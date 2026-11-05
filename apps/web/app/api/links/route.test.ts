/** @vitest-environment node */
import { NextRequest } from 'next/server';
import { beforeEach, describe, it, expect, vi } from 'vitest';

import { ACCESS_TOKEN_COOKIE } from '../../../lib/auth/server';
import {
  signAccessToken,
  stubAuthEnv,
  TEST_API_URL,
  TEST_WEB_ORIGIN,
  upstreamResponse,
} from '../../../lib/auth/test-support';
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

function linksRequest(
  method: 'GET' | 'POST',
  init: { origin?: string; body?: string } = {},
) {
  const headers = new Headers({ cookie: 'access_token=raw; auth_session=raw' });
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

describe('GET /api/links', () => {
  it('requires link.read and forwards the bearer token to /links', async () => {
    const token = signAccessToken({ permissions: ['link.read'] });
    cookieJar.set(ACCESS_TOKEN_COOKIE, token);
    const fetchMock = vi.fn(() => Promise.resolve(upstreamResponse(200, '[]')));
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(linksRequest('GET'));

    expect(fetchMock).toHaveBeenCalledWith(`${TEST_API_URL}/links`, {
      method: 'GET',
      headers: { authorization: `Bearer ${token}` },
      body: undefined,
      cache: 'no-store',
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([]);
  });

  it('answers 403 without calling upstream when link.read is missing', async () => {
    cookieJar.set(
      ACCESS_TOKEN_COOKIE,
      signAccessToken({ permissions: ['link.create'] }),
    );
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(linksRequest('GET'));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      message: 'Missing permission: link.read',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('answers 401 when the access token is missing', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(linksRequest('GET'));

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('POST /api/links', () => {
  const body = '{"title":"Docs","url":"https://example.com"}';

  it('requires link.create and forwards only the body and bearer token', async () => {
    const token = signAccessToken({ permissions: ['link.create'] });
    cookieJar.set(ACCESS_TOKEN_COOKIE, token);
    const fetchMock = vi.fn(() =>
      Promise.resolve(upstreamResponse(201, '{"id":5}')),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(
      linksRequest('POST', { origin: TEST_WEB_ORIGIN, body }),
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
    await expect(response.json()).resolves.toEqual({ id: 5 });
  });

  it('answers 403 without calling upstream when link.create is missing', async () => {
    cookieJar.set(
      ACCESS_TOKEN_COOKIE,
      signAccessToken({ permissions: ['link.read'] }),
    );
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(
      linksRequest('POST', { origin: TEST_WEB_ORIGIN, body }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      message: 'Missing permission: link.create',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['without an Origin', undefined],
    ['from another origin', 'https://evil.example'],
  ])('rejects a request %s with 403', async (_label, origin) => {
    cookieJar.set(
      ACCESS_TOKEN_COOKIE,
      signAccessToken({ permissions: ['link.create'] }),
    );
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(linksRequest('POST', { origin, body }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      message: 'Trusted same-origin request required',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('relays an upstream validation failure', async () => {
    cookieJar.set(
      ACCESS_TOKEN_COOKIE,
      signAccessToken({ permissions: ['link.create'] }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(upstreamResponse(400, '{"message":["url invalid"]}')),
      ),
    );

    const response = await POST(
      linksRequest('POST', { origin: TEST_WEB_ORIGIN, body }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: ['url invalid'],
    });
  });
});
