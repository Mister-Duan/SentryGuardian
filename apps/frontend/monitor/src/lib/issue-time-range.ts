/** Relative time presets for the issue stream. Issue 动态流相对时间预设。 */
export type TimeRangePreset = '1h' | '6h' | '12h' | '24h' | '7d' | 'custom';

/** Absolute time window used by list + chart APIs. 列表与图表共用的绝对时间窗口。 */
export type IssueTimeRange = {
  /** Selected preset id; `custom` when user picks explicit bounds. 当前预设；自定义时为 `custom`。 */
  preset: TimeRangePreset;
  /** ISO8601 inclusive start. 起始时间（含）。 */
  since: string;
  /** ISO8601 inclusive end. 结束时间（含）。 */
  until: string;
};

const PRESET_HOURS: Record<Exclude<TimeRangePreset, 'custom'>, number> = {
  '1h': 1,
  '6h': 6,
  '12h': 12,
  '24h': 24,
  '7d': 168,
};

export const TIME_RANGE_PRESETS: { id: Exclude<TimeRangePreset, 'custom'>; label: string }[] = [
  { id: '1h', label: '近 1 小时' },
  { id: '6h', label: '近 6 小时' },
  { id: '12h', label: '近 12 小时' },
  { id: '24h', label: '近 24 小时' },
  { id: '7d', label: '近 7 天' },
];

/**
 * Build a relative time window ending at `now`.
 * 构建以 `now` 为终点的相对时间窗口。
 *
 * @example
 * ```ts
 * // Input / 输入
 * createRelativeTimeRange('12h', Date.parse('2026-06-06T12:00:00.000Z'))
 * // Output / 输出
 * { preset: '12h', since: '2026-06-06T00:00:00.000Z', until: '2026-06-06T12:00:00.000Z' }
 * ```
 */
export function createRelativeTimeRange(
  preset: Exclude<TimeRangePreset, 'custom'>,
  now = Date.now(),
): IssueTimeRange {
  const hours = PRESET_HOURS[preset];
  const until = new Date(now);
  const since = new Date(now - hours * 3_600_000);
  return {
    preset,
    since: since.toISOString(),
    until: until.toISOString(),
  };
}

/** Default issue stream window (12h). 默认 12 小时窗口。 */
export function defaultIssueTimeRange(): IssueTimeRange {
  return createRelativeTimeRange('12h');
}

/**
 * Human-readable label for the active time range.
 * 当前时间区间的可读标签。
 */
export function formatTimeRangeLabel(range: IssueTimeRange): string {
  if (range.preset !== 'custom') {
    return TIME_RANGE_PRESETS.find((p) => p.id === range.preset)?.label ?? '自定义';
  }
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  return `${fmt(range.since)} – ${fmt(range.until)}`;
}

/** Convert `datetime-local` input value to ISO string. 将 datetime-local 转为 ISO。 */
export function datetimeLocalToIso(value: string): string {
  return new Date(value).toISOString();
}

/** Format ISO for `datetime-local` input. 将 ISO 格式化为 datetime-local。 */
export function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Build custom range from datetime-local fields; returns null when invalid.
 * 由 datetime-local 字段构建自定义区间；无效时返回 null。
 */
export function createCustomTimeRange(sinceLocal: string, untilLocal: string): IssueTimeRange | null {
  if (!sinceLocal || !untilLocal) return null;
  const since = datetimeLocalToIso(sinceLocal);
  const until = datetimeLocalToIso(untilLocal);
  if (new Date(since).getTime() >= new Date(until).getTime()) return null;
  return { preset: 'custom', since, until };
}
