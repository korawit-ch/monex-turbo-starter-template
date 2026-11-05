import { describe, it, expect } from 'vitest';
import { randomBytes, scryptSync } from 'node:crypto';

import { PasswordService } from './password.service';

/** Encodes a password the way packages/prisma/prisma/seed.ts stores it. */
function encode(
  password: string,
  salt = randomBytes(16).toString('base64url'),
) {
  const hash = scryptSync(password, salt, 64).toString('base64url');
  return `scrypt$${salt}$${hash}`;
}

describe('PasswordService', () => {
  const passwords = new PasswordService();

  it('verifies a password against its seeded scrypt hash', () => {
    expect(passwords.verify('local-change-me', encode('local-change-me'))).toBe(
      true,
    );
  });

  it('rejects a wrong password', () => {
    const stored = encode('local-change-me');
    expect(passwords.verify('local-change-mE', stored)).toBe(false);
    expect(passwords.verify('', stored)).toBe(false);
  });

  it('binds the hash to its salt', () => {
    const [, , hash] = encode('local-change-me', 'salt-a').split('$');
    expect(passwords.verify('local-change-me', `scrypt$salt-b$${hash}`)).toBe(
      false,
    );
  });

  it.each([
    ['an empty string', ''],
    ['a bare hash', 'abcdef'],
    ['another algorithm', encode('pw').replace(/^scrypt/, 'bcrypt')],
    ['a missing salt', `scrypt$$${encode('pw').split('$')[2]}`],
    ['a missing hash', 'scrypt$salt$'],
    ['a truncated hash', encode('pw').slice(0, -4)],
    [
      'a hash of the wrong length',
      `scrypt$salt$${Buffer.alloc(32).toString('base64url')}`,
    ],
  ])('returns false instead of throwing for %s', (_case, stored) => {
    expect(passwords.verify('pw', stored)).toBe(false);
  });
});
