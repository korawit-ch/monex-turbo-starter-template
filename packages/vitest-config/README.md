# @repo/vitest-config

Shared [Vitest](https://vitest.dev/) presets. Each workspace's `vitest.config.ts` calls one of them:

- `@repo/vitest-config/node`: `nodeConfig()` for framework-free packages (`src/**/*.spec.ts`, Node environment); used by `@repo/authorization`, `@repo/api-contract` and `@repo/prisma`.
- `@repo/vitest-config/nest`: `nestConfig()` for NestJS apps. It compiles with SWC (`unplugin-swc`) so decorator metadata exists for Nest's dependency injection; used by `apps/api` for unit and e2e tests.
- `@repo/vitest-config/react`: `reactConfig()` for React apps (`**/*.test.{ts,tsx}`, jsdom, automatic JSX runtime); used by `apps/web` and `@repo/ui`.

All presets restore mocks, environment stubs and global stubs before each test, and none enables Vitest globals: import `describe`, `it`, `expect` and `vi` from `vitest`.

The presets are plain ES modules with `.d.mts` declarations, so the package needs no build step. Consumers install `vitest` themselves (peer dependency); `nest` also needs `unplugin-swc` and `@swc/core`, and `react` needs `jsdom`, installed in the consuming workspace.
