import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@sentry-guardian/database';

/**
 * Nest injectable Prisma client with lifecycle hooks.
 * 可注入的 Prisma Client，带模块生命周期钩子。
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /**
   * Connect on module init.
   * 模块初始化时连接数据库。
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /**
   * Disconnect on module destroy.
   * 模块销毁时断开数据库连接。
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
