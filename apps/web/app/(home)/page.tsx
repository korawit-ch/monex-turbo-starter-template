import { Button } from '@repo/ui/button';
import Image from 'next/image';

import { getLinks } from '../../services/links.service';
import { FeatureBadge } from '../../components/feature-badge';

export default async function Home() {
  const links = await getLinks();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="w-full max-w-3xl">
        {/* Logo */}
        <Image
          src="/turborepo-dark.svg"
          alt="Turborepo"
          width={160}
          height={34}
          className="mb-8 dark:invert"
          priority
        />

        {/* Intro */}
        <h1 className="text-3xl font-bold mb-4">Turborepo + Prisma Demo</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Fetching data from PostgreSQL via NestJS API and Prisma ORM.
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-8">
          <FeatureBadge label="Next.js 16" />
          <FeatureBadge label="Prisma 7" />
          <FeatureBadge label="Local Component" highlight />
        </div>

        {/* Data */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Links ({links.length})</h2>

          {links.length > 0 ? (
            <ul className="space-y-3">
              {links.map((link) => (
                <li
                  key={link.id}
                  className="p-5 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {link.title}
                  </a>
                  {link.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {link.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    ID: {link.id} •{' '}
                    {new Date(link.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">
              No links. Start the API on port 3000.
            </p>
          )}

          {links.length > 0 && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-4">
              ✓ Fetched from PostgreSQL via Prisma
            </p>
          )}
        </section>
      </main>

      <footer className="w-full max-w-3xl mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-400 text-center">
        Web • Port 3001 • @repo/design-system
      </footer>
    </div>
  );
}
