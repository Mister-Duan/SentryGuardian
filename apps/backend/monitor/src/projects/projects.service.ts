import { Injectable } from '@nestjs/common';
import { buildDsn, generatePublicKey } from '@sentry-guardian/database';
import { PrismaService } from '@sentry-guardian/nest-prisma';
import type {
  CreateProjectRequest,
  ProjectResponse,
  RotateKeyResponse,
} from '@sentry-guardian/types';

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'project'
  );
}

/**
 * Project listing and management for the console.
 * 控制台项目列表与管理。
 */
@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  private ingestHost(): string {
    return process.env.SEED_INGEST_HOST ?? 'localhost:3001';
  }

  async listForOrganization(organizationId: string): Promise<ProjectResponse[]> {
    const projects = await this.prisma.project.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
    const host = this.ingestHost();
    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      dsn: buildDsn(p.id, host),
    }));
  }

  async create(organizationId: string, body: CreateProjectRequest): Promise<ProjectResponse> {
    const slug = body.slug ?? slugify(body.name);
    const project = await this.prisma.project.create({
      data: {
        organizationId,
        name: body.name,
        slug,
        publicKey: generatePublicKey(),
      },
    });
    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
      dsn: buildDsn(project.id, this.ingestHost()),
    };
  }

  async rotateKey(projectId: string): Promise<RotateKeyResponse> {
    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: { publicKey: generatePublicKey() },
    });
    return {
      dsn: buildDsn(project.id, this.ingestHost()),
      public_key: project.publicKey,
    };
  }
}
