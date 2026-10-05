# API Contract Instructions

- This package exports pure endpoint descriptions and TypeScript contracts, not a network client. Keep fetch, authentication, caching, React, Next.js, and Prisma runtime code in their owning applications.
- `src/links.ts` owns URL/method/body descriptions; `src/types.ts` owns endpoint shapes and manually maintained request DTOs. Preserve the phantom response type used by web fetch helpers for inference.
- Prisma imports must be type-only. The exported `Link` currently describes database values; JSON dates are strings. API delete currently returns the deleted record although this package declares `void`. See [README.md](README.md) before changing these contracts.
- Inspect producers in `apps/api/src/links` and consumers in `apps/web/lib/fetch`, `services`, and `queries` together. Align runtime serialization, nullable/optional fields, status codes, and error behavior deliberately.
- This is ESM with NodeNext compilation; retain `.js` relative import specifiers and the root/links/types public export paths in `package.json`.
- Build with `npm run build --workspace=@repo/api-client`; lint with `npm run lint --workspace=@repo/api-client`. There is no package test script; verify changed contracts through affected API/web tests and builds.
