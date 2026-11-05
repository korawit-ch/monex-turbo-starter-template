import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AuthConfig } from './auth.config';

const JWT_SECRET = '0123456789abcdef0123456789abcdef';
const COOKIE_SECRET = 'abcdef0123456789abcdef0123456789';

describe('AuthConfig', () => {
  beforeEach(() => {
    vi.stubEnv('AUTH_JWT_SECRET', JWT_SECRET);
    vi.stubEnv('AUTH_COOKIE_SECRET', COOKIE_SECRET);
    vi.stubEnv('AUTH_JWT_ISSUER', undefined);
    vi.stubEnv('AUTH_JWT_AUDIENCE', undefined);
    vi.stubEnv('AUTH_ACCESS_TTL_SECONDS', undefined);
    vi.stubEnv('AUTH_SESSION_TTL_SECONDS', undefined);
    vi.stubEnv('AUTH_COOKIE_DOMAIN', undefined);
    vi.stubEnv('NODE_ENV', 'test');
  });

  describe('secrets', () => {
    it('accepts secrets of exactly 32 bytes and applies the documented defaults', () => {
      const config = new AuthConfig();
      expect(config.jwtSecret).toBe(JWT_SECRET);
      expect(config.cookieSecret).toBe(COOKIE_SECRET);
      expect(config.jwtIssuer).toBe('monex-api');
      expect(config.jwtAudience).toBe('monex-web');
      expect(config.accessTtlSeconds).toBe(600);
      expect(config.sessionTtlSeconds).toBe(60 * 60 * 24 * 30);
    });

    it.each(['AUTH_JWT_SECRET', 'AUTH_COOKIE_SECRET'])(
      'refuses to start when %s is missing',
      (name) => {
        vi.stubEnv(name, undefined);
        expect(() => new AuthConfig()).toThrow(
          `${name} must contain at least 32 bytes`,
        );
      },
    );

    it.each(['AUTH_JWT_SECRET', 'AUTH_COOKIE_SECRET'])(
      'refuses to start when %s is empty or shorter than 32 bytes',
      (name) => {
        vi.stubEnv(name, '');
        expect(() => new AuthConfig()).toThrow(
          `${name} must contain at least 32 bytes`,
        );
        vi.stubEnv(name, 'x'.repeat(31));
        expect(() => new AuthConfig()).toThrow(
          `${name} must contain at least 32 bytes`,
        );
      },
    );

    it('measures the secret length in UTF-8 bytes, not characters', () => {
      // 16 characters of a two-byte code point are 32 bytes.
      vi.stubEnv('AUTH_JWT_SECRET', 'é'.repeat(16));
      expect(new AuthConfig().jwtSecret).toBe('é'.repeat(16));
      // 16 characters again, but only 31 bytes.
      vi.stubEnv('AUTH_JWT_SECRET', `${'é'.repeat(15)}x`);
      expect(() => new AuthConfig()).toThrow(
        'AUTH_JWT_SECRET must contain at least 32 bytes',
      );
    });
  });

  describe('optional settings', () => {
    it('reads issuer, audience and TTL overrides', () => {
      vi.stubEnv('AUTH_JWT_ISSUER', 'issuer-x');
      vi.stubEnv('AUTH_JWT_AUDIENCE', 'audience-x');
      vi.stubEnv('AUTH_ACCESS_TTL_SECONDS', '120');
      vi.stubEnv('AUTH_SESSION_TTL_SECONDS', '3600');
      const config = new AuthConfig();
      expect(config.jwtIssuer).toBe('issuer-x');
      expect(config.jwtAudience).toBe('audience-x');
      expect(config.accessTtlSeconds).toBe(120);
      expect(config.sessionTtlSeconds).toBe(3600);
    });

    it('falls back to the default TTL when the variable is an empty string', () => {
      vi.stubEnv('AUTH_ACCESS_TTL_SECONDS', '');
      expect(new AuthConfig().accessTtlSeconds).toBe(600);
    });

    it.each([
      ['AUTH_ACCESS_TTL_SECONDS', '0'],
      ['AUTH_ACCESS_TTL_SECONDS', '-60'],
      ['AUTH_ACCESS_TTL_SECONDS', '1.5'],
      ['AUTH_ACCESS_TTL_SECONDS', 'ten'],
      ['AUTH_SESSION_TTL_SECONDS', '0'],
      ['AUTH_SESSION_TTL_SECONDS', 'NaN'],
    ])('rejects %s=%s', (name, value) => {
      vi.stubEnv(name, value);
      expect(() => new AuthConfig()).toThrow(
        `${name} must be a positive integer`,
      );
    });
  });

  describe('cookie options', () => {
    it('issues HttpOnly, SameSite=Lax, root-path cookies with an age in milliseconds', () => {
      expect(new AuthConfig().cookieOptions(600)).toEqual({
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
        maxAge: 600_000,
      });
    });

    it('marks cookies Secure in production', () => {
      vi.stubEnv('NODE_ENV', 'production');
      expect(new AuthConfig().cookieOptions(1)).toHaveProperty('secure', true);
    });

    it('adds a domain only when AUTH_COOKIE_DOMAIN is configured', () => {
      expect(new AuthConfig().cookieOptions(1)).not.toHaveProperty('domain');
      vi.stubEnv('AUTH_COOKIE_DOMAIN', 'example.test');
      expect(new AuthConfig().cookieOptions(1)).toHaveProperty(
        'domain',
        'example.test',
      );
    });

    it('clears cookies with the same attributes and no maxAge', () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('AUTH_COOKIE_DOMAIN', 'example.test');
      expect(new AuthConfig().clearCookieOptions()).toEqual({
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        domain: 'example.test',
      });
    });
  });
});
