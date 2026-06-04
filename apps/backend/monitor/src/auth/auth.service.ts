import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@sentry-guardian/nest-prisma';
import type { LoginRequest, LoginResponse } from '@sentry-guardian/types';
import bcrypt from 'bcryptjs';

/**
 * Console authentication (email + password → JWT).
 * 控制台认证（邮箱密码 → JWT）。
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Validate credentials and issue a bearer token.
   * 校验凭据并签发 Bearer Token。
   *
   * @example
   * ```ts
   * // Input / 输入
   * await auth.login({ email: 'admin@localhost', password: 'adminadmin' })
   * // Output / 输出
   * { access_token: '...', token_type: 'Bearer', expires_in: 604800 }
   * ```
   */
  async login(body: LoginRequest): Promise<LoginResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const access_token = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
    });

    return {
      access_token,
      token_type: 'Bearer',
      expires_in: 7 * 24 * 60 * 60,
    };
  }
}
