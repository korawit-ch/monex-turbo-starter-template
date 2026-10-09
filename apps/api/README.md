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

`src/main.ts` creates the app, enables CORS, mounts Swagger, and listens on `API_PORT` or 3001. `AppModule` imports the global `PrismaModule` and `LinksModule`. Controllers handle HTTP input; `LinksService` reads/writes through injected `PrismaService.client`. The Prisma service connects on module initialization and disconnects on destruction.

- `GET /`: API information.
- `GET /links`: all links, ordered by `createdAt` descending.
- `GET /links/:id`: one link, or 404.
- `POST /links`: create and return a link.
- `PATCH /links/:id`: update and return a link.
- `DELETE /links/:id`: delete and return the deleted link.

`/api` is only the Swagger path; it does not prefix the routes above. Dates serialize as JSON strings. The schema is [packages/prisma/prisma/schema.prisma](../../packages/prisma/prisma/schema.prisma); request DTOs live in `src/links/dto`, response mapping lives in `src/links/links.mapper.ts`, and shared API contracts live in `packages/api-contract`.

## Development

Complete [root database/environment setup](../../README.md#getting-started), then from the root:

```bash
npx turbo run build --filter='./packages/*'
npm run dev --workspace=api
```

Watch startup uses the process environment. A linked `.env` is not automatically loaded by this bootstrap. For custom settings, export `DATABASE_URL` and `API_PORT` in the launching environment. For a compiled local run with the root env file:

```bash
npm run build --workspace=api
node --env-file=.env apps/api/dist/main.js
```

Database connection failure prevents normal startup. There is no readiness endpoint separate from the informational root route. The checked-in Compose file runs PostgreSQL only; it does not deploy the API.

## Verification

After shared builds, run from the root:

```bash
npm run lint --workspace=api
npm run test --workspace=api -- --runInBand
npm run build --workspace=api
```

Unit tests use the shared Nest Jest preset and mocked Prisma service. Existing coverage checks the root information response and links controller/service construction; it does not verify CRUD behavior.

`npm run test:e2e --workspace=api -- --runInBand` initializes the real application/Prisma service and requires an explicitly configured test database. It creates a Nest application directly rather than invoking `main.ts`, so bootstrap-only middleware/pipes are not automatically tested. The current test lacks application teardown.

## Improvements

- **IMPORTANT:** Add runtime validation for bodies and route IDs. Swagger annotations and Prisma interface implementation do not reject unknown properties, unsafe URLs, or invalid IDs; raw request objects currently reach Prisma.
- **IMPORTANT:** Define authentication/authorization and a CORS policy for any protected use. No guards, sessions, ownership fields, or tenant checks currently exist.
- **IMPORTANT:** Handle update/delete database not-found errors after the existence check. A concurrent deletion can occur between `findOne` and the write and escape the intended 404 mapping.
- **IMPORTANT:** Make environment loading explicit and declare required variables in Turbo; `API_PORT` currently triggers an undeclared-env lint warning. Add regression tests for validation, missing rows, and database failures, and close e2e apps.
- **SUGGESTION:** Add pagination when link volume requires it. Any change must update client endpoint contracts and query keys/consumers together.

See [local agent instructions](AGENTS.md) for implementation boundaries.
