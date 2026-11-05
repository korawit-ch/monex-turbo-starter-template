import { describe, it, expect } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { LoginDto } from './login.dto';

/** Same validator options as the global ValidationPipe in main.ts. */
async function errorsFor(body: Record<string, unknown>) {
  const dto = plainToInstance(LoginDto, body);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return Object.fromEntries(
    errors.map((error) => [
      error.property,
      Object.keys(error.constraints ?? {}).sort(),
    ]),
  );
}

const valid = { email: 'admin@example.com', password: 'local-change-me' };

describe('LoginDto', () => {
  it('accepts a well-formed email and password', async () => {
    expect(await errorsFor(valid)).toEqual({});
  });

  it('rejects unknown fields such as tenant or role', async () => {
    expect(
      await errorsFor({ ...valid, tenantId: 'tenant-2', role: 'ADMIN' }),
    ).toEqual({
      tenantId: ['whitelistValidation'],
      role: ['whitelistValidation'],
    });
  });

  it('requires both fields', async () => {
    expect(await errorsFor({})).toEqual({
      email: ['isEmail', 'maxLength'],
      password: ['isString', 'maxLength', 'minLength'],
    });
  });

  it.each([null, 42, 'not-an-email', 'a@b'])(
    'rejects email %s',
    async (email) => {
      expect(await errorsFor({ ...valid, email })).toHaveProperty('email');
    },
  );

  it('rejects an email longer than 320 characters', async () => {
    const labels = Array.from({ length: 5 }, () => 'b'.repeat(60)).join('.');
    const email = `${'a'.repeat(64)}@${labels}.com`;
    expect(email.length).toBeGreaterThan(320);
    expect(await errorsFor({ ...valid, email })).toHaveProperty(
      'email',
      expect.arrayContaining(['maxLength']),
    );
  });

  it('enforces the 8 to 256 character password length', async () => {
    expect(await errorsFor({ ...valid, password: 'x'.repeat(7) })).toEqual({
      password: ['minLength'],
    });
    expect(await errorsFor({ ...valid, password: 'x'.repeat(8) })).toEqual({});
    expect(await errorsFor({ ...valid, password: 'x'.repeat(256) })).toEqual(
      {},
    );
    expect(await errorsFor({ ...valid, password: 'x'.repeat(257) })).toEqual({
      password: ['maxLength'],
    });
  });

  it('rejects a non-string password', async () => {
    expect(await errorsFor({ ...valid, password: 12345678 })).toHaveProperty(
      'password',
      expect.arrayContaining(['isString']),
    );
  });
});
