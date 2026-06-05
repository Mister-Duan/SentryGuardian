import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaModule } from '@sentry-guardian/nest-prisma';
import { EnvelopeModule } from './envelope/envelope.module.js';
import { HealthModule } from './health/health.module.js';
import { RateLimitMiddleware } from './rate-limit.middleware.js';

@Module({
  imports: [PrismaModule, HealthModule, EnvelopeModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RateLimitMiddleware).forRoutes('*');
  }
}
