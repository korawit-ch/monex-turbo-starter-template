import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AccessTokenService } from './access-token.service';
import { AuthConfig } from './auth.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PasswordService } from './password.service';
import { PermissionGuard } from './permission.guard';
import { SessionCookieService } from './session-cookie.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthConfig,
    AccessTokenService,
    SessionCookieService,
    PasswordService,
    AuthService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
  exports: [AuthConfig, AccessTokenService],
})
export class AuthModule {}
