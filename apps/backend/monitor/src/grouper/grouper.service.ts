import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '@sentry-guardian/nest-prisma';
import type { ErrorEvent } from '@sentry-guardian/types';
import { eventCulprit, eventFingerprint, eventTitle } from './grouper.logic.js';

const BATCH_SIZE = 50;
const POLL_MS = Number(process.env.GROUPER_POLL_MS ?? 3000);

/**
 * Poll unaggregated events and upsert issues.
 * 轮询未聚合事件并 upsert Issue。
 */
@Injectable()
export class GrouperService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(GrouperService.name);
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(private readonly prisma: PrismaService) {}

  onApplicationBootstrap(): void {
    void this.processBatch();
    this.timer = setInterval(() => void this.processBatch(), POLL_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  /**
   * Process one batch of pending events.
   * 处理一批待聚合事件。
   *
   * @example
   * ```ts
   * // Input / 输入
   * await grouper.processBatch()
   * // Output / 输出
   * undefined
   * ```
   */
  async processBatch(): Promise<void> {
    const pending = await this.prisma.event.findMany({
      where: { aggregatedAt: null },
      orderBy: { createdAt: 'asc' },
      take: BATCH_SIZE,
    });

    for (const row of pending) {
      const event = row.payload as unknown as ErrorEvent;
      const fingerprint = eventFingerprint(event);
      const title = eventTitle(event);
      const culprit = eventCulprit(event);
      const level = event.level ?? 'error';
      const seenAt = new Date(event.timestamp);

      const issue = await this.prisma.issue.upsert({
        where: {
          projectId_fingerprint: {
            projectId: row.projectId,
            fingerprint,
          },
        },
        create: {
          projectId: row.projectId,
          fingerprint,
          title,
          level,
          firstSeen: seenAt,
          lastSeen: seenAt,
          eventCount: 1,
          usersSeen: event.user?.id ? 1 : 0,
          culprit,
        },
        update: {
          title,
          level,
          lastSeen: seenAt,
          eventCount: { increment: 1 },
          culprit: culprit ?? undefined,
        },
      });

      await this.prisma.event.update({
        where: { id: row.id },
        data: { issueId: issue.id, aggregatedAt: new Date() },
      });
    }

    if (pending.length > 0) {
      this.logger.log(`Aggregated ${pending.length} event(s)`);
    }
  }
}
