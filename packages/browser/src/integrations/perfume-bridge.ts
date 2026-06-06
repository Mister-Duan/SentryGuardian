import type { IAnalyticsTrackerOptions } from 'perfume.js';
import type { TransactionEvent } from '@sentry-guardian/types';

/** Filter callback for performance URL exclusion. 性能 URL 排除过滤器。 */
export type PerfumeUrlFilter = (url: string) => boolean;

/** Partial transaction emitted from a perfume.js report. perfume 报告映射的事务片段。 */
export type PerfumeTransactionPartial = Pick<TransactionEvent, 'transaction' | 'duration_ms'> &
  Partial<
    Omit<
      TransactionEvent,
      'transaction' | 'duration_ms' | 'type' | 'event_id' | 'timestamp' | 'sdk'
    >
  >;

const NAV_TIMING_SKIP = new Set(['timeToFirstByte']);

const NAV_TIMING_METRIC: Record<string, string> = {
  redirectTime: 'nav.redirect',
  dnsLookupTime: 'nav.dns',
  downloadTime: 'nav.download',
  fetchTime: 'nav.fetch',
  workerTime: 'nav.worker',
  totalTime: 'nav.total',
  headerSize: 'nav.headerSize',
};

/**
 * Map perfume.js `analyticsTracker` payload to SentryGuardian transaction partials.
 * 将 perfume.js `analyticsTracker` 载荷映射为事务片段（一条 perfume 事件可展开为多条）。
 *
 * @example
 * ```ts
 * // Input / 输入
 * mapPerfumeReport({ metricName: 'LCP', data: 2400, rating: 'good', attribution: {}, navigatorInformation: {} })
 * // Output / 输出
 * // [{ transaction: 'largest-contentful-paint', metric: 'LCP', metric_value: 2400, ... }]
 * ```
 */
export function mapPerfumeReport(
  options: IAnalyticsTrackerOptions,
  filter?: PerfumeUrlFilter,
): PerfumeTransactionPartial[] {
  const { metricName, data, rating, navigationType, attribution, navigatorInformation } = options;
  const shared = {
    metric_rating: mapPerfumeRating(rating),
    navigation_type: navigationType,
    perf_context: {
      attribution,
      navigator: navigatorInformation,
    },
  };

  if (typeof data === 'number') {
    if (metricName === 'userJourneyStep') {
      return [
        {
          ...shared,
          transaction: 'user.journey',
          duration_ms: Math.round(data),
          metric: 'userJourneyStep',
          metric_value: data,
          perf_context: {
            ...shared.perf_context,
            stepName: (attribution as { step_name?: string }).step_name,
          },
        },
      ];
    }
    return [numericMetric(metricName, data, attribution, shared)];
  }

  if (!data || typeof data !== 'object') {
    return [];
  }

  switch (metricName) {
    case 'navigationTiming':
      return mapNavigationTiming(data as Record<string, number>, shared);
    case 'networkInformation':
      return [
        {
          ...shared,
          transaction: 'network.information',
          duration_ms: 0,
          metric: 'network.info',
          perf_context: { ...shared.perf_context, network: data },
        },
      ];
    case 'storageEstimate':
      return [
        {
          ...shared,
          transaction: 'storage.estimate',
          duration_ms: 0,
          metric: 'storage.estimate',
          perf_context: { ...shared.perf_context, storage: data },
        },
      ];
    case 'dataConsumption':
      return mapDataConsumption(data as Record<string, number>, shared);
    case 'resourceTiming':
      return mapResourceTiming(data as PerformanceResourceTiming, shared, filter);
    default:
      return [];
  }
}

function numericMetric(
  metricName: string,
  value: number,
  attribution: object,
  shared: Pick<TransactionEvent, 'metric_rating' | 'navigation_type' | 'perf_context'>,
): PerfumeTransactionPartial {
  const id = (attribution as { identifier?: string }).identifier;
  const metric =
    metricName === 'ET' && id ? `ET.${id}` : metricName;
  return {
    transaction: transactionForMetric(metricName, id),
    duration_ms: metricName === 'CLS' ? 0 : Math.round(value),
    metric,
    metric_value: value,
    ...shared,
  };
}

function mapNavigationTiming(
  data: Record<string, number>,
  shared: Pick<TransactionEvent, 'metric_rating' | 'navigation_type' | 'perf_context'>,
): PerfumeTransactionPartial[] {
  return Object.entries(data)
    .filter(([key, value]) => !NAV_TIMING_SKIP.has(key) && typeof value === 'number' && value > 0)
    .map(([key, value]) => ({
      transaction: 'navigation.timing',
      duration_ms: key === 'headerSize' ? 0 : Math.round(value),
      metric: NAV_TIMING_METRIC[key] ?? `nav.${key}`,
      metric_value: value,
      ...shared,
    }));
}

function mapDataConsumption(
  data: Record<string, number>,
  shared: Pick<TransactionEvent, 'metric_rating' | 'navigation_type' | 'perf_context'>,
): PerfumeTransactionPartial[] {
  return Object.entries(data)
    .filter(([, kb]) => typeof kb === 'number' && kb > 0)
    .map(([key, kb]) => ({
      transaction: 'data.consumption',
      duration_ms: 0,
      metric: `data.${key}`,
      metric_value: kb,
      perf_context: { ...shared.perf_context, unit: 'KB' },
      ...shared,
    }));
}

function mapResourceTiming(
  entry: PerformanceResourceTiming,
  shared: Pick<TransactionEvent, 'metric_rating' | 'navigation_type' | 'perf_context'>,
  filter?: PerfumeUrlFilter,
): PerfumeTransactionPartial[] {
  if (!entry?.duration) {
    return [];
  }
  if (filter?.(entry.name)) {
    return [];
  }
  return [
    {
      transaction: 'resource.timing',
      duration_ms: Math.round(entry.duration),
      metric: 'resource.timing',
      metric_value: entry.duration,
      url: entry.name,
      perf_context: {
        ...shared.perf_context,
        initiatorType: entry.initiatorType,
        transferSize: entry.transferSize,
      },
      ...shared,
    },
  ];
}

function transactionForMetric(metricName: string, elementId?: string): string {
  switch (metricName) {
    case 'LCP':
      return 'largest-contentful-paint';
    case 'CLS':
      return 'cumulative-layout-shift';
    case 'FCP':
      return 'first-contentful-paint';
    case 'TTFB':
      return 'time-to-first-byte';
    case 'FID':
      return 'first-input-delay';
    case 'INP':
      return 'interaction';
    case 'TBT':
      return 'total-blocking-time';
    case 'NTBT':
      return 'navigation-total-blocking-time';
    case 'RT':
      return 'redirect-time';
    case 'ET':
      return elementId ? `element-timing.${elementId}` : 'element-timing';
    case 'userJourneyStep':
      return 'user.journey';
    default:
      return `perf.measure.${metricName}`;
  }
}

function mapPerfumeRating(
  rating: IAnalyticsTrackerOptions['rating'] | 'needs-improvement',
): TransactionEvent['metric_rating'] | undefined {
  if (!rating) return undefined;
  if (rating === 'needsImprovement' || rating === 'needs-improvement') return 'needs-improvement';
  if (rating === 'good' || rating === 'poor') return rating;
  return undefined;
}
