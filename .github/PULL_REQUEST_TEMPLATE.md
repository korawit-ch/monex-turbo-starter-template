<!--
PR title: [PROJECT-123] concise imperative summary
Use [TBD] only when no task exists yet.

Fill this as the work happens, not at the end: each section matches a step
of the deliver-change workflow (.claude/skills/deliver-change). Replace each
hint; write "none" or "not applicable" with a reason instead of deleting a
section. Never tick a box or list a check that did not run on this branch.
-->

[Link to ticket](https://linear.app/criclabs/issue/LINEAR-STORY-ID) <!-- or: TBD -->

## What happened 📌

- What behavior changed, and for whom?
- Why is the change needed? Name the acceptance criterion or decision it answers.

## Plan 🧭

- **Mode:** quick / standard / full, because <the risk areas touched: auth, tenant scope, Prisma schema, `@repo/api-contract`, environment, `scripts/`, CI; or "none">.
- **Scope:** changes <…> · context only <…> · out of scope <…>.
- **Plan:** <link to the plan or the ticket comment that holds it, or the steps below; quick mode: "none">.
- **Open questions:** <none, or each question with who answers it>. Decisions are recorded in `docs/knowledge/decisions.md`: <yes / none made>.

<!-- Standard and full: the steps as planned, one line each. Quick: delete the list. -->

1. <step>

### Deviations from the plan

<!-- One row per change of course: something found mid-way, a plan step that turned out wrong, a human decision. Write "none" when the work followed the plan. -->

| What changed | Why | Decided by |
| ------------ | --- | ---------- |

## Insight 🔍

- **Owner:** which application or package owns the change, and why that layer.
- **Flow:** the path the change runs through (page or route → BFF → contract → controller → validation → guard → service → database → mapper → response) and its side effects (writes, external calls, cache, jobs).
- **Effects elsewhere:** consumers checked for every changed contract, type, route, permission, environment variable or script, including other apps and the template scripts (`auth:remove`, `app:duplicate`, `template:finalize`, localize). Say how you checked, or "none".
- **Risks and assumptions:** what can go wrong, rollback, deploy or migration order. Mark anything not verified in code as (INFERRED).

## Proof Of Work 📸

### Requirement → code → test

| Requirement (acceptance criterion or decision) | Code (`file:line`) | Test |
| ---------------------------------------------- | ------------------ | ---- |

### Checks

<!-- Only checks that ran on this branch; add focused workspace checks. Note when a new test was proven to fail (behavior broken once, test red, restored). -->

| Check      | Command                     | Result |
| ---------- | --------------------------- | ------ |
| Lint       | `npm run lint`              |        |
| Types      | `npx turbo run check-types` |        |
| Unit tests | `npx turbo run test`        |        |
| Build      | `npx turbo run build`       |        |

### Review

<!-- Standard and full: who reviewed (the reviewer agent given only the task and the diff, or a person), each finding and what was done about it. Quick: "skipped (quick)". -->

- <finding> → <fixed in commit / answered with reason>

### Visual evidence

<!-- Required for visual changes. Attach an image/video to GitHub, then replace the URL. Use useful alt text. For non-visual changes, write "Not applicable — non-visual change." -->

![Describe the verified UI state](https://github.com/user-attachments/assets/replace-me)

### Not verified

<!-- What could not be checked and why (needs a database, a signed-in session, an external service, production data). Write "none" only when everything above was verified. -->

## After merge

<!-- Who must do what, and when: run a migration, set an environment variable, re-seed, deploy another repository first, tell someone. Write "nothing" when nothing is needed. -->

## Checklist

- [ ] Every check listed above ran on this branch, and failures are explained
- [ ] Database migration or persistent-state impact was reviewed, if applicable
- [ ] `AGENTS.md`, handbook and `docs/knowledge/` still describe the code, if boundaries, commands or decisions changed
- [ ] No secrets, tokens, customer data, or private infrastructure appear in evidence
