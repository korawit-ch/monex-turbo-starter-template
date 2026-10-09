import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { AuthorizationContext, Permission } from '@repo/authorization';
import type { Request } from 'express';

import { IS_PUBLIC_KEY, REQUIRED_PERMISSION_KEY } from './auth.constants';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const RequirePermission = (permission: Permission) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, permission);

export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthorizationContext => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthorizationContext }>();
    return request.user;
  },
);
