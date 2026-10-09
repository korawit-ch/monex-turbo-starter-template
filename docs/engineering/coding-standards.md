# Coding Standards

## General style

- Prefer clear, explicit behavior over clever abstractions.
- Keep functions focused and name side effects.
- Use early returns to reduce nesting.
- Do not abstract a single speculative use case.
- Keep runtime-specific code out of framework-neutral packages.
- Add comments for intent, constraints, or non-obvious tradeoffs; do not narrate syntax.
- Preserve unrelated code and avoid opportunistic refactors in feature commits.

## Naming

| Item                           | Convention                                                       | Example                      |
| ------------------------------ | ---------------------------------------------------------------- | ---------------------------- |
| Files and folders              | kebab-case                                                       | `authorization-summary.tsx`  |
| React components/classes/types | PascalCase                                                       | `AuthorizationSummary`       |
| Functions/variables            | camelCase                                                        | `toOrderResponse`            |
| Constants                      | camelCase by default; UPPER_SNAKE_CASE for true global constants | `linkKeys`, `MAX_RETRIES`    |
| Hooks                          | `use` prefix                                                     | `useOrdersQuery`             |
| Runtime DTO                    | `<action>-<entity>.dto.ts`                                       | `create-order.dto.ts`        |
| Mapper                         | `<entity>.mapper.ts`                                             | `order.mapper.ts`            |
| Client data access             | `<feature>.client.ts`                                            | `orders.client.ts`           |
| Server data access             | `<feature>.server.ts`                                            | `orders.server.ts`           |
| Tests                          | adjacent `*.spec.ts` or `*.test.tsx`                             | `order.mapper.spec.ts`       |
| Route-private components       | `_components/<name>.tsx`                                         | `_components/order-list.tsx` |

Use domain language consistently across schema, contract, API, and UI. Do not use `data`, `item`, `manager`, `helper`, or `common` when a precise name exists.

## TypeScript

- Prefer `unknown` over `any`, then narrow it.
- Use type-only imports when an import has no runtime value.
- Model exclusive states with discriminated unions.
- Use `satisfies` when validating an object without widening useful literals.
- Avoid non-null assertions unless an invariant is established immediately nearby.
- Do not weaken shared types to accommodate one caller; fix the boundary.
- Keep API responses JSON-safe.

## Choosing control flow

- Use a `switch` for three or more mutually exclusive discrete states, especially a discriminated union. Include an exhaustive `never` check when future variants must fail compilation.
- Use `if`/early return for guard conditions and independent predicates.
- Use a lookup map when behavior is data-driven and does not need branching side effects.
- Use a ternary only for one short binary choice.
- Never stack or nest ternaries for workflow logic.

```ts
switch (state.status) {
  case 'loading':
    return <Loading />;
  case 'error':
    return <ErrorMessage error={state.error} />;
  case 'ready':
    return <Result value={state.value} />;
  default:
    return assertNever(state);
}
```

## Linting and formatting

ESLint enforces correctness and repository rules. Prettier owns formatting and Tailwind class ordering. Do not manually fight formatter output or disable rules without a documented reason.

- `npm run lint` runs workspace lint tasks and a repository-wide Prettier check.
- `npm run format` rewrites supported TypeScript, JSON, and Markdown files.
- Staged TypeScript/JavaScript is linted and formatted by `lint-staged`.
- Staged JSON, Markdown, CSS, YAML, and JavaScript is formatted.
- Generated output, dependencies, and build caches are excluded.

Use the narrowest relevant lint/test/typecheck during development, then run the broader repository checks before review.

## Tests

- Test behavior and contracts, not implementation trivia.
- Cover success, validation failure, authorization failure, not found, conflict, and retry/idempotency behavior where applicable.
- Mapper tests should prove JSON conversion and hidden-field boundaries.
- UI tests should cover loading, error, empty, keyboard, and submission behavior.
- Database-backed tests must use an explicit test database and clean up deterministically.

Compilation proves type consistency; it does not prove authorization, database behavior, or request semantics.
