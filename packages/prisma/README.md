# @repo/prisma

Shared Prisma client and schema package with PostgreSQL support. This package provides a singleton Prisma client instance and exports all Prisma types for use across your monorepo or as a standalone npm package.

## Installation

Install workspace dependencies from the repository root:

```bash
npm install
```

For use outside this repository, first configure and verify publishing under your own package scope; see [Publishing](#publishing).

## Prerequisites

- Node.js >= 22.12
- PostgreSQL database
- `DATABASE_URL` environment variable set

## Quick Start

1. **Set up your database connection string**:

   Create the root environment file if missing:

   ```bash
   # From the root of the monorepo
   npm run env:setup
   ```

   The `.env` file in the root directory should contain:

   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/monex-turbo-starter-template-db?schema=public"
   ```

   **How Prisma loads environment variables:**

   A symlink is created in `packages/prisma/.env` that points to the root `.env` file. This ensures:
   - The root `.env` file is the single source of truth
   - Prisma commands work correctly from the `packages/prisma` directory
   - `prisma.config.ts` explicitly loads package/root `.env` for CLI commands; the runtime client separately reads process variables

   **Note**: If the symlink doesn't exist, create it with:

   ```bash
   cd packages/prisma && ln -sf ../../.env .env
   ```

2. **The Prisma client is automatically generated** on `npm install` via the `postinstall` script.

3. **Push your schema to the database** (development):

```bash
npx prisma db push
```

Or create and apply development migrations (run Prisma CLI commands from this package):

```bash
npx prisma migrate dev
```

## Usage

### Direct Import

Server code can import the Prisma client directly. Browser consumers must use type-only imports:

```typescript
import prisma from '@repo/prisma';

// Use in your code
const links = await prisma.link.findMany();
```

### NestJS Integration

The NestJS app includes a `PrismaService` that wraps the Prisma client. Import `PrismaModule` in your app module:

```typescript
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  // ...
})
export class AppModule {}
```

Then inject `PrismaService` in your services:

```typescript
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MyService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.client.link.findMany();
  }
}
```

## Seeding and migration notes

No migration history is checked in; `prisma migrate dev` is not a production deployment command. Establish a reviewed migration/deployment workflow for persistent data.

The seed does not explicitly load dotenv. With root configuration reviewed, run from the repository root:

```bash
node --env-file=.env --import=tsx packages/prisma/prisma/seed.ts
```

Reruns can insert duplicate URLs. Use `npm run db:seed` only with the correct `DATABASE_URL` already exported.

## Scripts

- `db:generate` - Generate Prisma Client
- `db:push` - Push schema changes to database (for development)
- `db:migrate` - Create and apply migrations
- `db:studio` - Open Prisma Studio
- `db:seed` - Run database seed script

## Type Exports

This package exports all Prisma types for use in your application:

```typescript
import type { Prisma, Link } from '@repo/prisma';

// Use Prisma types
const createData: Prisma.LinkCreateInput = {
  title: 'Example',
  url: 'https://example.com',
  description: 'An example link',
};
```

## Publishing

Publishing is a separate operation, not part of local setup. Configure a scope you own, verify the packed artifacts and consumer compatibility, and establish release/versioning ownership first. The repository has no configured publishing automation. Run the commands below from this package only when intentionally publishing.

To publish this package to npm:

```bash
# Build the package
npm run build

# Publish (make sure you're logged in to npm)
npm publish
```

The `prepublishOnly` script will automatically build the package before publishing.

## Sources and runtime

- `prisma/schema.prisma`: `Link`, mapped to table `links`, with integer auto-increment ID, URL, title, nullable description, and created/updated timestamps. Only ID is unique.
- `prisma.config.ts`: Prisma CLI schema location and datasource URL. It explicitly loads package/root `.env` files and falls back to the local template database URL.
- `src/index.ts`: separate runtime client setup using `pg.Pool` and `PrismaPg`. It reads the process `DATABASE_URL` and has a local fallback, but does not explicitly load dotenv. The singleton is cached globally outside production.
- `prisma/seed.ts`: inserts three example links and disconnects the client.

The API wraps this client in its Nest `PrismaService` lifecycle. Server code can import the default client; frontend/contracts code must use type-only imports so the runtime entry never reaches browser bundles:

```typescript
import type { Link, Prisma } from '@repo/prisma';
```

These are database types. JSON transport timestamps require separate representation or conversion; TypeScript model alignment is not request validation.

## Improvements

- **IMPORTANT:** Make seeding retry-safe. `skipDuplicates: true` does not deduplicate URLs because URL is not unique and every insertion receives a fresh ID. Reruns currently add duplicate examples.
- **IMPORTANT:** Establish reviewed migration history and a deployment command for persistent environments. Review existing data before adding uniqueness, required fields, or destructive schema changes.
- **IMPORTANT:** Unify CLI/runtime environment loading and handle missing production configuration explicitly rather than silently selecting a local fallback. Keep pool/client lifecycle coordinated with the API.
- **IMPORTANT:** Update both API DTOs and frontend contracts on model changes. The schema is authoritative for persistence, while transport dates, accepted fields, and error behavior need explicit contracts.

See [local agent instructions](AGENTS.md).
