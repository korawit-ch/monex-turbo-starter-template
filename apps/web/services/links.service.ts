import { linksApi, type LinkResponse } from '@repo/api-contract';
import { serverFetch } from '../lib/fetch/server';

/**
 * Server-side service for fetching links
 * Use in Server Components and Route Handlers
 */
export async function getLinks(): Promise<LinkResponse[]> {
  try {
    return await serverFetch(linksApi.list());
  } catch (error) {
    console.error('Error fetching links:', error);
    return [];
  }
}

export async function getLink(id: number): Promise<LinkResponse | null> {
  try {
    return await serverFetch(linksApi.detail(id));
  } catch (error) {
    console.error(`Error fetching link ${id}:`, error);
    return null;
  }
}
