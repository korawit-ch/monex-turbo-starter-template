import type { ApiEndpoint, ApiEndpointWithBody } from './types.js';

/**
 * Public representation of a link on the wire.
 *
 * Dates are strings because JSON responses do not preserve Date instances.
 * This type deliberately does not depend on the Prisma Link model.
 */
export interface LinkResponse {
  id: number;
  url: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLinkRequest {
  title: string;
  url: string;
  description?: string;
}

export interface UpdateLinkRequest {
  title?: string;
  url?: string;
  description?: string;
}

/** Pure link API definitions with no fetch or framework dependency. */
export const linksApi = {
  list: (): ApiEndpoint<LinkResponse[]> => ({
    url: '/links',
    method: 'GET',
  }),

  detail: (id: number): ApiEndpoint<LinkResponse> => ({
    url: `/links/${id}`,
    method: 'GET',
  }),

  create: (
    body: CreateLinkRequest,
  ): ApiEndpointWithBody<CreateLinkRequest, LinkResponse> => ({
    url: '/links',
    method: 'POST',
    body,
  }),

  update: (
    id: number,
    body: UpdateLinkRequest,
  ): ApiEndpointWithBody<UpdateLinkRequest, LinkResponse> => ({
    url: `/links/${id}`,
    method: 'PATCH',
    body,
  }),

  delete: (id: number): ApiEndpoint<LinkResponse> => ({
    url: `/links/${id}`,
    method: 'DELETE',
  }),
};
