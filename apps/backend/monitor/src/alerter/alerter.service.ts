import { Injectable, Logger } from '@nestjs/common';
import { AlertTrigger as PrismaAlertTrigger } from '@sentry-guardian/database';
import { PrismaService } from '@sentry-guardian/nest-prisma';
import type { AlertTrigger } from '@sentry-guardian/types';

/**
 * Evaluate alert rules and dispatch notifications.
 * 评估告警规则并发送通知。
 */
@Injectable()
export class AlerterService {
  private readonly logger = new Logger(AlerterService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fire rules when a new issue is created.
   * 新 Issue 创建时触发规则。
   */
  async onNewIssue(issueId: string, projectId: string): Promise<void> {
    const rules = await this.prisma.alertRule.findMany({
      where: {
        projectId,
        enabled: true,
        trigger: PrismaAlertTrigger.NEW_ISSUE,
      },
    });
    const issue = await this.prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) {
      return;
    }
    for (const rule of rules) {
      await this.dispatch(rule.webhookUrl, rule.emailTo, {
        trigger: 'new_issue',
        project_id: projectId,
        issue: {
          id: issue.id,
          title: issue.title,
          culprit: issue.culprit,
          event_count: issue.eventCount,
        },
      });
    }
  }

  /**
   * Periodic scan for error_rate thresholds.
   * 周期性扫描错误率阈值。
   */
  async scanErrorRates(): Promise<void> {
    const rules = await this.prisma.alertRule.findMany({
      where: {
        enabled: true,
        trigger: PrismaAlertTrigger.ERROR_RATE,
        threshold: { not: null },
      },
    });
    const since = new Date(Date.now() - 60 * 60 * 1000);
    for (const rule of rules) {
      const count = await this.prisma.event.count({
        where: {
          projectId: rule.projectId,
          eventType: 'ERROR',
          timestamp: { gte: since },
        },
      });
      if (count >= (rule.threshold ?? 0)) {
        await this.dispatch(rule.webhookUrl, rule.emailTo, {
          trigger: 'error_rate',
          project_id: rule.projectId,
          threshold: rule.threshold,
          event_count_1h: count,
        });
      }
    }
  }

  private async dispatch(
    webhookUrl: string | null,
    emailTo: string | null,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        this.logger.warn(`Webhook failed: ${String(err)}`);
      }
    }
    if (emailTo && process.env.SMTP_HOST) {
      this.logger.log(`Email alert to ${emailTo} (SMTP stub): ${JSON.stringify(payload)}`);
    }
  }

  static toApiTrigger(t: PrismaAlertTrigger): AlertTrigger {
    return t === PrismaAlertTrigger.NEW_ISSUE ? 'new_issue' : 'error_rate';
  }
}
