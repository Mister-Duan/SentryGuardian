import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@sentry-guardian/nest-prisma';
import type { IssueCommentResponse } from '@sentry-guardian/types';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(issueId: string): Promise<IssueCommentResponse[]> {
    const issue = await this.prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }
    const rows = await this.prisma.issueComment.findMany({
      where: { issueId },
      orderBy: { createdAt: 'asc' },
    });
    const users = await this.prisma.user.findMany({
      where: { id: { in: rows.map((r) => r.authorId) } },
    });
    const emailById = new Map(users.map((u) => [u.id, u.email]));
    return rows.map((r) => ({
      id: r.id,
      issue_id: r.issueId,
      author_email: emailById.get(r.authorId) ?? 'unknown',
      body: r.body,
      created_at: r.createdAt.toISOString(),
    }));
  }

  async create(
    issueId: string,
    authorId: string,
    body: string,
  ): Promise<IssueCommentResponse> {
    const issue = await this.prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }
    const row = await this.prisma.issueComment.create({
      data: { issueId, authorId, body },
    });
    const user = await this.prisma.user.findUnique({ where: { id: authorId } });
    return {
      id: row.id,
      issue_id: row.issueId,
      author_email: user?.email ?? 'unknown',
      body: row.body,
      created_at: row.createdAt.toISOString(),
    };
  }
}
