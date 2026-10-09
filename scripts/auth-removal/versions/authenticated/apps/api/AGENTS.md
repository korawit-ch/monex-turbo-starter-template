# API Instructions

- Read [README.md](README.md) for routes, startup, and current gaps. Bootstrap is `src/main.ts`; feature wiring is in `src/app.module.ts` and feature modules.
- Preserve controller → service → injected `PrismaService.client` flow. `PrismaModule` is global; it owns connection/disconnection through Nest lifecycle hooks.
- Authentication is global: `JwtAuthGuard` verifies bearer JWTs unless `@Public()` is explicit, and `PermissionGuard` evaluates typed `@RequirePermission()` metadata. Never assume the Next BFF already authorized a request.
- `AuthSession` is used only for login renewal/revocation. Ordinary protected requests validate the short-lived access JWT without querying the session table. Keep raw JWT/session credentials out of JSON and logs.
- `packages/prisma` owns the schema, CLI configuration, seed, runtime client, and generated database types. The API owns the Nest lifecycle wrapper in `src/prisma/prisma.service.ts` and maps database records to `@repo/api-contract` responses. Do not expose database model types as transport contracts.
- Keep transport DTOs in the feature's `dto` directory. DTOs implement shared request contracts; class-validator decorators and the global strict `ValidationPipe` provide runtime input validation, while Swagger decorators document it.
- When changing links inputs or responses, inspect controller DTOs and mappers, Prisma schema, `packages/api-contract/src/links.ts`, endpoint descriptions, and web consumers. Never treat incoming JSON as validated merely because it has a TypeScript annotation.
- Links are tenant-owned. Include `auth.tenantId` in reads and final mutations; do not accept tenant, role, permissions, or ownership from request bodies.
- Preserve documented status/error semantics. `findOne` throws 404, while update/delete currently check existence before writing; account for deletion between those operations when modifying them.
- List ordering is `createdAt` descending. URLs are unique per tenant and there is currently no pagination; changing either affects client contracts/data behavior.
- Direct startup must receive `DATABASE_URL`, both auth secrets, and optionally the documented auth/API configuration. Nest defaults to loopback. `/api` hosts Swagger only outside production; it is not a global route prefix.
- Generate from the schema with root `npm run db:generate`; never edit generated Prisma output. Validate schema syntax without database writes with `npm run db:validate`.
- No migration history is currently checked in. `db:push` is for disposable local development; `db:migrate` runs `prisma migrate dev`, not a production deployment command. The seed upserts stable tenant/user/link identities and rotates the seeded user's password hash.
- From the root, build shared packages first, then use `npm run lint --workspace=api`, `npm run test --workspace=api -- --runInBand`, and `npm run build --workspace=api`. In particular, the API consumes the compiled `@repo/prisma` entry point.
- Unit tests mock `PrismaService` and cover token/session/guard boundaries plus tenant-scoped link queries. Extend coverage for controller validation, missing rows, unique conflicts, and database failures when modifying behavior.
- `npm run test:e2e --workspace=api -- --runInBand` uses the real database. Verify the target, close created Nest apps, and account for bootstrap settings not applied by the test's `createNestApplication()`.
