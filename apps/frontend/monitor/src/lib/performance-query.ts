import type { TransactionListQuery } from '@sentry-guardian/types';
import type { IssueTimeRange } from './issue-time-range.js';

/**
 * Build transaction list / summary query from time range and optional metric filter.
 * 由时间区间与可选指标筛选构建事务查询参数。
 */
export function toTransactionQuery(
  timeRange: IssueTimeRange,
  metric: string,
  page: number,
  pageSize: number,
): TransactionListQuery {
  return {
    since: timeRange.since,
    until: timeRange.until,
    ...(metric ? { metric } : {}),
    page,
    page_size: pageSize,
  };
}

export function appendTransactionParams(
  params: URLSearchParams,
  query: TransactionListQuery,
) {
  if (query.since) params.set('since', query.since);
  if (query.until) params.set('until', query.until);
  if (query.metric) params.set('metric', query.metric);
  if (query.page != null) params.set('page', String(query.page));
  if (query.page_size != null) params.set('page_size', String(query.page_size));
}
