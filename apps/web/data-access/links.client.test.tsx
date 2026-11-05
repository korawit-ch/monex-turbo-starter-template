import { linksApi } from '@repo/api-contract';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, it, expect, vi } from 'vitest';

import { clientFetch } from '../lib/fetch/client';
import {
  linkKeys,
  useCreateLinkMutation,
  useDeleteLinkMutation,
  useLinkQuery,
  useLinksQuery,
  useUpdateLinkMutation,
} from './links.client';

// Only behaviour shared by the authenticated and no-auth versions is asserted
// here; permission gating is covered by the links demo test.
vi.mock('../lib/fetch/client', () => ({ clientFetch: vi.fn() }));

const clientFetchMock = vi.mocked(clientFetch);
// The hooks add an artificial 600-800 ms delay before fetching.
const slow = { timeout: 3000 };

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return { queryClient, invalidate, wrapper };
}

beforeEach(() => {
  clientFetchMock.mockReset();
});

describe('linkKeys', () => {
  it('uses a list key that prefixes every detail key', () => {
    expect(linkKeys.all).toEqual(['links']);
    expect(linkKeys.detail(3)).toEqual(['links', 3]);
  });
});

describe('useLinksQuery', () => {
  it('fetches the list endpoint under the list key', async () => {
    clientFetchMock.mockResolvedValueOnce([{ id: 1 }]);
    const { queryClient, wrapper } = setup();

    const { result } = renderHook(() => useLinksQuery(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true), slow);
    expect(result.current.data).toEqual([{ id: 1 }]);
    expect(clientFetchMock).toHaveBeenCalledWith(linksApi.list());
    expect(queryClient.getQueryData(linkKeys.all)).toEqual([{ id: 1 }]);
  });

  it('exposes a fetch failure as an error, not as empty data', async () => {
    const failure = Object.assign(new Error('API Error: 500'), {
      status: 500,
    });
    clientFetchMock.mockRejectedValueOnce(failure);
    const { wrapper } = setup();

    const { result } = renderHook(() => useLinksQuery(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true), slow);
    expect(result.current.error).toBe(failure);
    expect(result.current.data).toBeUndefined();
  });
});

describe('useLinkQuery', () => {
  it('fetches the detail endpoint under the detail key', async () => {
    clientFetchMock.mockResolvedValueOnce({ id: 4 });
    const { queryClient, wrapper } = setup();

    const { result } = renderHook(() => useLinkQuery(4), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), slow);
    expect(clientFetchMock).toHaveBeenCalledWith(linksApi.detail(4));
    expect(queryClient.getQueryData(linkKeys.detail(4))).toEqual({ id: 4 });
  });

  it('does not fetch without an id', () => {
    const { wrapper } = setup();

    const { result } = renderHook(() => useLinkQuery(0), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(clientFetchMock).not.toHaveBeenCalled();
  });
});

describe('link mutations', () => {
  it('create posts the body and invalidates the list prefix', async () => {
    clientFetchMock.mockResolvedValueOnce({ id: 9 });
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useCreateLinkMutation(), { wrapper });
    const input = { title: 'Docs', url: 'https://example.com' };

    await result.current.mutateAsync(input);

    expect(clientFetchMock).toHaveBeenCalledWith(linksApi.create(input));
    expect(invalidate).toHaveBeenCalledOnce();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: linkKeys.all });
  });

  it('update patches the link and invalidates the list and its detail', async () => {
    clientFetchMock.mockResolvedValueOnce({ id: 9 });
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useUpdateLinkMutation(), { wrapper });

    await result.current.mutateAsync({ id: 9, data: { title: 'Renamed' } });

    expect(clientFetchMock).toHaveBeenCalledWith(
      linksApi.update(9, { title: 'Renamed' }),
    );
    expect(invalidate).toHaveBeenCalledWith({ queryKey: linkKeys.all });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: linkKeys.detail(9),
    });
  });

  it('delete calls the delete endpoint and invalidates the list prefix', async () => {
    clientFetchMock.mockResolvedValueOnce(undefined);
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useDeleteLinkMutation(), { wrapper });

    await result.current.mutateAsync(9);

    expect(clientFetchMock).toHaveBeenCalledWith(linksApi.delete(9));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: linkKeys.all });
  });

  it('does not invalidate and rejects when the mutation fails', async () => {
    const failure = Object.assign(new Error('API Error: 409'), {
      status: 409,
    });
    clientFetchMock.mockRejectedValueOnce(failure);
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useDeleteLinkMutation(), { wrapper });

    await expect(result.current.mutateAsync(9)).rejects.toBe(failure);
    expect(invalidate).not.toHaveBeenCalled();
  });
});
