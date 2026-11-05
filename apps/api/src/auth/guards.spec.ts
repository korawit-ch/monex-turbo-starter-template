import { describe, it, expect, vi } from 'vitest';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY, REQUIRED_PERMISSION_KEY } from './auth.constants';
import { Public, RequirePermission } from './auth.decorators';

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
          auth: {
            subject: { userId: 'u', tenantId: 't' },
            grants: [{ permission: 'link.read', conditions: [] }],
          },
        }),
      } as never,
    );
    expect(guard.canActivate(context(request))).toBe(true);
    expect(request).toHaveProperty('user.subject.tenantId', 't');
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
          user: {
            subject: { userId: 'u', tenantId: 't' },
            grants: [{ permission: 'link.read', conditions: [] }],
          },
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});

describe('JwtAuthGuard', () => {
  class Routes {
    @Public()
    open() {}

    closed() {}
  }

  @Public()
  class PublicRoutes {
    anything() {}
  }

  const actor = {
    subject: { userId: 'u', tenantId: 't' },
    grants: [{ permission: 'link.read' as const, conditions: [] }],
  };

  function routeContext(
    handler: () => void,
    cls: new () => unknown,
    request: Record<string, unknown>,
  ): ExecutionContext {
    return {
      getHandler: () => handler,
      getClass: () => cls,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  function setup() {
    const accessTokens = {
      verify: vi.fn<(token: string) => { token: string; auth: typeof actor }>(
        (token) => ({ token, auth: actor }),
      ),
    };
    const guard = new JwtAuthGuard(new Reflector(), accessTokens as never);
    return { guard, accessTokens };
  }

  it('reads the public flag from the handler, then the class', () => {
    const reflector = {
      getAllAndOverride: vi.fn<(key: string, targets: unknown[]) => unknown>(
        () => true,
      ),
    };
    const guard = new JwtAuthGuard(reflector as never, {} as never);
    const handler = Routes.prototype.open;
    expect(guard.canActivate(routeContext(handler, Routes, {}))).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      handler,
      Routes,
    ]);
  });

  it('lets @Public() handlers and classes through without a token', () => {
    const { guard, accessTokens } = setup();
    const request = { headers: {} };
    expect(
      guard.canActivate(routeContext(Routes.prototype.open, Routes, request)),
    ).toBe(true);
    expect(
      guard.canActivate(
        routeContext(PublicRoutes.prototype.anything, PublicRoutes, request),
      ),
    ).toBe(true);
    expect(accessTokens.verify).not.toHaveBeenCalled();
    expect(request).not.toHaveProperty('user');
  });

  it.each([
    ['no header', undefined],
    ['an empty header', ''],
    ['another scheme', 'Basic dXNlcjpwYXNz'],
    ['a lower-case scheme', 'bearer token'],
    ['the scheme alone', 'Bearer'],
    ['an empty token', 'Bearer '],
    ['a double space', 'Bearer  token'],
    ['an extra segment', 'Bearer token extra'],
  ])('rejects %s on a protected route', (_case, authorization) => {
    const { guard, accessTokens } = setup();
    const request = {
      headers: authorization === undefined ? {} : { authorization },
    };
    expect(() =>
      guard.canActivate(routeContext(Routes.prototype.closed, Routes, request)),
    ).toThrow(UnauthorizedException);
    expect(accessTokens.verify).not.toHaveBeenCalled();
    expect(request).not.toHaveProperty('user');
  });

  it('verifies exactly the bearer token and stores only the sanitized context', () => {
    const { guard, accessTokens } = setup();
    const request = { headers: { authorization: 'Bearer abc.def.ghi' } };
    expect(
      guard.canActivate(routeContext(Routes.prototype.closed, Routes, request)),
    ).toBe(true);
    expect(accessTokens.verify).toHaveBeenCalledWith('abc.def.ghi');
    expect(request).toHaveProperty('user', actor);
  });

  it('propagates a verification failure and leaves request.user unset', () => {
    const { guard, accessTokens } = setup();
    accessTokens.verify.mockImplementation(() => {
      throw new UnauthorizedException('Invalid or expired access token');
    });
    const request = { headers: { authorization: 'Bearer forged' } };
    expect(() =>
      guard.canActivate(routeContext(Routes.prototype.closed, Routes, request)),
    ).toThrow(UnauthorizedException);
    expect(request).not.toHaveProperty('user');
  });
});

describe('PermissionGuard', () => {
  class Routes {
    @RequirePermission('link.delete')
    remove() {}

    unguarded() {}
  }

  @RequirePermission('link.update')
  class ClassGuarded {
    @RequirePermission('link.read')
    read() {}

    inherit() {}
  }

  const tenantCondition = {
    operator: 'equals' as const,
    subjectField: 'tenantId' as const,
    resourceField: 'tenantId' as const,
  };

  function actor(
    ...permissions: Array<'link.read' | 'link.update' | 'link.delete'>
  ) {
    return {
      subject: { userId: 'u', tenantId: 't' },
      grants: permissions.map((permission) => ({
        permission,
        conditions: [tenantCondition],
      })),
    };
  }

  function routeContext(
    handler: () => void,
    cls: new () => unknown,
    request: Record<string, unknown>,
  ): ExecutionContext {
    return {
      getHandler: () => handler,
      getClass: () => cls,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  const guard = new PermissionGuard(new Reflector());

  it('reads the permission metadata key from the handler, then the class', () => {
    const reflector = {
      getAllAndOverride: vi.fn<(key: string, targets: unknown[]) => unknown>(
        () => undefined,
      ),
    };
    const handler = Routes.prototype.unguarded;
    new PermissionGuard(reflector as never).canActivate(
      routeContext(handler, Routes, {}),
    );
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      REQUIRED_PERMISSION_KEY,
      [handler, Routes],
    );
  });

  it('allows a route without @RequirePermission()', () => {
    expect(
      guard.canActivate(routeContext(Routes.prototype.unguarded, Routes, {})),
    ).toBe(true);
  });

  it('allows an actor holding the required grant', () => {
    expect(
      guard.canActivate(
        routeContext(Routes.prototype.remove, Routes, {
          user: actor('link.delete'),
        }),
      ),
    ).toBe(true);
  });

  it('forbids a guarded route when request.user is missing', () => {
    expect(() =>
      guard.canActivate(routeContext(Routes.prototype.remove, Routes, {})),
    ).toThrow(new ForbiddenException('Missing permission: link.delete'));
  });

  it('lets handler metadata override class metadata', () => {
    const request = { user: actor('link.read') };
    expect(
      guard.canActivate(
        routeContext(ClassGuarded.prototype.read, ClassGuarded, request),
      ),
    ).toBe(true);
    expect(() =>
      guard.canActivate(
        routeContext(ClassGuarded.prototype.inherit, ClassGuarded, request),
      ),
    ).toThrow(new ForbiddenException('Missing permission: link.update'));
  });
});
