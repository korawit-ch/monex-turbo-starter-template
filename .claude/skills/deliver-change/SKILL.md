---
name: deliver-change
description: Delivery workflow for every change to this repository — feature, fix, refactor, schema, contract, configuration, script or documentation. Pins the scope, plans high-risk work before editing, writes tests from the contract, runs the affected checks, gets an independent review from the reviewer agent, and reports with evidence for the pull request template. Not for read-only questions.
---

# Deliver a change

Follow the phases in order. Each one names where its rules live; read them there instead of relying on memory.

## 1. Scope

- Write one line before editing: **Scope:** what changes · what is context only · what is out.
- Run `git status`. Changes already present belong to someone else: leave them out of your edits and commits.
- Read the root `AGENTS.md`, the nearest `AGENTS.md` of every workspace you will touch, and the handbook page for the area (`docs/engineering/README.md` routes to it). For domain terms and decisions, read `docs/knowledge/`.

## 2. Pick the mode

| Mode     | Use when                                                                                                                                                                             | Depth                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| quick    | Documentation, copy, or a single-file change with no contract or data effect                                                                                                         | Steps 4–6; review optional                                     |
| standard | A change inside one workspace                                                                                                                                                        | All steps; short plan in the conversation                      |
| full     | Authentication, authorization or tenant scope, Prisma schema, `@repo/api-contract`, environment handling, `scripts/`, CI, or a change spanning three or more files across workspaces | All steps; written plan and the user's go-ahead before editing |

## 3. Plan (standard and full)

- Trace the real path for the change: route or page → BFF handler → contract → controller → DTO validation → guard → service → Prisma query → mapper → response.
- List the files per layer, the open questions, and the checks you will run. Ask the questions; do not decide product behavior silently.
- Record lasting decisions in `docs/knowledge/decisions.md` and unresolved ones in `docs/knowledge/open-questions.md`.
- In full mode, wait for the user's go-ahead.

## 4. Build, contract first

- Follow the layer order in `docs/engineering/backend-and-api-contracts.md` ("Adding or changing a feature"). The files to copy and the per-layer tests are in `docs/engineering/ai-assisted-development.md` under "Extend the project".
- Write the tests from the contract before the implementation and see them fail once.
- Change generators and sources, never generated output.

## 5. Verify

- Run the affected workspace checks first, then the repository checks listed in the root `AGENTS.md`. Shared packages build before app commands.
- Report every check as it actually ran: passed, failed, skipped or cached. Never report a check you did not run.

## 6. Review

- Standard and full: have the `reviewer` agent review the diff. Give it the task statement and the diff range only, not your reasoning, so it judges the change on its own.
- Fix "Must fix" findings, rerun the affected checks, and list the rest in the report.

## 7. Update the context

- When a boundary, contract, command, environment variable or decision changed, update the nearest `AGENTS.md`, the README, the handbook page and `docs/knowledge/` in the same change.
- A new workspace gets its own `AGENTS.md` (see "Grow the AI context" in the AI guide).

## 8. Report

- Fill the pull request template: what happened, the owning workspace and flow, risks, and the commands with their results.
- Commit or push only when the user asks; the repository guard asks before either.
