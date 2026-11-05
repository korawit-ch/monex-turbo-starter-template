import { describe, it, expect } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateLinkDto } from './create-link.dto';

/** Same validator options as the global ValidationPipe in main.ts. */
async function errorsFor(body: Record<string, unknown>) {
  const dto = plainToInstance(CreateLinkDto, body);
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

const valid = { url: 'https://example.com/path?q=1', title: 'Example' };

describe('CreateLinkDto', () => {
  it('accepts a link with and without a description', async () => {
    expect(await errorsFor(valid)).toEqual({});
    expect(await errorsFor({ ...valid, description: 'About it' })).toEqual({});
  });

  it('rejects fields outside the contract, including ownership fields', async () => {
    expect(
      await errorsFor({
        ...valid,
        tenantId: 'tenant-2',
        id: 7,
        capabilities: {},
      }),
    ).toEqual({
      tenantId: ['whitelistValidation'],
      id: ['whitelistValidation'],
      capabilities: ['whitelistValidation'],
    });
  });

  it('requires url and title', async () => {
    expect(await errorsFor({})).toEqual({
      url: ['isUrl', 'maxLength'],
      title: ['isString', 'maxLength'],
    });
  });

  it.each([
    ['without a protocol', 'example.com'],
    ['with a script scheme', 'javascript:alert(1)'],
    ['that is not a URL', 'not a url'],
    ['that is empty', ''],
    ['that is not a string', 42],
    ['that is null', null],
  ])('rejects a url %s', async (_case, url) => {
    expect(await errorsFor({ ...valid, url })).toHaveProperty(
      'url',
      expect.arrayContaining(['isUrl']),
    );
  });

  it('documents current URL rules: ftp is accepted, a host without TLD is not', async () => {
    // class-validator's default protocols are http, https and ftp, and a TLD
    // is required, so local URLs such as http://localhost:3000 are refused.
    expect(
      await errorsFor({ ...valid, url: 'ftp://example.com/file' }),
    ).toEqual({});
    expect(
      await errorsFor({ ...valid, url: 'http://localhost:3000' }),
    ).toHaveProperty('url', ['isUrl']);
  });

  it('enforces the 2048-character url limit', async () => {
    const base = 'https://example.com/';
    const exact = base + 'a'.repeat(2048 - base.length);
    expect(await errorsFor({ ...valid, url: exact })).toEqual({});
    expect(await errorsFor({ ...valid, url: `${exact}a` })).toEqual({
      url: ['maxLength'],
    });
  });

  it('enforces title type and the 200-character limit', async () => {
    expect(await errorsFor({ ...valid, title: 'x'.repeat(200) })).toEqual({});
    expect(await errorsFor({ ...valid, title: 'x'.repeat(201) })).toEqual({
      title: ['maxLength'],
    });
    expect(await errorsFor({ ...valid, title: 5 })).toHaveProperty(
      'title',
      expect.arrayContaining(['isString']),
    );
    expect(await errorsFor({ ...valid, title: null })).toHaveProperty(
      'title',
      expect.arrayContaining(['isString']),
    );
  });

  it('documents current behaviour: an empty title is accepted (no minimum length)', async () => {
    expect(await errorsFor({ ...valid, title: '' })).toEqual({});
  });

  it('enforces description type and the 1000-character limit', async () => {
    expect(
      await errorsFor({ ...valid, description: 'x'.repeat(1000) }),
    ).toEqual({});
    expect(
      await errorsFor({ ...valid, description: 'x'.repeat(1001) }),
    ).toEqual({ description: ['maxLength'] });
    expect(await errorsFor({ ...valid, description: 5 })).toHaveProperty(
      'description',
      expect.arrayContaining(['isString']),
    );
  });

  it('documents a known finding: description null passes although the contract says string', async () => {
    // @IsOptional() skips validation for null as well as undefined, so
    // `description: null` reaches the service although CreateLinkRequest
    // declares `description?: string`.
    expect(await errorsFor({ ...valid, description: null })).toEqual({});
  });
});
