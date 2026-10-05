import { linksApi } from '@repo/api-client';
import { serverFetch } from '../lib/fetch/server';

/**
 * Server-side service for fetching links
 * Use in Server Components and Route Handlers
 */
export async function getLinks() {
  try {
    return await serverFetch(linksApi.list());
  } catch (error) {
    console.error('Error fetching links:', error);
    return [];
  }
}

export async function getLink(id: number) {
  try {
    return await serverFetch(linksApi.detail(id));
  } catch (error) {
    console.error(`Error fetching link ${id}:`, error);
    return null;
  }
}
