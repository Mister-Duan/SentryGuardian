import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import type { EventDetailResponse } from '@sentry-guardian/types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { EventsService } from './events.service.js';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get(':id')
  get(@Param('id') id: string): Promise<EventDetailResponse> {
    return this.eventsService.getById(id);
  }
}
