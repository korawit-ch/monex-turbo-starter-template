# Scripts and Template Customization

## Safety model

Commands fall into three groups:

1. Read-only verification: lint, tests, builds, type checks, and dry runs.
2. Workspace mutations: app duplication, ownership localization, auth removal, and template finalization. These preview by default and require `--apply`.
3. Persistent-state mutations: Prisma push/migrate/seed and database lifecycle commands. Confirm the target environment first.

Run workspace mutations from a clean branch, review the preview, apply once, inspect the diff, run `npm install` when requested, and verify before committing. Do not combine several ownership migrations in one unreviewed step.

## Guided project setup

```bash
npm run setup
npm run setup -- --dry-run
npm run setup -- --status
```

The interactive setup assistant links the existing guarded scripts into one workflow. On its first successful run it:

1. asks whether authentication is needed;
2. asks whether Prisma should stay in the shared server-only package or move into `apps/api`;
3. asks whether assets should stay shared or move into `apps/web`;
4. asks how many additional frontend and backend apps are needed, collects every app name, and then optionally duplicates the resulting web or API app state;
5. creates the root `.env` when missing and distributes it to eligible workspaces; and
6. writes ignored local state to `.monex-setup.json` so later runs open the maintenance menu instead of repeating initial setup.

Each mutation runs its normal dry-run preflight and requires an exact confirmation phrase. Use `--dry-run` to exercise the complete questionnaire without changing source, environments, dependencies, or setup state.

### App planning during setup

The starter's existing `apps/web` and `apps/api` are the duplication sources and are not included in the requested counts. Both counts default to `0` and must be non-negative whole numbers. The assistant collects the frontend and backend counts before asking for the corresponding app details:

```text
How many additional frontend applications should this project have? [0]: 2
How many additional backend applications should this project have? [0]: 1
Frontend application 1 name: admin
Frontend application 1 development port (optional, press Enter to keep it): 3004
Frontend application 2 name: customer
Frontend application 2 development port (optional, press Enter to keep it): 3005
Backend application 1 name: worker
Backend application 1 development port (optional, press Enter to keep it): 4001
```

Names must be lowercase, unscoped npm package names no longer than 214 characters. They must begin and end with a letter or number and may otherwise contain letters, numbers, dots, hyphens, or underscores. A name cannot be repeated in the same plan or match an existing directory under `apps`. The underlying duplication preflight also rejects an existing destination or workspace package name.

The development port is optional. When omitted, the copy keeps the source app's current port. When supplied, the web copy updates its `dev` script and the API copy updates its `API_PORT` fallback.

The assistant gathers and validates the complete plan before invoking the duplication script. It then runs the normal dry-run preflight for each app. Outside `--dry-run` mode, each app requires its own `CREATE` confirmation; declining one app skips it without cancelling the remaining plan. Copies use `--skip-install`, and the setup assistant runs `npm install` once after all selected architecture changes and app copies finish.

The same batch planner is available from the later-run maintenance menu through both the architecture review and app-duplication-only actions.

The initial workflow never runs `template:finalize`. Keep the Link vertical slice as an executable architecture example while the team learns or replaces it. On later runs, the assistant exposes finalization as a separate preview-first action; applying it also removes the setup assistant and other one-time template tools.

## Environment scripts

| Command                  | Behavior                                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `npm run env:setup`      | Creates root `.env` from `.env.example` only when missing.                                               |
| `npm run env:distribute` | Links workspace `.env` targets to root `.env`; regular files are preserved unless `--force` is explicit. |
| `npm run dev`            | Runs `env:distribute`, then starts workspace development tasks.                                          |

Use `npm run env:distribute -- --force` only after backing up or merging every regular workspace `.env`; forced distribution deletes those files before creating symlinks. A symlink does not make every runtime load dotenv. API and seed commands still need the documented process environment.

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

Use this only after the team has replaced the Link vertical-slice example or decided it is no longer needed. It removes the example API module, BFF routes, web link data access/demo, Link API contract, Link Prisma model/seed data, the guided setup assistant, and one-time template migration scripts. It also removes its own command. It keeps operational environment/database scripts and the engineering handbook.

The finalizer recognizes the unmodified starter example and intentionally stops if overlapping project work makes automatic removal ambiguous. Duplicated apps retain their copied examples and must be reviewed separately.

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
