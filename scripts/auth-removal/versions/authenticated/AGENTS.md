# Repository Instructions

## Architecture and sources of truth

- This is an npm-workspaces/Turborepo template: `apps/web` (Next.js App Router), `apps/api` (NestJS), and `apps/db` (local PostgreSQL Compose service). See [README.md](README.md) for setup and known gaps.
- Runtime data flows from web services/query hooks through `@repo/api-contract` endpoint descriptions to API controllers, services, `PrismaService`, and PostgreSQL. Keep database access in the server runtime.
- Protected browser traffic flows through same-origin Next.js BFF handlers. Both Next and Nest verify the access JWT and use `@repo/authorization`; Nest guards and tenant-scoped Prisma queries are the authoritative security boundaries. See [docs/authentication.md](docs/authentication.md).
- `packages/prisma/prisma/schema.prisma` owns the database model. `packages/prisma/prisma.config.ts` configures CLI connection/schema discovery, and `packages/prisma/src/index.ts` constructs the runtime client and exposes generated database types. This package is server-only persistence infrastructure.
- `@repo/api-contract` contains explicit transport descriptions and JSON-safe request/response types. It must remain free of fetch, React, Next.js, NestJS, Prisma, and database runtime imports. API DTO classes implement request contracts for Swagger, and controllers map Prisma records to response contracts; inspect producers and consumers together when changing contracts.
- `@repo/ui` owns reusable React controls and form adapters; `@repo/design-system/shared-styles.css` owns styling tokens/utilities; `@repo/assets` owns cross-app raw visual files and SVGR-generated icon components. App feature behavior and app-only assets stay in the app.
- Shared packages must not import from apps. Frontend code must not import `@repo/prisma` or `@prisma/client`, including type-only imports; expose JSON-safe data through `@repo/api-contract` instead.
- `@repo/authorization` is framework-independent and owns only stable permission vocabulary, claim parsing, sanitized context, and pure evaluation. Dynamic business rules remain in API services.
- `docs/engineering/README.md` is the human-facing company convention index. Keep it aligned when architecture, delivery policy, or supported scripts change materially.

## Tooling and generated output

- Use npm and the root `package-lock.json`. The root manifest requires Node >=22.12; `.nvmrc` selects Node 22. Do not introduce another lockfile.
- Build shared dependencies before running app commands directly: `npx turbo run build --filter='./packages/*'`. Some packages export `dist`; `@repo/ui` has separate component/style tasks coordinated by `packages/ui/turbo.json`, without a package-level `build` script.
- Do not hand-edit Prisma client output, `dist`, `.next`, or `packages/assets/src/icons/index.ts`; use their generators. Review tracked changes after generation.
- `npm run prisma:localize:api` is a dry-run architecture migration check. Add `-- --apply` only when intentionally moving all Prisma ownership into `apps/api`; it refuses to proceed while another workspace consumes `@repo/prisma`.
- `npm run app:duplicate -- --source <web|api> --name <name>` previews app duplication; add `--apply` to create it. The script copies the source's current shared/localized ownership state while excluding generated output and local environment files.
- `npm run auth:remove` previews scoped authentication removal; `-- --apply` uses the versioned files under `scripts/auth-removal` to three-way merge shared integration files, restore replaced files, and delete verified auth-owned files. It requires a clean tree, preserves compatible later changes, and does not change database state.
- `npm run template:finalize` previews removal of the Link vertical-slice example and one-time template migration tooling. Its `--apply` mode requires a clean tree, changes source/schema files, removes itself, and never changes database state.
- ESLint presets live in `packages/eslint-config`, TypeScript presets in `packages/typescript-config`, and shared Jest presets in `packages/jest-config`. The web app currently uses its own Jest config; API unit tests consume the shared Nest preset.
- Preserve existing ESM/CommonJS boundaries. `api-contract` uses ESM with `.js` import specifiers; API uses CommonJS compilation. Check consumers before changing package exports or compiler settings.
- Commit messages require a scope, as defined in `commitlint.config.js`; Husky runs lint-staged and Turbo type checks on commit.

## Git workflow

- `develop` is the integration branch. Create normal feature/fix/docs/refactor/chore branches from `develop` and target their PRs/merges back to `develop`; retain merge boundaries for completed topics.
- `main` holds releases. Prepare `release/vX.Y.Z` from `develop`, verify it, merge to `main`, and synchronize release changes back into `develop`.
- Branch urgent production fixes from `main` as `hotfix/*`; propagate completed fixes to `develop` and any affected active release branch.
- There is no configured release/tag/publish automation. Inspect current tags, manifests, CI, and remote refs before deciding release/version operations; do not assume a merge deploys anything.
- Fetch and inspect source/base/target history before Git operations. A deliberate local rewrite can diverge from remote tracking refs; never publish it with an ordinary or force push without explicit authorization.
- Keep unrelated working changes and local history backups out of commits. Preserve existing README sections/examples when updating documentation; prefer targeted corrections and additions.

## Environment and stateful commands

- Root `.env` is the intended local configuration source. `env:setup` creates it if missing; `env:distribute` links it into apps and non-config packages. Distribution removes existing regular target `.env` files; inspect before running it on an existing checkout.
- A symlink does not ensure a runtime loads variables. Next.js and Prisma CLI have loading paths; API bootstrap and the seed client do not explicitly load dotenv. The Prisma CLI config checks the package and root environment paths. Preserve explicit runtime environment handling when changing startup.
- Protected browser traffic uses same-origin BFF routes; `API_INTERNAL_URL` is server-only. Never expose auth secrets or the internal API URL through `NEXT_PUBLIC_*` variables.
- `db:push`, `db:migrate`, and `db:seed` change persistent data. Inspect the target first. Auth seeding is repeatable by stable identities but rotates the seeded password hash. Never use database reset/volume removal as routine verification.
- `npm run assets:localize:web` is a non-mutating preflight by default. Its `--apply` mode removes `packages/assets` only after confirming no workspace other than web consumes it; review architecture documentation after using the one-time migration.

## Verification and documentation

- Discover affected workspace scripts before choosing checks. Typical sequence: shared builds, affected lint/tests, relevant type checks, then affected app builds.
- Root commands: `npm run lint` (workspace lint plus Prettier), `npm run test`, `npm run test:e2e`, `npx turbo run check-types`, and `npm run build`.
- `check-types` exists only in web, UI, and assets; other TypeScript packages/API are checked by builds. Turbo tests have no build dependencies, so prepare shared outputs first.
- API e2e tests require PostgreSQL and initialize the real Prisma service. CI currently runs lint, formatting, type checks, and builds, but not tests.
- For documentation-only changes, run Prettier on the changed Markdown files, check relative links/command names against the repository, and run `git diff --check`. Do not reformat unrelated files.
- Report failed, skipped, and cached checks accurately. Passing compilation is not proof of database, authorization, or request behavior.
- Keep instructions durable and scoped. Update the affected README/AGENTS when boundaries, contracts, environment handling, or verification change; put unresolved implementation gaps in READMEs rather than describing them as established guarantees.
