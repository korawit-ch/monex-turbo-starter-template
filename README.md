# monex-turbo-starter-template

> **monex** = **mo**norepo + **n**ode + n**ex**t

A full-stack monorepo template featuring NestJS API, Next.js frontend, and Prisma ORM with PostgreSQL.

## What's inside?

This Turborepo includes the following packages & apps:

### Apps and Packages

```shell
.
├── apps
│   ├── admin                     # Next.js 16 admin dashboard        → http://localhost:3002
│   ├── api                       # NestJS 11 API with Prisma         → http://localhost:3000
│   ├── db                        # PostgreSQL 16 (Docker Compose)    → localhost:5433
│   └── web                       # Next.js 16 frontend               → http://localhost:3001
└── packages
    ├── @repo/design-system       # Tailwind 4 config, colors, global styles
    ├── @repo/eslint-config       # ESLint configurations (includes Prettier)
    ├── @repo/jest-config         # Jest configurations
    ├── @repo/prisma              # Prisma 7 client, schema, and types
    ├── @repo/typescript-config   # TypeScript configurations
    └── @repo/ui                  # React 19 component library with Tailwind
```

Each package and application are written in [TypeScript](https://www.typescriptlang.org/).

### Tech Stack & Versions

| Component                          | Version            | Port |
| ---------------------------------- | ------------------ | ---- |
| **NestJS API** (`apps/api`)        | ^11.0.0            | 3000 |
| **Next.js Web** (`apps/web`)       | ^16.0.7            | 3001 |
| **Next.js Admin** (`apps/admin`)   | ^16.0.7            | 3002 |
| **PostgreSQL** (`apps/db`)         | 16-alpine          | 5433 |
| **Prisma ORM** (`packages/prisma`) | ^7.1.0             | -    |
| **React**                          | ^19.1.0            | -    |
| **Tailwind CSS**                   | ^4.1.11            | -    |
| **TypeScript**                     | 5.5.4+             | -    |
| **Node.js**                        | >=20.19 or >=22.12 | -    |

**Core Technologies:**

- **Backend**: [NestJS](https://nestjs.com/) - Progressive Node.js framework
- **Frontend**: [Next.js](https://nextjs.org/) - React framework with App Router
- **Database**: [PostgreSQL](https://www.postgresql.org/) - Relational database
- **ORM**: [Prisma](https://www.prisma.io/) - Next-generation ORM (v7)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework (v4)
- **Monorepo**: [Turborepo](https://turbo.build/repo) - High-performance build system

### Utilities

This `Turborepo` includes:

- [TypeScript](https://www.typescriptlang.org/) for static type-safety
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting
- [Jest](https://jestjs.io/) for testing
- [Prisma](https://www.prisma.io/) for database management
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Docker Compose](https://docs.docker.com/compose/) for PostgreSQL database
- [Husky](https://typicode.github.io/husky/) for Git hooks
- [lint-staged](https://github.com/okonet/lint-staged) for pre-commit linting
- [Commitlint](https://commitlint.js.org/) for conventional commit messages

## Getting Started

### Prerequisites

- Node.js >= 18
- Docker and Docker Compose (for PostgreSQL database)
- npm, yarn, or pnpm

### Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

   This will automatically:
   - Create `.env` from `.env.example` if it doesn't exist
   - Set up the environment configuration

2. **Start PostgreSQL database**:

   ```bash
   npm run db:start
   # or
   npm run db:up
   # or
   cd apps/db && npm run dev
   ```

3. **Configure database connection** (if needed):

   The `.env` file is automatically created from `.env.example` during `npm install`. If you need to update it, edit the root `.env` file:

   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/monex-turbo-starter-template-db?schema=public"
   ```

   **Note**: When you run `npm run dev`, the root `.env` file is automatically distributed to all apps and packages (except config packages) via symlinks. This ensures all parts of the monorepo use the same environment variables.

4. **Generate Prisma client and push schema**:

   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

5. **Start development servers**:

   ```bash
   # From the root directory
   npm run dev
   ```

   This will:
   - Automatically distribute the root `.env` file to all apps and packages
   - Start all development servers:
     - NestJS API on <http://localhost:3000>
     - Next.js frontend on <http://localhost:3001>
     - Admin dashboard on <http://localhost:3002>

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

# Push schema to database
npm run db:push

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

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

#### test

```bash
# Will launch a test suites for all the app & packages with the supported `test` script.
pnpm run test

# You can launch e2e testes with `test:e2e`
pnpm run test:e2e

# See `@repo/jest-config` to customize the behavior.
```

#### Lint

```bash
# Will lint all the app & packages with the supported `lint` script.
# See `@repo/eslint-config` to customize the behavior.
pnpm run lint
```

#### Format

```bash
# Will format all the supported `.ts,.js,json,.tsx,.jsx` files.
# See `@repo/eslint-config/prettier-base.js` to customize the behavior.
npm run format
```

### Git Hooks & CI

#### Pre-commit

Automatically runs on every commit via Husky:

- **ESLint** + **Prettier** on staged `.ts/.tsx` files
- **Prettier** on staged `.json/.md/.css` files

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

#### GitHub Actions

Runs on all pushes and pull requests:

- ESLint across all packages
- Prettier format check
- TypeScript type checking

## Project Structure

### Database Setup

The project uses PostgreSQL with Prisma ORM. The database service is located in `apps/db/`:

- **Database**: PostgreSQL 16 (Alpine) running in Docker
- **Configuration**: Managed via environment variables in root `.env` file
- **Default Port**: 5433 (configurable via `DB_PORT`)
- **Default Database Name**: `monex-turbo-starter-template-db` (configurable via `DB_NAME`)
- **Default Credentials**: `postgres/postgres` (configurable via `DB_USER`/`DB_PASSWORD`)

The Prisma schema is located in `packages/prisma/prisma/schema.prisma` and defines the `Link` model.

**Database Environment Variables** (in root `.env`):

- `DB_USER` - PostgreSQL username
- `DB_PASSWORD` - PostgreSQL password
- `DB_NAME` - Database name
- `DB_PORT` - Host port mapping
- `DB_CONTAINER_NAME` - Docker container name
- `DATABASE_URL` - Full connection string for Prisma

### API Endpoints

The NestJS API provides the following endpoints:

- `GET /links` - Get all links
- `GET /links/:id` - Get a specific link
- `POST /links` - Create a new link
- `PATCH /links/:id` - Update a link
- `DELETE /links/:id` - Delete a link

### Frontend

The Next.js app displays database results fetched from the NestJS API. The frontend:

- Fetches links from the API on server-side
- Displays them in a styled card layout
- Shows link metadata (ID, URL, creation date)
- Uses Prisma-generated TypeScript types for type safety

### Shared Packages

- **@repo/prisma**: Shared Prisma client and schema
  - Exports singleton Prisma client instance
  - Exports all Prisma types (`Prisma`, `Link`, etc.)
  - **Ready to publish as an npm package** (see [Architecture Philosophy](#architecture-philosophy))
- **@repo/design-system**: Shared styling foundation
  - Tailwind CSS configuration and color palette
  - Global CSS variables and styles
  - Used by both `web` and `admin` frontends

- **@repo/ui**: Shared React component library
  - Reusable components (Button, Card, etc.)
  - Built with Tailwind CSS from `@repo/design-system`

### Environment Variables

The project uses a centralized `.env` file in the root directory:

- **Automatic Setup**: `.env` is created from `.env.example` during `npm install`
- **Automatic Distribution**: When running `npm run dev`, the root `.env` is distributed to all apps and packages via symlinks
- **Excluded Packages**: Config packages (`eslint-config`, `jest-config`, `typescript-config`) don't receive `.env` files
- **Single Source of Truth**: All environment variables are managed in the root `.env` file

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

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

## Development Workflow

1. **Start the database**: `npm run db:start`
2. **Generate Prisma client**: `npm run db:generate`
3. **Push schema**: `npm run db:push`
4. **Seed data** (optional): `npm run db:seed`
5. **Start dev servers**: `npm run dev`
6. **View results**: Open <http://localhost:3001>

## Testing the Database Connection

You can test the API directly:

```bash
# Get all links
curl http://localhost:3000/links

# Create a new link
curl -X POST http://localhost:3000/links \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Link","url":"https://example.com","description":"A test link"}'
```

## Troubleshooting

### Database Connection Issues

- Ensure Docker is running
- Check if the database container is up: `docker-compose -f apps/db/docker-compose.yml ps`
- Verify the `DATABASE_URL` in the root `.env` file (copy from `.env.example` if needed)
- Check database logs: `docker-compose -f apps/db/docker-compose.yml logs postgres`

### Prisma Client Not Found

- Run `npm run db:generate`
- Ensure `@repo/prisma` package is built: `npm run build`

### API Not Responding

- Check if the API is running on port 3000
- Verify CORS is enabled in `apps/api/src/main.ts`
- Check API logs for errors

## Useful Links

This example takes inspiration from:

- [with-nextjs](https://github.com/vercel/turborepo/tree/main/examples/with-nextjs) Turborepo example
- [01-cats-app](https://github.com/nestjs/nest/tree/master/sample/01-cats-app) NestJS sample

Learn more:

**Turborepo:**

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)

**Prisma:**

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma with NestJS](https://www.prisma.io/docs/guides/integration-guides/integrate-prisma-with-your-framework/nestjs)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)

**NestJS:**

- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS Prisma Integration](https://docs.nestjs.com/recipes/prisma)

## Architecture Philosophy

This repository is designed with **flexibility** and **modularity** in mind. The frontend and backend are combined in a single Turborepo for convenience during development, but the architecture allows them to be **detached at any time** and run as separate repositories while maintaining the same structure and configurations.

> **🚀 Ready to Detach**: The `@repo/prisma` package is **npm-ready** with proper `exports`, `types`, and `prepublishOnly` scripts. When you need to separate frontend from backend, simply publish `@repo/prisma` to npm and update the frontend's dependency from `"@repo/prisma": "*"` to `"@repo/prisma": "^1.0.0"` (or your private registry).

### Complementary Turborepo (Current State)

In the current setup, frontend and backend coexist in a single monorepo, sharing configurations and packages:

![Complementary Turborepo](./docs/images/complementary-turborepo.png)

**Benefits:**

- Shared configurations (ESLint, TypeScript, Prettier)
- Shared packages (`@repo/prisma`, `@repo/ui`)
- Single `npm install` for all dependencies
- Unified development workflow
- Easy local development and testing

### Interlocking Turborepos (Detached State)

When needed, the frontend and backend can be split into separate Turborepos that communicate via published npm packages:

![Interlocking Turborepos](./docs/images/interlocking-turborepos.png)

**How it works:**

1. **Backend Turborepo**: Contains the NestJS API, database setup, and `@repo/prisma` package
2. **Frontend Turborepo**: Contains the Next.js apps, `@repo/ui`, and `@repo/design-system` packages
3. **Shared via NPM**: The `@repo/prisma` package is published to npm, allowing the frontend to consume Prisma types without direct dependency on the backend repo
4. **Aligned Configurations**: Both repos maintain the same config packages (`eslint-config`, `typescript-config`) for consistency

**Publishing `@repo/prisma`:**

```bash
cd packages/prisma
npm run build        # Generates Prisma client and compiles TypeScript
npm publish          # Publishes to npm (or your private registry)
```

The package exports:

- `prisma` - Singleton Prisma client instance
- `Link`, `Prisma` - All Prisma-generated types
- Full TypeScript support with `.d.ts` files

**When to detach:**

- Different teams working on frontend vs backend
- Different deployment cycles or CI/CD pipelines
- Scaling concerns require separate infrastructure
- Security requirements mandate repository separation

**Reattaching:**

The repos can be merged back together at any time since they share the same structure and configurations. Simply:

1. Move apps and packages back into a single workspace
2. Update `package.json` workspaces
3. Remove npm package dependencies in favor of local workspace references

This architecture provides the **best of both worlds**: rapid development in a unified repo, with the option to scale to separate repos when needed.
