import type { LinkResponse } from '@repo/api-contract';
import type { Link as PrismaLink } from '@repo/prisma';

/** Converts the persistence model into the JSON-safe public API contract. */
export function toLinkResponse(link: PrismaLink): LinkResponse {
  return {
    id: link.id,
    url: link.url,
    title: link.title,
    description: link.description,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
  };
}
