# Web Instructions

- Use the existing App Router structure. The home page is `app/(home)/page.tsx`; `app/layout.tsx` loads Prompt, shared UI CSS, global CSS, and providers. See [README.md](README.md).
- Keep pages/layouts server-rendered where possible. Interactive controls, query hooks, form hooks, and context state use client components.
- Server reads go through `services/links.service.ts` → `lib/fetch/server.ts`; client reads/mutations go through `queries/links.ts` → `lib/fetch/client.ts`. Both consume `@repo/api-contract` descriptions; keep transport policy in the app.
- Protected browser requests must use same-origin `app/api/*` BFF handlers and server-only `API_INTERNAL_URL`. Never restore a `NEXT_PUBLIC_*` backend URL for protected traffic.
- The protected server layout verifies the HttpOnly access JWT and passes only `AuthorizationContext` to `AuthProvider`. Client `can()` controls UX only; BFF checks, Nest guards, and scoped database queries enforce access.
- Do not import Prisma models. Consume JSON-safe response contracts from `@repo/api-contract`; timestamp fields are ISO strings and must be converted explicitly when a `Date` instance is needed.
- Keep query keys in `queries/links.ts`. `linkKeys.all` is a prefix covering list/detail queries; account for that when invalidating mutations. The provider uses a 60-second stale time and disables focus refetching.
- The home page intentionally demonstrates independent server and client fetches. There is no hydration/prefetch handoff. When adapting this demo, decide deliberately whether both reads are still needed.
- Server link helpers currently log errors and return empty/null results. Do not mistake these values for verified empty/not-found responses when adding features.
- Never expose raw access/session tokens through props, context, storage, readable cookies, or logs. Configuration failures must not be converted into ordinary login redirects.
- Reuse `@repo/ui` primitives/form adapters and `@repo/icons`; feature schemas and submission behavior stay in the app. Supply stable field IDs for current label/helper associations and use form adapters inside `FormWrapper`.
- Mutating BFF handlers require the configured `WEB_ORIGIN`; they forward only business input and the server-verified bearer token. Client fetch may renew once after 401, never after 403/409.
- After shared builds, run `npm run lint --workspace=web`, `npm run check-types --workspace=web`, `npm run test --workspace=web -- --runInBand`, and `npm run build --workspace=web` as appropriate. Build uses `next/font/google` and may need network access.
- Tests use local Jest/jsdom/ts-jest configuration, not the shared Next preset. For UI changes, verify behavior, loading/error/empty states, keyboard access, and form submission rather than merely matching CSS classes.
