import { Body, Controller, Get, Post } from '@nestjs/common';
import type { SetupRequest, SetupResponse, SetupStatusResponse } from '@sentry-guardian/types';
import { SetupService } from './setup.service.js';

@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Get('status')
  status(): Promise<SetupStatusResponse> {
    return this.setupService.status();
  }

  @Post()
  bootstrap(@Body() body: SetupRequest): Promise<SetupResponse> {
    return this.setupService.bootstrap(body);
  }
}
