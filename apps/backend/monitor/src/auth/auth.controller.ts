import { Body, Controller, Post } from '@nestjs/common';
import type { LoginRequest, LoginResponse } from '@sentry-guardian/types';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Console login.
   * 控制台登录。
   */
  @Post('login')
  login(@Body() body: LoginRequest): Promise<LoginResponse> {
    return this.authService.login(body);
  }
}
