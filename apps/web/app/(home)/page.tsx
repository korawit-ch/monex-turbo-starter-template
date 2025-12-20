export const dynamic = 'force-dynamic';

import Image from 'next/image';

import { getLinks } from '../../services/links.service';
import { FeatureBadge } from '../../components/feature-badge';
import { LinksClient } from '../../components/links-client';
import { Button } from '@repo/ui/button';
import {
  AddFile,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Clear,
  Download,
  Edit,
  Error,
  FullArrowLeft,
  FullArrowRight,
  HamburgerMenu,
  Loading,
  MapPin,
  PhoneCall,
  Search,
  Send,
  Trash,
} from '@repo/icons';

export default async function Home() {
  const links = await getLinks();

  const icons = [
    { name: 'AddFile', component: AddFile },
    { name: 'ArrowLeft', component: ArrowLeft },
    { name: 'ArrowRight', component: ArrowRight },
    { name: 'Calendar', component: Calendar },
    { name: 'Check', component: Check },
    { name: 'Clear', component: Clear },
    { name: 'Download', component: Download },
    { name: 'Edit', component: Edit },
    { name: 'Error', component: Error },
    { name: 'FullArrowLeft', component: FullArrowLeft },
    { name: 'FullArrowRight', component: FullArrowRight },
    { name: 'HamburgerMenu', component: HamburgerMenu },
    { name: 'MapPin', component: MapPin },
    { name: 'PhoneCall', component: PhoneCall },
    { name: 'Search', component: Search },
    { name: 'Send', component: Send },
    { name: 'Trash', component: Trash },
  ];

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

        {/* Button Demo */}
        <section className="mt-8 pt-8 border-t border-surface">
          <h2 className="text-xl font-semibold mb-4">Button</h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => alert('Clicked!')}>Click me</Button>
            <Button disabled>Disabled</Button>
            <Button className="bg-warning-500 hover:bg-warning-600">
              Custom Style
            </Button>
          </div>
        </section>

        {/* Icon Showcase */}
        <section className="mt-8 pt-8 border-t border-surface">
          <h2 className="text-xl font-semibold mb-4">Icon Showcase</h2>
          <p className="text-sm text-foreground/70 mb-6">
            All available icons from @repo/icons package
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {icons.map(({ name, component: Icon }) => (
              <div
                key={name}
                className="flex flex-col items-center p-4 rounded-lg transition-colors"
              >
                <Icon className="h-5 text-primary-600 mb-2" />
                <span className="text-desktop-caption text-center">{name}</span>
              </div>
            ))}
            <div className="flex flex-col items-center p-4 rounded-lg transition-colors">
              <Loading className="h-5 text-primary-600 mb-2 animate-spin" />
              <span className="text-desktop-caption text-center">Loading</span>
            </div>
          </div>
        </section>

        {/* Data */}
        <section className="mt-8 pt-8 border-t border-surface">
          <h2 className="text-xl font-semibold mb-4">
            Server-Side Demo: Fetched Links ({links.length})
          </h2>

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
            <p className="text-sm text-success-800/70 mt-4">
              ✓ Server-side fetch via serverFetch()
            </p>
          )}
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
