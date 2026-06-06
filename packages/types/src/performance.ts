/**
 * Performance / transaction event payload (Lite subset).
 * 性能 / 事务事件载荷（Lite 精简子集）。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const tx: TransactionEvent = {
 *   event_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
 *   timestamp: '2026-06-05T12:00:00.000Z',
 *   type: 'transaction',
 *   transaction: 'pageload',
 *   duration_ms: 1200,
 *   sdk: { name: 'sentry-guardian.javascript.browser', version: '0.1.0' },
 * };
 * ```
 */
export interface TransactionEvent {
  /** Unique event id (UUID v4). 唯一事件 ID。 */
  event_id: string;
  /** ISO 8601 occurrence time. 发生时间。 */
  timestamp: string;
  /** Event kind; always `transaction` for this type. 事件类型。 */
  type: 'transaction';
  /** Transaction name (e.g. pageload, route change). 事务名称。 */
  transaction: string;
  /** Total duration in milliseconds. 总耗时（毫秒）。 */
  duration_ms: number;
  /** Optional HTTP status for fetch spans. 可选 HTTP 状态码。 */
  status_code?: number;
  /** Request URL for fetch/http spans. 请求 URL。 */
  url?: string;
  /** Application release version. Release 版本。 */
  release?: string;
  /** Deployment environment. 部署环境。 */
  environment?: string;
  /** Reporting SDK metadata. SDK 元数据。 */
  sdk: { name: string; version: string };
  /**
   * Performance metric key (Web Vitals, navigation, resource, …).
   * 性能指标键（Web Vitals、导航、资源等，来自 perfume.js）。
   */
  metric?: string;
  /** Metric value when `metric` is set. 指标值。 */
  metric_value?: number;
  /**
   * Vitals rating from perfume.js / web-vitals.
   * 指标评级（perfume.js / web-vitals）。
   */
  metric_rating?: 'good' | 'needs-improvement' | 'poor';
  /** Navigation type when reported by web-vitals. web-vitals 导航类型。 */
  navigation_type?: string;
  /**
   * Extra perfume attribution, device, or resource context.
   * perfume 归因、设备或资源上下文。
   */
  perf_context?: Record<string, unknown>;
}

/**
 * Summary row for performance transactions in the console.
 * 控制台性能事务列表摘要。
 */
export interface TransactionSummary {
  /** Internal row id. 内部 ID。 */
  id: string;
  /** Transaction name. 事务名称。 */
  transaction: string;
  /** Duration in ms. 耗时（毫秒）。 */
  duration_ms: number;
  /** Occurrence time (ISO). 发生时间。 */
  timestamp: string;
  /** URL when present. URL（若有）。 */
  url?: string;
  /** Web Vital metric. Web Vital 指标。 */
  metric?: string;
  /** Web Vital raw value when present. Web Vital 原始值（若有）。 */
  metric_value?: number;
  /** HTTP status for fetch spans. Fetch 请求的 HTTP 状态码。 */
  status_code?: number;
  /** Vitals rating when present. 指标评级（若有）。 */
  metric_rating?: 'good' | 'needs-improvement' | 'poor';
}

/**
 * Query parameters for paginated transaction list.
 * 分页事务列表查询参数。
 */
export interface TransactionListQuery {
  /** ISO8601 lower bound on event timestamp. 事件时间下限。 */
  since?: string;
  /** ISO8601 upper bound on event timestamp. 事件时间上限。 */
  until?: string;
  /** Filter by performance metric or transaction kind. 按指标或事务类型过滤。 */
  metric?: string;
  /** 1-based page index. 页码。 */
  page?: number;
  /** Page size (server may cap). 每页条数。 */
  page_size?: number;
}

/** One P75 sample in a vital time series bucket. Vital 时间序列单桶 P75 点。 */
export interface VitalTrendPoint {
  /** Bucket start (ISO). 桶起点时间。 */
  bucket: string;
  /** P75 in bucket; 0 when no samples. 桶内 P75；无样本时为 0。 */
  p75_value: number;
  /** Sample count in bucket. 桶内样本数。 */
  count: number;
}

/** P75 over time for one Web Vital metric. 单个 Web Vital 的 P75 时间序列。 */
export interface VitalTrendSeries {
  /** Metric key (e.g. `LCP`). 指标键。 */
  metric: string;
  /** Points aligned to {@link VitalTrendResponse.buckets}. 与 buckets 对齐的数据点。 */
  points: VitalTrendPoint[];
}

/**
 * Web Vital P75 trends for line charts.
 * Web Vital P75 趋势（折线图用）。
 */
export interface VitalTrendResponse {
  /** Analysis window in hours. 分析窗口（小时）。 */
  hours: number;
  /** Bucket width in milliseconds. 桶宽度（毫秒）。 */
  bucket_ms: number;
  /** Ordered bucket starts (ISO). 有序时间桶。 */
  buckets: string[];
  /** One series per tracked vital. 各 Vital 序列。 */
  series: VitalTrendSeries[];
}

/** Average HTTP duration in a time bucket. 时间桶内 HTTP 平均耗时。 */
export interface DurationTrendBucket {
  /** Bucket start (ISO). 桶起点时间。 */
  bucket: string;
  /** Average duration in ms; 0 when no samples. 平均耗时（毫秒）。 */
  avg_ms: number;
  /** HTTP transaction count in bucket. 桶内 HTTP 事务数。 */
  count: number;
}

/** Web Vital aggregate for the performance overview. 性能概览中的 Web Vital 聚合。 */
export interface VitalsSummaryItem {
  /** Metric key (e.g. `LCP`). 指标键。 */
  metric: string;
  /** Sample count in window. 窗口内样本数。 */
  count: number;
  /** Average metric value. 平均值。 */
  avg_value: number;
  /** 75th percentile value. P75 值。 */
  p75_value: number;
}

/**
 * Project performance overview for charts and vitals cards.
 * 项目性能概览（图表与 Vital 卡片）。
 */
export interface PerformanceSummaryResponse {
  /** Analysis window in hours. 分析窗口（小时）。 */
  hours: number;
  /** Aggregated Web Vitals. Web Vital 聚合。 */
  vitals: VitalsSummaryItem[];
  /** Counts by metric / transaction kind. 按指标或事务类型计数。 */
  by_metric: ErrorBreakdownItem[];
  /** Stacked transaction volume by metric / transaction kind. 按类型堆叠的事务量趋势。 */
  metric_trends: ErrorTypeTrendResponse;
  /** P75 trends for primary Web Vitals. 核心 Web Vital 的 P75 趋势。 */
  vital_trends: VitalTrendResponse;
  /** Average HTTP duration per time bucket. 各时间桶 HTTP 平均耗时。 */
  http_duration_trend: DurationTrendBucket[];
  /** Slow HTTP fetch transactions (`http.client`). 慢 HTTP 请求数。 */
  slow_http_count: number;
  /** Average duration of HTTP transactions (ms). HTTP 事务平均耗时（毫秒）。 */
  avg_http_duration_ms: number;
  /** Transaction volume over time. 事务量时间趋势。 */
  volume_trend: TrendBucket[];
}

/**
 * Paginated transaction list response.
 * 分页事务列表响应。
 */
export interface TransactionListResponse {
  items: TransactionSummary[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * Time-bucket count for issue/event trends.
 * Issue/事件趋势的时间桶计数。
 */
export interface TrendBucket {
  /** Bucket start time (ISO). 桶起始时间。 */
  bucket: string;
  /** Event count in bucket. 桶内事件数。 */
  count: number;
}

/**
 * Issue trend API response.
 * Issue 趋势 API 响应。
 */
export interface IssueTrendResponse {
  /** Time buckets. 时间桶列表。 */
  buckets: TrendBucket[];
  /** Window in hours. 窗口小时数。 */
  hours: number;
}

/**
 * Per-release error stats for comparison.
 * Release 维度错误统计（对比用）。
 */
export interface ReleaseStats {
  /** Release version string. Release 版本字符串。 */
  version: string;
  /** Total events in window. 窗口内事件总数。 */
  event_count: number;
  /** Distinct issues in window. 窗口内 Issue 数。 */
  issue_count: number;
  /** New issues in last 24h. 近 24h 新 Issue 数。 */
  new_issues_24h: number;
}

/**
 * Release comparison response.
 * Release 对比响应。
 */
export interface ReleaseCompareResponse {
  items: ReleaseStats[];
}

/**
 * One bucket in an error breakdown chart.
 * 错误分布图中的一个分组项。
 */
export interface ErrorBreakdownItem {
  /** Group key (e.g. exception type or mechanism id). 分组键。 */
  key: string;
  /** Human-readable label for UI. UI 展示用标签。 */
  label: string;
  /** Event count in the window. 窗口内事件数。 */
  count: number;
}

/**
 * Project-level error breakdown for charts.
 * 项目级错误分布（图表用）。
 */
export interface ErrorBreakdownResponse {
  /** Analysis window in hours. 分析窗口（小时）。 */
  hours: number;
  /** Counts by exception type name. 按异常类型计数。 */
  by_type: ErrorBreakdownItem[];
  /** Counts by capture mechanism. 按捕获机制计数。 */
  by_mechanism: ErrorBreakdownItem[];
  /** Counts by event level. 按事件级别计数。 */
  by_level: ErrorBreakdownItem[];
}

/**
 * Per-issue error breakdown and volume trend.
 * 单个 Issue 的错误分布与事件量趋势。
 */
export interface IssueErrorBreakdownResponse {
  /** Counts by exception type. 按异常类型计数。 */
  by_type: ErrorBreakdownItem[];
  /** Counts by capture mechanism. 按捕获机制计数。 */
  by_mechanism: ErrorBreakdownItem[];
  /** Event volume buckets (24h hourly). 事件量时间桶（24h 按小时）。 */
  trends: TrendBucket[];
  /** Stacked time series by exception type. 按异常类型分组的堆叠时间序列。 */
  type_trends: ErrorTypeTrendResponse;
}

/**
 * One time bucket count for a single error type series.
 * 单条错误类型序列在某个时间桶的计数。
 */
export interface ErrorTypeTrendPoint {
  /** Bucket start (ISO). 桶起点时间。 */
  bucket: string;
  /** Events in bucket for this type. 该类型在桶内的事件数。 */
  count: number;
}

/**
 * Error counts over time for one type/mechanism key.
 * 某一错误类型/机制随时间变化的事件数序列。
 */
export interface ErrorTypeTrendSeries {
  /** Series key (exception type or mechanism id). 序列键。 */
  key: string;
  /** Display label. 展示标签。 */
  label: string;
  /** Points aligned to {@link ErrorTypeTrendResponse.buckets}. 与 buckets 对齐的数据点。 */
  points: ErrorTypeTrendPoint[];
}

/**
 * Stacked chart payload: time on X-axis, error types on Y (stacked counts).
 * 堆叠图数据：横轴时间、纵轴各错误类型事件量。
 */
export interface ErrorTypeTrendResponse {
  /** Analysis window in hours. 分析窗口（小时）。 */
  hours: number;
  /** Bucket width in milliseconds. 桶宽度（毫秒）。 */
  bucket_ms: number;
  /** Grouping dimension. 分组维度。 */
  dimension: 'type' | 'mechanism';
  /** Ordered bucket starts (ISO), X-axis. 有序时间桶（横轴）。 */
  buckets: string[];
  /** One series per error type (top N + optional Other). 各错误类型序列（纵轴堆叠）。 */
  series: ErrorTypeTrendSeries[];
}
