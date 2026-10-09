import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { relaySetCookies } from '../../../../lib/auth/bff';
import { getApiInternalUrl } from '../../../../lib/auth/config';
import { SESSION_COOKIE } from '../../../../lib/auth/server';
import { safeReturnTo } from '../../../../lib/auth/safe-return';

async function refresh() {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!session) return undefined;
  return fetch(`${getApiInternalUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { cookie: `${SESSION_COOKIE}=${encodeURIComponent(session)}` },
    cache: 'no-store',
  });
}

export async function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get('returnTo'));
  const upstream = await refresh();
  if (!upstream || upstream.status === 401) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (!upstream.ok) {
    return NextResponse.json(
      { message: 'Authentication service is unavailable' },
      { status: 502 },
    );
  }
  const response = NextResponse.redirect(new URL(returnTo, request.url));
  relaySetCookies(upstream.headers, response);
  return response;
}

export async function POST() {
  const upstream = await refresh();
  if (!upstream) {
    return NextResponse.json(
      { message: 'Session is required' },
      { status: 401 },
    );
  }
  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      'content-type':
        upstream.headers.get('content-type') || 'application/json',
    },
  });
  relaySetCookies(upstream.headers, response);
  return response;
}
