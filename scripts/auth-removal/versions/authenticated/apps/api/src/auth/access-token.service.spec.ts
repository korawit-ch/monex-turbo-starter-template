import { UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';

import { AccessTokenService } from './access-token.service';
import { AuthConfig } from './auth.config';

const secret = '0123456789abcdef0123456789abcdef';
const readGrant = {
  permission: 'link.read' as const,
  conditions: [
    {
      operator: 'equals' as const,
      subjectField: 'tenantId' as const,
      resourceField: 'tenantId' as const,
    },
  ],
};

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
      grants: [readGrant],
    });
    expect(service.verify(token).auth).toEqual({
      subject: { userId: 'user-1', tenantId: 'tenant-1' },
      grants: [readGrant],
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
        { attributes: { tenantId: 'tenant-1' }, grants: [readGrant] },
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
      { attributes: { tenantId: 'tenant-1' }, grants: [readGrant] },
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
      {
        attributes: { tenantId: 'tenant-1' },
        // A valid condition, so only the permission allowlist can reject it.
        grants: [
          {
            permission: 'link.root',
            conditions: [
              {
                operator: 'equals',
                subjectField: 'tenantId',
                resourceField: 'tenantId',
              },
            ],
          },
        ],
      },
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
