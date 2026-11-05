import type { LinkResponse } from '@repo/api-contract';
import { can, type AuthorizationContext } from '@repo/authorization';
import type { Link as PrismaLink } from '@repo/prisma';

/** Converts the persistence model into the JSON-safe public API contract. */
export function toLinkResponse(
  link: PrismaLink,
  auth: AuthorizationContext,
): LinkResponse {
  const resource = { tenantId: link.tenantId };
  const mayUpdate = can(auth, 'link.update', resource);
  const mayDelete = can(auth, 'link.delete', resource);
  return {
    id: link.id,
    url: link.url,
    title: link.title,
    description: link.description,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
    capabilities: {
      update: {
        allowed: mayUpdate,
        ...(!mayUpdate
          ? { reason: 'Missing update grant or tenant scope' }
          : {}),
      },
      delete: {
        allowed: mayDelete,
        ...(!mayDelete
          ? { reason: 'Missing delete grant or tenant scope' }
          : {}),
      },
    },
  };
}
