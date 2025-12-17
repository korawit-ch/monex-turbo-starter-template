# cric-monex-frontend

> Frontend monorepo with Next.js apps and shared design system

## What's inside?

```shell
.
├── apps
│   ├── admin   # Next.js 16 admin dashboard   → http://localhost:3002
│   └── web     # Next.js 16 frontend          → http://localhost:3001
└── packages
    ├── @repo/api-client          # API definitions & types
    ├── @repo/design-system       # Tailwind config, colors, styles
    ├── @repo/eslint-config       # ESLint configurations
    ├── @repo/typescript-config   # TypeScript configurations
    └── @repo/ui                  # React component library
```

### Tech Stack

**Runtime & Apps**

| Component                                               | Version | Port |
| ------------------------------------------------------- | ------- | ---- |
| **Node.js**                                             | >=22.12 | -    |
| [**Next.js**](https://nextjs.org/) Web (`apps/web`)     | ^16.0.7 | 3001 |
| [**Next.js**](https://nextjs.org/) Admin (`apps/admin`) | ^16.0.7 | 3002 |

**Core Libraries**

| Library                                           | Version |
| ------------------------------------------------- | ------- |
| [**React**](https://react.dev/)                   | ^19.1.0 |
| [**Tailwind CSS**](https://tailwindcss.com/)      | ^4.1.11 |
| [**TanStack Query**](https://tanstack.com/query)  | ^5.80.7 |
| [**TypeScript**](https://www.typescriptlang.org/) | 5.5.4+  |

**Tooling**

| Tool                                           | Purpose         |
| ---------------------------------------------- | --------------- |
| [**Turborepo**](https://turbo.build/repo)      | Monorepo build  |
| [**ESLint**](https://eslint.org/)              | Code linting    |
| [**Prettier**](https://prettier.io)            | Code formatting |
| [**Husky**](https://typicode.github.io/husky/) | Git hooks       |
| [**Commitlint**](https://commitlint.js.org/)   | Commit messages |

## Getting Started

### Prerequisites

- Node.js >= 22.12
- Backend API running (or set `NEXT_PUBLIC_API_URL`)

### Setup

```bash
npm install
# Edit .env with your API URL
npm run dev
```

Opens: Web (3001), Admin (3002)

### Environment Variables

```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### Commands

| Command          | Description               |
| ---------------- | ------------------------- |
| `npm run dev`    | Start all dev servers     |
| `npm run build`  | Build all apps & packages |
| `npm run lint`   | Lint all packages         |
| `npm run format` | Format all files          |

## Data Fetching Architecture

Separates **API definitions** from **fetch logic**:

```
@repo/api-client (shared)    apps/web or apps/admin (per-app)
┌─────────────────────┐      ┌─────────────────────────────────┐
│ linksApi.list()     │      │ lib/fetch/server.ts (SSR)       │
│ linksApi.detail(id) │ ──▶  │ lib/fetch/client.ts (CSR)       │
│ linksApi.create()   │      │ queries/links.ts (TanStack)     │
└─────────────────────┘      └─────────────────────────────────┘
```

**Server Components** use `serverFetch()`:

```typescript
import { linksApi } from '@repo/api-client';
import { serverFetch } from '@/lib/fetch/server';

export default async function Page() {
  const links = await serverFetch(linksApi.list());
  return <LinksList links={links} />;
}
```

**Client Components** use TanStack Query:

```typescript
'use client';
import { useLinksQuery } from '@/queries/links';

export function LinksClient() {
  const { data: links, isLoading } = useLinksQuery();
  if (isLoading) return <Loading />;
  return <LinksList links={links} />;
}
```

## Shared Packages

- **@repo/api-client**: API endpoint definitions (no fetch, no React)
- **@repo/design-system**: Tailwind config, colors, global CSS
- **@repo/ui**: React components (Button, Card, etc.)

## Git Hooks & CI

**Pre-commit:** ESLint + Prettier on staged files

**Commit format:** `type(scope): message`

- Types: `build`, `chore`, `docs`, `feat`, `fix`, `refactor`, `test`, `release`

**CI:** Runs lint, format check, type check on all pushes/PRs
