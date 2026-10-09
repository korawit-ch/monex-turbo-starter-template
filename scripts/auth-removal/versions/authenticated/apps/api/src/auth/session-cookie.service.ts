import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

import { AuthConfig } from './auth.config';

type SessionEnvelope = {
  token: string;
  exp: number;
};

@Injectable()
export class SessionCookieService {
  private readonly key: Buffer;

  constructor(config: AuthConfig) {
    this.key = createHash('sha256').update(config.cookieSecret).digest();
  }

  seal(token: string, expiresAt: Date): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const plaintext = Buffer.from(
      JSON.stringify({
        token,
        exp: expiresAt.getTime(),
      } satisfies SessionEnvelope),
      'utf8',
    );
    const ciphertext = Buffer.concat([
      cipher.update(plaintext),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, ciphertext]).toString('base64url');
  }

  open(value: string): SessionEnvelope {
    try {
      const packed = Buffer.from(value, 'base64url');
      if (packed.length < 29) throw new Error('Invalid envelope');
      const iv = packed.subarray(0, 12);
      const tag = packed.subarray(12, 28);
      const ciphertext = packed.subarray(28);
      const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
      decipher.setAuthTag(tag);
      const envelope = JSON.parse(
        Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
          'utf8',
        ),
      ) as unknown;

      if (
        typeof envelope !== 'object' ||
        envelope === null ||
        typeof (envelope as SessionEnvelope).token !== 'string' ||
        typeof (envelope as SessionEnvelope).exp !== 'number' ||
        (envelope as SessionEnvelope).exp <= Date.now()
      ) {
        throw new Error('Invalid envelope');
      }
      return envelope as SessionEnvelope;
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
  }
}
