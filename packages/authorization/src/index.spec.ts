import { describe, it, expect } from 'vitest';
import {
  can,
  hasPermission,
  parseAccessTokenClaims,
  resourceScope,
  toAuthorizationContext,
  toClientAuthorizationContext,
} from '.';

const claims = {
  sub: 'user-1',
  attributes: { tenantId: 'tenant-1' },
  grants: [
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
      permission: 'link.create',
      conditions: [
        {
          operator: 'equals',
          subjectField: 'tenantId',
          resourceField: 'tenantId',
        },
      ],
    },
  ],
  iat: 1,
  exp: 2,
  iss: 'application-api',
  aud: 'application-web',
};

describe('authorization', () => {
  it('separates named permission checks from resource evaluation', () => {
    const auth = toAuthorizationContext(parseAccessTokenClaims(claims));
    expect(hasPermission(auth, 'link.read')).toBe(true);
    expect(can(auth, 'link.read', { tenantId: 'tenant-1' })).toBe(true);
    expect(can(auth, 'link.read', { tenantId: 'tenant-2' })).toBe(false);
    expect(can(auth, 'link.delete', { tenantId: 'tenant-1' })).toBe(false);
  });

  it('resolves the signed grant into database scope', () => {
    const auth = toAuthorizationContext(parseAccessTokenClaims(claims));
    expect(resourceScope(auth, 'link.read')).toEqual({ tenantId: 'tenant-1' });
    expect(resourceScope(auth, 'link.delete')).toBeNull();
  });

  it('exposes only coarse permission names to client components', () => {
    const auth = toAuthorizationContext(parseAccessTokenClaims(claims));
    expect(toClientAuthorizationContext(auth)).toEqual({
      userId: 'user-1',
      permissions: ['link.read', 'link.create'],
    });
  });

  it.each([
    [
      'unknown permission',
      { ...claims, grants: [{ permission: 'link.root', conditions: [] }] },
    ],
    [
      'empty conditions',
      { ...claims, grants: [{ permission: 'link.read', conditions: [] }] },
    ],
    [
      'unknown operator',
      {
        ...claims,
        grants: [
          {
            permission: 'link.read',
            conditions: [
              {
                operator: 'startsWith',
                subjectField: 'tenantId',
                resourceField: 'tenantId',
              },
            ],
          },
        ],
      },
    ],
    [
      'unknown resource field',
      {
        ...claims,
        grants: [
          {
            permission: 'link.read',
            conditions: [
              {
                operator: 'equals',
                subjectField: 'tenantId',
                resourceField: 'ownerId',
              },
            ],
          },
        ],
      },
    ],
    [
      'duplicate grant',
      { ...claims, grants: [claims.grants[0], claims.grants[0]] },
    ],
    ['missing subject', { ...claims, sub: undefined }],
    ['missing attributes', { ...claims, attributes: undefined }],
    ['non-array grants', { ...claims, grants: 'link.read' }],
  ])('rejects malformed claims: %s', (_name, payload) => {
    expect(() => parseAccessTokenClaims(payload)).toThrow(TypeError);
  });

  it('fails closed when a required resource attribute is missing', () => {
    const auth = toAuthorizationContext(parseAccessTokenClaims(claims));
    expect(can(auth, 'link.read', {})).toBe(false);
  });
});
