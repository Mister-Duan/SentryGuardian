import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { ProjectResponse } from '@sentry-guardian/types';
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
}
