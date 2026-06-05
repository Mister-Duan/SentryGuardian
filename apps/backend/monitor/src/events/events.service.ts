import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@sentry-guardian/nest-prisma';
import type { ErrorEvent, EventDetailResponse, EventSummary } from '@sentry-guardian/types';
import { SymbolicatorService } from '../symbolicator/symbolicator.service.js';

function mapSummary(row: {
  id: string;
  eventId: string;
  timestamp: Date;
  payload: unknown;
}): EventSummary {
  const payload = row.payload as ErrorEvent;
  return {
    id: row.id,
    event_id: row.eventId,
    timestamp: row.timestamp.toISOString(),
    environment: payload.environment,
    release: payload.release,
    user_id: payload.user?.id,
  };
}

/**
 * Event detail queries for the console API.
 * 控制台事件详情查询。
 */
@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly symbolicator: SymbolicatorService,
  ) {}

  /**
   * Fetch one event by internal id with optional symbolication.
   * 按内部 ID 获取事件（可选符号化）。
   */
  async getById(id: string): Promise<EventDetailResponse> {
    const row = await this.prisma.event.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Event not found');
    }
    const payload = row.payload as unknown as ErrorEvent;
    const symbolicated = await this.symbolicator.symbolicateEvent(
      row.projectId,
      payload,
    );
    return {
      id: row.id,
      event_id: row.eventId,
      issue_id: row.issueId ?? undefined,
      timestamp: row.timestamp.toISOString(),
      payload: symbolicated,
    };
  }

  mapSummary(row: {
    id: string;
    eventId: string;
    timestamp: Date;
    payload: unknown;
  }): EventSummary {
    return mapSummary(row);
  }
}
