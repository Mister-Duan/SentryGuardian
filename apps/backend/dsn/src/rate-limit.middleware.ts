import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { PrismaService } from '@sentry-guardian/nest-prisma';

const hits = new Map<string, { count: number; resetAt: number }>();

/**
 * Per-project ingest rate limiting middleware.
 * 按项目 ingest 限流中间件。
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const match = req.path.match(/\/api\/sentry\/envelope\/([^/]+)\/?$/);
    if (!match || req.method !== 'POST') {
      next();
      return;
    }

    const projectId = match[1];
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      next();
      return;
    }

    const limit = project.rateLimitPerMinute;
    const key = `${projectId}:${Math.floor(Date.now() / 60000)}`;
    const bucket = hits.get(key) ?? { count: 0, resetAt: Date.now() + 60_000 };
    bucket.count += 1;
    hits.set(key, bucket);

    if (bucket.count > limit) {
      res.setHeader('Retry-After', '60');
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }
    next();
  }
}
