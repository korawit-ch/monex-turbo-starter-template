import { describe, it, expect } from 'vitest';
import type { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import type { AuthorizationContext } from '@repo/authorization';

import { IS_PUBLIC_KEY, REQUIRED_PERMISSION_KEY } from './auth.constants';
import { CurrentAuth, Public, RequirePermission } from './auth.decorators';

class Decorated {
  @Public()
  open() {}

  @RequirePermission('link.delete')
  guarded() {}

  plain() {}

  withAuth(@CurrentAuth() _auth: AuthorizationContext) {}
}

@Public()
@RequirePermission('link.read')
class DecoratedClass {}

describe('auth decorators', () => {
  const reflector = new Reflector();

  it('@Public() marks the handler with the public metadata key', () => {
    expect(reflector.get(IS_PUBLIC_KEY, Decorated.prototype.open)).toBe(true);
    expect(
      reflector.get(REQUIRED_PERMISSION_KEY, Decorated.prototype.open),
    ).toBeUndefined();
  });

  it('@RequirePermission() stores the permission under the permission key only', () => {
    expect(
      reflector.get(REQUIRED_PERMISSION_KEY, Decorated.prototype.guarded),
    ).toBe('link.delete');
    expect(
      reflector.get(IS_PUBLIC_KEY, Decorated.prototype.guarded),
    ).toBeUndefined();
  });

  it('leaves undecorated handlers without auth metadata', () => {
    expect(
      reflector.get(IS_PUBLIC_KEY, Decorated.prototype.plain),
    ).toBeUndefined();
    expect(
      reflector.get(REQUIRED_PERMISSION_KEY, Decorated.prototype.plain),
    ).toBeUndefined();
  });

  it('works on classes as well as handlers', () => {
    expect(reflector.get(IS_PUBLIC_KEY, DecoratedClass)).toBe(true);
    expect(reflector.get(REQUIRED_PERMISSION_KEY, DecoratedClass)).toBe(
      'link.read',
    );
  });

  it('@CurrentAuth() returns the verified context from request.user', () => {
    const args = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      Decorated,
      'withAuth',
    ) as Record<
      string,
      { factory: (data: unknown, context: ExecutionContext) => unknown }
    >;
    const [entry] = Object.values(args);
    const user: AuthorizationContext = {
      subject: { userId: 'user-1', tenantId: 'tenant-1' },
      grants: [],
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
    expect(entry?.factory(undefined, context)).toBe(user);
  });
});
