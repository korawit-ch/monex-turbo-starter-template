/** @vitest-environment node */
import { NextRequest } from 'next/server';
import { beforeEach, describe, it, expect, vi } from 'vitest';

import {
  stubAuthEnv,
  TEST_API_URL,
  TEST_WEB_ORIGIN,
  upstreamResponse,
} from '../../../../lib/auth/test-support';
import { POST } from './route';

vi.mock('server-only', () => ({}));

const credentials =
  '{"email":"admin@example.com","password":"local-change-me"}';
const accessCookie =
  'access_token=jwt; Max-Age=600; Path=/; HttpOnly; SameSite=Lax';
const sessionCookie =
  'auth_session=enc; Max-Age=2592000; Path=/; HttpOnly; SameSite=Lax';

function loginRequest(origin?: string) {
  const headers = new Headers({
    'content-type': 'application/json',
    cookie: 'access_token=old; auth_session=old',
  });
  if (origin) headers.set('origin', origin);
  return new NextRequest(`${TEST_WEB_ORIGIN}/api/auth/login`, {
    method: 'POST',
    headers,
    body: credentials,
  });
}

beforeEach(() => {
  stubAuthEnv();
});

describe('POST /api/auth/login', () => {
  it('forwards only the JSON credentials and relays both session cookies', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        upstreamResponse(201, '{"ok":true}', [accessCookie, sessionCookie]),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(loginRequest(TEST_WEB_ORIGIN));

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(`${TEST_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: credentials,
      cache: 'no-store',
    });
    expect(response.status).toBe(201);
    expect(response.headers.getSetCookie()).toEqual([
      accessCookie,
      sessionCookie,
    ]);
    const body = await response.text();
    expect(JSON.parse(body)).toEqual({ ok: true });
    expect(body).not.toContain('jwt');
  });

  it.each([
    ['without an Origin', undefined],
    ['from another origin', 'https://evil.example'],
  ])('rejects a request %s with 403', async (_label, origin) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(loginRequest(origin));

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it('relays an upstream 401 without setting cookies', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          upstreamResponse(401, '{"message":"Invalid credentials"}'),
        ),
      ),
    );

    const response = await POST(loginRequest(TEST_WEB_ORIGIN));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: 'Invalid credentials',
    });
    expect(response.headers.getSetCookie()).toEqual([]);
  });
});
