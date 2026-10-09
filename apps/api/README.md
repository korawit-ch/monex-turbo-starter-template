# With-NestJs | API

## Getting Started

After completing [root setup](../../README.md#getting-started), run from this workspace:

```bash
npm run dev
```

By default, your server will run at [localhost:3001](http://localhost:3001). You can use your favorite API platform like [Insomnia](https://insomnia.rest/) or [Postman](https://www.postman.com/) to test your APIs

You can start editing the demo **APIs** by modifying [linksService](./src/links/links.service.ts) provider.

### Important Note 🚧

If you plan to `build` or `test` the app. Please make sure to build the `packages/*` first.

## Learn More

Learn more about `NestJs` with following resources:

- [Official Documentation](https://docs.nestjs.com) - A progressive Node.js framework for building efficient, reliable and scalable server-side applications.
- [Official NestJS Courses](https://courses.nestjs.com) - Learn everything you need to master NestJS and tackle modern backend applications at any scale.
- [GitHub Repo](https://github.com/nestjs/nest)

## Runtime flow

`src/main.ts` creates the app, installs strict runtime validation, mounts Swagger outside production, and listens on `API_HOST`/`API_PORT` (loopback/3001 by default). `AppModule` imports global persistence, authentication, and link modules. The Prisma service connects on module initialization and disconnects on destruction.

Global `JwtAuthGuard` verifies every non-public bearer JWT and writes the sanitized context to `request.user`. `PermissionGuard` evaluates typed route metadata through `@repo/authorization`. Link services then repeat tenant scope in Prisma queries and final mutations; Next.js authorization is only an earlier check.

- `GET /`: API information.
- `POST /auth/login`: validate credentials and create session/access cookies.
- `POST /auth/refresh`: renew access from the opaque session cookie.
- `POST /auth/logout`: revoke the current session and clear cookies.
- `POST /auth/logout-all`: revoke all actor sessions and clear cookies.
- `GET /links`: tenant links, ordered by `createdAt` descending.
- `GET /links/:id`: one link, or 404.
- `POST /links`: create and return a link.
- `PATCH /links/:id`: update and return a link.
- `DELETE /links/:id`: delete and return the deleted link.

`/api` is only the non-production Swagger path; it does not prefix the routes above. Dates serialize as JSON strings. The server-only [`@repo/prisma`](../../packages/prisma) package owns persistence. Request DTOs combine shared contract shapes with runtime validators, and response mapping keeps Prisma types internal. See the complete [authentication architecture](../../docs/authentication.md).

## Persistence ownership

- `packages/prisma/prisma/schema.prisma` defines the database model.
- `packages/prisma/prisma.config.ts` locates the schema and loads package/root environments for CLI commands.
- `packages/prisma/src/index.ts` creates the PostgreSQL adapter, pool, and singleton Prisma client and exports generated database types.
- `src/prisma/prisma.service.ts` owns connection and disconnection through Nest lifecycle hooks.
- `packages/prisma/prisma/seed.ts` upserts a development tenant, administrator, and example links, then disconnects the client.

Run database commands from the repository root with `npm run db:generate`, `db:validate`, `db:push`, `db:migrate`, `db:studio`, or `db:seed`. These delegate to `@repo/prisma`. No migration history is currently checked in; `db:migrate` is a development command. Links are unique by tenant and URL. Seed reruns rotate the development user's password hash.

If a deployment or extracted backend should own Prisma locally, first run `npm run prisma:localize:api` to check the migration, then `npm run prisma:localize:api -- --apply`. The apply command moves the package into this app, rewrites imports and scripts, and removes `packages/prisma`; it refuses to run while another workspace consumes the package. It does not change database data.

## Development

Complete [root database/environment setup](../../README.md#getting-started), then from the root:

```bash
npx turbo run build --filter='./packages/*'
npm run dev --workspace=api
```

Watch startup uses the process environment. A linked `.env` is not automatically loaded by this bootstrap. Export `DATABASE_URL`, both auth secrets, and the documented API/auth settings. For a compiled local run with the root env file:

```bash
npm run build --workspace=api
node --env-file=.env apps/api/dist/main.js
```

Database connection failure prevents normal startup. There is no readiness endpoint separate from the informational root route. The checked-in Compose file runs PostgreSQL only; it does not deploy the API.

## Verification

After shared contract/UI builds, run from the root:

```bash
npm run lint --workspace=api
npm run test --workspace=api -- --runInBand
npm run build --workspace=api
```

Unit tests use the shared Nest Jest preset and mocked Prisma service. Focused tests cover JWT validation, encrypted session envelopes, session revocation predicates, authentication/permission guards, and tenant scope in final link mutations.

`npm run test:e2e --workspace=api -- --runInBand` initializes the real application/Prisma service and requires an explicitly configured test database. It creates a Nest application directly rather than invoking `main.ts`, so bootstrap-only middleware/pipes are not automatically tested. The current test lacks application teardown.

## Improvements

- **IMPORTANT:** Replace seeded credential login with the production identity provider and add login rate limiting/abuse controls. OAuth/OIDC, state, nonce, and PKCE are not implemented.
- **IMPORTANT:** Move production JWT signing to asymmetric keys so Next receives verification material but cannot sign. Add operational secret rotation and session cleanup.
- **IMPORTANT:** Create reviewed tenant backfill/migration procedures before applying the required `tenantId` relation to existing production data.
- **IMPORTANT:** Add database-backed integration tests for login, renewal, revocation, validation, missing rows, and database failures; close e2e apps.
- **SUGGESTION:** Map tenant-unique URL conflicts to an intentional 409 response.
- **SUGGESTION:** Add pagination when link volume requires it. Any change must update client endpoint contracts and query keys/consumers together.

See [local agent instructions](AGENTS.md) for implementation boundaries.
