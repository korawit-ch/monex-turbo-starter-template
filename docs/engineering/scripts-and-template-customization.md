# Scripts and Template Customization

## Safety model

Commands fall into three groups:

1. Read-only verification: lint, tests, builds, type checks, and dry runs.
2. Workspace mutations: app duplication, ownership localization, auth removal, and template finalization. These preview by default and require `--apply`.
3. Persistent-state mutations: Prisma push/migrate/seed and database lifecycle commands. Confirm the target environment first.

Run workspace mutations from a clean branch, review the preview, apply once, inspect the diff, run `npm install` when requested, and verify before committing. Do not combine several ownership migrations in one unreviewed step.

## Guided project setup

The interactive setup assistant in `scripts/setup-project.mjs` connects the existing guarded migration scripts into one workflow. It detects the current filesystem layout instead of assuming the starter is unchanged.

### Command modes

| Command                      | Behavior                                                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run setup`              | Runs the first-time questionnaire or opens the maintenance menu when local setup state exists.                                           |
| `npm run setup -- --dry-run` | Runs the same questions and child-script preflights without applying source changes, creating environment links, or writing setup state. |
| `npm run setup -- --status`  | Prints detected authentication, Prisma, asset, and guided-setup state, then exits without prompting.                                     |
| `npm run setup -- --help`    | Prints supported options and exits.                                                                                                      |

The assistant supports both an interactive terminal and newline-delimited standard input. Non-interactive input must provide enough answers for the selected path; otherwise the command stops with an error.

### Detection and local state

Before prompting, the assistant detects:

- authentication from `apps/api/src/auth`;
- shared Prisma ownership from `packages/prisma/package.json` or API-local ownership from `apps/api/prisma/schema.prisma`;
- shared assets from `packages/assets/package.json` or web-local assets from `apps/web/assets`; and
- whether `.monex-setup.json` exists.

The ignored `.monex-setup.json` file contains a state version, completion timestamp, and architecture snapshot. Its existence selects the maintenance menu on later runs, but the snapshot is not treated as the architecture source of truth. Every run detects the current source tree again. Deleting the file reopens the first-run workflow without reversing any source changes.

### First-run flow

When `.monex-setup.json` is absent, the assistant:

1. asks whether authentication is needed;
2. asks whether Prisma should stay in the shared server-only package or move into `apps/api`;
3. asks whether assets should stay shared or move into `apps/web`;
4. asks how many additional frontend and backend apps are needed, collects every app name, and then optionally duplicates the resulting web or API app state;
5. previews and optionally applies the selected source changes in a fixed order;
6. runs `npm install` once if at least one source change was applied;
7. creates the root `.env` when missing and distributes it to eligible workspaces; and
8. writes `.monex-setup.json` so later runs open the maintenance menu.

The default answers keep authentication, shared Prisma, shared assets, and no additional apps. Ownership questions are omitted when the corresponding shared package is no longer present.

### Mutation order and confirmations

The questionnaire collects the plan before changing files. Selected mutations then run in this order:

```text
authentication removal
  -> Prisma localization
  -> asset localization
  -> app duplication
  -> one npm install
  -> environment creation/distribution
  -> local setup state
```

Authentication removal runs first because its versioned merge snapshots describe the shared starter layout. Localization runs before duplication so copied apps inherit the selected shared or app-local ownership state.

Every source mutation runs its standalone dry-run preflight before asking for an exact confirmation phrase:

| Mutation                               | Confirmation        | Important effect                                                                                        |
| -------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------- |
| Remove authentication                  | `REMOVE AUTH`       | Deletes verified auth-owned files and three-way merges shared integration files.                        |
| Localize Prisma                        | `LOCALIZE PRISMA`   | Moves schema, seed, client, and CLI ownership into `apps/api`, then removes `packages/prisma`.          |
| Localize assets                        | `LOCALIZE ASSETS`   | Moves raw assets and icon generation into `apps/web`, then removes `packages/assets`.                   |
| Duplicate an app                       | `CREATE`            | Creates one requested workspace; each planned app is confirmed independently.                           |
| Replace regular workspace `.env` files | `REPLACE ENV FILES` | Deletes those regular files and replaces them with root `.env` symlinks.                                |
| Finalize the template                  | `FINALIZE TEMPLATE` | Removes the Link example and one-time template/setup tooling; available only from the maintenance menu. |

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

### Environment and dependency finalization

Guarded child scripts run with `--skip-install`, allowing the assistant to refresh dependencies once after all selected source mutations finish. If no source mutation is applied, the initial workflow skips `npm install`.

The assistant then runs `scripts/setup-env.js`, which creates the root `.env` only when it is missing, followed by `scripts/distribute-env.js`. Existing symlinks are kept. Existing regular workspace `.env` files are preserved and cause distribution to return a non-zero status; the assistant then explains the data-loss risk and offers the separate `REPLACE ENV FILES` confirmation before retrying with `--force`.

Environment distribution is skipped completely in `--dry-run` mode. A successful non-dry initial run records setup state even when the user previews but declines every optional source mutation.

### Later-run maintenance menu

When `.monex-setup.json` exists, `npm run setup` offers:

| Action                              | Behavior                                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Review/change architecture          | Re-detects the current layout, offers only still-applicable auth/ownership changes, and uses the same batch app planner. |
| Duplicate apps only                 | Collects a frontend/backend duplication plan without revisiting authentication or ownership.                             |
| Create/distribute environment files | Runs environment creation and guarded symlink distribution, then refreshes setup state.                                  |
| Preview/apply template cleanup      | Runs the finalizer preflight and requires `FINALIZE TEMPLATE` before applying it.                                        |
| Show status                         | Prints detected architecture and setup state without changing files.                                                     |
| Exit                                | Closes the assistant without changing files.                                                                             |

Architecture review and app duplication run `npm install`, redistribute the environment, and refresh setup state only when at least one source change is applied. Declining every confirmation leaves those follow-up steps untouched.

### Failure and recovery behavior

The setup assistant is an orchestrator, not a cross-script transaction. A failed child preflight stops the workflow, but a mutation confirmed earlier in the sequence may already be applied. Inspect `git status` and the child-script output before retrying. Run the workflow from a clean branch so each applied mutation can be reviewed or reverted independently.

The setup workflow does not update PostgreSQL data. Prisma localization moves source ownership only, authentication removal leaves stored rows unchanged, and template finalization changes source/schema files without applying a database migration. Database push, migrate, and seed commands remain separate stateful operations.

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
