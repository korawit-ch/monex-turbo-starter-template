# @repo/api-client

Pure endpoint descriptions and TypeScript contracts consumed by `apps/web`. This package does not perform HTTP calls or manage headers, sessions, caching, or React state.

`src/links.ts` defines list/detail/create/update/delete URL, method, and optional body values. `src/types.ts` defines endpoint shapes and manually maintained request DTOs. A phantom response type lets web fetch helpers infer results. Imports from Prisma are type-only.

```typescript
import { linksApi } from '@repo/api-client';

const endpoint = linksApi.detail(1);
// { url: '/links/1', method: 'GET' }
```

Web server services and TanStack Query hooks pass these descriptions to their respective app-local fetch helpers. Nest controllers/DTOs are maintained separately in `apps/api/src/links`; changes must be coordinated with those producers.

## Build and verification

From the root:

```bash
npx turbo run build --filter=@repo/api-client
npm run lint --workspace=@repo/api-client
```

The package exports compiled ESM/declarations at the root, `/links`, and `/types`. Keep `.js` relative import specifiers in TypeScript source. There is no test script; verify contract changes through API/web behavior tests and consumer builds.

## Improvements

- **IMPORTANT:** Define an accurate serialized Link response: the exported Prisma model uses `Date`, but JSON returns timestamp strings and the fetch helpers do not revive dates.
- **IMPORTANT:** Align DELETE's response. It is typed as `void` here, while the controller returns the deleted Link record.
- **IMPORTANT:** Keep manual request DTOs aligned with validated server inputs, including nullable descriptions. Do not substitute broad Prisma write-input types for a deliberate public request contract.

See [local agent instructions](AGENTS.md).
