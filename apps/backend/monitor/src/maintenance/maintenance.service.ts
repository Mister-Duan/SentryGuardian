import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '@sentry-guardian/nest-prisma';
import { AlerterService } from '../alerter/alerter.service.js';

const RETENTION_DAYS = Number(process.env.EVENT_RETENTION_DAYS ?? 30);
const MAINTENANCE_MS = 60 * 60 * 1000;

/**
 * Periodic maintenance: event retention and error-rate alert scan.
 * 定期维护：事件保留与错误率告警扫描。
 */
@Injectable()
export class MaintenanceService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(MaintenanceService.name);
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly alerter: AlerterService,
  ) {}

  onApplicationBootstrap(): void {
    void this.run();
    this.timer = setInterval(() => void this.run(), MAINTENANCE_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async run(): Promise<void> {
    await this.purgeOldEvents();
    await this.alerter.scanErrorRates();
  }

  private async purgeOldEvents(): Promise<void> {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const result = await this.prisma.event.deleteMany({
      where: { timestamp: { lt: cutoff } },
    });
    if (result.count > 0) {
      this.logger.log(`Purged ${result.count} event(s) older than ${RETENTION_DAYS} days`);
    }
  }
}
