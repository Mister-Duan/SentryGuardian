import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type {
  CreateProjectRequest,
  ProjectResponse,
  RotateKeyResponse,
} from '@sentry-guardian/types';
import { type AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ProjectsService } from './projects.service.js';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  list(@Req() req: AuthenticatedRequest): Promise<ProjectResponse[]> {
    return this.projectsService.listForOrganization(req.user!.organizationId);
  }

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateProjectRequest,
  ): Promise<ProjectResponse> {
    return this.projectsService.create(req.user!.organizationId, body);
  }

  @Post(':id/rotate-key')
  rotateKey(@Param('id') id: string): Promise<RotateKeyResponse> {
    return this.projectsService.rotateKey(id);
  }
}
