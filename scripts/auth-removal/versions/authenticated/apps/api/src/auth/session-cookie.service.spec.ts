import { UnauthorizedException } from '@nestjs/common';

import { AuthConfig } from './auth.config';
import { SessionCookieService } from './session-cookie.service';

describe('SessionCookieService', () => {
  beforeEach(() => {
    process.env.AUTH_JWT_SECRET = '0123456789abcdef0123456789abcdef';
    process.env.AUTH_COOKIE_SECRET = 'abcdef0123456789abcdef0123456789';
  });

  it('encrypts and authenticates the opaque session token', () => {
    const service = new SessionCookieService(new AuthConfig());
    const sealed = service.seal(
      'raw-session-token',
      new Date(Date.now() + 60_000),
    );
    expect(sealed).not.toContain('raw-session-token');
    expect(service.open(sealed).token).toBe('raw-session-token');
    expect(() => service.open(`${sealed.slice(0, -1)}x`)).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects expired envelopes', () => {
    const service = new SessionCookieService(new AuthConfig());
    const sealed = service.seal('raw-session-token', new Date(Date.now() - 1));
    expect(() => service.open(sealed)).toThrow(UnauthorizedException);
  });
});
