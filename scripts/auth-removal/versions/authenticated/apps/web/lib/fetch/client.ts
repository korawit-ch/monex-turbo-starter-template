import type { ApiEndpoint } from '@repo/api-contract';

/**
 * Client-side fetch utility for use with TanStack Query
 * No caching here - TanStack Query handles that
 */
async function execute<TResponse, TBody>(
  endpoint: ApiEndpoint<TResponse, TBody>,
  allowRefresh: boolean,
): Promise<TResponse> {
  const { url, method } = endpoint;
  const body = 'body' in endpoint ? endpoint.body : undefined;

  const response = await fetch(`/api${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && allowRefresh) {
    const refreshed = await fetch('/api/auth/refresh', { method: 'POST' });
    if (refreshed.ok) return execute(endpoint, false);
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as TResponse) : (undefined as TResponse);
}

export function clientFetch<TResponse, TBody = never>(
  endpoint: ApiEndpoint<TResponse, TBody>,
): Promise<TResponse> {
  return execute(endpoint, true);
}
