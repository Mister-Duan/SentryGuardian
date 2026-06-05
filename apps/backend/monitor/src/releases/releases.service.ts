import { Injectable, NotFoundException, PayloadTooLargeException } from '@nestjs/common';
import { PrismaService } from '@sentry-guardian/nest-prisma';
import type { ReleaseResponse } from '@sentry-guardian/types';

const MAX_MAP_BYTES = 5_242_880;

@Injectable()
export class ReleasesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(projectId: string): Promise<ReleaseResponse[]> {
    const rows = await this.prisma.release.findMany({
      where: { projectId },
      include: { _count: { select: { artifacts: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      project_id: r.projectId,
      version: r.version,
      created_at: r.createdAt.toISOString(),
      artifact_count: r._count.artifacts,
    }));
  }

  async create(projectId: string, version: string): Promise<ReleaseResponse> {
    const row = await this.prisma.release.upsert({
      where: { projectId_version: { projectId, version } },
      create: { projectId, version },
      update: {},
      include: { _count: { select: { artifacts: true } } },
    });
    return {
      id: row.id,
      project_id: row.projectId,
      version: row.version,
      created_at: row.createdAt.toISOString(),
      artifact_count: row._count.artifacts,
    };
  }

  async uploadArtifact(
    projectId: string,
    releaseId: string,
    name: string,
    sourceMap: string,
  ): Promise<{ name: string }> {
    if (Buffer.byteLength(sourceMap, 'utf8') > MAX_MAP_BYTES) {
      throw new PayloadTooLargeException('Source map too large');
    }
    const release = await this.prisma.release.findFirst({
      where: { id: releaseId, projectId },
    });
    if (!release) {
      throw new NotFoundException('Release not found');
    }
    await this.prisma.artifact.upsert({
      where: { releaseId_name: { releaseId, name } },
      create: { releaseId, name, sourceMap },
      update: { sourceMap },
    });
    return { name };
  }
}
