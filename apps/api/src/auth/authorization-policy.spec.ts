import { describe, it, expect } from 'vitest';
import { buildPermissionGrants } from './authorization-policy';

describe('buildPermissionGrants', () => {
  it('adds explicit tenant scope to every action grant', () => {
    expect(buildPermissionGrants(['link.read', 'link.delete'])).toEqual([
      {
        permission: 'link.read',
        conditions: [
          {
            operator: 'equals',
            subjectField: 'tenantId',
            resourceField: 'tenantId',
          },
        ],
      },
      {
        permission: 'link.delete',
        conditions: [
          {
            operator: 'equals',
            subjectField: 'tenantId',
            resourceField: 'tenantId',
          },
        ],
      },
    ]);
  });
});
