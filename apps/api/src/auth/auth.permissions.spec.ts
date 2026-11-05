import { describe, it, expect } from 'vitest';

import { permissionsForRole } from './auth.permissions';

describe('permissionsForRole', () => {
  it('grants every Link action to ADMIN', () => {
    expect(permissionsForRole('ADMIN')).toEqual([
      'link.read',
      'link.create',
      'link.update',
      'link.delete',
    ]);
  });

  it('grants only read and create to MEMBER', () => {
    expect(permissionsForRole('MEMBER')).toEqual(['link.read', 'link.create']);
  });

  it('returns a fresh array so callers cannot widen the shared policy', () => {
    const first = permissionsForRole('MEMBER');
    first.push('link.delete');
    expect(permissionsForRole('MEMBER')).toEqual(['link.read', 'link.create']);

    const admin = permissionsForRole('ADMIN');
    admin.length = 0;
    expect(permissionsForRole('ADMIN')).toHaveLength(4);
  });
});
