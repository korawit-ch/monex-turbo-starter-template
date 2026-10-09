import { describe, expect, it } from '@jest/globals';
import type { Link as PrismaLink } from '@repo/prisma';

import { toLinkResponse } from './links.mapper';

describe('toLinkResponse', () => {
  it('maps the persistence model to a JSON-safe API response', () => {
    const link: PrismaLink = {
      id: 1,
      title: 'Example',
      url: 'https://example.com',
      description: null,
      createdAt: new Date('2026-01-02T03:04:05.000Z'),
      updatedAt: new Date('2026-02-03T04:05:06.000Z'),
    };

    expect(toLinkResponse(link)).toEqual({
      id: 1,
      title: 'Example',
      url: 'https://example.com',
      description: null,
      createdAt: '2026-01-02T03:04:05.000Z',
      updatedAt: '2026-02-03T04:05:06.000Z',
    });
  });
});
