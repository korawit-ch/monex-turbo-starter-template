'use client';

import { useLinksQuery } from '../queries/links';

/**
 * Client-side links component using TanStack Query
 * Demonstrates clientFetch pattern with automatic caching & refetching
 */
export function LinksClient() {
  const { data: links, isLoading, error, refetch } = useLinksQuery();

  if (isLoading) {
    return (
      <div className="p-5 border border-gray-200 dark:border-gray-800 rounded-xl">
        <p className="text-gray-500">Loading links...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 border border-red-200 dark:border-red-800 rounded-xl">
        <p className="text-red-500">Error loading links</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Client-Side Fetch (TanStack Query)</h3>
        <button
          onClick={() => refetch()}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refetch
        </button>
      </div>

      {links && links.length > 0 ? (
        <ul className="space-y-2">
          {links.map((link) => (
            <li
              key={link.id}
              className="p-3 border border-dashed border-blue-300 dark:border-blue-700 rounded-lg text-sm"
            >
              <span className="font-medium">{link.title}</span>
              <span className="text-gray-400 ml-2">#{link.id}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No links found</p>
      )}

      <p className="text-xs text-blue-500">
        ✓ Fetched client-side with useLinksQuery()
      </p>
    </div>
  );
}
