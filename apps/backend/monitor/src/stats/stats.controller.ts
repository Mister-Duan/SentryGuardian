import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import type {
  ErrorBreakdownResponse,
  ErrorTypeTrendResponse,
  IssueStatsQuery,
  IssueTrendResponse,
  PerformanceSummaryResponse,
  ReleaseCompareResponse,
  TransactionListQuery,
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

  @Get('performance-summary')
  performanceSummary(
    @Param('projectId') projectId: string,
    @Query() query: TransactionListQuery,
  ): Promise<PerformanceSummaryResponse> {
    return this.statsService.performanceSummary(projectId, query);
  }

  @Get('transactions')
  transactions(
    @Param('projectId') projectId: string,
    @Query() query: TransactionListQuery,
  ): Promise<TransactionListResponse> {
    return this.statsService.listTransactions(projectId, query);
  }
}
