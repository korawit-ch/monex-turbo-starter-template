import { Injectable } from '@nestjs/common';
import type { CookieOptions } from 'express';

function requireSecret(name: string): string {
  const value = process.env[name];
  if (!value || Buffer.byteLength(value, 'utf8') < 32) {
    throw new Error(`${name} must contain at least 32 bytes`);
  }
  return value;
}

function positiveInteger(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

@Injectable()
export class AuthConfig {
  readonly jwtSecret = requireSecret('AUTH_JWT_SECRET');
  readonly cookieSecret = requireSecret('AUTH_COOKIE_SECRET');
  readonly jwtIssuer = process.env.AUTH_JWT_ISSUER || 'monex-api';
  readonly jwtAudience = process.env.AUTH_JWT_AUDIENCE || 'monex-web';
  readonly accessTtlSeconds = positiveInteger('AUTH_ACCESS_TTL_SECONDS', 600);
  readonly sessionTtlSeconds = positiveInteger(
    'AUTH_SESSION_TTL_SECONDS',
    60 * 60 * 24 * 30,
  );

  cookieOptions(maxAgeSeconds: number): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: maxAgeSeconds * 1000,
      ...(process.env.AUTH_COOKIE_DOMAIN
        ? { domain: process.env.AUTH_COOKIE_DOMAIN }
        : {}),
    };
  }

  clearCookieOptions(): CookieOptions {
    const { maxAge: _maxAge, ...options } = this.cookieOptions(1);
    return options;
  }
}
