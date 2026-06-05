import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module.js';
import { SymbolicatorModule } from '../symbolicator/symbolicator.module.js';
import { IssuesController } from './issues.controller.js';
import { IssuesService } from './issues.service.js';

@Module({
  imports: [EventsModule, SymbolicatorModule],
  controllers: [IssuesController],
  providers: [IssuesService],
})
export class IssuesModule {}
