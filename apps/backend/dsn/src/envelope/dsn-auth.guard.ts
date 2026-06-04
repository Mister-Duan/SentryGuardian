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
  publicKey?: string;
}

const PUBLIC_KEY_HEADER = 'x-sentry-guardian-public-key';

/**
 * Validate projectId + public key for ingest requests.
 * 校验 ingest 请求的 projectId 与 public key。
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

    const publicKey = this.extractPublicKey(req);
    if (!publicKey) {
      throw new UnauthorizedException('Missing public key');
    }

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, publicKey },
    });
    if (!project) {
      throw new UnauthorizedException('Invalid DSN credentials');
    }

    req.projectId = projectId;
    req.publicKey = publicKey;
    return true;
  }

  private extractPublicKey(req: DsnAuthRequest): string | undefined {
    const header = req.headers[PUBLIC_KEY_HEADER];
    if (typeof header === 'string' && header.length > 0) {
      return header;
    }
    const query = req.query.sentry_key;
    if (typeof query === 'string') {
      return query;
    }
    return undefined;
  }
}
