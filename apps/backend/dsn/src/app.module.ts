import { Module } from '@nestjs/common';
import { PrismaModule } from '@sentry-guardian/nest-prisma';
import { EnvelopeModule } from './envelope/envelope.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [PrismaModule, HealthModule, EnvelopeModule],
})
export class AppModule {}
