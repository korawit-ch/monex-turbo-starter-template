# AI-Assisted Development

This guide explains how the repository prepares coding agents (Claude Code, Codex, Cursor and similar tools) to make safe changes, and how to keep that working as a project built from this template grows. The [project overview](overview.md#why-the-structure-is-ai-context-friendly) explains why the structure itself is AI-friendly; this guide covers the tooling around it.

The idea in one line: an agent is only as reliable as what it can read, what it can run, and what stops it. Knowledge lives in files, checks run behind one command, and dangerous commands are blocked by code rather than by prose.

## The layers

| Layer                   | Where it lives                                                   | What it gives the agent                                                                            |
| ----------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Repository instructions | Root `AGENTS.md`                                                 | System boundaries, commands, Git and environment rules, task routing                               |
| Module instructions     | `AGENTS.md` in each app and package                              | The module's contract, invariants, traps and checks, loaded when needed                            |
| Path-scoped rules       | `.claude/rules/*.md` with `paths:` frontmatter                   | Cross-cutting rules for files that match a glob, such as all tests                                 |
| Handbook                | `docs/engineering/`                                              | The intent behind each rule and the recipes for routine work                                       |
| Knowledge base          | `docs/knowledge/`                                                | Domain terms, decisions and open questions of the project                                          |
| Guards                  | `.claude/settings.json`, `.claude/hooks/`                        | Commands that are denied or need the user's confirmation, and lint and format checks on every edit |
| Workflow                | `.claude/skills/deliver-change`, `.claude/skills/extend-project` | Fixed phases with stop points, and the recipes for growing the project                             |
| Independent review      | `.claude/agents/reviewer.md`                                     | A read-only second opinion that never sees the implementer's reasoning                             |
| Checks                  | Root scripts, Husky hooks, CI                                    | The same commands locally and in CI, including `npm run test:agent-hooks`                          |

## How instructions load

- `AGENTS.md` is the single instruction format. Codex and Cursor read it, and Claude Code reads it natively (v2.1.277 and later), including a subdirectory's `AGENTS.md` when it opens a file there.
- Do not add a `CLAUDE.md` or `CLAUDE.local.md`. When one exists in the working directory or above it, Claude Code reads it _instead of_ `AGENTS.md`. For an older Claude Code version, or to keep personal notes in `CLAUDE.local.md`, set **Project instructions** to `claude-md-and-agents-md` in `/config`, or add a `CLAUDE.md` containing only `@AGENTS.md` beside every `AGENTS.md`.
- `.claude/rules/` files load alongside `AGENTS.md`. A rule with `paths:` loads only while the agent works on matching files.
- [Decision order](README.md#decision-order) settles conflicts: the task, then the nearest `AGENTS.md`, then the handbook, then nearby code.

## Guards

`.claude/settings.json` registers `.claude/hooks/guard-bash.mjs` as a `PreToolUse` hook for Bash commands. The hook runs in Claude Code sessions and their subagents, and returns one of three outcomes:

- **Deny**: force pushes, pushes to `main` or `develop`, `git reset --hard`, `git clean -f`, staging everything at once, `--no-verify`, Prisma resets and data-loss flags, Docker volume removal, and any `db:push`, `db:migrate`, `db:seed`, Prisma migrate/db command, `psql` or `pg_restore` whose database host is not local.
- **Ask**: `git commit`, `git push`, `--apply` on the template mutation scripts, and `env:distribute -- --force`.
- **No opinion**: everything else follows the normal permission flow.

The database host comes from a URL or `-h` flag in the command, then the `DATABASE_URL` environment variable, then the root `.env`. Loopback addresses, `host.docker.internal` and dotless Compose service names such as `postgres` count as local.

The command rules are data in `.claude/hooks/guard-rules.json`. To add one, add an entry and a blocked and an allowed case in `.claude/hooks/guard-bash.test.mjs`, then run `npm run test:agent-hooks`. CI runs the same tests.

A guard reduces mistakes; it is not a sandbox. Patterns can be bypassed by unusual quoting, and the hook allows a command when its input is unreadable so that a broken guard cannot block all work. Other tools need their own configuration; the rules file is the list to copy from.

### Format and lint on edit

Agent-written code must pass the same ESLint and Prettier rules as CI, so lint failures surface while the agent still has the file open instead of in CI.

- **On edit (Claude Code):** `.claude/hooks/check-on-edit.mjs` is a `PostToolUse` hook for `Edit`, `Write` and `MultiEdit`. It runs `eslint --fix` and `prettier --write` on the edited file. When ESLint errors remain, it blocks with the report, and the agent fixes them before continuing. It fails open when dependencies are missing or a tool itself crashes, and ignores files outside the repository and files Prettier ignores (including `.gitignore`).
- **On commit (every tool):** lint-staged runs the same two commands on staged files.
- **Same config as CI:** both use `--flag v10_config_lookup_from_file`, so each file is linted with its nearest workspace `eslint.config` (the web, API or package rules that `npm run lint` applies). Without the flag, ESLint uses the root config for every file, which skips the workspaces' type-aware rules: a web test with an `async` callback and no `await` passed the commit hook and failed `web` lint in CI that way.
- **Other tools:** Codex, Cursor and similar tools don't run Claude Code hooks. The root `AGENTS.md` tells them to run both commands on the files they changed, and lint-staged catches the rest at commit.
- **Tests:** `npm run test:agent-hooks` runs the tests of both hooks, and CI runs it.

## Workflow

Agents start every change with the `deliver-change` skill: scope line, mode (quick, standard or full by risk), plan for high-risk work, tests from the contract, affected checks, review by the `reviewer` agent, context updates, and a report shaped like the pull request template. Full mode covers authentication, tenant scope, the Prisma schema, `@repo/api-contract`, environment handling, `scripts/` and CI.

Give the reviewer the task and the diff range only. A reviewer that reads the implementer's reasoning tends to confirm it.

## Extend the project

### Add a feature slice

Follow the layer order in [Backend and API contracts](backend-and-api-contracts.md#adding-or-changing-a-feature) and copy the shape of the Link example:

| Layer             | Copy the shape of                                                         | Test with                                                          |
| ----------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Schema            | `model Link` in `packages/prisma/prisma/schema.prisma`                    | `npm run db:validate`, then `npm run db:generate`                  |
| Permissions       | `PERMISSIONS` in `packages/authorization/src/index.ts` (when auth exists) | `npm run test --workspace=@repo/authorization`                     |
| Contract          | `packages/api-contract/src/links.ts`                                      | Affected API and web builds                                        |
| DTO               | `apps/api/src/links/dto/`                                                 | Controller spec: invalid input is rejected                         |
| Service           | `apps/api/src/links/links.service.ts`                                     | Service spec: scope in every query, not found, conflict            |
| Mapper            | `apps/api/src/links/links.mapper.ts`                                      | Mapper spec: ISO dates, hidden fields stay hidden                  |
| Controller/module | `links.controller.ts`, `links.module.ts`, `src/app.module.ts`             | Controller spec, then `npm run test:e2e --workspace=api` if needed |
| BFF route         | `apps/web/app/api/links/` (when auth exists)                              | Web tests and build                                                |
| Data access       | `apps/web/data-access/links.server.ts`, `links.client.ts`                 | Web tests: loading, error and empty states                         |
| UI                | The nearest route-private `_components` directory                         | Web tests: keyboard, labels, submission                            |

Finish with the documentation: the owning workspaces' `AGENTS.md` and README when the slice adds a boundary or trap, and `docs/knowledge/` for new terms and decisions.

`npm run template:finalize -- --apply` removes the Link example. After that, the project's first real feature becomes the exemplar: name its files in the root `AGENTS.md` under "AI workflow and extending the project".

### Add an app

1. Preview: `npm run app:duplicate -- --source <web|api> --name <name>`.
2. Apply with `--apply` after the user confirms. The script copies the app with its `AGENTS.md` and README and rewrites their workspace paths.
3. Rewrite the new app's `AGENTS.md` for what makes it different: its audience, routes or endpoints, port and traps. A copied file that describes the source app misleads every later session.
4. Add the app to the architecture bullets of the root `AGENTS.md` and to [Architecture and modules](architecture-and-modules.md).

### Add a shared package

A package is shared only while it has more than one intentional consumer. When it does:

1. Create `packages/<name>` with `package.json` (`@repo/<name>`, explicit `exports`), a build script that emits `dist`, and the shared ESLint and TypeScript presets.
2. Add an `AGENTS.md` stating what the package owns, what it must not import (apps, frameworks it should stay free of), its public exports and its checks.
3. Add it to the root `AGENTS.md` architecture bullets, the dependency rules in [Architecture and modules](architecture-and-modules.md#dependency-direction), and the review checklist in `.claude/agents/reviewer.md` when it introduces a new boundary.

### Grow the AI context

Keep the instructions true and small as the project grows.

- **Root `AGENTS.md`** holds only system-wide rules and the task routing. Keep it under about 150 lines; move detail into a module `AGENTS.md` or the handbook and link it. It is loaded in every session, so every line costs context.
- **Add a module `AGENTS.md`** when a folder has its own contract, invariants or a trap that cost real time, for example an integration client, a billing module or a background worker. Write the rule, its reason, and the pattern to use instead.
- **Add a path-scoped rule** in `.claude/rules/` for concerns that cut across folders (all tests, all migrations, all route handlers).
- **Write rules as current behavior.** Rewrite a rule when the code changes instead of appending history; Git keeps the history. Date any status claim that will go stale.
- **Record decisions** in `docs/knowledge/decisions.md` and open questions in `docs/knowledge/open-questions.md`, so a later session starts from them instead of chat history.
- **Add guards** for new destructive or remote commands (deploy CLIs, cloud CLIs, infrastructure tools) in `.claude/hooks/guard-rules.json`, with tests.
- **Connect sources of truth.** Declare MCP servers for the issue tracker, chat and vendor API documentation in a committed `.mcp.json`, with credentials read from environment variables, never committed.
- **Add review automation** when the team grows: a CI job or bot that reviews pull requests against the repository's `AGENTS.md` files, and a required check for its must-fix findings.
- **Audit periodically.** Run `/doctor prompt-audit` in Claude Code, or ask an agent to compare every `AGENTS.md` against the code and list stale paths and commands.

## Bootstrap prompt for a new project

After creating a project from this template and running `npm run setup`, give an agent this prompt once:

```text
This project was created from the monex-turbo-starter-template. Adapt its AI context to this project.
Read docs/engineering/ai-assisted-development.md first. Investigate, propose, and change only what I approve.

1. Map what the project is: product, users, domain terms, which template options were applied
   (auth, Prisma location, assets, extra apps), and anything finalized or removed.
2. Propose, then wait for my OK:
   a. Root AGENTS.md updates: project purpose, the real apps and packages, the exemplar feature,
      and absolute rules with their reasons. Keep it under about 150 lines.
   b. Module AGENTS.md files that now describe the wrong app or need project traps.
   c. docs/knowledge/: glossary terms, business rules and decisions already made, open questions.
   d. Guards to add for this project's deploy, cloud or infrastructure commands.
   e. MCP servers for our tracker, chat and vendor documentation.
3. Rules: no commits or pushes unless I ask; local databases only; report only checks you ran.
```
