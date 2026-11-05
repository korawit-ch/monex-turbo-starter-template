import {
  type GrantCondition,
  type Permission,
  type PermissionGrant,
} from '@repo/authorization';

const tenantCondition: GrantCondition = {
  operator: 'equals',
  subjectField: 'tenantId',
  resourceField: 'tenantId',
};

/**
 * Builds the signed action-grant matrix. Every Link action is tenant-scoped;
 * adding a new permission therefore requires an explicit policy decision here.
 */
export function buildPermissionGrants(
  permissions: Permission[],
): PermissionGrant[] {
  return permissions.map((permission) => ({
    permission,
    conditions: conditionsFor(permission),
  }));
}

function conditionsFor(permission: Permission): GrantCondition[] {
  if (permission.startsWith('link.')) return [{ ...tenantCondition }];
  throw new Error(`No grant conditions defined for ${permission}`);
}
