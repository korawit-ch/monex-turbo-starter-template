import { linksApi, type LinkResponse } from '@repo/api-contract';
import { serverFetch } from '../lib/fetch/server';

/**
 * Server-side link data access for Server Components and Route Handlers.
 */
export async function getLinks(): Promise<LinkResponse[]> {
  return serverFetch(linksApi.list(), 'link.read');
}

export async function getLink(id: number): Promise<LinkResponse | null> {
  return serverFetch(linksApi.detail(id), 'link.read');
}
