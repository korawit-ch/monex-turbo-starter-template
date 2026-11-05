'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

const MAX_QUERY_RETRIES = 3;

/**
 * Retries network and server failures, but not client errors: a 4xx answer
 * (unauthenticated, forbidden, not found, conflict) will not change on retry,
 * and every retry of a 401 would start another session renewal.
 */
export function shouldRetryQuery(failureCount: number, error: unknown) {
  const status =
    error instanceof Error && 'status' in error ? error.status : undefined;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return false;
  }
  return failureCount < MAX_QUERY_RETRIES;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: shouldRetryQuery,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
