import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  can,
  type AuthorizationContext,
  type Permission,
} from '@repo/authorization';
import type { Request } from 'express';

import { REQUIRED_PERMISSION_KEY } from './auth.constants';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<Permission>(
      REQUIRED_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!permission) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthorizationContext }>();
    if (!request.user || !can(request.user, permission)) {
      throw new ForbiddenException(`Missing permission: ${permission}`);
    }
    return true;
  }
}
