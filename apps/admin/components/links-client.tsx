'use client';

import { useLinksQuery, useDeleteLinkMutation } from '../queries/links';

/**
 * Client-side links component with mutations
 * Demonstrates clientFetch pattern with TanStack Query mutations
 */
export function LinksClient() {
  const { data: links, isLoading, error } = useLinksQuery();
  const deleteMutation = useDeleteLinkMutation();

  if (isLoading) {
    return (
      <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg">
        <p className="text-red-500">Error loading links</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-800">
        <h3 className="font-medium text-blue-700 dark:text-blue-300">
          Client-Side (TanStack Query)
        </h3>
      </div>

      {links && links.length > 0 ? (
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {links.map((link) => (
            <li
              key={link.id}
              className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <div>
                <span className="font-medium">{link.title}</span>
                <span className="text-gray-400 text-sm ml-2">#{link.id}</span>
              </div>
              <button
                onClick={() => deleteMutation.mutate(link.id)}
                disabled={deleteMutation.isPending}
                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
              >
                {deleteMutation.isPending ? '...' : 'Delete'}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-4 text-gray-500">No links</p>
      )}

      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 text-xs text-blue-500">
        ✓ useLinksQuery() + useDeleteLinkMutation()
      </div>
    </div>
  );
}
