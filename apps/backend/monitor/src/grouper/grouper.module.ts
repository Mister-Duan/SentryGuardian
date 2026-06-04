import { Module } from '@nestjs/common';
import { GrouperService } from './grouper.service.js';

@Module({
  providers: [GrouperService],
})
export class GrouperModule {}
