import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthorizationContext } from '@repo/authorization';
import type { Request } from 'express';

import { IS_PUBLIC_KEY } from './auth.constants';
import { AccessTokenService } from './access-token.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokens: AccessTokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthorizationContext }>();
    const header = request.headers.authorization;
    const [scheme, token, extra] = header?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token || extra) {
      throw new UnauthorizedException('Bearer access token is required');
    }
    request.user = this.accessTokens.verify(token).auth;
    return true;
  }
}
