import { describe, it, expect } from 'vitest';
import type { Link as PrismaLink } from '@repo/prisma';

import { toLinkResponse } from './links.mapper';

describe('toLinkResponse', () => {
  it('maps the persistence model to a JSON-safe API response', () => {
    const link: PrismaLink = {
      id: 1,
      title: 'Example',
      url: 'https://example.com',
      description: null,
      tenantId: 'tenant-1',
      createdAt: new Date('2026-01-02T03:04:05.000Z'),
      updatedAt: new Date('2026-02-03T04:05:06.000Z'),
    };

    const auth = {
      subject: { userId: 'user-1', tenantId: 'tenant-1' },
      grants: [
        {
          permission: 'link.update' as const,
          conditions: [
            {
              operator: 'equals' as const,
              subjectField: 'tenantId' as const,
              resourceField: 'tenantId' as const,
            },
          ],
        },
      ],
    };
    expect(toLinkResponse(link, auth)).toEqual({
      id: 1,
      title: 'Example',
      url: 'https://example.com',
      description: null,
      createdAt: '2026-01-02T03:04:05.000Z',
      updatedAt: '2026-02-03T04:05:06.000Z',
      capabilities: {
        update: { allowed: true },
        delete: {
          allowed: false,
          reason: 'Missing delete grant or tenant scope',
        },
      },
    });
  });
});
