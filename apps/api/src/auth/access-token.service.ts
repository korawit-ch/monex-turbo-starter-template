import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  parseAccessTokenClaims,
  toAuthorizationContext,
  type AuthorizationContext,
  type Permission,
} from '@repo/authorization';
import jwt from 'jsonwebtoken';

import { AuthConfig } from './auth.config';

export type VerifiedAccessToken = {
  auth: AuthorizationContext;
  token: string;
};

@Injectable()
export class AccessTokenService {
  constructor(private readonly config: AuthConfig) {}

  issue(input: {
    userId: string;
    tenantId: string;
    permissions: Permission[];
  }): string {
    return jwt.sign(
      {
        tenantId: input.tenantId,
        permissions: input.permissions,
      },
      this.config.jwtSecret,
      {
        algorithm: 'HS256',
        audience: this.config.jwtAudience,
        expiresIn: this.config.accessTtlSeconds,
        issuer: this.config.jwtIssuer,
        subject: input.userId,
      },
    );
  }

  verify(token: string): VerifiedAccessToken {
    try {
      const payload = jwt.verify(token, this.config.jwtSecret, {
        algorithms: ['HS256'],
        audience: this.config.jwtAudience,
        issuer: this.config.jwtIssuer,
      });
      const claims = parseAccessTokenClaims(payload);
      return { auth: toAuthorizationContext(claims), token };
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
