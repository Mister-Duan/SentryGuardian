import { Module } from '@nestjs/common';
import { PrismaModule } from '@sentry-guardian/nest-prisma';
import { AuthModule } from './auth/auth.module.js';
import { GrouperModule } from './grouper/grouper.module.js';
import { HealthModule } from './health/health.module.js';
import { IssuesModule } from './issues/issues.module.js';
import { ProjectsModule } from './projects/projects.module.js';

@Module({
  imports: [PrismaModule, HealthModule, AuthModule, ProjectsModule, IssuesModule, GrouperModule],
})
export class AppModule {}
