export const PERMISSIONS = [
  'link.read',
  'link.create',
  'link.update',
  'link.delete',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type AuthorizationContext = {
  userId: string;
  tenantId: string;
  permissions: Permission[];
};

export type AuthorizationOptions = {
  tenantId?: string;
};

export type AccessTokenClaims = {
  sub: string;
  tenantId: string;
  permissions: Permission[];
  iat: number;
  exp: number;
  iss: string;
  aud: string | string[];
};

const permissionSet = new Set<string>(PERMISSIONS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`Access token claim ${key} must be a non-empty string`);
  }
  return value;
}

function requireNumber(payload: Record<string, unknown>, key: string): number {
  const value = payload[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`Access token claim ${key} must be a finite number`);
  }
  return value;
}

function parseAudience(value: unknown): string | string[] {
  if (typeof value === 'string' && value.length > 0) return value;
  if (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (audience) => typeof audience === 'string' && audience.length > 0,
    )
  ) {
    return [...value];
  }
  throw new TypeError(
    'Access token claim aud must be a non-empty string or string array',
  );
}

function parsePermissions(value: unknown): Permission[] {
  if (!Array.isArray(value)) {
    throw new TypeError('Access token claim permissions must be an array');
  }

  if (!value.every((permission) => typeof permission === 'string')) {
    throw new TypeError('Access token permissions must contain only strings');
  }

  const unknownPermission = value.find(
    (permission) => !permissionSet.has(permission),
  );
  if (unknownPermission) {
    throw new TypeError(`Unknown permission claim: ${unknownPermission}`);
  }

  return [...new Set(value)] as Permission[];
}

export function parseAccessTokenClaims(payload: unknown): AccessTokenClaims {
  if (!isRecord(payload)) {
    throw new TypeError('Access token payload must be an object');
  }

  return {
    sub: requireString(payload, 'sub'),
    tenantId: requireString(payload, 'tenantId'),
    permissions: parsePermissions(payload.permissions),
    iat: requireNumber(payload, 'iat'),
    exp: requireNumber(payload, 'exp'),
    iss: requireString(payload, 'iss'),
    aud: parseAudience(payload.aud),
  };
}

export function toAuthorizationContext(
  claims: AccessTokenClaims,
): AuthorizationContext {
  return {
    userId: claims.sub,
    tenantId: claims.tenantId,
    permissions: [...claims.permissions],
  };
}

export function can(
  auth: AuthorizationContext,
  permission: Permission,
  options: AuthorizationOptions = {},
): boolean {
  if (!auth.permissions.includes(permission)) return false;
  if (options.tenantId && auth.tenantId !== options.tenantId) return false;
  return true;
}
