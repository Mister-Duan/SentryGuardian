import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { CreateIssueCommentRequest, IssueCommentResponse } from '@sentry-guardian/types';
import { type AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CommentsService } from './comments.service.js';

@Controller('issues/:issueId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  list(@Param('issueId') issueId: string): Promise<IssueCommentResponse[]> {
    return this.commentsService.list(issueId);
  }

  @Post()
  create(
    @Param('issueId') issueId: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateIssueCommentRequest,
  ): Promise<IssueCommentResponse> {
    return this.commentsService.create(issueId, req.user!.sub, body.body);
  }
}
