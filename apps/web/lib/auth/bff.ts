import 'server-only';

import { can, type Permission } from '@repo/authorization';
import { NextRequest, NextResponse } from 'next/server';

import { getApiInternalUrl, getWebOrigin } from './config';
import { AuthenticationError, getVerifiedAccess } from './server';

export function authenticationResponse(error: unknown): NextResponse | null {
  if (error instanceof AuthenticationError) {
    return NextResponse.json({ message: error.message }, { status: 401 });
  }
  return null;
}

export function requireSameOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  if (origin !== getWebOrigin()) {
    return NextResponse.json(
      { message: 'Trusted same-origin request required' },
      { status: 403 },
    );
  }
  return null;
}

export async function proxyProtectedRequest(
  request: NextRequest,
  apiPath: string,
  permission: Permission,
): Promise<NextResponse> {
  try {
    const verified = await getVerifiedAccess();
    if (!can(verified.auth, permission)) {
      return NextResponse.json(
        { message: `Missing permission: ${permission}` },
        { status: 403 },
      );
    }

    if (!['GET', 'HEAD'].includes(request.method)) {
      const originFailure = requireSameOrigin(request);
      if (originFailure) return originFailure;
    }

    const body = ['GET', 'HEAD'].includes(request.method)
      ? undefined
      : await request.text();
    const upstream = await fetch(`${getApiInternalUrl()}${apiPath}`, {
      method: request.method,
      headers: {
        authorization: `Bearer ${verified.token}`,
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      body: body || undefined,
      cache: 'no-store',
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        'content-type':
          upstream.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    const authFailure = authenticationResponse(error);
    if (authFailure) return authFailure;
    throw error;
  }
}

export function relaySetCookies(source: Headers, response: NextResponse): void {
  const headers = source as Headers & { getSetCookie?: () => string[] };
  const values = headers.getSetCookie?.() ?? [];
  if (values.length === 0) {
    const value = source.get('set-cookie');
    if (value) response.headers.append('set-cookie', value);
    return;
  }
  for (const value of values) response.headers.append('set-cookie', value);
}
