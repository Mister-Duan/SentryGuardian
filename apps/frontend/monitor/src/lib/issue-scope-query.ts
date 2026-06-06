import type { IssueFilterState } from './issue-filters.js';
import type { IssueTimeRange } from './issue-time-range.js';
import type { IssueListQuery, IssueStatsQuery } from '@sentry-guardian/types';

/** Scope fields shared by issue list and stats APIs. 列表与统计 API 共用的范围字段。 */
export function toIssueScopeQuery(
  filters: IssueFilterState,
  timeRange: IssueTimeRange,
): Pick<
  IssueListQuery,
  'status' | 'environment' | 'exception_type' | 'mechanism' | 'level' | 'since' | 'until'
> {
  return {
    ...(filters.status !== 'all' ? { status: filters.status } : {}),
    ...(filters.environment ? { environment: filters.environment } : {}),
    ...(filters.exception_type ? { exception_type: filters.exception_type } : {}),
    ...(filters.mechanism ? { mechanism: filters.mechanism } : {}),
    ...(filters.level ? { level: filters.level } : {}),
    since: timeRange.since,
    until: timeRange.until,
  };
}

/** Query string params for scoped stats endpoints. 统计端点查询参数。 */
export function toIssueStatsQuery(
  filters: IssueFilterState,
  timeRange: IssueTimeRange,
): IssueStatsQuery {
  return toIssueScopeQuery(filters, timeRange);
}

export function appendScopeParams(params: URLSearchParams, scope: ReturnType<typeof toIssueScopeQuery>) {
  if (scope.status) params.set('status', scope.status);
  if (scope.environment) params.set('environment', scope.environment);
  if (scope.exception_type) params.set('exception_type', scope.exception_type);
  if (scope.mechanism) params.set('mechanism', scope.mechanism);
  if (scope.level) params.set('level', scope.level);
  if (scope.since) params.set('since', scope.since);
  if (scope.until) params.set('until', scope.until);
}
