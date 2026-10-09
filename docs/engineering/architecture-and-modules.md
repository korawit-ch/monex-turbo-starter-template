# Architecture and Modules

## System overview

```text
Browser
  -> Next.js route or Server Component (apps/web)
  -> same-origin Next.js BFF for protected browser requests
  -> shared endpoint description and JSON contract (@repo/api-contract)
  -> NestJS controller and runtime DTO (apps/api)
  -> service and authorization scope
  -> PrismaService / @repo/prisma
  -> PostgreSQL (apps/db)
```

The frontend and backend share the meaning of an HTTP request and response. They do not share database records, framework handlers, fetch clients, or UI state.

## Repository structure

```text
apps/
  web/                       Next.js App Router application
    app/                     routes, layouts, BFF route handlers
    components/              components shared by unrelated routes
    data-access/             feature fetch functions and query hooks
    lib/                     app infrastructure such as auth and fetch
    providers/               app-wide React providers
  api/                       NestJS application
    src/<feature>/           controller, DTO, mapper, service, module, tests
    src/auth/                authentication and Nest guards
    src/prisma/              Nest adapter for the shared Prisma client
  db/                        local PostgreSQL Compose service
packages/
  api-contract/              framework-free HTTP contracts
  assets/                    shared raw assets and generated SVG components
  authorization/             permission vocabulary and pure evaluation
  design-system/             tokens, Tailwind theme, and shared styles
  prisma/                    server-only schema, seed, client, and DB types
  ui/                        reusable React controls and form adapters
  eslint-config/             shared lint presets
  jest-config/               shared Jest presets
  typescript-config/         shared TypeScript presets
docs/                        durable architecture and engineering guidance
scripts/                     operational and guarded migration utilities
```

## Application responsibilities

### `apps/web`

- Renders routes and owns user interaction.
- Owns server/client fetch implementations and TanStack Query policy.
- Uses same-origin BFF handlers for protected browser traffic.
- Converts wire values when the UI needs richer types, for example an ISO timestamp to `Date`.
- Never imports `@repo/prisma` or `@prisma/client`.

### `apps/api`

- Owns HTTP controllers, runtime validation, Swagger decorators, authorization enforcement, and business operations.
- Maps persistence records to shared response contracts.
- Keeps tenant and ownership filters in authoritative Prisma queries.
- Returns intentional HTTP errors instead of leaking database exceptions.

### `apps/db`

- Owns only local PostgreSQL infrastructure.
- Does not own the Prisma schema or application migrations.
- Must not be treated as a production deployment definition.

## Package responsibilities

### `@repo/api-contract`

Contains paths, methods, request types, response types, and framework-neutral endpoint descriptions. It may not import React, fetch, Next.js, NestJS, Prisma, or database runtimes.

### `@repo/prisma`

Contains the schema, seed, Prisma CLI configuration, runtime client, and generated database types. It is server-only. A Prisma type describes storage; it is not a promise to API consumers.

### `@repo/authorization`

Contains stable permission names, claim parsing, sanitized authorization context, and pure permission evaluation. JWT signing, cookies, Nest guards, and database ownership checks stay in applications.

### `@repo/design-system`

Contains visual tokens and shared CSS foundations. Add a value here when multiple apps should express the same brand/system decision, not for one page's layout.

### `@repo/ui`

Contains company-wide controls and form adapters. Components accept content and icon slots from callers. They must not choose product copy, routes, permissions, API calls, or feature-specific icons.

### `@repo/assets`

Contains visual files reused by applications. Raw files use purpose-based exports such as `@repo/assets/brand/...`; SVG glyphs are generated into React components and imported from `@repo/assets/icons`.

### Configuration packages

`eslint-config`, `jest-config`, and `typescript-config` centralize tool policy. Applications may extend them, but should not silently weaken shared correctness rules.

## Dependency direction

```text
apps -> shared packages
shared packages -X-> apps
web -> api-contract, authorization, UI/design/assets
api -> api-contract, authorization, prisma
api-contract -X-> frameworks, fetch, Prisma, apps
ui -X-> app features, API clients, selected product icons
```

When a shared package needs an app import, the responsibility is in the wrong layer.
