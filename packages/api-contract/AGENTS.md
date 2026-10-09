# API Contract Instructions

- This package exports pure endpoint descriptions and TypeScript contracts, not a network client. Keep fetch, authentication, caching, React, Next.js, and Prisma runtime code in their owning applications.
- `src/links.ts` owns URL/method/body descriptions and link request/response contracts; `src/types.ts` owns generic endpoint shapes. Preserve the phantom response type used by web fetch helpers for inference.
- Do not import Prisma types. Public responses must describe JSON wire values explicitly, including ISO timestamp strings and nullable fields.
- Inspect producers in `apps/api/src/links` and consumers in `apps/web/lib/fetch`, `services`, and `queries` together. Align runtime serialization, nullable/optional fields, status codes, and error behavior deliberately.
- This is ESM with NodeNext compilation; retain `.js` relative import specifiers and the root/links/types public export paths in `package.json`.
- Build with `npm run build --workspace=@repo/api-contract`; lint with `npm run lint --workspace=@repo/api-contract`. There is no package test script; verify changed contracts through affected API/web tests and builds.
