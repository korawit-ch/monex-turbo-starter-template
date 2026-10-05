# Prisma Instructions

- `prisma/schema.prisma` is the authoritative data model. The only current model is `Link`, mapped to `links`; `url` has no unique constraint. See [README.md](README.md).
- CLI configuration is in `prisma.config.ts`; runtime configuration is in `src/index.ts`. They have separate environment-loading behavior and both contain local fallback URLs. Inspect both when changing connection handling.
- Runtime exports construct a Prisma client with the PostgreSQL adapter and pool, reuse a global client outside production, and re-export Prisma symbols. Do not introduce value imports into browser consumers.
- API services consume the singleton through Nest's `PrismaService`. Keep lifecycle changes coordinated with that wrapper and the seed script's disconnect path.
- Generate from the schema with root `npm run db:generate`; never edit generated Prisma output. Build with `npm run build --workspace=@repo/prisma` (its prebuild also generates).
- Before schema changes, inspect API DTOs/services, `@repo/api-client`, and web readers. Database model types do not define JSON timestamp representation or request validation.
- No migration history is currently checked in. `db:push` is for disposable local development; `db:migrate` runs `prisma migrate dev`, not a production deployment command. Establish reviewed migrations and deployment ordering for persistent environments.
- `prisma/seed.ts` uses `createMany` with `skipDuplicates`, but fresh IDs and non-unique URLs allow repeat records. Do not assume retries/reruns are idempotent or silently add uniqueness without reviewing existing data.
- Check schema syntax without database writes using `npx prisma validate` from this package. Database-backed verification must use an explicitly identified development/test target.
