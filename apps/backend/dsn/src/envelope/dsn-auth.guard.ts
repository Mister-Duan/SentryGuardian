import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '@sentry-guardian/nest-prisma';

export interface DsnAuthRequest extends Request {
  projectId?: string;
}

/**
 * Validate project id for ingest requests (DSN path embeds project id).
 * 校验 ingest 请求的项目 id（DSN 路径含 project id）。
 */
@Injectable()
export class DsnAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Attach authenticated project context to the request.
   * 将已鉴权的项目上下文挂到请求上。
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<DsnAuthRequest>();
    const rawId = req.params.projectId;
    const projectId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!projectId) {
      throw new UnauthorizedException('Missing projectId');
    }

    const project = await this.prisma.project.findFirst({
      where: { id: projectId },
    });
    if (!project) {
      throw new UnauthorizedException('Unknown project');
    }

    req.projectId = projectId;
    return true;
  }
}
