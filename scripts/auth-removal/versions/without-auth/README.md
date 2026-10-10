# monex-turbo-starter-template

A full-stack monorepo featuring NestJS APIs, Next.js frontends, and Prisma ORM with PostgreSQL.

## What's inside?

This Turborepo includes the following packages & apps:

### Apps and Packages

```shell
.
├── apps
│   ├── web                # Next.js 16 Frontend         → http://localhost:3000
│   ├── api                # NestJS 11 API              → http://localhost:3001
│   └── db                        # PostgreSQL 16 (Docker Compose)    → localhost:5433
└── packages
    ├── @repo/api-contract        # Shared API request/response contracts
    ├── @repo/assets              # Shared raw assets and SVG icon components
    ├── @repo/design-system       # Tailwind 4 config, colors, global styles
    ├── @repo/eslint-config       # ESLint configurations (includes Prettier)
    ├── @repo/jest-config         # Jest configurations
    ├── @repo/prisma              # Server-only Prisma schema, client, and DB types
    ├── @repo/typescript-config   # TypeScript configurations
    └── @repo/ui                  # React 19 component library with Tailwind
```

Applications and runtime packages use [TypeScript](https://www.typescriptlang.org/); database infrastructure, styles, and tooling also use YAML, CSS, JavaScript, and shell scripts.

## Engineering conventions

The [Engineering Handbook](docs/engineering/README.md) is the entry point for company-wide conventions. It covers:

- [architecture, folder structure, and module ownership](docs/engineering/architecture-and-modules.md);
- [frontend components and data access](docs/engineering/frontend.md);
- [Prisma, NestJS, Swagger, and shared API contracts](docs/engineering/backend-and-api-contracts.md);
- [file naming, coding style, linting, formatting, and tests](docs/engineering/coding-standards.md);
- [branches, commits, pull requests, proof of work, releases, and hotfixes](docs/engineering/delivery-workflow.md);
- [scripts, localization, authentication removal, and starter finalization](docs/engineering/scripts-and-template-customization.md).

Start there before introducing a new folder, package, shared abstraction, or delivery process.

### Tech Stack & Versions

**Runtime & Apps**

| Component                                                 | Version         | Port |
| --------------------------------------------------------- | --------------- | ---- |
| **Node.js**                                               | >=22.12         | -    |
| [**Next.js Web**](https://nextjs.org/) (`apps/web`)       | ^16.0.7         | 3000 |
| [**NestJS API**](https://nestjs.com/) (`apps/api`)        | ^11.0.0         | 3001 |
| [**PostgreSQL**](https://www.postgresql.org/) (`apps/db`) | 16-alpine       | 5433 |
| **Swagger** (`/api`)                                      | @nestjs/swagger | 3001 |

**Core Libraries**

| Library                                           | Version |
| ------------------------------------------------- | ------- |
| [**React**](https://react.dev/)                   | ^19.1.0 |
| [**Prisma ORM**](https://www.prisma.io/)          | ^7.1.0  |
| [**Tailwind CSS**](https://tailwindcss.com/)      | ^4.1.5  |
| [**TanStack Query**](https://tanstack.com/query)  | ^5.80.7 |
| [**TypeScript**](https://www.typescriptlang.org/) | 5.5.4+  |
| [**SVGR**](https://react-svgr.com/)               | ^8.1.0  |

**Tooling**

| Tool                                                   | Purpose            |
| ------------------------------------------------------ | ------------------ |
| [**Turborepo**](https://turbo.build/repo)              | Monorepo build     |
| [**ESLint**](https://eslint.org/)                      | Code linting       |
| [**Prettier**](https://prettier.io)                    | Code formatting    |
| [**Jest**](https://jestjs.io/)                         | Testing            |
| [**Docker Compose**](https://docs.docker.com/compose/) | Database container |
| [**Husky**](https://typicode.github.io/husky/)         | Git hooks          |
| [**Commitlint**](https://commitlint.js.org/)           | Commit messages    |

## Getting Started

### Prerequisites

- Node.js >= 22.12 (required for Prisma 7)
- Docker and Docker Compose (for PostgreSQL database)
- npm (the root manifest declares npm 10.2.3; use the root npm lockfile)

### Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

   This will automatically:
   - Create `.env` from `.env.example` if it doesn't exist
   - Set up the environment configuration

2. **Run the guided project setup**:

   ```bash
   npm run setup
   ```

   The first run asks whether the project needs built-in authentication, shared or API-owned Prisma, shared or web-owned assets, and how many additional frontend and backend apps to create. It collects every new app name before previewing the copies. The counts exclude the starter's existing `apps/web` and `apps/api`. Every source-changing action is previewed and separately confirmed. It then creates/distributes the root environment and records ignored local setup state. The Link example is deliberately kept until the team chooses cleanup on a later run.

   Use `npm run setup -- --dry-run` to preview the questionnaire without changing anything, or `npm run setup -- --status` to inspect the detected architecture.

3. **Start PostgreSQL database**:

   ```bash
   docker-compose --env-file .env -f apps/db/docker-compose.yml up -d --wait postgres
   ```

4. **Verify database connection configuration**:

   The `.env` file is automatically created from `.env.example` during `npm install`. If you need to update it, edit the root `.env` file:

   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/monex-turbo-starter-template-db?schema=public"
   ```

   **Note**: When you run `npm run dev`, the root `.env` file is automatically distributed to all apps and packages (except config packages) via symlinks. This makes the root configuration available to those workspaces; API bootstrap and the seed runtime still need explicit process environment loading.

5. **Generate Prisma client and push schema**:

   ```bash
   npm run db:generate
   npm run db:push
   # Optional seed, with root environment loaded explicitly:
   npm run db:seed
   ```

6. **Build shared packages and start development servers**:

   ```bash
   npx turbo run build --filter='./packages/*'
   npm run dev
   ```

   This will:
   - Automatically distribute the root `.env` file to all apps and packages
   - Start all development servers:
     - Web on <http://localhost:3000>
     - API on <http://localhost:3001>

### Commands

This `Turborepo` includes useful commands for all apps and packages.

#### Database Commands

```bash
# Start PostgreSQL database
npm run db:start
# or
npm run db:up

# Stop PostgreSQL database
npm run db:stop
# or
npm run db:down

# Generate Prisma client
npm run db:generate

# Validate Prisma schema without changing the database
npm run db:validate

# Push schema to database
npm run db:push

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

`db:push` changes the selected database schema; `db:migrate` creates/applies development migrations, not production deployments. No migration history is checked in. The seed can insert duplicates on reruns because URLs are not unique. `db:seed` needs `DATABASE_URL` exported; the setup example above loads it explicitly.

`@repo/prisma` centralizes server-side schema/client ownership for this monorepo; it is not an API contract and frontend code must not consume it. If the API needs to become independently owned, run `npm run prisma:localize:api` for a dry run and `npm run prisma:localize:api -- --apply` to move Prisma into `apps/api`. The migration is guarded against other workspace consumers and does not modify database data.

The `db:start` helper prints credentials and can wait indefinitely; prefer the direct Compose startup shown in setup. Compose shortcuts use the linked `apps/db/.env`. See [database operations](apps/db/README.md).

#### Build

```bash
# Will build all the app & packages with the supported `build` script.
npm run build

# ℹ️ If you plan to only build apps individually,
# Please make sure you've built the packages first.
```

#### Develop

```bash
# Will run the development server for all the app & packages with the supported `dev` script.
# This automatically distributes the root .env file to all apps and packages before starting.
npm run dev
```

**Note**: The `predev` script automatically creates symlinks from the root `.env` to each app and package (excluding config packages like `eslint-config`, `jest-config`, `typescript-config`).

#### Test

```bash
# Will launch a test suites for all the app & packages with the supported `test` script.
npm run test

# You can launch e2e testes with `test:e2e`
npm run test:e2e

# See `@repo/jest-config` to customize the behavior.
```

Build shared packages before tests. API unit tests use the shared Nest Jest preset; web uses its own Jest configuration. API e2e tests need a reachable test database and do not start it automatically.

#### Type Check

```bash
npx turbo run check-types
```

This runs scripts in web, UI, and assets. API and other TypeScript packages are checked through builds.

#### Lint

```bash
# Will lint all the app & packages with the supported `lint` script.
# See `@repo/eslint-config` to customize the behavior.
npm run lint
```

#### Format

```bash
# Formats `.ts`, `.tsx`, `.json`, and `.md` files across the repository.
# See `@repo/eslint-config/prettier-base.js` to customize the behavior.
npm run format
```

### Git Hooks & CI

#### Pre-commit

Automatically runs on every commit via Husky:

- **ESLint** + **Prettier** on staged `.ts/.tsx/.mjs` files
- **Prettier** on staged `.json/.md/.css/.yml/.yaml/.js` files
- **Turbo type checks** after lint-staged

#### Commit Messages

Uses [Conventional Commits](https://www.conventionalcommits.org/) format with required scope:

```bash
# Format: type(scope): message
feat(web): add user authentication
fix(api): resolve database connection issue
docs(readme): update installation steps
refactor(prisma): optimize query performance
```

**Allowed types:** `build`, `chore`, `docs`, `feat`, `fix`, `refactor`, `test`, `release`

#### Branch and release workflow

Normal work starts from `develop` on a `feature/*`, `fix/*`, `docs/*`, `refactor/*`, or `chore/*` branch and merges back into `develop`. Keep topic merge boundaries so the integration history remains readable.

Prepare releases on `release/vX.Y.Z` from `develop`, then merge verified releases into `main` and synchronize back to `develop`. Production hotfixes start from `main` on `hotfix/*` and must also reach `develop` and any affected active release branch.

The repository has no configured release/tag/publishing automation. Inspect existing tags, version metadata, CI, and remote state before releasing; a merge does not itself publish or deploy the project.

Pull request titles must be `[PROJECT-123] concise summary` or `[TBD] concise summary`. Complete the repository PR template and attach an image or recording for visual changes. See the [delivery workflow](docs/engineering/delivery-workflow.md).

#### GitHub Actions

Runs on all pushes and pull requests:

- ESLint across all packages
- Prettier format check
- TypeScript type checking
- Prisma generation and package/application builds

CI does not currently run unit or e2e tests. See `.github/workflows/ci.yml`.

## Project Structure

### API Endpoints

The NestJS APIs provide the following endpoints with **Swagger documentation**:

- API: `http://localhost:3001/api`

- `GET /links` - Get all links
- `GET /links/:id` - Get a specific link
- `POST /links` - Create a new link
- `PATCH /links/:id` - Update a link
- `DELETE /links/:id` - Delete a link

#### DTOs & Swagger

DTOs implement shared request contracts while retaining classes for Swagger:

```typescript
// apps/api/src/links/dto/create-link.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import type { CreateLinkRequest } from '@repo/api-contract';

export class CreateLinkDto implements CreateLinkRequest {
  @ApiProperty({ example: 'https://google.com' })
  url: string;

  @ApiProperty({ example: 'Google' })
  title: string;

  @ApiProperty({ example: 'Search engine', required: false })
  description?: string;
}
```

Controllers map Prisma records to `LinkResponse`, converting database `Date`
instances to ISO strings. This keeps the database model internal while
`@repo/api-contract` remains the source of truth for the wire format.

Swagger decorators and TypeScript interface implementation do not provide runtime request validation. The API currently has no validation pipe or authentication/authorization layer. Shared request contracts are maintained in `@repo/api-contract`.

### Frontend

The Next.js apps display database results fetched from their respective NestJS APIs. The frontends:

- Fetches links from the API on server-side
- Displays them in a styled card layout
- Shows link metadata (ID, URL, creation date)
- Uses shared API response types rather than Prisma-generated model types

### Shared Packages

- **@repo/api-contract**: Shared API contracts (no fetch, React, NestJS, or Prisma)
  - Endpoint definitions with typed request/response
  - Shared requests (`CreateLinkRequest`, `UpdateLinkRequest`)
  - JSON-safe responses (`LinkResponse`)
  - Runtime-agnostic - works on server and client components
  - **Shared by frontend and backend**

- **@repo/design-system**: Shared styling foundation
  - Tailwind CSS configuration and color palette
  - Global CSS variables and styles
  - Used by all frontend apps

- **@repo/assets**: Shared visual assets and SVG icon components
  - Raw logos and illustrations exposed through purpose-based subpaths
  - UI icon SVGs converted to React components using SVGR
  - TypeScript support with `currentColor` styling for icon components
  - See [@repo/assets README](./packages/assets/README.md) for usage

- **@repo/ui**: Shared React component library
  - Reusable Button, Input, Textarea, and React Hook Form/Zod adapters
  - Built with Tailwind CSS from `@repo/design-system`

### Asset and Icon System

The `@repo/assets` package exposes raw shared files directly and uses [SVGR](https://react-svgr.com/) to convert SVGs in its icon source directory into React components. This keeps both asset categories together while preserving separate consumption paths.

**How it works:**

1. **SVG Icon Sources**: Place component-style SVG glyphs in `packages/assets/src/icons/` (e.g., `arrow-right.svg`). Keep raw logos and illustrations in their purpose-based asset folders.

2. **Build Process**: SVGR transforms SVGs into React components:

   ```bash
   npm run build:icons --workspace=@repo/assets  # Converts SVG → React components in dist/icons/
   ```

3. **Auto-Generated Index**: The build process creates TypeScript exports:

   ```typescript
   // packages/assets/src/icons/index.ts (auto-generated)
   export { default as ArrowRight } from '../../dist/icons/ArrowRight';
   ```

4. **Usage in Apps**: Import icons as React components:

   ```tsx
   import { ArrowRight, AddUser } from '@repo/assets/icons';

   <ArrowRight className="text-primary-600 h-5 w-5" />;
   ```

**SVGR Configuration** (`.svgrrc.js`):

- **TypeScript**: Generates `.tsx` files with full type safety
- **SVGO Optimization**: Automatically optimizes SVG files
- **Color Replacement**: `#000` and `#000000` → `currentColor` for styling flexibility
- **Icon Mode**: Optimized for icon usage (removes dimensions, preserves viewBox)

**Development Workflow** (run these commands inside `packages/assets`):

- `npm run build` - Build all icons and regenerate index
- `npm run dev` - Watch mode (auto-rebuilds on SVG changes)
- Icons are automatically converted from kebab-case filenames to PascalCase component names

If assets stop being shared across applications, preview the guarded one-time
migration that localizes them into `apps/web`:

```bash
npm run assets:localize:web
npm run assets:localize:web -- --apply
```

The script leaves the company-wide `@repo/ui` and `@repo/design-system`
packages in place. It refuses to run while another workspace imports
`@repo/assets`, builds the icon output before copying it, rewrites web imports,
and refreshes the lockfile. The default invocation is a non-mutating dry run.

### Data Fetching Architecture

This project separates **API definitions** from **fetch logic** for maximum flexibility:

```
@repo/api-contract (shared)  apps/web (per-app)
┌─────────────────────┐      ┌─────────────────────────────────┐
│ linksApi.list()     │      │ lib/fetch/server.ts (SSR)       │
│ linksApi.detail(id) │ ──▶  │ lib/fetch/client.ts (CSR)       │
│ linksApi.create()   │      │ data-access/links.{client,server}.ts │
└─────────────────────┘      └─────────────────────────────────┘
```

The following snippets illustrate the pattern; actual fetch helpers also set headers, check HTTP status, and handle empty responses. Demo rendering components in the snippets are illustrative.

**How it works:**

1. **`@repo/api-contract`** defines endpoints and wire types as pure data (no fetch):

```typescript
// packages/api-contract/src/links.ts
export const linksApi = {
  list: () => ({ url: '/links', method: 'GET' }),
  detail: (id: number) => ({ url: `/links/${id}`, method: 'GET' }),
  create: (data) => ({ url: '/links', method: 'POST', body: data }),
};
```

2. **Each app** has its own fetch utilities that consume these definitions:

```typescript
// apps/web/lib/fetch/server.ts - Server-side fetch
export async function serverFetch<TResponse, TBody = never>(
  endpoint: ApiEndpoint<TResponse, TBody>,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${endpoint.url}`, {
    method: endpoint.method,
    body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
    cache: 'no-store', // Server controls caching
  });
  return response.json();
}

// apps/web/lib/fetch/client.ts - Client-side fetch (for TanStack Query)
export async function clientFetch<TResponse, TBody = never>(
  endpoint: ApiEndpoint<TResponse, TBody>,
): Promise<TResponse> {
  // Same logic, but TanStack Query handles caching
}
```

3. **Usage** differs by component type:

**Server Components** use feature-owned server data access:

```typescript
// Server Component usage example
import { getLinks } from '@/data-access/links.server';

export default async function Page() {
  const links = await getLinks();
  return <LinksList links={links} />;
}
```

**Client Components** use TanStack Query hooks:

```typescript
// apps/web/app/(home)/_components/links-demo.tsx
'use client';
import { useLinksQuery } from '@/data-access/links.client';

export function LinksDemo() {
  const { data: links, isLoading } = useLinksQuery();
  if (isLoading) return <Loading />;
  return <LinksList links={links} />;
}
```

**Why this pattern?**

- ✅ **Share contracts, not persistence types** - `@repo/api-contract` has no Prisma, fetch, React, or NestJS dependency
- ✅ **Per-app control** - Each app manages caching, headers, error handling
- ✅ **Server vs client separation** - Different strategies for SSR and CSR
- ✅ **Type safety** - Full TypeScript inference from endpoint to response
- ✅ **Easy to test** - Mock endpoints without mocking fetch

### Extending Apps

> **Extension pattern**: Duplicate the existing web or API app, then update its feature-specific behavior and verification.

This monorepo is designed to make adding new apps straightforward. The duplication script reads the selected source app as it exists, so it preserves shared-package dependencies as well as any assets or Prisma files that have been localized into that app.

1. **Preview the duplication**:

   ```bash
   npm run app:duplicate -- --source web --name my-new-app --port 3004
   ```

2. **Create the app** after reviewing the detected ownership state:

   ```bash
   npm run app:duplicate -- --source web --name my-new-app --port 3004 --apply
   ```

3. **Verify the new workspace**. It will:
   - ✅ Automatically use shared packages (`@repo/design-system`, `@repo/ui`, `@repo/api-contract`)
   - ✅ Preserve shared or app-local assets and Prisma ownership from the source
   - ✅ Inherit all Tailwind configurations from the design system
   - ✅ Use the same environment variables (via symlink distribution)
   - ✅ Work with Turborepo's build and dev commands
   - ✅ Share TypeScript, ESLint, and Prettier configurations

**Example: Creating an admin dashboard**

```bash
# Preview, then create the workspace
npm run app:duplicate -- --source web --name admin --port 3004
npm run app:duplicate -- --source web --name admin --port 3004 --apply

# Start only the new app
npm run dev --workspace=admin
# Your new admin app will be available at http://localhost:3004
```

Use `--source api` to duplicate the NestJS app. `--port` is optional; omitting it preserves the source port exactly. Generated output, caches, coverage, and local environment files are never copied. The command refuses existing destinations and duplicate workspace package names, then runs `npm install` to register the new workspace and refresh the lockfile.

### Environment Variables

The project uses a centralized `.env` file in the root directory:

- **Automatic Setup**: `.env` is created from `.env.example` during `npm install`
- **Automatic Distribution**: When running `npm run dev`, the root `.env` is distributed to all apps and packages via symlinks
- **Excluded Packages**: Config packages (`eslint-config`, `jest-config`, `typescript-config`) don't receive `.env` files
- **Single Source of Truth**: All environment variables are managed in the root `.env` file

#### Configuration details

- Set `NEXT_PUBLIC_API_URL` for web; `.env.example` currently uses the unconsumed name `NEXT_PUBLIC_API`.
- Setup substitutes fixed defaults when first creating `.env`; later edits to `DB_*` do not recalculate `DATABASE_URL`.
- `env:distribute` preserves regular workspace `.env` files and exits with a warning. After backing them up or merging their values, use `npm run env:distribute -- --force` to replace them with symlinks intentionally.
- API bootstrap and the seed client do not explicitly load dotenv. Turbo strict mode also lacks some API/database environment declarations. For custom settings, launch the API directly with exported variables; see [API startup](apps/api/README.md#development).
- `NEXT_PUBLIC_*` values and the web server-provider DOM attribute are public; never put secrets there.

### Remote Caching

> [!TIP]
> Optional remote caching is available through Vercel. Check current availability and terms at [vercel.com](https://vercel.com/).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```bash
npx turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```bash
npx turbo link
```

## Improvement priorities

These are current implementation gaps, not features supplied by this documentation:

1. **IMPORTANT — API boundary validation and access policy.** Body DTOs have Swagger annotations but no validation decorators/global pipe; IDs are coerced with `+id`. CRUD routes have no authentication/authorization, and CORS is unrestricted. Validate accepted fields/URLs/IDs and define server access policy before using the template for protected data. [API details](apps/api/README.md#improvements).
2. **IMPORTANT — Startup and data integrity.** Unify environment loading/name conventions and declare Turbo runtime variables; remove credential logging and bound database readiness waits. Define seed identity and migration workflow before repeatable deployments. [DB details](apps/db/README.md#improvements), [API persistence details](apps/api/README.md#persistence-ownership).
3. **IMPORTANT — Shared form behavior.** FormInput/FormTextarea destructure missing context before their fallback; inputs without IDs lose label associations and reuse `undefined-helper`. Correct these contracts and add behavior/accessibility tests. [UI details](packages/ui/README.md#improvements).
4. **IMPORTANT — HTTP failures and concurrency.** Shared contracts now represent JSON timestamps and DELETE responses explicitly. Still map database write races and distinguish API outages from empty/not-found UI results. [Contracts](packages/api-contract/README.md), [web details](apps/web/README.md#improvements).
5. **IMPORTANT — Verification coverage.** Repair badge tests that expect obsolete colors, add CRUD/failure-path coverage, close e2e Nest apps, and run tests in CI. Current links unit tests only check construction.
6. **SUGGESTION — Production adaptation.** Remove artificial query delays, decide whether independent server/client demo reads are needed, introduce bounded link listing when needed, and investigate the oversized `app-thai-id.svg` asset. No production deployment or bundle-performance validation is implied.

## Agent guidance

[AGENTS.md](AGENTS.md) describes root architecture, sources of truth, tooling, and verification. Local instructions cover [web](apps/web/AGENTS.md), [API](apps/api/AGENTS.md), [database infrastructure](apps/db/AGENTS.md), [Prisma persistence](packages/prisma/AGENTS.md), [contracts](packages/api-contract/AGENTS.md), [assets and icons](packages/assets/AGENTS.md), and [UI](packages/ui/AGENTS.md). Shared tooling/design-system rules remain at the root because those packages do not need separate instruction hierarchies.

Keep README setup and agent guidance synchronized with durable architecture/runtime changes. Do not turn instruction files into task logs or copy generic engineering rules into every package.
