import { Injectable } from '@nestjs/common';
import { PrismaService } from '@sentry-guardian/nest-prisma';
import type {
  IssueTrendResponse,
  ReleaseCompareResponse,
  TransactionEvent,
  TransactionListResponse,
  TransactionSummary,
} from '@sentry-guardian/types';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async issueTrends(projectId: string, hours: number): Promise<IssueTrendResponse> {
    const windowHours = Math.min(Math.max(hours, 1), 168);
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const events = await this.prisma.event.findMany({
      where: {
        projectId,
        eventType: 'ERROR',
        timestamp: { gte: since },
      },
      select: { timestamp: true },
      orderBy: { timestamp: 'asc' },
    });

    const bucketMs = windowHours <= 24 ? 60 * 60 * 1000 : 6 * 60 * 60 * 1000;
    const buckets = new Map<string, number>();
    for (const e of events) {
      const start = new Date(Math.floor(e.timestamp.getTime() / bucketMs) * bucketMs);
      const key = start.toISOString();
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    return {
      hours: windowHours,
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
