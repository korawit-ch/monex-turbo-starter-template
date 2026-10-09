# Scripts and Template Customization

## Safety model

Commands fall into three groups:

1. Read-only verification: lint, tests, builds, type checks, and dry runs.
2. Workspace mutations: app duplication, ownership localization, auth removal, and template finalization. These preview by default and require `--apply`.
3. Persistent-state mutations: Prisma push/migrate/seed and database lifecycle commands. Confirm the target environment first.

Run workspace mutations from a clean branch, review the preview, apply once, inspect the diff, run `npm install` when requested, and verify before committing. Do not combine several ownership migrations in one unreviewed step.

## Environment scripts

| Command                  | Behavior                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| `npm run env:setup`      | Creates root `.env` from `.env.example` only when missing.                                             |
| `npm run env:distribute` | Replaces workspace `.env` targets with symlinks to root `.env`. Preserve existing regular files first. |
| `npm run dev`            | Runs `env:distribute`, then starts workspace development tasks.                                        |

A symlink does not make every runtime load dotenv. API and seed commands still need the documented process environment.

## Database scripts

`db:start`, `db:stop`, `db:up`, `db:down`, `db:logs`, and `db:ps` operate on local Compose infrastructure. `db:generate` and `db:validate` do not intentionally change database data. `db:push`, `db:migrate`, and `db:seed` do.

## Duplicate an app

```bash
npm run app:duplicate -- --source web --name admin --port 3004
npm run app:duplicate -- --source web --name admin --port 3004 --apply
```

The script copies the source's current shared/local ownership state and excludes caches, generated output, and local environment files. It refuses existing destinations and duplicate package names. Use `--source api` for a Nest app.

## Localize shared infrastructure

Keep a package shared while two or more apps consume it. Localize it when only one app owns it and independent deployment/maintenance is more valuable than central reuse.

### Prisma into API

```bash
npm run prisma:localize:api
npm run prisma:localize:api -- --apply
```

This moves schema, seed, config, client, and dependencies into `apps/api`. It refuses to proceed while another workspace consumes `@repo/prisma`. It does not change database data.

### Assets into web

```bash
npm run assets:localize:web
npm run assets:localize:web -- --apply
```

This moves raw assets and generated icon components into `apps/web`, rewrites imports, and keeps company-wide `@repo/ui` and `@repo/design-system` packages shared.

There is intentionally no automatic “combine everything” command. To centralize local code again, create/reuse the correct shared package, move one responsibility at a time, update consumers, verify, and commit the boundary change separately.

## Remove authentication

```bash
npm run auth:remove
npm run auth:remove -- --apply
```

The versioned three-way merge preserves compatible later edits, removes auth-owned files, restores auth-neutral files, and leaves database state unchanged. Review the remaining Prisma schema/data and environment variables separately.

## Finalize the starter template

```bash
npm run template:finalize
npm run template:finalize -- --apply
```

Use this only after the team has replaced the Link vertical-slice example or decided it is no longer needed. It removes the example API module, BFF routes, web link data access/demo, Link API contract, Link Prisma model/seed data, and one-time template migration scripts. It also removes its own command. It keeps operational environment/database scripts and the engineering handbook.

The finalizer changes source/schema files but never changes a database. Create and review the required migration after applying it. Link-named authorization permissions remain as concrete auth examples until the first real domain permission replaces them; do not ship placeholder permission vocabulary unnoticed.

## Removed legacy separation scripts

The former `separate-frontend.sh` and `separate-backend.sh` scripts were removed because they deleted workspaces before copying template files that did not exist. To split deployment ownership:

1. duplicate the target app if needed;
2. localize Prisma or assets with the guarded scripts;
3. verify no remaining workspace consumers;
4. remove unused workspaces in a dedicated branch;
5. regenerate the lockfile and update root docs/config;
6. run full verification.

Repository separation changes authentication, environment, deployment, and package boundaries; it should be reviewed as an architecture migration, not a cleanup shortcut.
