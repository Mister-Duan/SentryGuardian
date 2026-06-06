import { Injectable, NotFoundException } from '@nestjs/common';
import { IssueStatus as PrismaIssueStatus } from '@sentry-guardian/database';
import { PrismaService } from '@sentry-guardian/nest-prisma';
import type {
  ErrorEvent,
  Issue,
  IssueDetailResponse,
  IssueErrorBreakdownResponse,
  IssueEventListQuery,
  IssueEventListResponse,
  IssueListQuery,
  IssueListResponse,
  IssueStatus,
  UpdateIssueStatusRequest,
} from '@sentry-guardian/types';
import { toIssueErrorBreakdownResponse } from '../stats/error-breakdown.js';
import { EventsService } from '../events/events.service.js';
import { SymbolicatorService } from '../symbolicator/symbolicator.service.js';
import { buildIssueListWhere } from './issues.logic.js';

function toApiStatus(status: PrismaIssueStatus): IssueStatus {
  return status.toLowerCase() as IssueStatus;
}

function mapIssue(row: {
  id: string;
  projectId: string;
  fingerprint: string;
  title: string;
  status: PrismaIssueStatus;
  level: string;
  firstSeen: Date;
  lastSeen: Date;
  eventCount: number;
  usersSeen: number;
  culprit: string | null;
  exceptionType: string | null;
  mechanism: string | null;
  environment: string | null;
  release: string | null;
  tags: string | null;
}): Issue {
  return {
    id: row.id,
    project_id: row.projectId,
    fingerprint: row.fingerprint,
    title: row.title,
    status: toApiStatus(row.status),
    level: row.level,
    first_seen: row.firstSeen.toISOString(),
    last_seen: row.lastSeen.toISOString(),
    event_count: row.eventCount,
    users_seen: row.usersSeen,
    culprit: row.culprit ?? undefined,
    exception_type: row.exceptionType ?? undefined,
    mechanism: row.mechanism ?? undefined,
  };
}

/**
 * Issue query and status updates for the console API.
 * 控制台 Issue 查询与状态更新。
 */
@Injectable()
export class IssuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly symbolicator: SymbolicatorService,
  ) {}

  async list(query: IssueListQuery): Promise<IssueListResponse> {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.page_size ?? 20, 100);
    const where = buildIssueListWhere(query);

    const [items, total] = await Promise.all([
      this.prisma.issue.findMany({
        where,
        orderBy: { lastSeen: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.issue.count({ where }),
    ]);

    return {
      items: items.map(mapIssue),
      total,
      page,
      page_size: pageSize,
    };
  }

  async listEvents(issueId: string, query: IssueEventListQuery): Promise<IssueEventListResponse> {
    const issue = await this.prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }
    const page = query.page ?? 1;
    const pageSize = Math.min(query.page_size ?? 20, 100);

    const where = { issueId, eventType: 'ERROR' as const };
    const [rows, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      items: rows.map((r) => this.eventsService.mapSummary(r)),
      total,
      page,
      page_size: pageSize,
    };
  }

  async errorBreakdown(issueId: string): Promise<IssueErrorBreakdownResponse> {
    const issue = await this.prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rows = await this.prisma.event.findMany({
      where: { issueId, eventType: 'ERROR', timestamp: { gte: since } },
      select: { payload: true, timestamp: true },
      orderBy: { timestamp: 'asc' },
      take: 2000,
    });
    const payloads = rows.map((r) => r.payload as unknown as ErrorEvent);
    const timestamps = rows.map((r) => r.timestamp);
    return toIssueErrorBreakdownResponse(payloads, timestamps);
  }

  async getById(id: string): Promise<IssueDetailResponse> {
    const issue = await this.prisma.issue.findUnique({ where: { id } });
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    const latest = await this.prisma.event.findFirst({
      where: { issueId: id, eventType: 'ERROR' },
      orderBy: { timestamp: 'desc' },
    });

    let latest_event: ErrorEvent | undefined;
    if (latest) {
      latest_event = await this.symbolicator.symbolicateEvent(
        issue.projectId,
        latest.payload as unknown as ErrorEvent,
      );
    }

    return {
      issue: mapIssue(issue),
      latest_event,
    };
  }

  async updateStatus(id: string, body: UpdateIssueStatusRequest): Promise<Issue> {
    const status = body.status.toUpperCase() as PrismaIssueStatus;
    try {
      const updated = await this.prisma.issue.update({
        where: { id },
        data: { status },
      });
      return mapIssue(updated);
    } catch {
      throw new NotFoundException('Issue not found');
    }
  }
}
