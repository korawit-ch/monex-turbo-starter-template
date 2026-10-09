import { NextRequest, NextResponse } from 'next/server';

import {
  authenticationResponse,
  relaySetCookies,
  requireSameOrigin,
} from '../../../../lib/auth/bff';
import { getApiInternalUrl } from '../../../../lib/auth/config';
import { getVerifiedAccess } from '../../../../lib/auth/server';

export async function POST(request: NextRequest) {
  const originFailure = requireSameOrigin(request);
  if (originFailure) return originFailure;
  try {
    const verified = await getVerifiedAccess();
    const upstream = await fetch(`${getApiInternalUrl()}/auth/logout-all`, {
      method: 'POST',
      headers: { authorization: `Bearer ${verified.token}` },
      cache: 'no-store',
    });
    const response = NextResponse.json(
      { ok: true },
      { status: upstream.status },
    );
    relaySetCookies(upstream.headers, response);
    return response;
  } catch (error) {
    const authFailure = authenticationResponse(error);
    if (authFailure) return authFailure;
    throw error;
  }
}
