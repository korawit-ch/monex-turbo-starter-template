import { getLinks } from '../../services/links.service';
import { StatusIndicator } from '../../components/status-indicator';

export default async function AdminDashboard() {
  const links = await getLinks();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-500">Manage links from database</p>
          </div>
          <div className="flex gap-2">
            <StatusIndicator status="online" label="API" />
            <StatusIndicator status="online" label="DB" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-5 border border-gray-200 dark:border-gray-800 rounded-xl">
            <p className="text-2xl font-bold text-blue-600">{links.length}</p>
            <p className="text-sm text-gray-500">Links</p>
          </div>
          <div className="p-5 border border-gray-200 dark:border-gray-800 rounded-xl">
            <p className="text-2xl font-bold text-green-600">Online</p>
            <p className="text-sm text-gray-500">Database</p>
          </div>
          <div className="p-5 border border-gray-200 dark:border-gray-800 rounded-xl">
            <p className="text-sm font-bold text-purple-600">
              @repo/design-system
            </p>
            <p className="text-sm text-gray-500">Shared Package</p>
          </div>
        </div>

        {/* Table */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-medium">Links</h2>
          </div>

          {links.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-200 dark:border-gray-800">
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">Title</th>
                  <th className="px-5 py-4">URL</th>
                  <th className="px-5 py-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {links.map((link) => (
                  <tr
                    key={link.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <td className="px-5 py-4 text-gray-500">{link.id}</td>
                    <td className="px-5 py-4 font-medium">{link.title}</td>
                    <td className="px-5 py-4">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {link.url}
                      </a>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-8 text-center text-gray-500">
              No links. Start the API on port 3000.
            </p>
          )}
        </div>

        {links.length > 0 && (
          <p className="text-sm text-green-600 mt-4">
            ✓ Fetched from PostgreSQL via Prisma
          </p>
        )}
      </main>

      <footer className="w-full max-w-4xl mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-400 text-center">
        Admin • Port 3002 • @repo/design-system
      </footer>
    </div>
  );
}
