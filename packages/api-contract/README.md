# @repo/api-contract

Pure endpoint descriptions and JSON-safe TypeScript contracts shared by `apps/api` and `apps/web`. This package does not perform HTTP calls or manage headers, sessions, caching, database access, or React state.

`src/links.ts` defines list/detail/create/update/delete URL, method, body, request, and response types. `src/types.ts` defines generic endpoint shapes. A phantom response type lets web fetch helpers infer results without exposing Prisma models.

```typescript
import { linksApi } from '@repo/api-contract';

const endpoint = linksApi.detail(1);
// { url: '/links/1', method: 'GET' }
```

Web server services and TanStack Query hooks pass these descriptions to their respective app-local fetch helpers. Nest DTOs implement the request contracts, while controllers map Prisma records into `LinkResponse` values.

## Build and verification

From the root:

```bash
npx turbo run build --filter=@repo/api-contract
npm run lint --workspace=@repo/api-contract
```

The package exports compiled ESM/declarations at the root, `/links`, and `/types`. Keep `.js` relative import specifiers in TypeScript source. There is no test script; verify contract changes through API/web behavior tests and consumer builds.

Keep request DTOs aligned with validated server inputs and keep database-only fields out of public contracts. TypeScript contracts do not provide runtime validation.

See [local agent instructions](AGENTS.md).
