# API Instructions

- Read [README.md](README.md) for routes, startup, and current gaps. Bootstrap is `src/main.ts`; feature wiring is in `src/app.module.ts` and feature modules.
- Preserve controller → service → injected `PrismaService.client` flow. `PrismaModule` is global; it owns connection/disconnection through Nest lifecycle hooks.
- Keep transport DTOs in the feature's `dto` directory. Swagger decorators and `implements Prisma.*Input` provide documentation/compile-time alignment only; there is currently no global validation pipe or authentication/authorization layer.
- When changing links inputs, inspect controller DTOs, Prisma schema, `packages/api-client/src/types.ts`, endpoint descriptions, and web consumers. Never treat incoming JSON as validated merely because it has a TypeScript annotation.
- Links are stored without user/tenant ownership. Do not infer access policy from the web `ClientProvider`; any new policy must be authoritative in the API.
- Preserve documented status/error semantics. `findOne` throws 404, while update/delete currently check existence before writing; account for deletion between those operations when modifying them.
- List ordering is `createdAt` descending. There is currently no pagination or URL uniqueness constraint; changing either affects client contracts/data behavior.
- Direct startup must receive `DATABASE_URL` and optionally `API_PORT`; bootstrap does not explicitly load `.env`. `API_PORT` defaults to 3001. `/api` hosts Swagger, not a global route prefix.
- From the root, build shared packages first, then use `npm run lint --workspace=api`, `npm run test --workspace=api -- --runInBand`, and `npm run build --workspace=api`.
- Unit tests mock `PrismaService`. Extend behavior coverage for invalid input, missing rows, and database failures when implementing changes; existing links tests only check instantiation.
- `npm run test:e2e --workspace=api -- --runInBand` uses the real database. Verify the target, close created Nest apps, and account for bootstrap settings not applied by the test's `createNestApplication()`.
