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
      // A valid condition, so only the permission allowlist can reject it.
      {
        ...claims,
        grants: [{ ...claims.grants[0], permission: 'link.root' }],
      },
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

const tenantCondition = claims.grants[0].conditions[0];

function withReadGrant(grant: unknown) {
  return { ...claims, grants: [grant] };
}

describe('parseAccessTokenClaims failure paths', () => {
  it.each([
    [
      'unknown subject field',
      withReadGrant({
        permission: 'link.read',
        conditions: [{ ...tenantCondition, subjectField: 'userId' }],
      }),
      'Unknown grant condition subject field: userId',
    ],
    [
      'unknown resource field',
      withReadGrant({
        permission: 'link.read',
        conditions: [{ ...tenantCondition, resourceField: 'ownerId' }],
      }),
      'Unknown grant condition resource field: ownerId',
    ],
    [
      'non-object condition',
      withReadGrant({ permission: 'link.read', conditions: ['tenantId'] }),
      'Permission grant condition must be an object',
    ],
    [
      'array condition',
      withReadGrant({ permission: 'link.read', conditions: [[]] }),
      'Permission grant condition must be an object',
    ],
    [
      'non-object grant',
      withReadGrant('link.read'),
      'Permission grant must be an object',
    ],
    ['null grant', withReadGrant(null), 'Permission grant must be an object'],
    [
      'conditions not an array',
      withReadGrant({ permission: 'link.read', conditions: tenantCondition }),
      'Permission grant conditions must be an array',
    ],
    [
      'missing conditions',
      withReadGrant({ permission: 'link.read' }),
      'Permission grant conditions must be an array',
    ],
    [
      'duplicate resource-field conditions',
      withReadGrant({
        permission: 'link.read',
        conditions: [tenantCondition, tenantCondition],
      }),
      'Permission grant contains duplicate resource fields',
    ],
    [
      'empty tenantId attribute',
      { ...claims, attributes: { tenantId: '' } },
      'Access token claim tenantId must be a non-empty string',
    ],
    [
      'non-string tenantId attribute',
      { ...claims, attributes: { tenantId: 1 } },
      'Access token claim tenantId must be a non-empty string',
    ],
    [
      'legacy { tenantId, permissions } payload',
      {
        sub: 'user-1',
        tenantId: 'tenant-1',
        permissions: ['link.read'],
        iat: 1,
        exp: 2,
        iss: 'application-api',
        aud: 'application-web',
      },
      'Access token claim attributes must be an object',
    ],
    [
      'legacy permissions list in place of grants',
      { ...claims, grants: undefined, permissions: ['link.read'] },
      'Access token claim grants must be an array',
    ],
    ['non-object payload', 'token', 'Access token payload must be an object'],
    [
      'non-finite exp',
      { ...claims, exp: Number.POSITIVE_INFINITY },
      'Access token claim exp must be a finite number',
    ],
    [
      'empty audience array',
      { ...claims, aud: [] },
      'Access token claim aud must be a non-empty string or string array',
    ],
    [
      'audience array with an empty entry',
      { ...claims, aud: ['application-web', ''] },
      'Access token claim aud must be a non-empty string or string array',
    ],
  ])('rejects %s', (_name, payload, message) => {
    expect(() => parseAccessTokenClaims(payload)).toThrow(
      new TypeError(message),
    );
  });

  it('keeps only the known claim shape in the parsed result', () => {
    const parsed = parseAccessTokenClaims({
      ...claims,
      attributes: { tenantId: 'tenant-1', role: 'admin' },
      grants: [
        {
          ...claims.grants[0],
          extra: true,
          conditions: [{ ...tenantCondition, extra: true }],
        },
      ],
      permissions: ['link.delete'],
      aud: ['application-web', 'application-admin'],
    });

    expect(parsed).toEqual({
      sub: 'user-1',
      attributes: { tenantId: 'tenant-1' },
      grants: [{ permission: 'link.read', conditions: [tenantCondition] }],
      iat: 1,
      exp: 2,
      iss: 'application-api',
      aud: ['application-web', 'application-admin'],
    });
  });
});

describe('authorization evaluation edge cases', () => {
  const auth = toAuthorizationContext(parseAccessTokenClaims(claims));

  it('returns null scope when no grant matches the permission', () => {
    expect(resourceScope(auth, 'link.update')).toBeNull();
    expect(resourceScope(auth, 'link.delete')).toBeNull();
  });

  it('denies a granted permission on a resource in another tenant', () => {
    expect(hasPermission(auth, 'link.create')).toBe(true);
    expect(can(auth, 'link.create', { tenantId: 'tenant-2' })).toBe(false);
    expect(can(auth, 'link.create', { tenantId: 'tenant-1' })).toBe(true);
  });
});
