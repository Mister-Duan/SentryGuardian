import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '@sentry-guardian/nest-prisma';
import type { ErrorEvent } from '@sentry-guardian/types';
import { AlerterService } from '../alerter/alerter.service.js';
import { primaryMechanism, primaryType } from '../stats/error-breakdown.js';
import { eventCulpritInfo, eventFingerprint, eventTitle } from './grouper.logic.js';

const BATCH_SIZE = 50;
const POLL_MS = Number(process.env.GROUPER_POLL_MS ?? 3000);

function tagsString(event: ErrorEvent): string | undefined {
  if (!event.tags || !Object.keys(event.tags).length) {
    return undefined;
  }
  return Object.entries(event.tags)
    .map(([k, v]) => `${k}:${v}`)
    .join(',');
}

/**
 * Poll unaggregated events and upsert issues.
 * 轮询未聚合事件并 upsert Issue。
 */
@Injectable()
export class GrouperService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(GrouperService.name);
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly alerter: AlerterService,
  ) {}

  onApplicationBootstrap(): void {
    void this.processBatch();
    this.timer = setInterval(() => void this.processBatch(), POLL_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async processBatch(): Promise<void> {
    const pending = await this.prisma.event.findMany({
      where: { aggregatedAt: null, eventType: 'ERROR' },
      orderBy: { createdAt: 'asc' },
      take: BATCH_SIZE,
    });

    for (const row of pending) {
      const event = row.payload as unknown as ErrorEvent;
      const fingerprint = eventFingerprint(event);
      const title = eventTitle(event);
      const { culprit, culprit_in_app: culpritInApp } = eventCulpritInfo(event);
      const level = event.level ?? 'error';
      const seenAt = new Date(event.timestamp);
      const environment = event.environment ?? null;
      const release = event.release ?? null;
      const tagLine = tagsString(event) ?? null;
      const exceptionType = primaryType(event);
      const mechanism = primaryMechanism(event);

      const existing = await this.prisma.issue.findUnique({
        where: {
          projectId_fingerprint: {
            projectId: row.projectId,
            fingerprint,
          },
        },
      });

      const isNewIssue = !existing;

      let userIncrement = 0;
      if (event.user?.id) {
        const prior = existing
          ? await this.prisma.event.count({
              where: {
                issueId: existing.id,
                NOT: { id: row.id },
                payload: { path: ['user', 'id'], equals: event.user.id },
              },
            })
          : 0;
        userIncrement = prior === 0 ? 1 : 0;
      }

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
          culpritInApp,
          exceptionType,
          mechanism,
          environment,
          release,
          tags: tagLine,
        },
        update: {
          title,
          level,
          lastSeen: seenAt,
          eventCount: { increment: 1 },
          usersSeen: userIncrement ? { increment: userIncrement } : undefined,
          culprit: culprit ?? undefined,
          culpritInApp: culpritInApp ?? undefined,
          exceptionType,
          mechanism,
          environment: environment ?? undefined,
          release: release ?? undefined,
          tags: tagLine ?? undefined,
        },
      });

      await this.prisma.event.update({
        where: { id: row.id },
        data: { issueId: issue.id, aggregatedAt: new Date() },
      });

      if (isNewIssue) {
        await this.alerter.onNewIssue(issue.id, row.projectId);
      }
    }

    if (pending.length > 0) {
      this.logger.log(`Aggregated ${pending.length} event(s)`);
    }
  }
}
