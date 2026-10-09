import { can, parseAccessTokenClaims, toAuthorizationContext } from '.';

const claims = {
  sub: 'user-1',
  tenantId: 'tenant-1',
  permissions: ['link.read', 'link.create'],
  iat: 1,
  exp: 2,
  iss: 'application-api',
  aud: 'application-web',
};

describe('authorization', () => {
  it('grants a known permission in the matching tenant', () => {
    const auth = toAuthorizationContext(parseAccessTokenClaims(claims));
    expect(can(auth, 'link.read', { tenantId: 'tenant-1' })).toBe(true);
  });

  it('rejects missing permissions and tenant mismatches', () => {
    const auth = toAuthorizationContext(parseAccessTokenClaims(claims));
    expect(can(auth, 'link.delete')).toBe(false);
    expect(can(auth, 'link.read', { tenantId: 'tenant-2' })).toBe(false);
  });

  it('rejects unknown permission claims', () => {
    expect(() =>
      parseAccessTokenClaims({
        ...claims,
        permissions: ['link.read', 'link.superuser'],
      }),
    ).toThrow('Unknown permission claim');
  });

  it.each([
    ['missing subject', { ...claims, sub: undefined }],
    ['missing tenant', { ...claims, tenantId: undefined }],
    ['non-array permissions', { ...claims, permissions: 'link.read' }],
    ['non-string permission', { ...claims, permissions: [1] }],
  ])('rejects malformed claims: %s', (_name, payload) => {
    expect(() => parseAccessTokenClaims(payload)).toThrow(TypeError);
  });
});
