/** @vitest-environment node */
import type { ApiEndpoint, ApiEndpointWithBody } from '@repo/api-contract';
import { beforeEach, describe, it, expect, vi } from 'vitest';

import { ACCESS_TOKEN_COOKIE, AuthenticationError } from '../auth/server';
import {
  signAccessToken,
  stubAuthEnv,
  TEST_API_URL,
} from '../auth/test-support';
import { serverFetch } from './server';

const cookieJar = vi.hoisted(() => new Map<string, string>());

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
    }),
}));

const listEndpoint: ApiEndpoint<unknown> = { url: '/links', method: 'GET' };
const createEndpoint: ApiEndpointWithBody<{ title: string }, unknown> = {
  url: '/links',
  method: 'POST',
  body: { title: 'Docs' },
};

beforeEach(() => {
  cookieJar.clear();
  stubAuthEnv();
});

describe('serverFetch', () => {
  it('calls the internal API with the verified bearer token and parses JSON', async () => {
    const token = signAccessToken({ permissions: ['link.read'] });
    cookieJar.set(ACCESS_TOKEN_COOKIE, token);
    const fetchMock = vi.fn(() => Promise.resolve(new Response('[{"id":1}]')));
    vi.stubGlobal('fetch', fetchMock);

    await expect(serverFetch(listEndpoint, 'link.read')).resolves.toEqual([
      { id: 1 },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(`${TEST_API_URL}/links`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: undefined,
      cache: 'no-store',
    });
  });

  it('serializes the endpoint body', async () => {
    const token = signAccessToken({ permissions: ['link.create'] });
    cookieJar.set(ACCESS_TOKEN_COOKIE, token);
    const fetchMock = vi.fn(() => Promise.resolve(new Response('{"id":2}')));
    vi.stubGlobal('fetch', fetchMock);

    await serverFetch(createEndpoint, 'link.create');

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_API_URL}/links`,
      expect.objectContaining({ method: 'POST', body: '{"title":"Docs"}' }),
    );
  });

  it('returns undefined for an empty body', async () => {
    cookieJar.set(ACCESS_TOKEN_COOKIE, signAccessToken());
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(null, { status: 200 }))),
    );

    await expect(serverFetch(listEndpoint, 'link.read')).resolves.toBe(
      undefined,
    );
  });

  it('throws without calling the API when the permission is missing', async () => {
    cookieJar.set(
      ACCESS_TOKEN_COOKIE,
      signAccessToken({ permissions: ['link.read'] }),
    );
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(serverFetch(createEndpoint, 'link.create')).rejects.toThrow(
      'Missing permission: link.create',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('propagates an authentication failure without calling the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(serverFetch(listEndpoint, 'link.read')).rejects.toBeInstanceOf(
      AuthenticationError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [404, 'Not Found'],
    [500, 'Internal Server Error'],
  ])('throws on an API %i instead of returning data', async (status, text) => {
    cookieJar.set(ACCESS_TOKEN_COOKIE, signAccessToken());
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(new Response('{}', { status, statusText: text })),
      ),
    );

    await expect(serverFetch(listEndpoint, 'link.read')).rejects.toThrow(
      `API Error: ${status} ${text}`,
    );
  });
});
