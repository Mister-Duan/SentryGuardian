import { Module } from '@nestjs/common';
import { AlerterModule } from '../alerter/alerter.module.js';
import { GrouperService } from './grouper.service.js';

@Module({
  imports: [AlerterModule],
  providers: [GrouperService],
})
export class GrouperModule {}
