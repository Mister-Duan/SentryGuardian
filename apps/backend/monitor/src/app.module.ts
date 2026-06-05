import { Module } from '@nestjs/common';
import { PrismaModule } from '@sentry-guardian/nest-prisma';
import { AlertsModule } from './alerts/alerts.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CommentsModule } from './comments/comments.module.js';
import { EventsModule } from './events/events.module.js';
import { GrouperModule } from './grouper/grouper.module.js';
import { HealthModule } from './health/health.module.js';
import { IssuesModule } from './issues/issues.module.js';
import { MaintenanceModule } from './maintenance/maintenance.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { ReleasesModule } from './releases/releases.module.js';
import { SetupModule } from './setup/setup.module.js';
import { StatsModule } from './stats/stats.module.js';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    SetupModule,
    AuthModule,
    ProjectsModule,
    IssuesModule,
    EventsModule,
    ReleasesModule,
    StatsModule,
    CommentsModule,
    AlertsModule,
    GrouperModule,
    MaintenanceModule,
  ],
})
export class AppModule {}
