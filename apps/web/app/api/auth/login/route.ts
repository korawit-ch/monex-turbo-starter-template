import { NextRequest, NextResponse } from 'next/server';

import { relaySetCookies, requireSameOrigin } from '../../../../lib/auth/bff';
import { getApiInternalUrl } from '../../../../lib/auth/config';

export async function POST(request: NextRequest) {
  const originFailure = requireSameOrigin(request);
  if (originFailure) return originFailure;

  const upstream = await fetch(`${getApiInternalUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: await request.text(),
    cache: 'no-store',
  });
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
