# Prisma Package Instructions

- `prisma/schema.prisma` is the authoritative database model. Keep generated database types here and transport contracts in `@repo/api-contract`.
- This is a server-only package. Frontend workspaces must not import `@repo/prisma` or `@prisma/client`, including type-only imports.
- `src/index.ts` owns the PostgreSQL adapter, pool, and singleton client. The API's `PrismaService` owns Nest connection and disconnection lifecycle around that client.
- `prisma.config.ts` is the Prisma CLI entry point. Preserve package/root environment discovery when changing paths.
- Generate with root `npm run db:generate`, validate without database writes with `npm run db:validate`, and build with `npm run build --workspace=@repo/prisma`. Never edit generated client output.
- `db:push`, `db:migrate`, and `db:seed` mutate persistent state. Inspect the target first; the seed upserts stable identities but rotates the seeded password hash, and there is no checked-in migration history.
- `npm run prisma:localize:api` dry-runs the supported move into `apps/api`; `-- --apply` performs it. Keep its consumer and collision guards intact when package paths change.
