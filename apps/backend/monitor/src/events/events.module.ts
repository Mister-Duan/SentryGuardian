import { Module } from '@nestjs/common';
import { SymbolicatorModule } from '../symbolicator/symbolicator.module.js';
import { EventsController } from './events.controller.js';
import { EventsService } from './events.service.js';

@Module({
  imports: [SymbolicatorModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
