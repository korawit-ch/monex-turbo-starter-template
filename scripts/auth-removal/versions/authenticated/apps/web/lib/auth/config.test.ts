/** @vitest-environment node */
import { describe, it, expect, vi } from 'vitest';

import {
  getApiInternalUrl,
  getAuthVerificationConfig,
  getWebOrigin,
} from './config';

vi.mock('server-only', () => ({}));

describe('getAuthVerificationConfig', () => {
  it('returns the secret with the issuer and audience defaults', () => {
    vi.stubEnv('AUTH_JWT_SECRET', 'x'.repeat(32));
    vi.stubEnv('AUTH_JWT_ISSUER', '');
    vi.stubEnv('AUTH_JWT_AUDIENCE', '');

    expect(getAuthVerificationConfig()).toEqual({
      secret: 'x'.repeat(32),
      issuer: 'monex-api',
      audience: 'monex-web',
    });
  });

  it('uses the configured issuer and audience', () => {
    vi.stubEnv('AUTH_JWT_SECRET', 'x'.repeat(32));
    vi.stubEnv('AUTH_JWT_ISSUER', 'custom-issuer');
    vi.stubEnv('AUTH_JWT_AUDIENCE', 'custom-audience');

    expect(getAuthVerificationConfig()).toMatchObject({
      issuer: 'custom-issuer',
      audience: 'custom-audience',
    });
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['31 bytes', 'x'.repeat(31)],
  ])('throws a configuration error when the secret is %s', (_label, value) => {
    vi.stubEnv('AUTH_JWT_SECRET', value);

    expect(() => getAuthVerificationConfig()).toThrow(
      'AUTH_JWT_SECRET must contain at least 32 bytes',
    );
  });

  it('counts bytes, not characters', () => {
    // 16 two-byte characters are 32 bytes.
    vi.stubEnv('AUTH_JWT_SECRET', 'é'.repeat(16));

    expect(getAuthVerificationConfig().secret).toBe('é'.repeat(16));
  });
});

describe('getApiInternalUrl', () => {
  it('strips one trailing slash', () => {
    vi.stubEnv('API_INTERNAL_URL', 'http://127.0.0.1:3001/');

    expect(getApiInternalUrl()).toBe('http://127.0.0.1:3001');
  });

  it('throws when it is not configured', () => {
    vi.stubEnv('API_INTERNAL_URL', undefined);

    expect(() => getApiInternalUrl()).toThrow('API_INTERNAL_URL is required');
  });
});

describe('getWebOrigin', () => {
  it('returns the configured origin without a trailing slash', () => {
    vi.stubEnv('WEB_ORIGIN', 'https://app.example.com/');

    expect(getWebOrigin()).toBe('https://app.example.com');
  });

  it('defaults to the local dev origin', () => {
    vi.stubEnv('WEB_ORIGIN', undefined);

    expect(getWebOrigin()).toBe('http://localhost:3000');
  });
});
