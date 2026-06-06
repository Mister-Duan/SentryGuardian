import type { IssueStatus as PrismaIssueStatus } from '@sentry-guardian/database';
import type { IssueListQuery } from '@sentry-guardian/types';

/**
 * Build Prisma `where` clause for paginated issue list queries.
 * 构建分页 Issue 列表查询的 Prisma `where` 条件。
 *
 * @example
 * ```ts
 * // Input / 输入
 * buildIssueListWhere({ project_id: 'p1', level: 'error', exception_type: 'TypeError' })
 * // Output / 输出
 * { projectId: 'p1', level: 'error', exceptionType: 'TypeError' }
 * ```
 */
export function buildIssueListWhere(query: IssueListQuery) {
  return {
    ...(query.project_id ? { projectId: query.project_id } : {}),
    ...(query.status
      ? { status: query.status.toUpperCase() as PrismaIssueStatus }
      : {}),
    ...(query.environment ? { environment: query.environment } : {}),
    ...(query.release ? { release: query.release } : {}),
    ...(query.exception_type ? { exceptionType: query.exception_type } : {}),
    ...(query.mechanism ? { mechanism: query.mechanism } : {}),
    ...(query.level ? { level: query.level } : {}),
    ...(query.since || query.until
      ? {
          lastSeen: {
            ...(query.since ? { gte: new Date(query.since) } : {}),
            ...(query.until ? { lte: new Date(query.until) } : {}),
          },
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' as const } },
            { culprit: { contains: query.search, mode: 'insensitive' as const } },
            { fingerprint: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };
}
