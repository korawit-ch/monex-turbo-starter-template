export const PERMISSIONS = [
  'link.read',
  'link.create',
  'link.update',
  'link.delete',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type SubjectAttributes = { userId: string; tenantId: string };
export type ResourceAttributes = { tenantId: string };
export type GrantCondition = {
  operator: 'equals';
  subjectField: 'tenantId';
  resourceField: 'tenantId';
};
export type PermissionGrant = {
  permission: Permission;
  conditions: GrantCondition[];
};
export type AuthorizationContext = {
  subject: SubjectAttributes;
  grants: PermissionGrant[];
};
export type ClientAuthorizationContext = {
  userId: string;
  permissions: Permission[];
};
export type ResourceScope = Partial<Record<keyof ResourceAttributes, string>>;
export type AccessTokenClaims = {
  sub: string;
  attributes: Omit<SubjectAttributes, 'userId'>;
  grants: PermissionGrant[];
  iat: number;
  exp: number;
  iss: string;
  aud: string | string[];
};

const permissionSet = new Set<string>(PERMISSIONS);
const subjectFields = ['tenantId'] as const;
const resourceFields = ['tenantId'] as const;

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

function isPermission(value: unknown): value is Permission {
  return typeof value === 'string' && permissionSet.has(value);
}

function parseCondition(value: unknown): GrantCondition {
  if (!isRecord(value)) {
    throw new TypeError('Permission grant condition must be an object');
  }
  if (value.operator !== 'equals') {
    throw new TypeError(
      `Unknown grant condition operator: ${String(value.operator)}`,
    );
  }
  if (!subjectFields.includes(value.subjectField as 'tenantId')) {
    throw new TypeError(
      `Unknown grant condition subject field: ${String(value.subjectField)}`,
    );
  }
  if (!resourceFields.includes(value.resourceField as 'tenantId')) {
    throw new TypeError(
      `Unknown grant condition resource field: ${String(value.resourceField)}`,
    );
  }
  return {
    operator: 'equals',
    subjectField: 'tenantId',
    resourceField: 'tenantId',
  };
}

function parseGrants(value: unknown): PermissionGrant[] {
  if (!Array.isArray(value)) {
    throw new TypeError('Access token claim grants must be an array');
  }

  const grants = value.map((candidate) => {
    if (!isRecord(candidate)) {
      throw new TypeError('Permission grant must be an object');
    }
    if (!isPermission(candidate.permission)) {
      throw new TypeError(
        `Unknown permission claim: ${String(candidate.permission)}`,
      );
    }
    if (!Array.isArray(candidate.conditions)) {
      throw new TypeError('Permission grant conditions must be an array');
    }
    if (candidate.conditions.length === 0) {
      throw new TypeError('Permission grant conditions must not be empty');
    }
    const conditions = candidate.conditions.map(parseCondition);
    const resourceFieldCount = new Set(
      conditions.map((condition) => condition.resourceField),
    ).size;
    if (resourceFieldCount !== conditions.length) {
      throw new TypeError(
        'Permission grant contains duplicate resource fields',
      );
    }
    return { permission: candidate.permission, conditions };
  });

  if (new Set(grants.map((grant) => grant.permission)).size !== grants.length) {
    throw new TypeError('Access token contains duplicate permission grants');
  }
  return grants;
}

export function parseAccessTokenClaims(payload: unknown): AccessTokenClaims {
  if (!isRecord(payload)) {
    throw new TypeError('Access token payload must be an object');
  }
  if (!isRecord(payload.attributes)) {
    throw new TypeError('Access token claim attributes must be an object');
  }

  return {
    sub: requireString(payload, 'sub'),
    attributes: { tenantId: requireString(payload.attributes, 'tenantId') },
    grants: parseGrants(payload.grants),
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
    subject: { userId: claims.sub, tenantId: claims.attributes.tenantId },
    grants: claims.grants.map((grant) => ({
      permission: grant.permission,
      conditions: grant.conditions.map((condition) => ({ ...condition })),
    })),
  };
}

export function toClientAuthorizationContext(
  auth: AuthorizationContext,
): ClientAuthorizationContext {
  return {
    userId: auth.subject.userId,
    permissions: auth.grants.map((grant) => grant.permission),
  };
}

export function hasPermission(
  auth: AuthorizationContext,
  permission: Permission,
): boolean {
  return auth.grants.some((grant) => grant.permission === permission);
}

export function can(
  auth: AuthorizationContext,
  permission: Permission,
  resource: Partial<ResourceAttributes>,
): boolean {
  const grant = auth.grants.find(
    (candidate) => candidate.permission === permission,
  );
  if (!grant) return false;
  return grant.conditions.every((condition) => {
    const resourceValue = resource[condition.resourceField];
    return (
      typeof resourceValue === 'string' &&
      auth.subject[condition.subjectField] === resourceValue
    );
  });
}

export function resourceScope(
  auth: AuthorizationContext,
  permission: Permission,
): ResourceScope | null {
  const grant = auth.grants.find(
    (candidate) => candidate.permission === permission,
  );
  if (!grant) return null;
  return Object.fromEntries(
    grant.conditions.map((condition) => [
      condition.resourceField,
      auth.subject[condition.subjectField],
    ]),
  ) as ResourceScope;
}
