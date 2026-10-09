# `@repo/prisma`

Server-only persistence package for the monorepo. It owns the Prisma schema, generated database types, CLI configuration, seed, and shared runtime client.

This package is not an API contract. Backend code must map Prisma records to the JSON-safe request and response types in `@repo/api-contract`; frontend code must never import this package or `@prisma/client`.

## Structure

- `prisma/schema.prisma`: authoritative PostgreSQL model.
- `prisma/seed.ts`: repeatable development tenant, administrator, and example-link seed.
- `prisma.config.ts`: schema discovery and database URL loading for Prisma CLI.
- `src/index.ts`: PostgreSQL adapter, singleton Prisma client, and generated type exports.

The Nest API wraps the default client in `apps/api/src/prisma/prisma.service.ts` so connection lifecycle remains owned by Nest.

## Commands

Run through the root scripts:

```bash
npm run db:generate
npm run db:validate
npm run db:push
npm run db:migrate
npm run db:studio
npm run db:seed
```

`db:push`, `db:migrate`, and `db:seed` change persistent state. The seed upserts stable identities but rotates the seeded administrator's password hash. There is currently no checked-in migration history.

Build the runtime entry point with:

```bash
npm run build --workspace=@repo/prisma
```

## Localizing into the API

For an independently owned API deployment, the repository can move this package into `apps/api`:

```bash
# Safety check only
npm run prisma:localize:api

# Apply the ownership migration
npm run prisma:localize:api -- --apply
```

The script refuses to overwrite existing API persistence files or proceed while another workspace consumes `@repo/prisma`. It rewrites files and dependencies but does not run schema pushes, migrations, seeds, or other database writes.
