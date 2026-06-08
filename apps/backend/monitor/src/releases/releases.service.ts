import { createHash } from 'node:crypto';
import { Injectable, NotFoundException, PayloadTooLargeException } from '@nestjs/common';
import { PrismaService } from '@sentry-guardian/nest-prisma';
import type { ArtifactResponse, ArtifactType, ReleaseResponse, UploadArtifactMetadata } from '@sentry-guardian/types';
import { parseDebugIdFromMap } from '../symbolicator/symbolicator.logic.js';

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

  async listArtifacts(projectId: string, releaseId: string): Promise<ArtifactResponse[]> {
    const release = await this.prisma.release.findFirst({
      where: { id: releaseId, projectId },
      include: { artifacts: { orderBy: { createdAt: 'desc' } } },
    });
    if (!release) {
      throw new NotFoundException('Release not found');
    }
    return release.artifacts.map((a) => ({
      id: a.id,
      name: a.name,
      bundle_url: a.bundleUrl ?? undefined,
      debug_id: a.debugId ?? undefined,
      artifact_type: (a.artifactType as ArtifactType) ?? 'map',
      created_at: a.createdAt.toISOString(),
    }));
  }

  async uploadArtifact(
    projectId: string,
    releaseId: string,
    name: string,
    content: string,
    metadata: UploadArtifactMetadata = {},
  ): Promise<{ name: string }> {
    if (Buffer.byteLength(content, 'utf8') > MAX_MAP_BYTES) {
      throw new PayloadTooLargeException('Source map too large');
    }
    const release = await this.prisma.release.findFirst({
      where: { id: releaseId, projectId },
    });
    if (!release) {
      throw new NotFoundException('Release not found');
    }

    const artifactType = metadata.artifact_type ?? 'map';
    let debugId = metadata.debug_id;
    if (!debugId && artifactType === 'map') {
      debugId = parseDebugIdFromMap(content);
    }
    const checksum = createHash('sha256').update(content).digest('hex').slice(0, 16);

    await this.prisma.artifact.upsert({
      where: { releaseId_name: { releaseId, name } },
      create: {
        releaseId,
        name,
        sourceMap: content,
        bundleUrl: metadata.bundle_url ?? null,
        debugId: debugId ?? null,
        artifactType,
        checksum,
      },
      update: {
        sourceMap: content,
        bundleUrl: metadata.bundle_url ?? undefined,
        debugId: debugId ?? undefined,
        artifactType,
        checksum,
      },
    });
    return { name };
  }
}
