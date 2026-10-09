import { UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';

import { AccessTokenService } from './access-token.service';
import { AuthConfig } from './auth.config';

const secret = '0123456789abcdef0123456789abcdef';

describe('AccessTokenService', () => {
  let service: AccessTokenService;

  beforeEach(() => {
    process.env.AUTH_JWT_SECRET = secret;
    process.env.AUTH_COOKIE_SECRET = 'abcdef0123456789abcdef0123456789';
    process.env.AUTH_JWT_ISSUER = 'test-api';
    process.env.AUTH_JWT_AUDIENCE = 'test-web';
    service = new AccessTokenService(new AuthConfig());
  });

  it('issues and verifies a sanitized authorization context', () => {
    const token = service.issue({
      userId: 'user-1',
      tenantId: 'tenant-1',
      permissions: ['link.read'],
    });
    expect(service.verify(token).auth).toEqual({
      userId: 'user-1',
      tenantId: 'tenant-1',
      permissions: ['link.read'],
    });
  });

  it.each([
    ['wrong signature', 'different-secret-0123456789abcdef'],
    ['wrong issuer', secret, 'other-api', 'test-web'],
    ['wrong audience', secret, 'test-api', 'other-web'],
  ])(
    'rejects %s',
    (_name, signingSecret, issuer = 'test-api', audience = 'test-web') => {
      const token = jwt.sign(
        { tenantId: 'tenant-1', permissions: ['link.read'] },
        signingSecret,
        {
          algorithm: 'HS256',
          subject: 'user-1',
          issuer,
          audience,
          expiresIn: 60,
        },
      );
      expect(() => service.verify(token)).toThrow(UnauthorizedException);
    },
  );

  it('rejects expired and unknown-permission tokens', () => {
    const expired = jwt.sign(
      { tenantId: 'tenant-1', permissions: ['link.read'] },
      secret,
      {
        algorithm: 'HS256',
        subject: 'user-1',
        issuer: 'test-api',
        audience: 'test-web',
        expiresIn: -1,
      },
    );
    const unknown = jwt.sign(
      { tenantId: 'tenant-1', permissions: ['link.root'] },
      secret,
      {
        algorithm: 'HS256',
        subject: 'user-1',
        issuer: 'test-api',
        audience: 'test-web',
        expiresIn: 60,
      },
    );
    expect(() => service.verify(expired)).toThrow(UnauthorizedException);
    expect(() => service.verify(unknown)).toThrow(UnauthorizedException);
  });
});
