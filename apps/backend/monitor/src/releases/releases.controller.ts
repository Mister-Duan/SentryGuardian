import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { CreateReleaseRequest, ReleaseResponse } from '@sentry-guardian/types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ReleasesService } from './releases.service.js';

@Controller('projects/:projectId/releases')
@UseGuards(JwtAuthGuard)
export class ReleasesController {
  constructor(private readonly releasesService: ReleasesService) {}

  @Get()
  list(@Param('projectId') projectId: string): Promise<ReleaseResponse[]> {
    return this.releasesService.list(projectId);
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() body: CreateReleaseRequest,
  ): Promise<ReleaseResponse> {
    return this.releasesService.create(projectId, body.version);
  }

  @Post(':releaseId/artifacts')
  @UseInterceptors(FileInterceptor('file'))
  uploadArtifact(
    @Param('projectId') projectId: string,
    @Param('releaseId') releaseId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ name: string }> {
    return this.releasesService.uploadArtifact(
      projectId,
      releaseId,
      file.originalname,
      file.buffer.toString('utf8'),
    );
  }
}
