import { Module } from '@nestjs/common';
import { PrismaModule } from '@sentry-guardian/nest-prisma';
import { EnvelopeController } from './envelope.controller.js';
import { EnvelopeService } from './envelope.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [EnvelopeController],
  providers: [EnvelopeService],
})
export class EnvelopeModule {}
