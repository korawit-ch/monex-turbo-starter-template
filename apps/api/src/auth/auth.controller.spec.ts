import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  UnauthorizedException,
  ValidationPipe,
  type INestApplication,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { AuthorizationContext } from '@repo/authorization';
import type { Server } from 'node:http';
import request from 'supertest';

import { AccessTokenService } from './access-token.service';
import { AuthConfig } from './auth.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionGuard } from './permission.guard';

const actor: AuthorizationContext = {
  subject: { userId: 'user-1', tenantId: 'tenant-1' },
  grants: [],
};

function setCookies(response: request.Response): string[] {
  const header = response.headers['set-cookie'] as unknown;
  if (!header) return [];
  return Array.isArray(header) ? (header as string[]) : [String(header)];
}

function cookieNamed(response: request.Response, name: string) {
  return setCookies(response).find((cookie) => cookie.startsWith(`${name}=`));
}

/**
 * Runs the controller in a real Nest HTTP pipeline (global guards and the
 * same ValidationPipe options as main.ts) with the services mocked, so status
 * codes and Set-Cookie headers are what a client actually receives.
 */
describe('AuthController', () => {
  let app: INestApplication;
  const auth = {
    login: vi.fn<
      (
        email: string,
        password: string,
      ) => Promise<{
        accessToken: string;
        sessionCookie: string;
        sessionExpiresAt: Date;
      }>
    >(),
    refresh: vi.fn<(sessionCookie: string) => Promise<string>>(),
    revokeCurrent: vi.fn<(sessionCookie?: string) => Promise<void>>(),
    revokeAll: vi.fn<(userId: string) => Promise<void>>(),
  };
  const accessTokens = {
    verify: vi.fn<(token: string) => { auth: AuthorizationContext }>(),
  };

  beforeEach(async () => {
    vi.stubEnv('AUTH_JWT_SECRET', '0123456789abcdef0123456789abcdef');
    vi.stubEnv('AUTH_COOKIE_SECRET', 'abcdef0123456789abcdef0123456789');
    vi.stubEnv('AUTH_ACCESS_TTL_SECONDS', '600');
    vi.stubEnv('AUTH_SESSION_TTL_SECONDS', '2592000');
    vi.stubEnv('AUTH_COOKIE_DOMAIN', undefined);
    vi.stubEnv('NODE_ENV', 'test');

    auth.login.mockResolvedValue({
      accessToken: 'access-jwt',
      sessionCookie: 'sealed-session',
      sessionExpiresAt: new Date(Date.now() + 60_000),
    });
    auth.refresh.mockResolvedValue('fresh-access-jwt');
    auth.revokeCurrent.mockResolvedValue();
    auth.revokeAll.mockResolvedValue();
    accessTokens.verify.mockReturnValue({ auth: actor });

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthConfig,
        { provide: AuthService, useValue: auth },
        { provide: AccessTokenService, useValue: accessTokens },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer() as Server);

  describe('POST /auth/login', () => {
    const body = { email: 'admin@example.com', password: 'local-change-me' };

    it('sets both HttpOnly cookies and keeps the credentials out of the JSON body', async () => {
      const response = await http().post('/auth/login').send(body).expect(201);

      expect(response.body).toEqual({ ok: true });
      expect(auth.login).toHaveBeenCalledWith(
        'admin@example.com',
        'local-change-me',
      );

      const access = cookieNamed(response, 'access_token');
      const session = cookieNamed(response, 'auth_session');
      expect(access).toMatch(/^access_token=access-jwt;/);
      expect(session).toMatch(/^auth_session=sealed-session;/);
      for (const cookie of [access, session]) {
        expect(cookie).toContain('HttpOnly');
        expect(cookie).toContain('SameSite=Lax');
        expect(cookie).toContain('Path=/');
        expect(cookie).not.toContain('Secure');
        expect(cookie).not.toContain('Domain=');
      }
      expect(access).toContain('Max-Age=600;');
      expect(session).toContain('Max-Age=2592000;');
      expect(setCookies(response)).toHaveLength(2);
    });

    it('marks both cookies Secure in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const response = await http().post('/auth/login').send(body).expect(201);
      expect(cookieNamed(response, 'access_token')).toContain('Secure');
      expect(cookieNamed(response, 'auth_session')).toContain('Secure');
    });

    it('is reachable without a bearer token (public route)', async () => {
      await http().post('/auth/login').send(body).expect(201);
      expect(accessTokens.verify).not.toHaveBeenCalled();
    });

    it.each([
      ['an unknown field', { ...body, tenantId: 'tenant-2' }],
      ['a malformed email', { ...body, email: 'not-an-email' }],
      ['a short password', { ...body, password: 'short' }],
    ])(
      'rejects a body with %s with 400 before calling the service',
      async (_case, payload) => {
        const response = await http()
          .post('/auth/login')
          .send(payload)
          .expect(400);
        expect(auth.login).not.toHaveBeenCalled();
        expect(setCookies(response)).toEqual([]);
      },
    );

    it('returns 401 and sets no cookie when the credentials are rejected', async () => {
      auth.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );
      const response = await http().post('/auth/login').send(body).expect(401);
      expect(setCookies(response)).toEqual([]);
    });
  });

  describe('POST /auth/refresh', () => {
    it('returns 401 without calling the service when the session cookie is missing', async () => {
      const response = await http()
        .post('/auth/refresh')
        .set('Cookie', 'access_token=old; other=1')
        .expect(401);
      expect(auth.refresh).not.toHaveBeenCalled();
      expect(setCookies(response)).toEqual([]);
    });

    it('renews only the access cookie from the session cookie', async () => {
      const response = await http()
        .post('/auth/refresh')
        .set('Cookie', 'other=1; auth_session=sealed%2Dsession')
        .expect(201);

      expect(response.body).toEqual({ ok: true });
      expect(auth.refresh).toHaveBeenCalledWith('sealed-session');
      expect(accessTokens.verify).not.toHaveBeenCalled();
      expect(setCookies(response)).toHaveLength(1);
      const access = cookieNamed(response, 'access_token');
      expect(access).toMatch(/^access_token=fresh-access-jwt;/);
      expect(access).toContain('Max-Age=600;');
      expect(access).toContain('HttpOnly');
      expect(access).toContain('SameSite=Lax');
    });

    it('returns 401 and sets no cookie when the session is not active', async () => {
      auth.refresh.mockRejectedValue(
        new UnauthorizedException('Session is not active'),
      );
      const response = await http()
        .post('/auth/refresh')
        .set('Cookie', 'auth_session=revoked')
        .expect(401);
      expect(setCookies(response)).toEqual([]);
    });
  });

  function expectCleared(response: request.Response) {
    for (const name of ['access_token', 'auth_session']) {
      const cookie = cookieNamed(response, name);
      expect(cookie).toMatch(new RegExp(`^${name}=;`));
      expect(cookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
      expect(cookie).toContain('Path=/');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
    }
  }

  describe('POST /auth/logout', () => {
    it('revokes the current session and clears both cookies', async () => {
      const response = await http()
        .post('/auth/logout')
        .set('Cookie', 'auth_session=sealed-session')
        .expect(201);
      expect(response.body).toEqual({ ok: true });
      expect(auth.revokeCurrent).toHaveBeenCalledWith('sealed-session');
      expectCleared(response);
    });

    it('still clears both cookies when no session cookie is sent', async () => {
      const response = await http().post('/auth/logout').expect(201);
      expect(auth.revokeCurrent).toHaveBeenCalledWith(undefined);
      expectCleared(response);
    });

    it('clears cookies on the configured domain with the Secure flag in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('AUTH_COOKIE_DOMAIN', 'example.test');
      const response = await http().post('/auth/logout').expect(201);
      for (const name of ['access_token', 'auth_session']) {
        expect(cookieNamed(response, name)).toContain('Domain=example.test');
        expect(cookieNamed(response, name)).toContain('Secure');
      }
    });
  });

  describe('POST /auth/logout-all', () => {
    it('requires a bearer access token', async () => {
      const response = await http()
        .post('/auth/logout-all')
        .set('Cookie', 'auth_session=sealed-session')
        .expect(401);
      expect(auth.revokeAll).not.toHaveBeenCalled();
      expect(setCookies(response)).toEqual([]);
    });

    it('revokes every session of the verified user and clears both cookies', async () => {
      const response = await http()
        .post('/auth/logout-all')
        .set('Authorization', 'Bearer access-jwt')
        .expect(201);
      expect(response.body).toEqual({ ok: true });
      expect(accessTokens.verify).toHaveBeenCalledWith('access-jwt');
      expect(auth.revokeAll).toHaveBeenCalledWith('user-1');
      expectCleared(response);
    });
  });
});
