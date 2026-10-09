import 'server-only';

import {
  parseAccessTokenClaims,
  toAuthorizationContext,
  type AuthorizationContext,
} from '@repo/authorization';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

import { getAuthVerificationConfig } from './config';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const SESSION_COOKIE = 'auth_session';

export class AuthenticationError extends Error {}

export type VerifiedAccess = {
  auth: AuthorizationContext;
  token: string;
};

export async function getVerifiedAccess(): Promise<VerifiedAccess> {
  const config = getAuthVerificationConfig();
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) throw new AuthenticationError('Access token is missing');

  try {
    const payload = jwt.verify(token, config.secret, {
      algorithms: ['HS256'],
      audience: config.audience,
      issuer: config.issuer,
    });
    const claims = parseAccessTokenClaims(payload);
    return { auth: toAuthorizationContext(claims), token };
  } catch {
    throw new AuthenticationError('Access token is invalid or expired');
  }
}

export async function getAuth(): Promise<AuthorizationContext> {
  return (await getVerifiedAccess()).auth;
}
