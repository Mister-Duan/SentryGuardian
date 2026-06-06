/** Web Vital rating bucket. Web Vital 评级档位。 */
export type VitalRating = 'good' | 'needs-improvement' | 'poor' | 'unknown';

const RATING_STYLES: Record<Exclude<VitalRating, 'unknown'>, string> = {
  good: '#16a34a',
  'needs-improvement': '#ca8a04',
  poor: 'var(--sg-danger)',
};

const RATING_LABELS: Record<Exclude<VitalRating, 'unknown'>, string> = {
  good: '良好',
  'needs-improvement': '待改进',
  poor: '较差',
};

/** Metric filter options for the performance page. 性能页指标筛选项。 */
export const METRIC_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '全部类型' },
  { value: 'LCP', label: 'LCP' },
  { value: 'CLS', label: 'CLS' },
  { value: 'TTFB', label: 'TTFB' },
  { value: 'FCP', label: 'FCP' },
  { value: 'INP', label: 'INP' },
  { value: 'FID', label: 'FID' },
  { value: 'TBT', label: 'TBT' },
  { value: 'NTBT', label: 'NTBT' },
  { value: 'RT', label: 'RT' },
  { value: 'resource.timing', label: '资源加载' },
  { value: 'http.client', label: 'HTTP 请求' },
];

/** Primary vitals shown as overview inline summary. 概览行内展示的核心指标。 */
export const PRIMARY_VITALS = ['LCP', 'CLS', 'TTFB', 'FCP', 'INP'] as const;

/** Label for stored metric_rating. 存储的 metric_rating 展示标签。 */
export function labelMetricRating(rating: string | undefined): string {
  if (!rating || rating === 'unknown') return '—';
  if (rating in RATING_LABELS) {
    return RATING_LABELS[rating as Exclude<VitalRating, 'unknown'>];
  }
  return rating;
}

/** Good / poor thresholds for chart bands and card gauges. 图表色带与卡片仪表阈值。 */
export const VITAL_THRESHOLDS: Record<string, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  TBT: { good: 200, poor: 600 },
};

/**
 * Rate a Web Vital P75 value against common thresholds.
 * 按常见阈值对 Web Vital P75 评级。
 */
export function rateVital(metric: string, p75: number): VitalRating {
  if (!Number.isFinite(p75) || p75 <= 0) return 'unknown';
  switch (metric) {
    case 'LCP':
      if (p75 <= 2500) return 'good';
      if (p75 <= 4000) return 'needs-improvement';
      return 'poor';
    case 'CLS':
      if (p75 <= 0.1) return 'good';
      if (p75 <= 0.25) return 'needs-improvement';
      return 'poor';
    case 'TTFB':
      if (p75 <= 800) return 'good';
      if (p75 <= 1800) return 'needs-improvement';
      return 'poor';
    case 'INP':
      if (p75 <= 200) return 'good';
      if (p75 <= 500) return 'needs-improvement';
      return 'poor';
    case 'FCP':
      if (p75 <= 1800) return 'good';
      if (p75 <= 3000) return 'needs-improvement';
      return 'poor';
    case 'FID':
      if (p75 <= 100) return 'good';
      if (p75 <= 300) return 'needs-improvement';
      return 'poor';
    case 'TBT':
      if (p75 <= 200) return 'good';
      if (p75 <= 600) return 'needs-improvement';
      return 'poor';
    default:
      return 'unknown';
  }
}

/** Human-readable vital value for UI. UI 展示用指标值。 */
export function formatVitalValue(metric: string, value: number): string {
  if (metric === 'CLS') return value.toFixed(3);
  if (metric.startsWith('data.')) return `${value.toFixed(1)} KB`;
  return `${Math.round(value)} ms`;
}

export function vitalRatingColor(rating: VitalRating): string | undefined {
  if (rating === 'unknown') return undefined;
  return RATING_STYLES[rating];
}

export function vitalRatingLabel(rating: VitalRating): string {
  if (rating === 'unknown') return '—';
  return RATING_LABELS[rating];
}

/** 0–100 gauge position relative to poor threshold. 相对较差阈值的 0–100 仪表位置。 */
export function vitalGaugePercent(metric: string, value: number): number {
  const poor = VITAL_THRESHOLDS[metric]?.poor;
  if (!poor || !Number.isFinite(value) || value <= 0) return 0;
  return Math.min(100, Math.round((value / poor) * 100));
}

/** Filter key for a performance list row. 性能列表行的筛选键。 */
export function performanceRowFilterKey(metric: string | undefined, transaction: string): string {
  return metric ?? transaction;
}

/**
 * Primary label for merged transaction / metric column.
 * 合并「事务 / 指标」列的主标签。
 */
export function formatTransactionMetricLabel(metric: string | undefined, transaction: string): string {
  return labelMetricKey(performanceRowFilterKey(metric, transaction));
}

/**
 * Format merged duration / metric value for the performance table.
 * 格式化合并后的「耗时 / 值」列展示。
 */
export function formatPerformanceMeasure(
  metric: string | undefined,
  metricValue: number | undefined,
  durationMs: number,
): string {
  if (metric && metricValue != null) {
    const formatted = formatVitalValue(metric, metricValue);
    if (metric === 'CLS' || metric.startsWith('data.')) {
      return formatted;
    }
    if (durationMs === 0 || Math.round(metricValue) === durationMs) {
      return formatted;
    }
    return `${formatted} · ${durationMs} ms`;
  }
  return `${durationMs} ms`;
}

/** Label for breakdown keys (metrics + transaction kinds). 分布图键名标签。 */
export function labelMetricKey(key: string): string {
  if (key === 'http.client') return 'HTTP 请求';
  if (key === 'resource.timing') return '资源加载';
  if (key === 'pageload') return '页面加载';
  if (key === 'navigation') return '路由导航';
  if (key.startsWith('ET.')) return `元素 ${key.slice(3)}`;
  if (key.startsWith('nav.')) return `导航 ${key.slice(4)}`;
  if (key.startsWith('data.')) return `流量 ${key.slice(5)}`;
  return key;
}
