import { useQueryClient } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { QueryProvider, shouldRetryQuery } from './provider';

describe('QueryProvider', () => {
  it('provides one client with the shared query defaults', () => {
    const { result, rerender } = renderHook(() => useQueryClient(), {
      wrapper: QueryProvider,
    });
    const client = result.current;

    expect(client.getDefaultOptions().queries).toEqual({
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: shouldRetryQuery,
    });
    rerender();
    expect(result.current).toBe(client);
  });
});
