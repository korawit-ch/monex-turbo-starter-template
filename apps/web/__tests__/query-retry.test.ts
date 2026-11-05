/**
 * @jest-environment node
 */
import type { ApiEndpoint } from '@repo/api-contract';

import { clientFetch } from '../lib/fetch/client';
import { shouldRetryQuery } from '../lib/tanstack-query/provider';

// The contract package is ESM-only, so the endpoint is built inline.
const listEndpoint: ApiEndpoint<unknown> = { url: '/links', method: 'GET' };

function respond(status: number, statusText = '') {
  return Promise.resolve(new Response(null, { status, statusText }));
}

describe('client fetch errors and the query retry policy', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('attaches the HTTP status to a failed response', async () => {
    global.fetch = jest.fn(() => respond(403, 'Forbidden'));

    await expect(clientFetch(listEndpoint)).rejects.toMatchObject({
      message: 'API Error: 403 Forbidden',
      status: 403,
    });
  });

  it.each([400, 401, 403, 404, 409])(
    'does not retry a %i response',
    (status) => {
      const error = Object.assign(new Error('API Error'), { status });
      expect(shouldRetryQuery(0, error)).toBe(false);
    },
  );

  it('retries server errors and network failures up to three times', () => {
    const serverError = Object.assign(new Error('API Error'), { status: 503 });
    const networkError = new TypeError('Failed to fetch');

    expect(shouldRetryQuery(0, serverError)).toBe(true);
    expect(shouldRetryQuery(2, networkError)).toBe(true);
    expect(shouldRetryQuery(3, serverError)).toBe(false);
  });
});
