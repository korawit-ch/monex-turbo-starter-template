import type { Link } from '@repo/prisma';
import { Button } from '@repo/ui/button';
import Image, { type ImageProps } from 'next/image';

type Props = Omit<ImageProps, 'src'> & {
  srcLight: string;
  srcDark: string;
};

const ThemeImage = (props: Props) => {
  const { srcLight, srcDark, ...rest } = props;

  return (
    <>
      <Image {...rest} src={srcLight} className="imgLight" />
      <Image {...rest} src={srcDark} className="imgDark" />
    </>
  );
};

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

export default async function Home() {
  const links = await getLinks();

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-20 gap-16 max-sm:p-8 max-sm:pb-20">
      <main className="flex flex-col gap-8 row-start-2">
        <ThemeImage
          className="dark:invert"
          srcLight="turborepo-dark.svg"
          srcDark="turborepo-light.svg"
          alt="Turborepo logo"
          width={180}
          height={38}
          priority
        />
        <ol className="font-mono text-sm leading-6 tracking-tight list-inside list-decimal max-sm:text-center">
          <li className="mb-2">
            Get started by editing{' '}
            <code className="bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded font-semibold">
              apps/web/app/page.tsx
            </code>
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <div className="flex gap-4 max-sm:flex-col">
          <a
            className="flex items-center justify-center gap-2 h-12 px-5 rounded-full bg-foreground text-background font-medium text-base transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            href="https://vercel.com/new/clone?demo-description=Learn+to+implement+a+monorepo+with+a+two+Next.js+sites+that+has+installed+three+local+packages.&demo-image=%2F%2Fimages.ctfassets.net%2Fe5382hct74si%2F4K8ZISWAzJ8X1504ca0zmC%2F0b21a1c6246add355e55816278ef54bc%2FBasic.png&demo-title=Monorepo+with+Turborepo&demo-url=https%3A%2F%2Fexamples-basic-web.vercel.sh%2F&from=templates&project-name=Monorepo+with+Turborepo&repository-name=monorepo-turborepo&repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fturborepo%2Ftree%2Fmain%2Fexamples%2Fbasic&root-directory=apps%2Fdocs&skippable-integrations=1&teamSlug=vercel&utm_source=create-turbo"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            href="https://turborepo.com/docs?utm_source"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center h-12 px-5 min-w-[180px] rounded-full border border-black/10 dark:border-white/15 font-medium text-base transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 max-sm:min-w-0"
          >
            Read our docs
          </a>
        </div>

        <Button appName="web" variant="outline">
          Open alert
        </Button>

        <div className="mt-8 w-full">
          <h2 className="text-2xl font-semibold mb-4">
            Database Links (from Prisma)
          </h2>
          {links.length > 0 ? (
            <div className="flex flex-col gap-4 w-full">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="p-4 border border-gray-200 dark:border-white/15 rounded-lg bg-gray-50 dark:bg-white/5 transition-all hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20"
                >
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold m-0">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 no-underline hover:underline"
                      >
                        {link.title}
                      </a>
                    </h3>
                    {link.description && (
                      <p className="m-0 text-gray-500 dark:text-gray-400 text-sm">
                        {link.description}
                      </p>
                    )}
                    <div className="flex gap-4 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
                      <span>ID: {link.id}</span>
                      <span>•</span>
                      <span>URL: {link.url}</span>
                      <span>•</span>
                      <span>
                        Created: {new Date(link.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-md text-sm text-blue-800 dark:text-blue-200">
                ✅ Successfully fetched {links.length} link
                {links.length !== 1 ? 's' : ''} from PostgreSQL database using
                Prisma!
              </div>
            </div>
          ) : (
            <div className="p-6 border border-amber-400 dark:border-amber-500 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200">
              <p className="m-0 mb-2 font-semibold">No links available</p>
              <p className="m-0 text-sm">
                Make sure the NestJS API is running on port 3000 and the
                database is seeded.
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          href="https://vercel.com/templates?search=turborepo&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          href="https://turborepo.com?utm_source=create-turbo"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to turborepo.com →
        </a>
      </footer>
    </div>
  );
}
