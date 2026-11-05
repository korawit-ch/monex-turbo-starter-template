import { describe, it, expect } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateLinkDto } from './update-link.dto';

/** Same validator options as the global ValidationPipe in main.ts. */
async function errorsFor(body: Record<string, unknown>) {
  const dto = plainToInstance(UpdateLinkDto, body);
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

describe('UpdateLinkDto', () => {
  it('accepts an empty body and any subset of fields', async () => {
    expect(await errorsFor({})).toEqual({});
    expect(await errorsFor({ title: 'Renamed' })).toEqual({});
    expect(
      await errorsFor({
        url: 'https://example.com',
        title: 'Example',
        description: 'About it',
      }),
    ).toEqual({});
  });

  it('rejects fields outside the contract, including ownership fields', async () => {
    expect(
      await errorsFor({ title: 'Renamed', tenantId: 'tenant-2', id: 7 }),
    ).toEqual({
      tenantId: ['whitelistValidation'],
      id: ['whitelistValidation'],
    });
  });

  it.each([
    ['without a protocol', 'example.com'],
    ['with a script scheme', 'javascript:alert(1)'],
    ['that is empty', ''],
    ['that is not a string', 42],
  ])('rejects a url %s', async (_case, url) => {
    expect(await errorsFor({ url })).toHaveProperty(
      'url',
      expect.arrayContaining(['isUrl']),
    );
  });

  it('applies the same length limits as create', async () => {
    const base = 'https://example.com/';
    expect(
      await errorsFor({ url: base + 'a'.repeat(2049 - base.length) }),
    ).toEqual({ url: ['maxLength'] });
    expect(await errorsFor({ title: 'x'.repeat(201) })).toEqual({
      title: ['maxLength'],
    });
    expect(await errorsFor({ description: 'x'.repeat(1001) })).toEqual({
      description: ['maxLength'],
    });
  });

  it('rejects non-string title and description', async () => {
    expect(await errorsFor({ title: 5, description: false })).toEqual({
      title: ['isString', 'maxLength'],
      description: ['isString', 'maxLength'],
    });
  });

  it('documents a known finding: null passes for every field although the contract says string', async () => {
    // @IsOptional() skips validation for null as well as undefined.
    // UpdateLinkRequest declares `url?: string; title?: string;
    // description?: string`, but these nulls reach LinksService.update, which
    // writes them to required url/title columns.
    expect(
      await errorsFor({ url: null, title: null, description: null }),
    ).toEqual({});
  });
});
