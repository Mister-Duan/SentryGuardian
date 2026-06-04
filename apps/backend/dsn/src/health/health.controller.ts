import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '@sentry-guardian/nest-prisma';

/**
 * Liveness and readiness probes.
 * 存活与就绪探针。
 */
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liveness probe.
   * 存活探针。
   *
   * @example
   * ```http
   * GET /health
   * // Output / 输出
   * { "status": "ok" }
   * ```
   */
  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  /**
   * Readiness probe (database reachable).
   * 就绪探针（数据库可连接）。
   *
   * @example
   * ```http
   * GET /ready
   * // Output / 输出
   * { "status": "ready" }
   * ```
   */
  @Get('ready')
  async ready(): Promise<{ status: string }> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ready' };
  }
}
