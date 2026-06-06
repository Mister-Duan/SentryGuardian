import type { IssueListQuery } from '@sentry-guardian/types';

/** Resolved absolute time window for stats and issue queries. 解析后的绝对时间窗口。 */
export type ResolvedTimeWindow = {
  /** Window start (inclusive). 窗口起点（含）。 */
  since: Date;
  /** Window end (inclusive). 窗口终点（含）。 */
  until: Date;
  /** Span in hours (for chart bucketing). 跨度小时数（图表分桶用）。 */
  hours: number;
};

const MAX_WINDOW_HOURS = 720;

/**
 * Resolve relative `hours` or absolute `since`/`until` into a bounded window ending at now unless `until` is set.
 * 将相对 `hours` 或绝对 `since`/`until` 解析为受限时间窗口。
 *
 * @example
 * ```ts
 * // Input / 输入
 * resolveTimeWindow({ hours: 12 })
 * // Output / 输出：since ≈ now - 12h, until ≈ now
 * ```
 */
export function resolveTimeWindow(query: {
  hours?: number | string;
  since?: string;
  until?: string;
}): ResolvedTimeWindow {
  if (query.since && query.until) {
    const since = new Date(query.since);
    const until = new Date(query.until);
    const spanMs = Math.max(until.getTime() - since.getTime(), 60_000);
    const hours = Math.min(Math.max(Math.ceil(spanMs / 3_600_000), 1), MAX_WINDOW_HOURS);
    return { since, until, hours };
  }

  const windowHours = Math.min(
    Math.max(Number(query.hours ?? 12) || 12, 1),
    MAX_WINDOW_HOURS,
  );
  const until = new Date();
  const since = new Date(until.getTime() - windowHours * 3_600_000);
  return { since, until, hours: windowHours };
}

/** Whether taxonomy filters (excluding project/time) are active. 是否启用了分类筛选。 */
export function hasIssueTaxonomyFilters(query: IssueListQuery): boolean {
  return Boolean(
    query.status ||
      query.environment ||
      query.exception_type ||
      query.mechanism ||
      query.level,
  );
}
