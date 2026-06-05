import { Injectable } from '@nestjs/common';
import { buildDsn } from '@sentry-guardian/database';
import { PrismaService } from '@sentry-guardian/nest-prisma';
import type { ProjectResponse } from '@sentry-guardian/types';

/**
 * Project listing for the console.
 * 控制台项目列表。
 */
@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List projects in the user's organization with DSN strings.
   * 列出用户组织下的项目（含 DSN）。
   *
   * @example
   * ```ts
   * // Input / 输入
   * await service.listForOrganization('org-id')
   * // Output / 输出
   * [{ id: '...', name: 'Default', slug: 'default', dsn: 'https://...' }]
   * ```
   */
  async listForOrganization(organizationId: string): Promise<ProjectResponse[]> {
    const host = process.env.SEED_INGEST_HOST ?? 'localhost:3001';
    const projects = await this.prisma.project.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      dsn: buildDsn(p.id, host),
    }));
  }
}
