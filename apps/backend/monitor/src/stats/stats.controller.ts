import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import type {
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

  @Get('trends')
  trends(
    @Param('projectId') projectId: string,
    @Query('hours') hours?: string,
  ): Promise<IssueTrendResponse> {
    return this.statsService.issueTrends(projectId, Number(hours ?? 24));
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
