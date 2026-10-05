'use client';

import { Button } from '@repo/ui/button';
import { useLinksQuery } from '../queries/links';

/**
 * Client-side links component using TanStack Query
 * Demonstrates clientFetch pattern with automatic caching & refetching
 */
export function LinksClient() {
  const {
    data: links,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLinksQuery();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Client-Side Fetch (TanStack Query)</h3>
          <Button variant="primary" onClick={refetch}>
            Refetch
          </Button>
        </div>
        <div className="p-5 border border-surface rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-foreground/70">Loading links...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 border border-error-400/50 rounded-xl">
        <p className="text-error-400">Error loading links</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Client-Side Fetch (TanStack Query)</h3>
        <Button variant="primary" onClick={refetch} disabled={isFetching}>
          {isFetching ? 'Refetching...' : 'Refetch'}
        </Button>
      </div>

      {isFetching && !isLoading && (
        <div className="p-3 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-foreground/70">Refetching links...</p>
          </div>
        </div>
      )}

      {links && links.length > 0 ? (
        <ul className="space-y-2">
          {links.map((link) => (
            <li
              key={link.id}
              className="p-3 border border-dashed border-primary-500/30 rounded-lg text-sm"
            >
              <span className="font-medium">{link.title}</span>
              <span className="text-foreground/50 ml-2">#{link.id}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-foreground/70">No links found</p>
      )}

      <p className="text-xs text-success-800/70">
        ✓ Fetched client-side with useLinksQuery()
      </p>
    </div>
  );
}
