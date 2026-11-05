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

  it('denies both capabilities for a record owned by another tenant', () => {
    const link: PrismaLink = {
      id: 2,
      title: 'Foreign',
      url: 'https://example.org',
      description: 'Other tenant',
      tenantId: 'tenant-2',
      createdAt: new Date('2026-01-02T03:04:05.000Z'),
      updatedAt: new Date('2026-01-02T03:04:05.000Z'),
    };
    const tenantCondition = {
      operator: 'equals' as const,
      subjectField: 'tenantId' as const,
      resourceField: 'tenantId' as const,
    };
    const admin = {
      subject: { userId: 'user-1', tenantId: 'tenant-1' },
      grants: (['link.read', 'link.update', 'link.delete'] as const).map(
        (permission) => ({ permission, conditions: [tenantCondition] }),
      ),
    };
    const response = toLinkResponse(link, admin);
    expect(response.capabilities).toEqual({
      update: {
        allowed: false,
        reason: 'Missing update grant or tenant scope',
      },
      delete: {
        allowed: false,
        reason: 'Missing delete grant or tenant scope',
      },
    });
    expect(response).not.toHaveProperty('tenantId');
  });
});
