import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import type {
  ErrorBreakdownResponse,
  ErrorTypeTrendResponse,
  IssueStatsQuery,
  IssueTrendResponse,
  ReleaseCompareResponse,
  TransactionListResponse,
} from '@sentry-guardian/types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { StatsService } from './stats.service.js';

@Controller('projects/:projectId')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('error-type-trends')
  errorTypeTrends(
    @Param('projectId') projectId: string,
    @Query() query: IssueStatsQuery & { dimension?: string },
  ): Promise<ErrorTypeTrendResponse> {
    const dim = query.dimension === 'mechanism' ? 'mechanism' : 'type';
    return this.statsService.errorTypeTrends(projectId, query, dim);
  }

  @Get('error-breakdown')
  errorBreakdown(
    @Param('projectId') projectId: string,
    @Query() query: IssueStatsQuery,
  ): Promise<ErrorBreakdownResponse> {
    return this.statsService.errorBreakdown(projectId, query);
  }

  @Get('trends')
  trends(
    @Param('projectId') projectId: string,
    @Query('hours') hours?: string,
  ): Promise<IssueTrendResponse> {
    return this.statsService.issueTrends(projectId, Number(hours ?? 12));
  }

  @Get('releases/compare')
  releaseCompare(@Param('projectId') projectId: string): Promise<ReleaseCompareResponse> {
    return this.statsService.releaseCompare(projectId);
  }

  @Get('transactions')
  transactions(
    @Param('projectId') projectId: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
  ): Promise<TransactionListResponse> {
    return this.statsService.listTransactions(
      projectId,
      Number(page ?? 1),
      Number(pageSize ?? 20),
    );
  }
}
