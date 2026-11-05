/** @vitest-environment node */
import type { Permission } from '@repo/authorization';
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
import { DELETE, GET, PATCH } from './route';

const cookieJar = vi.hoisted(() => new Map<string, string>());

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
    }),
}));

type Method = 'GET' | 'PATCH' | 'DELETE';
const handlers = { GET, PATCH, DELETE };
const permissionFor: Record<Method, Permission> = {
  GET: 'link.read',
  PATCH: 'link.update',
  DELETE: 'link.delete',
};

function call(
  method: Method,
  id: string,
  init: { origin?: string; body?: string } = {},
) {
  const headers = new Headers({ cookie: 'access_token=raw; auth_session=raw' });
  if (init.origin) headers.set('origin', init.origin);
  const request = new NextRequest(
    `${TEST_WEB_ORIGIN}/api/links/${encodeURIComponent(id)}`,
    { method, headers, body: init.body },
  );
  return handlers[method](request, { params: Promise.resolve({ id }) });
}

beforeEach(() => {
  cookieJar.clear();
  stubAuthEnv();
});

describe('/api/links/[id]', () => {
  it('GET requires link.read and forwards to /links/:id', async () => {
    const token = signAccessToken({ permissions: ['link.read'] });
    cookieJar.set(ACCESS_TOKEN_COOKIE, token);
    const fetchMock = vi.fn(() =>
      Promise.resolve(upstreamResponse(200, '{"id":42}')),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await call('GET', '42');

    expect(fetchMock).toHaveBeenCalledWith(`${TEST_API_URL}/links/42`, {
      method: 'GET',
      headers: { authorization: `Bearer ${token}` },
      body: undefined,
      cache: 'no-store',
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: 42 });
  });

  it('PATCH requires link.update and forwards only the body and bearer token', async () => {
    const token = signAccessToken({ permissions: ['link.update'] });
    cookieJar.set(ACCESS_TOKEN_COOKIE, token);
    const fetchMock = vi.fn(() =>
      Promise.resolve(upstreamResponse(200, '{"id":42}')),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await call('PATCH', '42', {
      origin: TEST_WEB_ORIGIN,
      body: '{"title":"Renamed"}',
    });

    expect(fetchMock).toHaveBeenCalledWith(`${TEST_API_URL}/links/42`, {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: '{"title":"Renamed"}',
      cache: 'no-store',
    });
    expect(response.status).toBe(200);
  });

  it('DELETE requires link.delete and sends no body', async () => {
    const token = signAccessToken({ permissions: ['link.delete'] });
    cookieJar.set(ACCESS_TOKEN_COOKIE, token);
    const fetchMock = vi.fn(() =>
      Promise.resolve(upstreamResponse(200, '{"id":42}')),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await call('DELETE', '42', { origin: TEST_WEB_ORIGIN });

    expect(fetchMock).toHaveBeenCalledWith(`${TEST_API_URL}/links/42`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${token}` },
      body: undefined,
      cache: 'no-store',
    });
    expect(response.status).toBe(200);
  });

  it.each(['abc', '1.5', '-1', '1 OR 1=1', '../auth/logout-all', ''])(
    'rejects the invalid id %j with 400 before authentication',
    async (id) => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      const response = await call('GET', id);

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        message: 'Invalid link ID',
      });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each<Method>(['GET', 'PATCH', 'DELETE'])(
    '%s answers 403 without calling upstream when its permission is missing',
    async (method) => {
      const others = Object.values(permissionFor).filter(
        (permission) => permission !== permissionFor[method],
      );
      cookieJar.set(
        ACCESS_TOKEN_COOKIE,
        signAccessToken({ permissions: others }),
      );
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      const response = await call(method, '42', {
        origin: TEST_WEB_ORIGIN,
        body: method === 'PATCH' ? '{"title":"x"}' : undefined,
      });

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        message: `Missing permission: ${permissionFor[method]}`,
      });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each<[Method, string | undefined]>([
    ['PATCH', undefined],
    ['PATCH', 'https://evil.example'],
    ['DELETE', undefined],
    ['DELETE', 'https://evil.example'],
  ])(
    '%s from origin %s answers 403 without calling upstream',
    async (method, origin) => {
      cookieJar.set(
        ACCESS_TOKEN_COOKIE,
        signAccessToken({ permissions: ['link.update', 'link.delete'] }),
      );
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      const response = await call(method, '42', {
        origin,
        body: method === 'PATCH' ? '{"title":"x"}' : undefined,
      });

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        message: 'Trusted same-origin request required',
      });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([404, 409])('relays upstream status %i', async (status) => {
    cookieJar.set(
      ACCESS_TOKEN_COOKIE,
      signAccessToken({ permissions: ['link.delete'] }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(upstreamResponse(status, '{"message":"upstream"}')),
      ),
    );

    const response = await call('DELETE', '42', { origin: TEST_WEB_ORIGIN });

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ message: 'upstream' });
  });
});
