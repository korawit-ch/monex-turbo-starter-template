# Frontend Conventions

## Component placement

Choose the narrowest correct owner.

1. Used by one route: place it in that route's `_components` directory.
2. Used by related routes in one feature/domain: place it under `apps/web/components/<domain>`.
3. Used by unrelated routes in this app: place it directly under `apps/web/components` or a concrete domain folder.
4. Reusable across company applications and product-neutral: move it to `@repo/ui`.

Do not create `components/common`, `components/shared`, or a `features` directory merely to add another layer. Introduce a feature folder only when it owns a meaningful group of routes, components, data access, and behavior.

## Route-specific versus shared

```text
app/(protected)/orders/
  page.tsx
  _components/
    order-list.tsx           only this route tree
components/
  auth/
    logout-button.tsx        used by unrelated routes
data-access/
  orders.client.ts           TanStack Query hooks
  orders.server.ts           Server Component access
```

Page files coordinate data and layout. They should not accumulate reusable controls or business calculations.

## Data access

- Put server-only feature access in `<feature>.server.ts`.
- Put client query keys, queries, and mutations in `<feature>.client.ts`.
- Use endpoint descriptions and types from `@repo/api-contract`.
- Keep base URLs, credentials, retries, and error translation in app-owned fetch helpers.
- Use TanStack Query for browser server-state; do not duplicate that state into a general React context.
- Query keys are public invalidation contracts. Use a stable prefix and invalidate deliberately.

Protected browser calls go through `app/api/*`. The BFF verifies the access token, checks the expected permission, and forwards only the bearer token and business input. NestJS verifies again and applies database scope.

## Server and client components

- Default to Server Components.
- Add `'use client'` only for hooks, browser APIs, event handlers, or client context.
- Never pass raw access/session tokens to Client Components.
- Do not perform the same server and client read unless the UX intentionally demonstrates or needs both.
- Handle loading, empty, error, forbidden, and retry states explicitly.

## Shared UI and icons

`@repo/ui` owns behavior-neutral primitives. Callers supply icons:

```tsx
import { ArrowRight } from '@repo/assets/icons';
import { Button } from '@repo/ui/button';

<Button endIcon={<ArrowRight />} variant="linked">
  Continue
</Button>;
```

This keeps UI variants independent from one icon package and allows each app to provide its own visual language.

Use `@repo/design-system` tokens before adding local colors or spacing values. App-only images stay in `public`; cross-app files go to `@repo/assets`.

## Forms

- Keep the Zod schema and submission behavior in the feature.
- Use `@repo/ui/form/*` adapters for consistent presentation.
- Give every field a stable ID so labels, helper text, and errors remain associated.
- Server/API validation remains authoritative even when the browser validates first.

## Rendering conditions

- Use an early return for page-level loading, error, forbidden, or empty states.
- Use `condition ? <View /> : null` when the condition is derived from a possibly empty value such as a number or string.
- Use `condition && <View />` only when `condition` is already a boolean and the false branch is intentionally empty.
- Avoid `!!value && <View />`; name the predicate or use an explicit ternary.
- Avoid nested ternaries. Use a helper, early returns, or a `switch` for multiple exclusive states.
