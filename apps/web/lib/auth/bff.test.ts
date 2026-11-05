/** @vitest-environment node */
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, it, expect, vi } from 'vitest';

import {
  authenticationResponse,
  proxyProtectedRequest,
  relaySetCookies,
  requireSameOrigin,
} from './bff';
import { ACCESS_TOKEN_COOKIE, AuthenticationError } from './server';
import {
  signAccessToken,
  stubAuthEnv,
  TEST_API_URL,
  TEST_WEB_ORIGIN,
  upstreamResponse,
} from './test-support';

const cookieJar = vi.hoisted(() => new Map<string, string>());

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
    }),
}));

function request(
  method: string,
  init: { origin?: string; body?: string } = {},
) {
  const headers = new Headers({
    cookie: 'access_token=raw-browser-cookie; auth_session=raw-session',
  });
  if (init.origin) headers.set('origin', init.origin);
  return new NextRequest(`${TEST_WEB_ORIGIN}/api/links`, {
    method,
    headers,
    body: init.body,
  });
}

beforeEach(() => {
  cookieJar.clear();
  stubAuthEnv();
});

describe('requireSameOrigin', () => {
  it('accepts the configured WEB_ORIGIN', () => {
    expect(
      requireSameOrigin(request('POST', { origin: TEST_WEB_ORIGIN })),
    ).toBeNull();
  });

  it.each([
    ['missing', undefined],
    ['another site', 'https://evil.example'],
    ['another port', 'http://localhost:3001'],
    ['the literal null origin', 'null'],
  ])('rejects an Origin that is %s with 403', async (_label, origin) => {
    const failure = requireSameOrigin(request('POST', { origin }));

    expect(failure?.status).toBe(403);
    await expect(failure?.json()).resolves.toEqual({
      message: 'Trusted same-origin request required',
    });
  });
});

describe('authenticationResponse', () => {
  it('turns an AuthenticationError into a 401 with its message', async () => {
    const response = authenticationResponse(
      new AuthenticationError('Access token is missing'),
    );

    expect(response?.status).toBe(401);
    await expect(response?.json()).resolves.toEqual({
      message: 'Access token is missing',
    });
  });

  it('leaves other errors to the caller', () => {
    expect(authenticationResponse(new Error('boom'))).toBeNull();
  });
});

describe('proxyProtectedRequest', () => {
  it('forwards a GET with only the verified bearer token and relays the upstream answer', async () => {
    const token = signAccessToken({ permissions: ['link.read'] });
    cookieJar.set(ACCESS_TOKEN_COOKIE, token);
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        upstreamResponse(
          200,
          '[{"id":1}]',
          [],
          'application/json; charset=utf-8',
        ),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await proxyProtectedRequest(
      request('GET'),
      '/links',
      'link.read',
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(`${TEST_API_URL}/links`, {
      method: 'GET',
      headers: { authorization: `Bearer ${token}` },
      body: undefined,
      cache: 'no-store',
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(
      'application/json; charset=utf-8',
    );
    await expect(response.json()).resolves.toEqual([{ id: 1 }]);
  });

  it('forwards a same-origin mutation body as JSON with the bearer token', async () => {
    const token = signAccessToken({ permissions: ['link.create'] });
    cookieJar.set(ACCESS_TOKEN_COOKIE, token);
    const fetchMock = vi.fn(() =>
      Promise.resolve(upstreamResponse(201, '{"id":2}')),
    );
    vi.stubGlobal('fetch', fetchMock);
    const body = '{"title":"Docs","url":"https://example.com"}';

    const response = await proxyProtectedRequest(
      request('POST', { origin: TEST_WEB_ORIGIN, body }),
      '/links',
      'link.create',
    );

    expect(fetchMock).toHaveBeenCalledWith(`${TEST_API_URL}/links`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body,
      cache: 'no-store',
    });
    expect(response.status).toBe(201);
  });

  it('rejects a mutation without the trusted Origin before calling upstream', async () => {
    cookieJar.set(
      ACCESS_TOKEN_COOKIE,
      signAccessToken({ permissions: ['link.create'] }),
    );
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await proxyProtectedRequest(
      request('POST', { origin: 'https://evil.example', body: '{}' }),
      '/links',
      'link.create',
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      message: 'Trusted same-origin request required',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a missing permission with 403 before calling upstream', async () => {
    cookieJar.set(
      ACCESS_TOKEN_COOKIE,
      signAccessToken({ permissions: ['link.read'] }),
    );
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await proxyProtectedRequest(
      request('DELETE', { origin: TEST_WEB_ORIGIN }),
      '/links/1',
      'link.delete',
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      message: 'Missing permission: link.delete',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('answers 401 without calling upstream when the access cookie is missing', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await proxyProtectedRequest(
      request('GET'),
      '/links',
      'link.read',
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: 'Access token is missing',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('answers 401 for an invalid access token', async () => {
    cookieJar.set(ACCESS_TOKEN_COOKIE, 'not-a-jwt');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await proxyProtectedRequest(
      request('GET'),
      '/links',
      'link.read',
    );

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([404, 409, 500])(
    'relays upstream status %i and its body',
    async (status) => {
      cookieJar.set(
        ACCESS_TOKEN_COOKIE,
        signAccessToken({ permissions: ['link.update'] }),
      );
      vi.stubGlobal(
        'fetch',
        vi.fn(() =>
          Promise.resolve(upstreamResponse(status, '{"message":"upstream"}')),
        ),
      );

      const response = await proxyProtectedRequest(
        request('PATCH', { origin: TEST_WEB_ORIGIN, body: '{"title":"x"}' }),
        '/links/1',
        'link.update',
      );

      expect(response.status).toBe(status);
      await expect(response.json()).resolves.toEqual({ message: 'upstream' });
    },
  );

  it('defaults the content type to JSON when upstream sends none', async () => {
    cookieJar.set(ACCESS_TOKEN_COOKIE, signAccessToken());
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(null, { status: 204 }))),
    );

    const response = await proxyProtectedRequest(
      request('GET'),
      '/links',
      'link.read',
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('content-type')).toBe('application/json');
  });

  it('rethrows configuration failures instead of answering 401', async () => {
    vi.stubEnv('AUTH_JWT_SECRET', 'short');
    cookieJar.set(ACCESS_TOKEN_COOKIE, signAccessToken());
    vi.stubGlobal('fetch', vi.fn());

    await expect(
      proxyProtectedRequest(request('GET'), '/links', 'link.read'),
    ).rejects.toThrow('AUTH_JWT_SECRET must contain at least 32 bytes');
  });
});

describe('relaySetCookies', () => {
  it('appends every upstream Set-Cookie header unchanged', () => {
    const access =
      'access_token=a; Max-Age=600; Path=/; HttpOnly; SameSite=Lax';
    const session =
      'auth_session=s; Max-Age=2592000; Path=/; HttpOnly; SameSite=Lax';
    const response = NextResponse.json({ ok: true });

    relaySetCookies(
      upstreamResponse(200, null, [access, session]).headers,
      response,
    );

    expect(response.headers.getSetCookie()).toEqual([access, session]);
  });

  it('adds nothing when upstream sets no cookie', () => {
    const response = NextResponse.json({ ok: true });

    relaySetCookies(new Headers(), response);

    expect(response.headers.getSetCookie()).toEqual([]);
  });
});
