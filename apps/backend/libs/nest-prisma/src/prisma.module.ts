import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * Global Prisma module for backend apps.
 * 后端应用共用的全局 Prisma 模块。
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
