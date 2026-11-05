/** @vitest-environment node */
import { linksApi } from '@repo/api-contract';
import { beforeEach, describe, it, expect, vi } from 'vitest';

import { serverFetch } from '../lib/fetch/server';
import { getLink, getLinks } from './links.server';

// Auth-specific: the no-auth version calls serverFetch without a permission
// and turns failures into empty data.
vi.mock('../lib/fetch/server', () => ({ serverFetch: vi.fn() }));

const serverFetchMock = vi.mocked(serverFetch);

beforeEach(() => {
  serverFetchMock.mockReset();
});

describe('links server data access', () => {
  it('reads the list with link.read', async () => {
    serverFetchMock.mockResolvedValueOnce([{ id: 1 }]);

    await expect(getLinks()).resolves.toEqual([{ id: 1 }]);
    expect(serverFetchMock).toHaveBeenCalledWith(linksApi.list(), 'link.read');
  });

  it('reads one link with link.read', async () => {
    serverFetchMock.mockResolvedValueOnce({ id: 7 });

    await expect(getLink(7)).resolves.toEqual({ id: 7 });
    expect(serverFetchMock).toHaveBeenCalledWith(
      linksApi.detail(7),
      'link.read',
    );
  });

  it('propagates failures instead of returning empty data', async () => {
    serverFetchMock.mockRejectedValueOnce(new Error('API Error: 500'));
    await expect(getLinks()).rejects.toThrow('API Error: 500');

    serverFetchMock.mockRejectedValueOnce(new Error('API Error: 404'));
    await expect(getLink(7)).rejects.toThrow('API Error: 404');
  });
});
