import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import type {
  Issue,
  IssueDetailResponse,
  IssueEventListQuery,
  IssueEventListResponse,
  IssueListQuery,
  IssueListResponse,
  UpdateIssueStatusRequest,
} from '@sentry-guardian/types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { IssuesService } from './issues.service.js';

@Controller('issues')
@UseGuards(JwtAuthGuard)
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get()
  list(@Query() query: IssueListQuery): Promise<IssueListResponse> {
    return this.issuesService.list(query);
  }

  @Get(':id/events')
  listEvents(
    @Param('id') id: string,
    @Query() query: IssueEventListQuery,
  ): Promise<IssueEventListResponse> {
    return this.issuesService.listEvents(id, query);
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<IssueDetailResponse> {
    return this.issuesService.getById(id);
  }

  @Patch(':id')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateIssueStatusRequest,
  ): Promise<Issue> {
    return this.issuesService.updateStatus(id, body);
  }
}
