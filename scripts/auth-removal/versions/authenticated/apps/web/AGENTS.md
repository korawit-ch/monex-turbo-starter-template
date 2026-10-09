# Web Instructions

- Use the existing App Router structure. The protected home page is `app/(protected)/(home)/page.tsx`; `app/layout.tsx` loads Prompt, shared UI CSS, global CSS, and providers. See [README.md](README.md).
- Keep pages/layouts server-rendered where possible. Interactive controls, query hooks, form hooks, and context state use client components.
- Link data access lives under `data-access`: `links.server.ts` wraps `lib/fetch/server.ts` for Server Components, while `links.client.ts` owns TanStack Query hooks over `lib/fetch/client.ts`. Both consume `@repo/api-contract` descriptions; keep transport policy in the app.
- Keep route-owned UI in the nearest route-private `_components` directory. Put components shared by unrelated routes directly under `components`, grouping them by a concrete domain such as `components/auth` only when multiple related components justify it. Cross-app primitives belong in `@repo/ui`; do not add a catch-all `components/common` directory.
- Protected browser requests must use same-origin `app/api/*` BFF handlers and server-only `API_INTERNAL_URL`. Never restore a `NEXT_PUBLIC_*` backend URL for protected traffic.
- The protected server layout verifies the HttpOnly access JWT and passes only `AuthorizationContext` to `AuthProvider`. Client `can()` controls UX only; BFF checks, Nest guards, and scoped database queries enforce access.
- Do not import Prisma models. Consume JSON-safe response contracts from `@repo/api-contract`; timestamp fields are ISO strings and must be converted explicitly when a `Date` instance is needed.
- Keep link query keys in `data-access/links.client.ts`. `linkKeys.all` is a prefix covering list/detail queries; account for that when invalidating mutations. `lib/tanstack-query/provider.tsx` owns shared TanStack Query configuration with a 60-second stale time and disabled focus refetching.
- The home page intentionally demonstrates independent server and client fetches. There is no hydration/prefetch handoff. When adapting this demo, decide deliberately whether both reads are still needed.
- Server link data access propagates authentication, authorization, transport, and API failures. Handle those states explicitly at the route or component boundary rather than presenting them as empty data.
- Never expose raw access/session tokens through props, context, storage, readable cookies, or logs. Configuration failures must not be converted into ordinary login redirects.
- Reuse `@repo/ui` primitives/form adapters and `@repo/icons`; feature schemas and submission behavior stay in the app. Supply stable field IDs for current label/helper associations and use form adapters inside `FormWrapper`.
- Mutating BFF handlers require the configured `WEB_ORIGIN`; they forward only business input and the server-verified bearer token. Client fetch may renew once after 401, never after 403/409.
- After shared builds, run `npm run lint --workspace=web`, `npm run check-types --workspace=web`, `npm run test --workspace=web -- --runInBand`, and `npm run build --workspace=web` as appropriate. Build uses `next/font/google` and may need network access.
- Tests use local Jest/jsdom/ts-jest configuration, not the shared Next preset. For UI changes, verify behavior, loading/error/empty states, keyboard access, and form submission rather than merely matching CSS classes.
