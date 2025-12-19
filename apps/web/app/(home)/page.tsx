export const dynamic = 'force-dynamic';

import Image from 'next/image';

import { getLinks } from '../../services/links.service';
import { FeatureBadge } from '../../components/feature-badge';
import { LinksClient } from '../../components/links-client';
import { Button } from '@repo/ui/button';

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
          className="mb-8"
          priority
        />

        {/* Intro */}
        <h1 className="text-3xl font-bold mb-4">Turborepo + Prisma Demo</h1>
        <p className="text-primary-500 mb-8">
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
                  className="p-5 border border-surface rounded-xl hover:border-border transition-colors"
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary-500 hover:underline"
                  >
                    {link.title}
                  </a>
                  {link.description && (
                    <p className="text-sm text-foreground/70 mt-1">
                      {link.description}
                    </p>
                  )}
                  <p className="text-xs text-foreground/50 mt-2">
                    ID: {link.id} •{' '}
                    {new Date(link.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-foreground/70">
              No links. Start the API on port 3000.
            </p>
          )}

          {links.length > 0 && (
            <p className="text-sm text-success-400 mt-4">
              ✓ Server-side fetch via serverFetch()
            </p>
          )}
        </section>

        {/* Button Variants Demo */}
        <section className="mt-8 pt-8 border-t border-surface">
          <h2 className="text-xl font-semibold mb-4">Button Variants</h2>

          <div className="space-y-6">
            {/* Primary Variants */}
            <div>
              <h3 className="text-lg font-medium mb-3">Primary</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">กรอกผลคะแนน</Button>
                <Button variant="primary" color={'yellow' as const}>
                  กรอกผลคะแนน
                </Button>
                <Button variant="primary" color={'red' as const}>
                  กรอกผลคะแนน
                </Button>
                <Button variant="primary" disabled>
                  กรอกผลคะแนน
                </Button>
              </div>
            </div>

            {/* Primary with Icon */}
            <div>
              <h3 className="text-lg font-medium mb-3">Primary with Icon</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant={'primary-icon' as const} icon="👤">
                  กรอกผลคะแนน
                </Button>
                <Button
                  variant={'primary-icon' as const}
                  color={'yellow' as const}
                  icon="👤"
                >
                  กรอกผลคะแนน
                </Button>
                <Button
                  variant={'primary-icon' as const}
                  color={'red' as const}
                  icon="👤"
                >
                  กรอกผลคะแนน
                </Button>
              </div>
            </div>

            {/* Secondary Variants */}
            <div>
              <h3 className="text-lg font-medium mb-3">Secondary</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary">กรอกผลคะแนน</Button>
                <Button variant="secondary" color={'yellow' as const}>
                  กรอกผลคะแนน
                </Button>
                <Button variant="secondary" color={'red' as const}>
                  กรอกผลคะแนน
                </Button>
                <Button variant="secondary" disabled>
                  กรอกผลคะแนน
                </Button>
              </div>
            </div>

            {/* Linked Variants */}
            <div>
              <h3 className="text-lg font-medium mb-3">Linked</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant={'linked' as const}>กรอกผลคะแนน</Button>
                <Button variant={'linked' as const} color={'yellow' as const}>
                  กรอกผลคะแนน
                </Button>
                <Button variant={'linked' as const} color={'red' as const}>
                  กรอกผลคะแนน
                </Button>
                <Button variant="linked" disabled>
                  กรอกผลคะแนน
                </Button>
              </div>
            </div>

            {/* Text Link Variants */}
            <div>
              <h3 className="text-lg font-medium mb-3">Text Link</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant={'textlink' as const}>กรอกผลคะแนน</Button>
                <Button variant={'textlink' as const} color={'yellow' as const}>
                  กรอกผลคะแนน
                </Button>
                <Button variant={'textlink' as const} color={'red' as const}>
                  กรอกผลคะแนน
                </Button>
                <Button variant="textlink" disabled>
                  กรอกผลคะแนน
                </Button>
              </div>
            </div>

            {/* Size Variants */}
            <div>
              <h3 className="text-lg font-medium mb-3">Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size={'large' as const}>
                  กรอกผลคะแนน
                </Button>
                <Button variant="primary" size={'small' as const}>
                  กรอกผลคะแนน
                </Button>
                <Button variant="secondary" size={'large' as const}>
                  กรอกผลคะแนน
                </Button>
                <Button variant="secondary" size={'small' as const}>
                  กรอกผลคะแนน
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Client-side fetch demo */}
        <section className="mt-8 pt-8 border-t border-surface">
          <h2 className="text-xl font-semibold mb-4">Client-Side Demo</h2>
          <LinksClient />
        </section>
      </main>

      <footer className="w-full max-w-3xl mt-16 pt-8 border-t border-surface text-sm text-foreground/50 text-center">
        Web • Port 3001 • @repo/design-system
      </footer>
    </div>
  );
}
