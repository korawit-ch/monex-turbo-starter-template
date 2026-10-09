import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { relaySetCookies, requireSameOrigin } from '../../../../lib/auth/bff';
import { getApiInternalUrl } from '../../../../lib/auth/config';
import { SESSION_COOKIE } from '../../../../lib/auth/server';

export async function POST(request: NextRequest) {
  const originFailure = requireSameOrigin(request);
  if (originFailure) return originFailure;
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  const upstream = await fetch(`${getApiInternalUrl()}/auth/logout`, {
    method: 'POST',
    headers: session
      ? { cookie: `${SESSION_COOKIE}=${encodeURIComponent(session)}` }
      : {},
    cache: 'no-store',
  });
  const response = NextResponse.json({ ok: true }, { status: upstream.status });
  relaySetCookies(upstream.headers, response);
  return response;
}
