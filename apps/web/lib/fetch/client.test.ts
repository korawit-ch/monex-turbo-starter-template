/** @vitest-environment node */
import type { ApiEndpoint } from '@repo/api-contract';
import { describe, it, expect, vi } from 'vitest';

import { clientFetch } from './client';

// Session renewal is auth-specific: the no-auth client has no refresh step.
const listEndpoint: ApiEndpoint<unknown> = { url: '/links', method: 'GET' };

function respond(status: number, body: string | null = null) {
  return new Response(body, { status });
}

describe('clientFetch session renewal', () => {
  it('calls the same-origin BFF path', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(respond(200, '[]')));
    vi.stubGlobal('fetch', fetchMock);

    await expect(clientFetch(listEndpoint)).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith('/api/links', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: undefined,
    });
  });

  it('renews once after a 401 and retries the original request', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respond(401))
      .mockResolvedValueOnce(respond(201, '{"ok":true}'))
      .mockResolvedValueOnce(respond(200, '[{"id":1}]'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(clientFetch(listEndpoint)).resolves.toEqual([{ id: 1 }]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/auth/refresh', {
      method: 'POST',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/links',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('does not renew a second time when the retry is also 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respond(401))
      .mockResolvedValueOnce(respond(201, '{"ok":true}'))
      .mockResolvedValueOnce(respond(401));
    vi.stubGlobal('fetch', fetchMock);

    await expect(clientFetch(listEndpoint)).rejects.toMatchObject({
      status: 401,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('surfaces the original 401 when renewal fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respond(401))
      .mockResolvedValueOnce(respond(401));
    vi.stubGlobal('fetch', fetchMock);

    await expect(clientFetch(listEndpoint)).rejects.toMatchObject({
      status: 401,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([403, 409, 500])('does not renew after a %i', async (status) => {
    const fetchMock = vi.fn(() => Promise.resolve(respond(status)));
    vi.stubGlobal('fetch', fetchMock);

    await expect(clientFetch(listEndpoint)).rejects.toMatchObject({ status });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
