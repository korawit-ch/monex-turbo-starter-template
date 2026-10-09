import { linksApi, type LinkResponse } from '@repo/api-contract';
import { serverFetch } from '../lib/fetch/server';

/**
 * Server-side service for fetching links
 * Use in Server Components and Route Handlers
 */
export async function getLinks(): Promise<LinkResponse[]> {
  return serverFetch(linksApi.list(), 'link.read');
}

export async function getLink(id: number): Promise<LinkResponse | null> {
  return serverFetch(linksApi.detail(id), 'link.read');
}
