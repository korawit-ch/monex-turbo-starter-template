import type { Permission } from '@repo/authorization';
import jwt from 'jsonwebtoken';
import { vi } from 'vitest';

/**
 * Shared fixtures for web auth tests. Tokens are signed with the same shape
 * and HS256 options the API issues, so tests exercise the real verification.
 */
export const TEST_JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-bytes';
export const TEST_WEB_ORIGIN = 'http://localhost:3000';
export const TEST_API_URL = 'http://api.internal:3001';

export function stubAuthEnv(): void {
  vi.stubEnv('AUTH_JWT_SECRET', TEST_JWT_SECRET);
  vi.stubEnv('AUTH_JWT_ISSUER', 'monex-api');
  vi.stubEnv('AUTH_JWT_AUDIENCE', 'monex-web');
  vi.stubEnv('API_INTERNAL_URL', TEST_API_URL);
  vi.stubEnv('WEB_ORIGIN', TEST_WEB_ORIGIN);
}

type TokenOptions = {
  permissions?: Permission[];
  userId?: string;
  tenantId?: string;
  secret?: string;
  issuer?: string;
  audience?: string;
  expiresInSeconds?: number;
};

export function signAccessToken({
  permissions = ['link.read'],
  userId = 'user-1',
  tenantId = 'tenant-1',
  secret = TEST_JWT_SECRET,
  issuer = 'monex-api',
  audience = 'monex-web',
  expiresInSeconds = 600,
}: TokenOptions = {}): string {
  return jwt.sign(
    {
      attributes: { tenantId },
      grants: permissions.map((permission) => ({
        permission,
        conditions: [
          {
            operator: 'equals',
            subjectField: 'tenantId',
            resourceField: 'tenantId',
          },
        ],
      })),
    },
    secret,
    {
      algorithm: 'HS256',
      subject: userId,
      issuer,
      audience,
      expiresIn: expiresInSeconds,
    },
  );
}

/** Upstream response carrying one Set-Cookie header per value. */
export function upstreamResponse(
  status: number,
  body: string | null,
  setCookies: string[] = [],
  contentType = 'application/json',
): Response {
  const headers = new Headers({ 'content-type': contentType });
  for (const value of setCookies) headers.append('set-cookie', value);
  return new Response(body, { status, headers });
}
