# Getting Started

After completing [root setup](../../README.md#getting-started), run from this workspace:

```bash
npm run dev
```

Browse [localhost:3000](http://localhost:3000) to see the result.

You can start editing the protected page in `app/(protected)/(home)/page.tsx`. The public login page is `app/login/page.tsx`.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load Prompt, a custom Google Font.

## Learn More

Learn more about `Next.js` with the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

One hosting option for a Next.js app is the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

The repository has no configured application deployment workflow. A deployment must provide private API/database reachability, server-only auth configuration, and the correct browser origin.

## Structure and data flow

- `app/layout.tsx` loads Prompt through `next/font/google`, shared UI CSS, app CSS, and providers.
- `app/(protected)/layout.tsx` verifies the HttpOnly access JWT and passes only sanitized authorization context to `AuthProvider`.
- `app/(protected)/(home)/page.tsx` is a protected dynamic Server Component displaying links and template demonstrations.
- `app/api/auth/*` handles login, renewal, logout, and all-session logout; `app/api/links/*` is the protected browser BFF.
- `features/links/data-access/server.ts` wraps `lib/fetch/server.ts` for server reads with `cache: 'no-store'`.
- `features/links/data-access/client.ts` owns query keys, client reads, and mutation invalidation through `lib/fetch/client.ts`.
- `lib/query/provider.tsx` creates one query client per provider instance, with 60-second stale time and no focus refetching.
- `providers/auth-provider.tsx` exposes sanitized identity/scope and shared `can()` for UX decisions; it never receives a token.

Both fetch helpers consume JSON-safe contracts from `@repo/api-contract`. Browser fetch uses same-origin BFF routes and renews once after 401; server fetch verifies the cookie and calls internal Nest with the bearer token. The BFF verifies named permissions, requires trusted mutation origin, and never forwards browser cookies to link endpoints. Nest verifies and scopes again. See [authentication architecture](../../docs/authentication.md).

Reuse `@repo/ui/button`, `input`, `textarea`, and `form/*`, with named icons from `@repo/icons`. Feature-specific forms/schemas remain in this app. The contact form demo stores submitted data locally and logs it; it does not send data to the API.

## Development

Follow [root setup](../../README.md#getting-started), then run from the root:

```bash
npx turbo run build --filter='./packages/*'
npm run dev --workspace=web
```

Set server-only `API_INTERNAL_URL`, `WEB_ORIGIN`, JWT verification settings, and independent auth secrets in the root `.env`; distribute/link it before startup. Keep the API running on a private/reachable address. Do not introduce `NEXT_PUBLIC_*` auth or internal API settings.

## Verification

After shared builds, run from the root:

```bash
npm run lint --workspace=web
npm run check-types --workspace=web
npm run test --workspace=web -- --runInBand
npm run build --workspace=web
```

The app uses its own Jest/jsdom/ts-jest setup. Tests cover the existing feature badge and renewal redirect sanitization. The build can require Google Fonts network access. There is no browser e2e script.

## Improvements

- **IMPORTANT:** Add browser-level tests covering cookie relay, BFF 401/403 behavior, one-time renewal, logout, and backend outages.
- **IMPORTANT:** Remove submitted personal data logging before adapting the demo to real forms. Form inputs also need explicit IDs with current shared components.
- **IMPORTANT:** Configure production private networking and asymmetric JWT verification; do not treat client `can()` as enforcement.
- **SUGGESTION:** Remove the artificial 800/600 ms query delays for real features; decide whether both server/client reads are necessary. Prefix invalidation of `linkKeys.all` already covers detail keys, so a second detail invalidation is redundant in the current update hook.

See [local agent instructions](AGENTS.md) and [shared UI limitations](../../packages/ui/README.md#improvements).
