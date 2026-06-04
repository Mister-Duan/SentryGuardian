import { Injectable, NotFoundException } from '@nestjs/common';
import { IssueStatus as PrismaIssueStatus } from '@sentry-guardian/database';
import { PrismaService } from '@sentry-guardian/nest-prisma';
import type {
  ErrorEvent,
  Issue,
  IssueDetailResponse,
  IssueListQuery,
  IssueListResponse,
  IssueStatus,
  UpdateIssueStatusRequest,
} from '@sentry-guardian/types';

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
  };
}

/**
 * Issue query and status updates for the console API.
 * 控制台 Issue 查询与状态更新。
 */
@Injectable()
export class IssuesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: IssueListQuery): Promise<IssueListResponse> {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.page_size ?? 20, 100);
    const where = {
      ...(query.project_id ? { projectId: query.project_id } : {}),
      ...(query.status
        ? { status: query.status.toUpperCase() as PrismaIssueStatus }
        : {}),
    };

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

  async getById(id: string): Promise<IssueDetailResponse> {
    const issue = await this.prisma.issue.findUnique({ where: { id } });
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    const latest = await this.prisma.event.findFirst({
      where: { issueId: id },
      orderBy: { timestamp: 'desc' },
    });

    return {
      issue: mapIssue(issue),
      latest_event: latest ? (latest.payload as unknown as ErrorEvent) : undefined,
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
