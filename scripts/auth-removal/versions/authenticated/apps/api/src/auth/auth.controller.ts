import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthMutationResponse } from '@repo/api-contract';
import type { AuthorizationContext } from '@repo/authorization';
import type { Request, Response } from 'express';

import { ACCESS_TOKEN_COOKIE, SESSION_COOKIE } from './auth.constants';
import { AuthConfig } from './auth.config';
import { CurrentAuth, Public } from './auth.decorators';
import { AuthService } from './auth.service';
import { readCookie } from './cookie.util';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: AuthConfig,
  ) {}

  @Public()
  @Post('login')
  async login(
    @Body() input: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthMutationResponse> {
    const credentials = await this.auth.login(input.email, input.password);
    response.cookie(
      ACCESS_TOKEN_COOKIE,
      credentials.accessToken,
      this.config.cookieOptions(this.config.accessTtlSeconds),
    );
    response.cookie(
      SESSION_COOKIE,
      credentials.sessionCookie,
      this.config.cookieOptions(this.config.sessionTtlSeconds),
    );
    return { ok: true };
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthMutationResponse> {
    const sessionCookie = readCookie(request, SESSION_COOKIE);
    if (!sessionCookie) throw new UnauthorizedException('Session is required');
    const accessToken = await this.auth.refresh(sessionCookie);
    response.cookie(
      ACCESS_TOKEN_COOKIE,
      accessToken,
      this.config.cookieOptions(this.config.accessTtlSeconds),
    );
    return { ok: true };
  }

  @Public()
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthMutationResponse> {
    await this.auth.revokeCurrent(readCookie(request, SESSION_COOKIE));
    this.clearCookies(response);
    return { ok: true };
  }

  @Post('logout-all')
  async logoutAll(
    @CurrentAuth() auth: AuthorizationContext,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthMutationResponse> {
    await this.auth.revokeAll(auth.userId);
    this.clearCookies(response);
    return { ok: true };
  }

  private clearCookies(response: Response): void {
    const options = this.config.clearCookieOptions();
    response.clearCookie(ACCESS_TOKEN_COOKIE, options);
    response.clearCookie(SESSION_COOKIE, options);
  }
}
