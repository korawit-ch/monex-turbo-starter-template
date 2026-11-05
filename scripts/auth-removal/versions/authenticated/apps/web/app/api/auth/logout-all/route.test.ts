/** @vitest-environment node */
import { NextRequest } from 'next/server';
import { beforeEach, describe, it, expect, vi } from 'vitest';

import { ACCESS_TOKEN_COOKIE } from '../../../../lib/auth/server';
import {
  signAccessToken,
  stubAuthEnv,
  TEST_API_URL,
  TEST_WEB_ORIGIN,
  upstreamResponse,
} from '../../../../lib/auth/test-support';
import { POST } from './route';

const cookieJar = vi.hoisted(() => new Map<string, string>());

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
    }),
}));

const clearedCookies = [
  'access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax',
  'auth_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax',
];

function logoutAllRequest(origin?: string) {
  const headers = new Headers({ cookie: 'auth_session=enc' });
  if (origin) headers.set('origin', origin);
  return new NextRequest(`${TEST_WEB_ORIGIN}/api/auth/logout-all`, {
    method: 'POST',
    headers,
  });
}

beforeEach(() => {
  cookieJar.clear();
  stubAuthEnv();
});

describe('POST /api/auth/logout-all', () => {
  it('forwards only the verified bearer token and relays the cleared cookies', async () => {
    const token = signAccessToken();
    cookieJar.set(ACCESS_TOKEN_COOKIE, token);
    cookieJar.set('auth_session', 'enc');
    const fetchMock = vi.fn(() =>
      Promise.resolve(upstreamResponse(201, '{"ok":true}', clearedCookies)),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(logoutAllRequest(TEST_WEB_ORIGIN));

    expect(fetchMock).toHaveBeenCalledWith(`${TEST_API_URL}/auth/logout-all`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.headers.getSetCookie()).toEqual(clearedCookies);
  });

  it.each([
    ['without an Origin', undefined],
    ['from another origin', 'https://evil.example'],
  ])('rejects a request %s with 403', async (_label, origin) => {
    cookieJar.set(ACCESS_TOKEN_COOKIE, signAccessToken());
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(logoutAllRequest(origin));

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['missing', undefined],
    ['invalid', 'not-a-jwt'],
  ])(
    'answers 401 without calling upstream when the access token is %s',
    async (_label, token) => {
      if (token) cookieJar.set(ACCESS_TOKEN_COOKIE, token);
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      const response = await POST(logoutAllRequest(TEST_WEB_ORIGIN));

      expect(response.status).toBe(401);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it('relays the upstream status', async () => {
    cookieJar.set(ACCESS_TOKEN_COOKIE, signAccessToken());
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(upstreamResponse(503, '{}'))),
    );

    const response = await POST(logoutAllRequest(TEST_WEB_ORIGIN));

    expect(response.status).toBe(503);
  });

  it('rethrows configuration failures', async () => {
    vi.stubEnv('AUTH_JWT_SECRET', 'short');
    cookieJar.set(ACCESS_TOKEN_COOKIE, signAccessToken());
    vi.stubGlobal('fetch', vi.fn());

    await expect(POST(logoutAllRequest(TEST_WEB_ORIGIN))).rejects.toThrow(
      'AUTH_JWT_SECRET must contain at least 32 bytes',
    );
  });
});
