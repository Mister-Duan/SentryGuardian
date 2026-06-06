import type {
  ErrorBreakdownItem,
  ErrorBreakdownResponse,
  ErrorEvent,
  ErrorTypeTrendResponse,
  IssueErrorBreakdownResponse,
  TrendBucket,
} from '@sentry-guardian/types';

function countMap(): Map<string, number> {
  return new Map();
}

function bump(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function toItems(map: Map<string, number>, limit = 12): ErrorBreakdownItem[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, label: key, count }));
}

const OTHER_SERIES_KEY = '__other__';

export function primaryType(payload: ErrorEvent): string {
  return payload.exception?.values?.[0]?.type ?? (payload.message ? 'Message' : 'Unknown');
}

export function primaryMechanism(payload: ErrorEvent): string {
  return (
    payload.exception?.values?.[0]?.mechanism?.type ??
    payload.tags?.['error.type'] ??
    'unknown'
  );
}

function bucketMsForWindow(windowHours: number): number {
  return windowHours <= 24 ? 60 * 60 * 1000 : 6 * 60 * 60 * 1000;
}

function floorToBucket(iso: Date, bucketMs: number): string {
  const start = new Date(Math.floor(iso.getTime() / bucketMs) * bucketMs);
  return start.toISOString();
}

function listBucketStarts(windowHours: number): { bucketMs: number; buckets: string[] } {
  const bucketMs = bucketMsForWindow(windowHours);
  const now = Date.now();
  const since = now - windowHours * 60 * 60 * 1000;
  const buckets: string[] = [];
  for (let t = Math.floor(since / bucketMs) * bucketMs; t <= now; t += bucketMs) {
    buckets.push(new Date(t).toISOString());
  }
  return { bucketMs, buckets };
}

export function aggregateErrorPayloads(payloads: ErrorEvent[]): {
  by_type: ErrorBreakdownItem[];
  by_mechanism: ErrorBreakdownItem[];
  by_level: ErrorBreakdownItem[];
} {
  const byType = countMap();
  const byMechanism = countMap();
  const byLevel = countMap();

  for (const payload of payloads) {
    bump(byType, primaryType(payload));
    bump(byMechanism, primaryMechanism(payload));
    bump(byLevel, payload.level ?? 'error');
  }

  return {
    by_type: toItems(byType),
    by_mechanism: toItems(byMechanism),
    by_level: toItems(byLevel),
  };
}

export function buildTrendBuckets(
  timestamps: Date[],
  windowHours: number,
): TrendBucket[] {
  const { bucketMs } = listBucketStarts(windowHours);
  const buckets = new Map<string, number>();
  for (const ts of timestamps) {
    const key = floorToBucket(ts, bucketMs);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([bucket, count]) => ({ bucket, count }));
}

/**
 * Build stacked time-series for error types or mechanisms.
 * 构建按错误类型/机制分组的堆叠时间序列。
 */
export function buildErrorTypeTrends(
  rows: { timestamp: Date; payload: ErrorEvent }[],
  windowHours: number,
  dimension: 'type' | 'mechanism' = 'type',
  topN = 8,
): ErrorTypeTrendResponse {
  const { bucketMs, buckets } = listBucketStarts(windowHours);
  const keyFn = dimension === 'mechanism' ? primaryMechanism : primaryType;

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
    const seriesKey = keyFn(row.payload);
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
    dimension,
    buckets,
    series,
  };
}

export function toErrorBreakdownResponse(
  payloads: ErrorEvent[],
  hours: number,
): ErrorBreakdownResponse {
  const agg = aggregateErrorPayloads(payloads);
  return { hours, ...agg };
}

export function toIssueErrorBreakdownResponse(
  payloads: ErrorEvent[],
  timestamps: Date[],
): IssueErrorBreakdownResponse {
  const agg = aggregateErrorPayloads(payloads);
  const rows = payloads.map((payload, i) => ({
    payload,
    timestamp: timestamps[i]!,
  }));
  return {
    by_type: agg.by_type,
    by_mechanism: agg.by_mechanism,
    trends: buildTrendBuckets(timestamps, 24),
    type_trends: buildErrorTypeTrends(rows, 24, 'type'),
  };
}
