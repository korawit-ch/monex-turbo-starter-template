# Authorization Package Instructions

- Keep the permission vocabulary complete, explicit, and shared by Next and Nest.
- Treat decoded JWT payloads as untrusted. Reject missing claims, wrong types, malformed arrays, and unknown permissions before producing `AuthorizationContext`.
- Keep `can()` pure and limited to stable permission/tenant scope. Database state, ownership, workflow transitions, limits, and other dynamic rules belong in API services and scoped Prisma queries.
- Do not import React, Next.js, NestJS, Prisma, cookie/JWT libraries, network clients, or environment configuration.
- Run `npm run build --workspace=@repo/authorization`, `npm run lint --workspace=@repo/authorization`, and `npm run test --workspace=@repo/authorization` after changes.
