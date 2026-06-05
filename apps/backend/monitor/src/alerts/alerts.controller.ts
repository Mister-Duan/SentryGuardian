import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { AlertRuleRequest, AlertRuleResponse } from '@sentry-guardian/types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AlertsService } from './alerts.service.js';

@Controller('projects/:projectId/alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  list(@Param('projectId') projectId: string): Promise<AlertRuleResponse[]> {
    return this.alertsService.list(projectId);
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() body: AlertRuleRequest,
  ): Promise<AlertRuleResponse> {
    return this.alertsService.create(projectId, body);
  }

  @Patch(':id')
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() body: AlertRuleRequest,
  ): Promise<AlertRuleResponse> {
    return this.alertsService.update(projectId, id, body);
  }

  @Delete(':id')
  remove(@Param('projectId') projectId: string, @Param('id') id: string): Promise<void> {
    return this.alertsService.remove(projectId, id);
  }
}
