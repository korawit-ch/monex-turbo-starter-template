---
name: extend-project
description: Grow a project built from this template — add a feature resource end to end, add an app, add a shared package, or extend the AI context (AGENTS.md files, rules, knowledge base, guards) as the project gets bigger. Use when the request is "add a <resource>", "new app", "new package", "split this module", or when instructions no longer fit the codebase. Runs inside the deliver-change workflow.
---

# Extend the project

The recipes live in `docs/engineering/ai-assisted-development.md` so every tool and every person reads the same steps. Open the section for the request, follow it, and run it inside the `deliver-change` workflow (scope, plan, tests first, checks, review).

| Request                                                    | Section in the AI guide      | Command it relies on                                         |
| ---------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------ |
| New resource or feature (schema to UI)                     | Add a feature slice          | `npm run db:validate`, `npm run db:generate`                 |
| New web or API app                                         | Add an app                   | `npm run app:duplicate -- --source <web\|api> --name <name>` |
| New shared package                                         | Add a shared package         | `npx turbo run build --filter=<package>`                     |
| Instructions outgrew the code, or the project grew a layer | Grow the AI context          | `npm run test:agent-hooks` after guard changes               |
| A command the agent must never run, or must ask before     | Grow the AI context → Guards | `npm run test:agent-hooks`                                   |

Rules that hold for every extension:

- Preview every template script first; `--apply` needs the user's confirmation (the guard asks).
- Copy the shape of the closest existing slice, not its names. If `template:finalize` already removed the Link example, use the project's first real feature as the exemplar and name it in the root `AGENTS.md`.
- Every new workspace ships with its own `AGENTS.md` in the same change.
