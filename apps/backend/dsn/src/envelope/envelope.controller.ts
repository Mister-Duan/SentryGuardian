import { Controller, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { DsnAuthGuard } from './dsn-auth.guard.js';
import { EnvelopeService } from './envelope.service.js';

/**
 * Ingest envelope HTTP API.
 * Envelope 上报 HTTP API。
 */
@Controller('api/sentry/:projectId')
export class EnvelopeController {
  constructor(private readonly envelopeService: EnvelopeService) {}

  /**
   * Accept a line-based sentry-guardian envelope.
   * 接收行式 sentry-guardian Envelope。
   *
   * @example
   * ```http
   * POST /api/sentry/{projectId}/envelope/
   * // Output / 输出
   * { "stored": 1 }
   * ```
   */
  @Post('envelope')
  @HttpCode(201)
  @UseGuards(DsnAuthGuard)
  async ingest(
    @Param('projectId') projectId: string,
    @Req() req: Request,
  ): Promise<{ stored: number }> {
    const body = typeof req.body === 'string' ? req.body : '';
    return this.envelopeService.ingest(projectId, body);
  }
}
