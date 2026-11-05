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
import { GET, POST } from './route';

const cookieJar = vi.hoisted(() => new Map<string, string>());

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
    }),
}));

const renewedAccessCookie =
  'access_token=fresh; Max-Age=600; Path=/; HttpOnly; SameSite=Lax';

const expectedUpstreamCall = [
  `${TEST_API_URL}/auth/refresh`,
  {
    method: 'POST',
    headers: { cookie: 'auth_session=enc%2Bvalue' },
    cache: 'no-store',
  },
] as const;

function getRequest(returnTo?: string) {
  const url = new URL('/api/auth/refresh', TEST_WEB_ORIGIN);
  if (returnTo !== undefined) url.searchParams.set('returnTo', returnTo);
  return new NextRequest(url, { headers: { cookie: 'access_token=old' } });
}

function postRequest(origin?: string) {
  const headers = new Headers({ cookie: 'access_token=old' });
  if (origin) headers.set('origin', origin);
  return new NextRequest(`${TEST_WEB_ORIGIN}/api/auth/refresh`, {
    method: 'POST',
    headers,
  });
}

beforeEach(() => {
  cookieJar.clear();
  stubAuthEnv();
});

describe('GET /api/auth/refresh', () => {
  it('renews with only the session cookie and redirects to a local returnTo', async () => {
    cookieJar.set(SESSION_COOKIE, 'enc+value');
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        upstreamResponse(201, '{"ok":true}', [renewedAccessCookie]),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(getRequest('/links?filter=mine'));

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(...expectedUpstreamCall);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      `${TEST_WEB_ORIGIN}/links?filter=mine`,
    );
    expect(response.headers.getSetCookie()).toEqual([renewedAccessCookie]);
  });

  it.each([
    'https://evil.example/phish',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
  ])('replaces the unsafe returnTo %s with /', async (returnTo) => {
    cookieJar.set(SESSION_COOKIE, 'enc+value');
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          upstreamResponse(201, '{"ok":true}', [renewedAccessCookie]),
        ),
      ),
    );

    const response = await GET(getRequest(returnTo));

    expect(response.headers.get('location')).toBe(`${TEST_WEB_ORIGIN}/`);
  });

  it('falls back to / when returnTo is missing', async () => {
    cookieJar.set(SESSION_COOKIE, 'enc+value');
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(upstreamResponse(201, '{"ok":true}'))),
    );

    const response = await GET(getRequest());

    expect(response.headers.get('location')).toBe(`${TEST_WEB_ORIGIN}/`);
  });

  it('redirects to /login without calling upstream when there is no session', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(getRequest('/links'));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(`${TEST_WEB_ORIGIN}/login`);
  });

  it('redirects to /login when upstream rejects the session with 401', async () => {
    cookieJar.set(SESSION_COOKIE, 'enc+value');
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(upstreamResponse(401, '{"message":"revoked"}')),
      ),
    );

    const response = await GET(getRequest('/links'));

    expect(response.headers.get('location')).toBe(`${TEST_WEB_ORIGIN}/login`);
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it.each([400, 403, 500, 503])(
    'answers 502 instead of a login redirect when upstream fails with %i',
    async (status) => {
      cookieJar.set(SESSION_COOKIE, 'enc+value');
      vi.stubGlobal(
        'fetch',
        vi.fn(() =>
          Promise.resolve(
            upstreamResponse(status, '{}', [renewedAccessCookie]),
          ),
        ),
      );

      const response = await GET(getRequest('/links'));

      expect(response.status).toBe(502);
      expect(response.headers.get('location')).toBeNull();
      expect(response.headers.getSetCookie()).toEqual([]);
      await expect(response.json()).resolves.toEqual({
        message: 'Authentication service is unavailable',
      });
    },
  );
});

describe('POST /api/auth/refresh', () => {
  it('renews with only the session cookie and relays the access cookie', async () => {
    cookieJar.set(SESSION_COOKIE, 'enc+value');
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        upstreamResponse(201, '{"ok":true}', [renewedAccessCookie]),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(postRequest(TEST_WEB_ORIGIN));

    expect(fetchMock).toHaveBeenCalledWith(...expectedUpstreamCall);
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.headers.getSetCookie()).toEqual([renewedAccessCookie]);
  });

  it.each([
    ['without an Origin', undefined],
    ['from another origin', 'https://evil.example'],
  ])('rejects a request %s with 403', async (_label, origin) => {
    cookieJar.set(SESSION_COOKIE, 'enc+value');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(postRequest(origin));

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('answers 401 without calling upstream when there is no session', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(postRequest(TEST_WEB_ORIGIN));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: 'Session is required',
    });
  });

  it.each([401, 500])('relays upstream status %i', async (status) => {
    cookieJar.set(SESSION_COOKIE, 'enc+value');
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(upstreamResponse(status, '{"message":"no"}')),
      ),
    );

    const response = await POST(postRequest(TEST_WEB_ORIGIN));

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ message: 'no' });
  });
});
