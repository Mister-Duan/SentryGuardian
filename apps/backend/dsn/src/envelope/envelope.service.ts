import {
  BadRequestException,
  Inject,
  Injectable,
  PayloadTooLargeException,
  UnauthorizedException,
} from '@nestjs/common';
import { parseEnvelope } from '@sentry-guardian/core';
import { PrismaService } from '@sentry-guardian/nest-prisma';
import type { ErrorEvent, TransactionEvent } from '@sentry-guardian/types';
import { scrubObject } from '@sentry-guardian/utils';

const MAX_BYTES = Number(process.env.MAX_ENVELOPE_BYTES ?? 1_048_576);

/**
 * Persist envelope events to PostgreSQL.
 * 将 Envelope 中的事件写入 PostgreSQL。
 */
@Injectable()
export class EnvelopeService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async ingest(projectId: string, rawBody: string): Promise<{ stored: number }> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new UnauthorizedException('Unknown project');
    }

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
      if (item.header.type === 'event') {
        stored += await this.storeError(projectId, item.payload);
      } else if (item.header.type === 'transaction') {
        stored += await this.storeTransaction(projectId, item.payload);
      } else if (item.header.type === 'client_report') {
        // Client reports logged only; no persistence in Lite MVP+
        continue;
      }
    }

    return { stored };
  }

  private async storeError(projectId: string, payload: string): Promise<number> {
    const event = JSON.parse(payload) as ErrorEvent;
    if (!event.event_id || !event.timestamp) {
      throw new BadRequestException('Invalid event payload');
    }

    const scrubbed = scrubObject(
      event as unknown as Record<string, unknown>,
    ) as unknown as ErrorEvent;

    const existing = await this.prisma.event.findUnique({
      where: { projectId_eventId: { projectId, eventId: event.event_id } },
    });
    if (existing) {
      return 0;
    }

    await this.prisma.event.create({
      data: {
        projectId,
        eventId: event.event_id,
        eventType: 'ERROR',
        payload: scrubbed as object,
        timestamp: new Date(event.timestamp),
      },
    });
    return 1;
  }

  private async storeTransaction(projectId: string, payload: string): Promise<number> {
    const tx = JSON.parse(payload) as TransactionEvent;
    if (!tx.event_id || !tx.timestamp || tx.type !== 'transaction') {
      throw new BadRequestException('Invalid transaction payload');
    }

    const existing = await this.prisma.event.findUnique({
      where: { projectId_eventId: { projectId, eventId: tx.event_id } },
    });
    if (existing) {
      return 0;
    }

    await this.prisma.event.create({
      data: {
        projectId,
        eventId: tx.event_id,
        eventType: 'TRANSACTION',
        payload: tx as object,
        timestamp: new Date(tx.timestamp),
        aggregatedAt: new Date(),
      },
    });
    return 1;
  }
}
