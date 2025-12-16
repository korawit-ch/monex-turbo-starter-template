import type { Link } from '@repo/prisma';
import { Button } from '@repo/ui/button';
import { Card } from '@repo/ui/card';

async function getLinks(): Promise<Link[]> {
  try {
    const res = await fetch('http://localhost:3000/links', {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch links');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching links:', error);
    return [];
  }
}

export default async function AdminDashboard() {
  const links = await getLinks();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your links and content using the shared design system
          </p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-surface rounded-xl border border-border">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Total Links
            </h3>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {links.length}
            </p>
          </div>
          <div className="p-6 bg-surface rounded-xl border border-border">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Database
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              Connected
            </p>
          </div>
          <div className="p-6 bg-surface rounded-xl border border-border">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Design System
            </h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              @repo/design-system
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Button appName="admin" variant="primary">
            Add New Link
          </Button>
          <Button appName="admin" variant="secondary">
            Export Data
          </Button>
          <Button appName="admin" variant="outline">
            Settings
          </Button>
        </div>

        {/* Links Table */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">
              Links Management
            </h2>
          </div>
          
          {links.length > 0 ? (
            <div className="divide-y divide-border">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">
                      {link.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {link.url}
                    </p>
                    {link.description && (
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        {link.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      ID: {link.id}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </span>
                    <button className="px-3 py-1 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors">
                      Edit
                    </button>
                    <button className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No links found. Make sure the API is running on port 3000.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-400 dark:text-gray-500">
          <p>
            Admin Dashboard • Using shared @repo/design-system • Port 3002
          </p>
        </footer>
      </div>
    </div>
  );
}
