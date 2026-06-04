import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * Require `Authorization: Bearer <jwt>` on protected routes.
 * 受保护路由要求 `Authorization: Bearer <jwt>`。
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = header.slice(7);
    try {
      req.user = await this.jwt.verifyAsync<JwtPayload>(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
