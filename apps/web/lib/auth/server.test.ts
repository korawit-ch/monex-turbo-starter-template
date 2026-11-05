/** @vitest-environment node */
import jwt from 'jsonwebtoken';
import { beforeEach, describe, it, expect, vi } from 'vitest';

import {
  ACCESS_TOKEN_COOKIE,
  AuthenticationError,
  getAuth,
  getVerifiedAccess,
} from './server';
import { signAccessToken, stubAuthEnv, TEST_JWT_SECRET } from './test-support';

const cookieJar = vi.hoisted(() => new Map<string, string>());

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
    }),
}));

const tenantCondition = {
  operator: 'equals',
  subjectField: 'tenantId',
  resourceField: 'tenantId',
};

beforeEach(() => {
  cookieJar.clear();
  stubAuthEnv();
});

describe('getVerifiedAccess', () => {
  it('returns the sanitized context and the raw token from the access cookie', async () => {
    const token = signAccessToken({
      userId: 'user-7',
      tenantId: 'tenant-9',
      permissions: ['link.read', 'link.create'],
    });
    cookieJar.set(ACCESS_TOKEN_COOKIE, token);

    await expect(getVerifiedAccess()).resolves.toEqual({
      token,
      auth: {
        subject: { userId: 'user-7', tenantId: 'tenant-9' },
        grants: [
          { permission: 'link.read', conditions: [tenantCondition] },
          { permission: 'link.create', conditions: [tenantCondition] },
        ],
      },
    });
  });

  it('reads only the access_token cookie', async () => {
    cookieJar.set('auth_session', signAccessToken());

    await expect(getVerifiedAccess()).rejects.toThrow(
      new AuthenticationError('Access token is missing'),
    );
  });

  it.each([
    ['signed with another secret', { secret: 'y'.repeat(40) }],
    ['from another issuer', { issuer: 'someone-else' }],
    ['for another audience', { audience: 'another-app' }],
    ['expired', { expiresInSeconds: -10 }],
  ])('rejects a token %s', async (_label, options) => {
    cookieJar.set(ACCESS_TOKEN_COOKIE, signAccessToken(options));

    const result = getVerifiedAccess();

    await expect(result).rejects.toBeInstanceOf(AuthenticationError);
    await expect(result).rejects.toThrow('Access token is invalid or expired');
  });

  it('rejects a token signed with another algorithm', async () => {
    const token = jwt.sign(
      { attributes: { tenantId: 't' }, grants: [] },
      TEST_JWT_SECRET,
      {
        algorithm: 'HS512',
        subject: 'user-1',
        issuer: 'monex-api',
        audience: 'monex-web',
        expiresIn: 600,
      },
    );
    cookieJar.set(ACCESS_TOKEN_COOKIE, token);

    await expect(getVerifiedAccess()).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });

  it('rejects a validly signed token whose claims are malformed', async () => {
    const token = jwt.sign(
      {
        attributes: { tenantId: 'tenant-1' },
        grants: [{ permission: 'link.admin', conditions: [tenantCondition] }],
      },
      TEST_JWT_SECRET,
      {
        algorithm: 'HS256',
        subject: 'user-1',
        issuer: 'monex-api',
        audience: 'monex-web',
        expiresIn: 600,
      },
    );
    cookieJar.set(ACCESS_TOKEN_COOKIE, token);

    await expect(getVerifiedAccess()).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });

  it('surfaces a configuration failure instead of an authentication failure', async () => {
    vi.stubEnv('AUTH_JWT_SECRET', 'short');
    cookieJar.set(ACCESS_TOKEN_COOKIE, signAccessToken());

    const result = getVerifiedAccess();

    await expect(result).rejects.toThrow(
      'AUTH_JWT_SECRET must contain at least 32 bytes',
    );
    await expect(result).rejects.not.toBeInstanceOf(AuthenticationError);
  });
});

describe('getAuth', () => {
  it('returns only the authorization context', async () => {
    cookieJar.set(ACCESS_TOKEN_COOKIE, signAccessToken({ userId: 'user-3' }));

    const auth = await getAuth();

    expect(auth.subject.userId).toBe('user-3');
    expect(auth).not.toHaveProperty('token');
  });
});
