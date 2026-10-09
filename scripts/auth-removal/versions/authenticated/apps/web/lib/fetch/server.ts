import type { ApiEndpoint } from '@repo/api-contract';
import { can, type Permission } from '@repo/authorization';
import { getApiInternalUrl } from '../auth/config';
import { getVerifiedAccess } from '../auth/server';

/**
 * Server-side fetch utility for Server Components and Route Handlers
 * Handles cookies, headers, and caching strategies for server context
 */
export async function serverFetch<TResponse, TBody = never>(
  endpoint: ApiEndpoint<TResponse, TBody>,
  permission: Permission,
): Promise<TResponse> {
  const { url, method } = endpoint;
  const body = 'body' in endpoint ? endpoint.body : undefined;

  const verified = await getVerifiedAccess();
  if (!can(verified.auth, permission)) {
    throw new Error(`Missing permission: ${permission}`);
  }

  const response = await fetch(`${getApiInternalUrl()}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${verified.token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store', // Server components default to no caching
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  // Handle empty responses (e.g., DELETE)
  const text = await response.text();
  return text ? (JSON.parse(text) as TResponse) : (undefined as TResponse);
}
