# Web Instructions

- Use the existing App Router structure. The home page is `app/(home)/page.tsx`; `app/layout.tsx` loads Prompt, shared UI CSS, global CSS, and providers. See [README.md](README.md).
- Keep pages/layouts server-rendered where possible. Interactive controls, query hooks, form hooks, and context state use client components.
- Server reads go through `services/links.service.ts` → `lib/fetch/server.ts`; client reads/mutations go through `queries/links.ts` → `lib/fetch/client.ts`. Both consume `@repo/api-contract` descriptions; keep transport policy in the app.
- Do not import Prisma models. Consume JSON-safe response contracts from `@repo/api-contract`; timestamp fields are ISO strings and must be converted explicitly when a `Date` instance is needed.
- Keep query keys in `queries/links.ts`. `linkKeys.all` is a prefix covering list/detail queries; account for that when invalidating mutations. The provider uses a 60-second stale time and disables focus refetching.
- The home page intentionally demonstrates independent server and client fetches. There is no hydration/prefetch handoff. When adapting this demo, decide deliberately whether both reads are still needed.
- Server link helpers currently log errors and return empty/null results. Do not mistake these values for verified empty/not-found responses when adding features.
- `ClientProvider` is local demo state, not authentication. `ServerProvider` serializes config into a DOM attribute; include public values only.
- Reuse `@repo/ui` primitives/form adapters and `@repo/icons`; import cross-app raw files from explicit `@repo/assets` subpaths, while web-only files stay in `public`. Feature schemas and submission behavior stay in the app. Supply stable field IDs for current label/helper associations and use form adapters inside `FormWrapper`.
- `NEXT_PUBLIC_API_URL` is used in both fetch helpers and defaults to localhost:3001. Client values are public build inputs. Neither helper currently forwards authentication cookies/headers.
- After shared builds, run `npm run lint --workspace=web`, `npm run check-types --workspace=web`, `npm run test --workspace=web -- --runInBand`, and `npm run build --workspace=web` as appropriate. Build uses `next/font/google` and may need network access.
- Tests use local Jest/jsdom/ts-jest configuration, not the shared Next preset. For UI changes, verify behavior, loading/error/empty states, keyboard access, and form submission rather than merely matching CSS classes.
