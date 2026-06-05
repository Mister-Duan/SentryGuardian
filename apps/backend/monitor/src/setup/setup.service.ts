import { BadRequestException, Injectable } from '@nestjs/common';
import { buildDsn, generatePublicKey } from '@sentry-guardian/database';
import { PrismaService } from '@sentry-guardian/nest-prisma';
import type { SetupRequest, SetupResponse, SetupStatusResponse } from '@sentry-guardian/types';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SetupService {
  constructor(private readonly prisma: PrismaService) {}

  async status(): Promise<SetupStatusResponse> {
    const count = await this.prisma.user.count();
    return { configured: count > 0 };
  }

  async bootstrap(body: SetupRequest): Promise<SetupResponse> {
    const existing = await this.prisma.user.count();
    if (existing > 0) {
      throw new BadRequestException('Instance already configured');
    }

    const orgSlug = body.organization_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'default';
    const projectSlug =
      body.project_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48) || 'default';

    const org = await this.prisma.organization.create({
      data: { name: body.organization_name, slug: orgSlug },
    });
    await this.prisma.user.create({
      data: {
        organizationId: org.id,
        email: body.admin_email,
        passwordHash: await bcrypt.hash(body.admin_password, 10),
      },
    });
    const project = await this.prisma.project.create({
      data: {
        organizationId: org.id,
        name: body.project_name,
        slug: projectSlug,
        publicKey: generatePublicKey(),
      },
    });

    const host = process.env.SEED_INGEST_HOST ?? 'localhost:3001';
    return {
      dsn: buildDsn(project.id, host),
      project_id: project.id,
    };
  }
}
