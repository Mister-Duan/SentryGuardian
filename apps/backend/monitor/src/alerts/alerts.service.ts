import { Injectable, NotFoundException } from '@nestjs/common';
import { AlertTrigger as PrismaAlertTrigger } from '@sentry-guardian/database';
import { PrismaService } from '@sentry-guardian/nest-prisma';
import type { AlertRuleRequest, AlertRuleResponse } from '@sentry-guardian/types';
import { AlerterService } from '../alerter/alerter.service.js';

function mapRule(row: {
  id: string;
  projectId: string;
  name: string;
  trigger: PrismaAlertTrigger;
  webhookUrl: string | null;
  emailTo: string | null;
  enabled: boolean;
  threshold: number | null;
}): AlertRuleResponse {
  return {
    id: row.id,
    project_id: row.projectId,
    name: row.name,
    trigger: AlerterService.toApiTrigger(row.trigger),
    webhook_url: row.webhookUrl ?? undefined,
    email_to: row.emailTo ?? undefined,
    enabled: row.enabled,
    threshold: row.threshold ?? undefined,
  };
}

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(projectId: string): Promise<AlertRuleResponse[]> {
    const rows = await this.prisma.alertRule.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapRule);
  }

  async create(projectId: string, body: AlertRuleRequest): Promise<AlertRuleResponse> {
    const row = await this.prisma.alertRule.create({
      data: {
        projectId,
        name: body.name,
        trigger: body.trigger.toUpperCase() as PrismaAlertTrigger,
        webhookUrl: body.webhook_url,
        emailTo: body.email_to,
        enabled: body.enabled ?? true,
        threshold: body.threshold,
      },
    });
    return mapRule(row);
  }

  async update(
    projectId: string,
    id: string,
    body: AlertRuleRequest,
  ): Promise<AlertRuleResponse> {
    try {
      const row = await this.prisma.alertRule.update({
        where: { id, projectId },
        data: {
          name: body.name,
          trigger: body.trigger.toUpperCase() as PrismaAlertTrigger,
          webhookUrl: body.webhook_url,
          emailTo: body.email_to,
          enabled: body.enabled,
          threshold: body.threshold,
        },
      });
      return mapRule(row);
    } catch {
      throw new NotFoundException('Alert rule not found');
    }
  }

  async remove(projectId: string, id: string): Promise<void> {
    try {
      await this.prisma.alertRule.delete({ where: { id, projectId } });
    } catch {
      throw new NotFoundException('Alert rule not found');
    }
  }
}
