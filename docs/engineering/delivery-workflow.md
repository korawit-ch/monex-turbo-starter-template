# Delivery Workflow

## Branches

Fetch first, then branch from the correct base.

| Work              | Base      | Branch                  |
| ----------------- | --------- | ----------------------- |
| Feature           | `develop` | `feature/<short-name>`  |
| Fix               | `develop` | `fix/<short-name>`      |
| Refactor          | `develop` | `refactor/<short-name>` |
| Documentation     | `develop` | `docs/<short-name>`     |
| Chore             | `develop` | `chore/<short-name>`    |
| Release           | `develop` | `release/vX.Y.Z`        |
| Production hotfix | `main`    | `hotfix/<short-name>`   |

Use `feature/`, never `feat/`, for branch names. Keep one reviewable topic per branch. Merge normal work back to `develop` while retaining topic merge boundaries.

## Commits

Commit messages follow Conventional Commits and require a scope:

```text
type(scope): imperative summary
```

Examples:

```text
feat(orders): add order creation contract
fix(auth): reject revoked sessions
docs(engineering): document release workflow
refactor(web): move route-owned components
```

Allowed types are `build`, `chore`, `docs`, `feat`, `fix`, `refactor`, `test`, and `release`. Use lower-case or kebab-case scopes. Keep commits coherent: contracts, implementation, tests, and documentation may be separate commits when each remains understandable and buildable.

## Git hooks

On commit:

1. Husky runs `lint-staged`.
2. ESLint fixes staged TypeScript/JavaScript where safe.
3. Prettier formats staged supported files.
4. Turbo runs configured type checks.
5. The `commit-msg` hook runs Commitlint.

Hooks are guardrails, not a replacement for running tests. Do not bypass hooks to land a known failure.

## Pull requests

PR titles must use one of these formats:

```text
[PROJECT-123] concise imperative summary
[TBD] concise imperative summary
```

- `PROJECT` is the uppercase project code.
- `123` is the task number.
- Use `[TBD]` only when no task exists; replace it when a task is created.
- Keep the title about the outcome, not the implementation diary.

Complete every section in `.github/PULL_REQUEST_TEMPLATE.md`. Proof of work must show what was verified. For visual changes, attach an image or short recording and include accessible alt text:

```md
![Order form validation shown at desktop width](https://github.com/.../asset.png)
```

For non-visual changes, include command output or a concise test matrix. Never include credentials, tokens, customer data, or private infrastructure in screenshots or logs.

Reviewers should be able to determine:

- what behavior changed;
- why the chosen layer owns it;
- request/data/side-effect flow;
- risk and rollback implications;
- exact checks performed;
- visual evidence when applicable.

## CI

Pull requests validate the title and run dependency installation, Prisma generation, package builds, lint, formatting, type checks, and builds. Unit/e2e coverage may still need to be run locally until explicitly added to CI.

## Release flow

1. Ensure `develop` contains the intended changes and is green.
2. Inspect existing tags, package versions, migration requirements, and deployment configuration.
3. Create `release/vX.Y.Z` from `develop`.
4. Update release metadata/changelog if the product uses them.
5. Run full lint, tests, type checks, builds, and migration validation.
6. Test upgrade and rollback/forward-fix steps for schema changes.
7. Open a release PR to `main` using the normal title and proof rules.
8. Tag the verified merge only when the release process requires it.
9. Merge/synchronize release changes back into `develop`.

This repository has no automatic publish or deployment pipeline. A merge or tag does not prove that software was deployed.

For a production hotfix, branch from `main`, verify the smallest safe change, merge to `main`, then propagate it to `develop` and any affected active release branch.
