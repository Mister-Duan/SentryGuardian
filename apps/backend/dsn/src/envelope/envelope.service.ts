import { BadRequestException, Injectable, PayloadTooLargeException } from '@nestjs/common';
import { parseEnvelope } from '@sentry-guardian/core';
import { PrismaService } from '@sentry-guardian/nest-prisma';
import type { ErrorEvent } from '@sentry-guardian/types';
import { scrubObject } from '@sentry-guardian/utils';

const MAX_BYTES = Number(process.env.MAX_ENVELOPE_BYTES ?? 1_048_576);

/**
 * Persist envelope events to PostgreSQL.
 * 将 Envelope 中的事件写入 PostgreSQL。
 */
@Injectable()
export class EnvelopeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Parse, scrub, and store events (idempotent on event_id).
   * 解析、脱敏并存储事件（按 event_id 幂等）。
   *
   * @example
   * ```ts
   * // Input / 输入
   * await service.ingest('proj-1', envelopeBody)
   * // Output / 输出
   * { stored: 1 }
   * ```
   */
  async ingest(projectId: string, rawBody: string): Promise<{ stored: number }> {
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_BYTES) {
      throw new PayloadTooLargeException('Envelope too large');
    }

    let parsed;
    try {
      parsed = parseEnvelope(rawBody);
    } catch {
      throw new BadRequestException('Invalid envelope format');
    }

    let stored = 0;
    for (const item of parsed.items) {
      if (item.header.type !== 'event') {
        continue;
      }
      const event = JSON.parse(item.payload) as ErrorEvent;
      if (!event.event_id || !event.timestamp) {
        throw new BadRequestException('Invalid event payload');
      }

      const scrubbed = scrubObject(
        event as unknown as Record<string, unknown>,
      ) as unknown as ErrorEvent;
      const timestamp = new Date(event.timestamp);

      const existing = await this.prisma.event.findUnique({
        where: {
          projectId_eventId: { projectId, eventId: event.event_id },
        },
      });
      if (existing) {
        continue;
      }

      await this.prisma.event.create({
        data: {
          projectId,
          eventId: event.event_id,
          payload: scrubbed as object,
          timestamp,
        },
      });
      stored += 1;
    }

    return { stored };
  }
}
