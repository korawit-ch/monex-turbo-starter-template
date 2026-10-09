import { Injectable } from '@nestjs/common';
import { scryptSync, timingSafeEqual } from 'node:crypto';

@Injectable()
export class PasswordService {
  verify(password: string, encoded: string): boolean {
    const [algorithm, salt, expected] = encoded.split('$');
    if (algorithm !== 'scrypt' || !salt || !expected) return false;

    try {
      const actual = scryptSync(password, salt, 64);
      const expectedBuffer = Buffer.from(expected, 'base64url');
      return (
        actual.length === expectedBuffer.length &&
        timingSafeEqual(actual, expectedBuffer)
      );
    } catch {
      return false;
    }
  }
}
