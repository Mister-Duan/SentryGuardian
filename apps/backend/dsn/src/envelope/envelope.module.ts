import { Module } from '@nestjs/common';
import { DsnAuthGuard } from './dsn-auth.guard.js';
import { EnvelopeController } from './envelope.controller.js';
import { EnvelopeService } from './envelope.service.js';

@Module({
  controllers: [EnvelopeController],
  providers: [EnvelopeService, DsnAuthGuard],
})
export class EnvelopeModule {}
