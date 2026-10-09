import { UnauthorizedException } from '@nestjs/common';
import { jest } from '@jest/globals';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  const user = {
    id: 'user-1',
    email: 'admin@example.com',
    passwordHash: 'encoded',
    tenantId: 'tenant-1',
    role: 'ADMIN' as const,
    disabledAt: null,
  };

  function setup() {
    const client = {
      user: { findUnique: jest.fn(async () => user) },
      authSession: {
        create: jest.fn(async (input) => input),
        findFirst: jest.fn(),
        updateMany: jest.fn(async () => ({ count: 1 })),
      },
    };
    const accessTokens = { issue: jest.fn(() => 'access-jwt') };
    const sessions = {
      seal: jest.fn(() => 'encrypted-session'),
      open: jest.fn(() => ({ token: 'raw-session', exp: Date.now() + 1000 })),
    };
    const service = new AuthService(
      { client } as never,
      accessTokens as never,
      sessions as never,
      { verify: jest.fn(() => true) } as never,
      { sessionTtlSeconds: 3600 } as never,
    );
    return { service, client, accessTokens, sessions };
  }

  it('stores only a hash of the raw session credential', async () => {
    const { service, client, sessions } = setup();
    await service.login(user.email, 'password');
    const createInput = client.authSession.create.mock.calls[0]?.[0] as {
      data: { tokenHash: string };
    };
    const rawToken = sessions.seal.mock.calls[0]?.[0];
    expect(createInput.data.tokenHash).toBeDefined();
    expect(createInput.data.tokenHash).not.toBe(rawToken);
    expect(createInput.data.tokenHash).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('rejects renewal when the database session is revoked or expired', async () => {
    const { service, client } = setup();
    client.authSession.findFirst.mockResolvedValueOnce(null as never);
    await expect(service.refresh('encrypted-session')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(client.authSession.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ revokedAt: null }),
      }),
    );
  });

  it('revokes only the selected user for all-session logout', async () => {
    const { service, client } = setup();
    await service.revokeAll('user-1');
    expect(client.authSession.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
