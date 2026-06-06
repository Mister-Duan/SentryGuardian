import { Injectable } from '@nestjs/common';
import { PrismaService } from '@sentry-guardian/nest-prisma';
import type {
  ErrorBreakdownResponse,
  ErrorEvent,
  ErrorTypeTrendResponse,
  IssueListQuery,
  IssueStatsQuery,
  IssueTrendResponse,
  ReleaseCompareResponse,
  TransactionEvent,
  TransactionListResponse,
  TransactionSummary,
} from '@sentry-guardian/types';
import { buildIssueListWhere } from '../issues/issues.logic.js';
import { buildErrorTypeTrends, toErrorBreakdownResponse } from './error-breakdown.js';
import { hasIssueTaxonomyFilters, resolveTimeWindow } from './stats.query.js';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  private async matchingIssueIds(
    projectId: string,
    query: IssueStatsQuery,
  ): Promise<string[] | null> {
    const scope: IssueListQuery = {
      project_id: projectId,
      status: query.status,
      environment: query.environment,
      exception_type: query.exception_type,
      mechanism: query.mechanism,
      level: query.level,
    };
    if (!hasIssueTaxonomyFilters(scope)) {
      return null;
    }
    const rows = await this.prisma.issue.findMany({
      where: buildIssueListWhere(scope),
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  private async fetchScopedErrorEvents(projectId: string, query: IssueStatsQuery) {
    const window = resolveTimeWindow(query);
    const issueIds = await this.matchingIssueIds(projectId, query);

    if (issueIds !== null && issueIds.length === 0) {
      return { window, rows: [] as { timestamp: Date; payload: ErrorEvent }[] };
    }

    const rows = await this.prisma.event.findMany({
      where: {
        projectId,
        eventType: 'ERROR',
        timestamp: { gte: window.since, lte: window.until },
        ...(issueIds !== null ? { issueId: { in: issueIds } } : {}),
      },
      select: { timestamp: true, payload: true },
      orderBy: { timestamp: 'asc' },
      take: 10000,
    });

    return {
      window,
      rows: rows.map((r) => ({
        timestamp: r.timestamp,
        payload: r.payload as unknown as ErrorEvent,
      })),
    };
  }

  async errorTypeTrends(
    projectId: string,
    query: IssueStatsQuery,
    dimension: 'type' | 'mechanism' = 'type',
  ): Promise<ErrorTypeTrendResponse> {
    const { window, rows } = await this.fetchScopedErrorEvents(projectId, query);
    return buildErrorTypeTrends(rows, window.hours, dimension, 8, {
      since: window.since,
      until: window.until,
    });
  }

  async errorBreakdown(projectId: string, query: IssueStatsQuery): Promise<ErrorBreakdownResponse> {
    const { window, rows } = await this.fetchScopedErrorEvents(projectId, query);
    const payloads = rows.map((r) => r.payload);
    return toErrorBreakdownResponse(payloads, window.hours);
  }

  async issueTrends(projectId: string, hours: number): Promise<IssueTrendResponse> {
    const window = resolveTimeWindow({ hours });
    const events = await this.prisma.event.findMany({
      where: {
        projectId,
        eventType: 'ERROR',
        timestamp: { gte: window.since, lte: window.until },
      },
      select: { timestamp: true },
      orderBy: { timestamp: 'asc' },
    });

    const bucketMs = window.hours <= 24 ? 60 * 60 * 1000 : 6 * 60 * 60 * 1000;
    const buckets = new Map<string, number>();
    for (const e of events) {
      const start = new Date(Math.floor(e.timestamp.getTime() / bucketMs) * bucketMs);
      const key = start.toISOString();
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    return {
      hours: window.hours,
      buckets: [...buckets.entries()].map(([bucket, count]) => ({ bucket, count })),
    };
  }

  async releaseCompare(projectId: string): Promise<ReleaseCompareResponse> {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const releases = await this.prisma.release.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const items = await Promise.all(
      releases.map(async (rel) => {
        const [event_count, issue_count, new_issues_24h] = await Promise.all([
          this.prisma.event.count({
            where: {
              projectId,
              eventType: 'ERROR',
              payload: { path: ['release'], equals: rel.version },
            },
          }),
          this.prisma.issue.count({
            where: { projectId, release: rel.version },
          }),
          this.prisma.issue.count({
            where: {
              projectId,
              release: rel.version,
              firstSeen: { gte: since24h },
            },
          }),
        ]);
        return {
          version: rel.version,
          event_count,
          issue_count,
          new_issues_24h,
        };
      }),
    );

    return { items };
  }

  async listTransactions(
    projectId: string,
    page: number,
    pageSize: number,
  ): Promise<TransactionListResponse> {
    const size = Math.min(pageSize, 100);
    const where = { projectId, eventType: 'TRANSACTION' as const };
    const [rows, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * size,
        take: size,
      }),
      this.prisma.event.count({ where }),
    ]);

    const items: TransactionSummary[] = rows.map((r) => {
      const p = r.payload as unknown as TransactionEvent;
      return {
        id: r.id,
        transaction: p.transaction,
        duration_ms: p.duration_ms,
        timestamp: r.timestamp.toISOString(),
        url: p.url,
        metric: p.metric,
      };
    });

    return { items, total, page, page_size: size };
  }
}
