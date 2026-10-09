import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { AccessTokenService } from './access-token.service';
import { AuthConfig } from './auth.config';
import { permissionsForRole } from './auth.permissions';
import { PasswordService } from './password.service';
import { SessionCookieService } from './session-cookie.service';

type IssuedCredentials = {
  accessToken: string;
  sessionCookie: string;
  sessionExpiresAt: Date;
};

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('base64url');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessTokens: AccessTokenService,
    private readonly sessions: SessionCookieService,
    private readonly passwords: PasswordService,
    private readonly config: AuthConfig,
  ) {}

  async login(email: string, password: string): Promise<IssuedCredentials> {
    const user = await this.prisma.client.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (
      !user ||
      user.disabledAt ||
      !this.passwords.verify(password, user.passwordHash)
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const rawToken = randomBytes(32).toString('base64url');
    const sessionExpiresAt = new Date(
      Date.now() + this.config.sessionTtlSeconds * 1000,
    );
    await this.prisma.client.authSession.create({
      data: {
        tokenHash: hashSessionToken(rawToken),
        userId: user.id,
        expiresAt: sessionExpiresAt,
      },
    });

    return {
      accessToken: this.accessTokens.issue({
        userId: user.id,
        tenantId: user.tenantId,
        permissions: permissionsForRole(user.role),
      }),
      sessionCookie: this.sessions.seal(rawToken, sessionExpiresAt),
      sessionExpiresAt,
    };
  }

  async refresh(sessionCookie: string): Promise<string> {
    const envelope = this.sessions.open(sessionCookie);
    const session = await this.prisma.client.authSession.findFirst({
      where: {
        tokenHash: hashSessionToken(envelope.token),
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: { disabledAt: null },
      },
      include: { user: true },
    });
    if (!session) throw new UnauthorizedException('Session is not active');

    return this.accessTokens.issue({
      userId: session.user.id,
      tenantId: session.user.tenantId,
      permissions: permissionsForRole(session.user.role),
    });
  }

  async revokeCurrent(sessionCookie?: string): Promise<void> {
    if (!sessionCookie) return;
    let rawToken: string;
    try {
      rawToken = this.sessions.open(sessionCookie).token;
    } catch {
      return;
    }
    await this.prisma.client.authSession.updateMany({
      where: {
        tokenHash: hashSessionToken(rawToken),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAll(userId: string): Promise<void> {
    await this.prisma.client.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
