# Engineering Handbook

This handbook is the company-wide source of truth for routine engineering work in this repository. The root [README](../../README.md) remains the setup and command entry point. `AGENTS.md` files contain concise instructions for automated contributors; this handbook explains the same architecture for people.

## Read this first

| Guide                                                                       | Use it when                                                                                                       |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [Architecture and modules](architecture-and-modules.md)                     | You need to understand the repository, runtime boundaries, or package ownership.                                  |
| [Frontend conventions](frontend.md)                                         | You are adding routes, components, data access, forms, or assets.                                                 |
| [Backend and API contracts](backend-and-api-contracts.md)                   | You are changing Prisma, NestJS, validation, Swagger, or a shared request/response.                               |
| [Coding standards](coding-standards.md)                                     | You need naming, TypeScript, control-flow, rendering, testing, lint, or formatting rules.                         |
| [Delivery workflow](delivery-workflow.md)                                   | You are creating a branch, commit, pull request, release, or hotfix.                                              |
| [Scripts and template customization](scripts-and-template-customization.md) | You are running database, environment, duplication, localization, auth-removal, or template-finalization scripts. |

## Decision order

When guidance conflicts, use this order:

1. The current task or accepted technical decision.
2. The nearest `AGENTS.md` file.
3. This handbook.
4. Existing code next to the change.
5. General framework convention.

Do not copy a pattern from another project when this repository already has an established boundary.

## Core rules

- Keep PostgreSQL and Prisma types behind the API boundary.
- Share JSON-safe transport contracts through `@repo/api-contract`; never share Prisma models with the frontend.
- Put reusable, product-neutral controls in `@repo/ui`; keep feature behavior in the owning app.
- Prefer the nearest route-private `_components` directory for page-specific UI.
- Make database scope, permission checks, validation, and response mapping explicit.
- Preview guarded scripts before using `--apply`.
- Keep changes reviewable: one topic per branch and coherent commits with passing checks.
