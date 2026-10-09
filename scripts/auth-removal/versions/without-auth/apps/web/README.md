# Getting Started

After completing [root setup](../../README.md#getting-started), run from this workspace:

```bash
npm run dev
```

Browse [localhost:3000](http://localhost:3000) to see the result.

You can start editing the page by modifying `app/(home)/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load Prompt, a custom Google Font.

## Learn More

Learn more about `Next.js` with the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

One hosting option for a Next.js app is the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

The repository has no configured application deployment workflow. A deployment must also provide a reachable API/database and the correct public API URL.

## Structure and data flow

- `app/layout.tsx` loads Prompt through `next/font/google`, shared UI CSS, app CSS, and providers.
- `app/(home)/page.tsx` is a dynamic Server Component displaying links, control/form demonstrations, and an icon gallery.
- `app/(home)/_components/*` contains UI owned only by the home route; components reused by unrelated routes belong under `components`.
- `data-access/links.server.ts` wraps `lib/fetch/server.ts` for server reads with `cache: 'no-store'`.
- `data-access/links.client.ts` owns query keys, client reads, and mutation invalidation through `lib/fetch/client.ts`.
- `lib/tanstack-query/provider.tsx` creates one query client per provider instance, with 60-second stale time and no focus refetching.
- `providers/client-provider.tsx` holds demo user state only; it supplies no session or API authentication. `server-provider.tsx` renders public configuration in a DOM attribute.

Both fetch helpers consume descriptions and JSON-safe wire contracts from `@repo/api-contract`. They parse JSON and throw on non-success HTTP status, but do not validate response shapes, convert timestamps to `Date` instances, or forward authentication cookies. The server helpers catch errors and return `[]`/`null`. The page separately mounts `LinksDemo`, so the demo performs both server and client reads without hydration handoff.

Reuse `@repo/ui/button`, `input`, `textarea`, and `form/*`, with named icons from `@repo/icons`. Feature-specific forms/schemas remain in this app. The contact form demo stores submitted data locally and logs it; it does not send data to the API.

## Development

Follow [root setup](../../README.md#getting-started), then run from the root:

```bash
npx turbo run build --filter='./packages/*'
npm run dev --workspace=web
```

Set `NEXT_PUBLIC_API_URL` in the root `.env` and distribute/link it before startup. The code defaults to `http://localhost:3001`; the example's `NEXT_PUBLIC_API` name is not consumed. Public variables are browser-visible build configuration. Keep the API running for link reads.

## Verification

After shared builds, run from the root:

```bash
npm run lint --workspace=web
npm run check-types --workspace=web
npm run test --workspace=web -- --runInBand
npm run build --workspace=web
```

The app uses its own Jest/jsdom/ts-jest setup. Its only current suite tests `FeatureBadge`; two assertions still expect `bg-blue-100`/`bg-gray-100` although the component uses design-system classes. The build can require Google Fonts network access. There is no web e2e script.

## Improvements

- **IMPORTANT:** Distinguish fetch failure from empty/not-found data in server helpers and UI. An API outage currently produces the same server list result as an empty database.
- **IMPORTANT:** Correct JSON wire types: `Link` timestamps arrive as strings, not Prisma `Date` values. Align API/client response definitions together.
- **IMPORTANT:** Fix stale badge assertions and add behavior coverage for fetch errors, query invalidation, and forms. Form inputs need explicit IDs with the current shared components; missing IDs break label/helper relationships.
- **IMPORTANT:** Make environment names consistent and remove submitted personal data logging before adapting the demo to real forms. Never turn the client context or DOM config into an authorization boundary.
- **SUGGESTION:** Remove the artificial 800/600 ms query delays for real features; decide whether both server/client reads are necessary. Prefix invalidation of `linkKeys.all` already covers detail keys, so a second detail invalidation is redundant in the current update hook.

See [local agent instructions](AGENTS.md) and [shared UI limitations](../../packages/ui/README.md#improvements).
