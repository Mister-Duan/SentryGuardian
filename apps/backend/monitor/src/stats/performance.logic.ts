import type {
  DurationTrendBucket,
  ErrorBreakdownItem,
  ErrorTypeTrendResponse,
  PerformanceSummaryResponse,
  TransactionEvent,
  TrendBucket,
  VitalTrendResponse,
  VitalsSummaryItem,
} from '@sentry-guardian/types';
import {
  buildTrendBuckets,
  floorToBucket,
  listBucketStarts,
  listBucketStartsForRange,
} from './error-breakdown.js';

const OTHER_SERIES_KEY = '__other__';
const PRIMARY_VITAL_METRICS = ['LCP', 'CLS', 'TTFB', 'FCP', 'INP', 'FID', 'TBT'] as const;

const VITAL_METRIC_SET = new Set<string>(PRIMARY_VITAL_METRICS);

/** Whether payload is a numeric Web Vital sample for overview aggregation. 是否为可聚合的 Web Vital 数值样本。 */
export function isVitalMetricSample(tx: TransactionEvent): boolean {
  return (
    tx.metric != null &&
    tx.metric_value != null &&
    VITAL_METRIC_SET.has(tx.metric)
  );
}

/** Compute percentile from sorted samples. 计算百分位数。 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)]!;
}

function metricKey(tx: TransactionEvent): string {
  return tx.metric ?? tx.transaction;
}

function toBreakdownItems(counts: Map<string, number>): ErrorBreakdownItem[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ key, label: key, count }));
}

function resolveBuckets(
  windowHours: number,
  range?: { since: Date; until: Date },
): { bucketMs: number; buckets: string[] } {
  return range ? listBucketStartsForRange(range.since, range.until) : listBucketStarts(windowHours);
}

export function buildMetricTypeTrends(
  rows: { timestamp: Date; payload: TransactionEvent }[],
  windowHours: number,
  topN = 8,
  range?: { since: Date; until: Date },
): ErrorTypeTrendResponse {
  const { bucketMs, buckets } = resolveBuckets(windowHours, range);
  const totals = new Map<string, number>();
  const matrix = new Map<string, Map<string, number>>();

  for (const bucket of buckets) {
    matrix.set(bucket, new Map());
  }

  for (const row of rows) {
    const bucket = floorToBucket(row.timestamp, bucketMs);
    if (!matrix.has(bucket)) {
      continue;
    }
    const seriesKey = metricKey(row.payload);
    totals.set(seriesKey, (totals.get(seriesKey) ?? 0) + 1);
    const bucketMap = matrix.get(bucket)!;
    bucketMap.set(seriesKey, (bucketMap.get(seriesKey) ?? 0) + 1);
  }

  const rankedKeys = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);
  const topKeys = rankedKeys.slice(0, topN);
  const hasOther = rankedKeys.length > topN;
  const seriesKeys = hasOther ? [...topKeys, OTHER_SERIES_KEY] : topKeys;

  const series = seriesKeys.map((key) => ({
    key,
    label: key === OTHER_SERIES_KEY ? '其他' : key,
    points: buckets.map((bucket) => {
      const bucketMap = matrix.get(bucket)!;
      if (key === OTHER_SERIES_KEY) {
        let count = 0;
        for (const [k, n] of bucketMap.entries()) {
          if (!topKeys.includes(k)) {
            count += n;
          }
        }
        return { bucket, count };
      }
      return { bucket, count: bucketMap.get(key) ?? 0 };
    }),
  }));

  return {
    hours: windowHours,
    bucket_ms: bucketMs,
    dimension: 'type',
    buckets,
    series,
  };
}

export function buildVitalP75Trends(
  rows: { timestamp: Date; payload: TransactionEvent }[],
  windowHours: number,
  metrics: readonly string[] = PRIMARY_VITAL_METRICS,
  range?: { since: Date; until: Date },
): VitalTrendResponse {
  const { bucketMs, buckets } = resolveBuckets(windowHours, range);
  const bucketValues = new Map<string, Map<string, number[]>>();

  for (const bucket of buckets) {
    const perMetric = new Map<string, number[]>();
    for (const metric of metrics) {
      perMetric.set(metric, []);
    }
    bucketValues.set(bucket, perMetric);
  }

  for (const row of rows) {
    const tx = row.payload;
    if (!tx.metric || tx.metric_value == null || !metrics.includes(tx.metric)) {
      continue;
    }
    const bucket = floorToBucket(row.timestamp, bucketMs);
    const perMetric = bucketValues.get(bucket);
    if (!perMetric) {
      continue;
    }
    const list = perMetric.get(tx.metric) ?? [];
    list.push(tx.metric_value);
    perMetric.set(tx.metric, list);
  }

  const series = metrics.map((metric) => ({
    metric,
    points: buckets.map((bucket) => {
      const values = bucketValues.get(bucket)?.get(metric) ?? [];
      return {
        bucket,
        p75_value: values.length > 0 ? percentile(values, 75) : 0,
        count: values.length,
      };
    }),
  }));

  return { hours: windowHours, bucket_ms: bucketMs, buckets, series };
}

export function buildHttpDurationTrend(
  rows: { timestamp: Date; payload: TransactionEvent }[],
  windowHours: number,
  range?: { since: Date; until: Date },
): DurationTrendBucket[] {
  const { bucketMs, buckets } = resolveBuckets(windowHours, range);
  const bucketDurations = new Map<string, number[]>();

  for (const bucket of buckets) {
    bucketDurations.set(bucket, []);
  }

  for (const row of rows) {
    const tx = row.payload;
    if (tx.transaction !== 'http.client') {
      continue;
    }
    const bucket = floorToBucket(row.timestamp, bucketMs);
    const list = bucketDurations.get(bucket);
    if (!list) {
      continue;
    }
    list.push(tx.duration_ms);
  }

  return buckets.map((bucket) => {
    const durations = bucketDurations.get(bucket) ?? [];
    return {
      bucket,
      count: durations.length,
      avg_ms:
        durations.length > 0
          ? Math.round(durations.reduce((s, v) => s + v, 0) / durations.length)
          : 0,
    };
  });
}

/**
 * Aggregate transaction payloads into performance overview stats.
 * 将事务载荷聚合为性能概览统计。
 *
 * @example
 * ```ts
 * // Input / 输入
 * buildPerformanceSummary(rows, 12)
 * // Output / 输出
 * { hours: 12, vitals: [...], metric_trends: {...}, vital_trends: {...}, ... }
 * ```
 */
export function buildPerformanceSummary(
  rows: { timestamp: Date; payload: TransactionEvent }[],
  windowHours: number,
  range?: { since: Date; until: Date },
): PerformanceSummaryResponse {
  const vitalsMap = new Map<string, number[]>();
  const metricCounts = new Map<string, number>();
  const httpDurations: number[] = [];
  const timestamps: Date[] = [];

  for (const row of rows) {
    const tx = row.payload;
    timestamps.push(row.timestamp);
    const key = metricKey(tx);
    metricCounts.set(key, (metricCounts.get(key) ?? 0) + 1);

    if (isVitalMetricSample(tx)) {
      const list = vitalsMap.get(tx.metric!) ?? [];
      list.push(tx.metric_value!);
      vitalsMap.set(tx.metric!, list);
    }

    if (tx.transaction === 'http.client') {
      httpDurations.push(tx.duration_ms);
    }
  }

  const vitals: VitalsSummaryItem[] = [...vitalsMap.entries()]
    .map(([metric, values]) => ({
      metric,
      count: values.length,
      avg_value: values.reduce((s, v) => s + v, 0) / values.length,
      p75_value: percentile(values, 75),
    }))
    .sort((a, b) => a.metric.localeCompare(b.metric));

  const volume_trend: TrendBucket[] = buildTrendBuckets(timestamps, windowHours);
  const metric_trends = buildMetricTypeTrends(rows, windowHours, 8, range);
  const vitalRows = rows.filter((row) => isVitalMetricSample(row.payload));
  const vital_trends = buildVitalP75Trends(
    vitalRows,
    windowHours,
    PRIMARY_VITAL_METRICS,
    range,
  );
  const http_duration_trend = buildHttpDurationTrend(rows, windowHours, range);

  return {
    hours: windowHours,
    vitals,
    by_metric: toBreakdownItems(metricCounts),
    metric_trends,
    vital_trends,
    http_duration_trend,
    slow_http_count: httpDurations.length,
    avg_http_duration_ms:
      httpDurations.length > 0
        ? Math.round(httpDurations.reduce((s, v) => s + v, 0) / httpDurations.length)
        : 0,
    volume_trend,
  };
}
