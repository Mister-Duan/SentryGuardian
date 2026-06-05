import { Module } from '@nestjs/common';
import { AlerterService } from './alerter.service.js';

@Module({
  providers: [AlerterService],
  exports: [AlerterService],
})
export class AlerterModule {}
