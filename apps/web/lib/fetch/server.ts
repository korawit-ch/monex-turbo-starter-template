import type { ApiEndpoint, ApiEndpointWithBody } from '@repo/api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Server-side fetch utility for Server Components and Route Handlers
 * Handles cookies, headers, and caching strategies for server context
 */
export async function serverFetch<TResponse>(
  endpoint: ApiEndpoint<TResponse> | ApiEndpointWithBody<unknown, TResponse>,
): Promise<TResponse> {
  const { url, method } = endpoint;
  const body = 'body' in endpoint ? endpoint.body : undefined;

  const response = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store', // Server components default to no caching
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  // Handle empty responses (e.g., DELETE)
  const text = await response.text();
  return text ? JSON.parse(text) : (undefined as TResponse);
}
