import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionGuard } from './permission.guard';

function context(request: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: () => context,
    getClass: () => class Test {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('authentication and permission guards', () => {
  it('populates request.user from a bearer access token', () => {
    const request = { headers: { authorization: 'Bearer token' } };
    const guard = new JwtAuthGuard(
      { getAllAndOverride: () => false } as never,
      {
        verify: () => ({
          token: 'token',
          auth: { userId: 'u', tenantId: 't', permissions: ['link.read'] },
        }),
      } as never,
    );
    expect(guard.canActivate(context(request))).toBe(true);
    expect(request).toHaveProperty('user.tenantId', 't');
  });

  it('rejects missing bearer authentication', () => {
    const guard = new JwtAuthGuard(
      { getAllAndOverride: () => false } as never,
      { verify: () => undefined } as never,
    );
    expect(() => guard.canActivate(context({ headers: {} }))).toThrow(
      UnauthorizedException,
    );
  });

  it('returns forbidden when the verified actor lacks permission', () => {
    const guard = new PermissionGuard({
      getAllAndOverride: () => 'link.delete',
    } as never);
    expect(() =>
      guard.canActivate(
        context({
          user: { userId: 'u', tenantId: 't', permissions: ['link.read'] },
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});
