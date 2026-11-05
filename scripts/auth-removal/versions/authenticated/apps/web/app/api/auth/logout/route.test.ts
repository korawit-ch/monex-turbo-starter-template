/** @vitest-environment node */
import { NextRequest } from 'next/server';
import { beforeEach, describe, it, expect, vi } from 'vitest';

import { SESSION_COOKIE } from '../../../../lib/auth/server';
import {
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

function logoutRequest(origin?: string) {
  const headers = new Headers({ cookie: 'access_token=jwt; other=value' });
  if (origin) headers.set('origin', origin);
  return new NextRequest(`${TEST_WEB_ORIGIN}/api/auth/logout`, {
    method: 'POST',
    headers,
  });
}

beforeEach(() => {
  cookieJar.clear();
  stubAuthEnv();
});

describe('POST /api/auth/logout', () => {
  it('forwards only the encoded session cookie and relays the cleared cookies', async () => {
    cookieJar.set(SESSION_COOKIE, 'enc/value+=');
    cookieJar.set('access_token', 'jwt');
    const fetchMock = vi.fn(() =>
      Promise.resolve(upstreamResponse(201, '{"ok":true}', clearedCookies)),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(logoutRequest(TEST_WEB_ORIGIN));

    expect(fetchMock).toHaveBeenCalledWith(`${TEST_API_URL}/auth/logout`, {
      method: 'POST',
      headers: { cookie: 'auth_session=enc%2Fvalue%2B%3D' },
      cache: 'no-store',
    });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.headers.getSetCookie()).toEqual(clearedCookies);
  });

  it('still calls upstream without a session so the cookies get cleared', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(upstreamResponse(201, '{"ok":true}', clearedCookies)),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(logoutRequest(TEST_WEB_ORIGIN));

    expect(fetchMock).toHaveBeenCalledWith(`${TEST_API_URL}/auth/logout`, {
      method: 'POST',
      headers: {},
      cache: 'no-store',
    });
    expect(response.headers.getSetCookie()).toEqual(clearedCookies);
  });

  it.each([
    ['without an Origin', undefined],
    ['from another origin', 'https://evil.example'],
  ])('rejects a request %s with 403', async (_label, origin) => {
    cookieJar.set(SESSION_COOKIE, 'enc');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(logoutRequest(origin));

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('relays the upstream status', async () => {
    cookieJar.set(SESSION_COOKIE, 'enc');
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(upstreamResponse(500, '{}'))),
    );

    const response = await POST(logoutRequest(TEST_WEB_ORIGIN));

    expect(response.status).toBe(500);
  });
});
