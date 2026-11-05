# Authentication and authorization

## System architecture

Protected browser traffic follows one trust path:

```text
Browser
  -> same-origin Next.js route handler (/api/*)
  -> internal NestJS API (Bearer access JWT)
  -> tenant-scoped Prisma query
  -> PostgreSQL
```

Next.js is the browser-facing backend-for-frontend (BFF). NestJS remains the authoritative API security boundary: it verifies every protected request even though Next already performed an early check. PostgreSQL is reached only through Prisma in the API runtime.

This starter implements credential login against seeded users. It does **not** implement OAuth/OIDC, authorization-code callbacks, state, nonce, or PKCE. Add those as an identity-verification step before `AuthService` creates the application session; do not describe the current `/auth/login` endpoint as OAuth.

## Responsibilities and trust boundaries

- `packages/authorization` owns the permission vocabulary, typed grant language, untrusted JWT-claim parsing, sanitized `AuthorizationContext`, named-permission checks, pure resource evaluation, and grant-to-query-scope resolution. It has no framework, network, cookie, React, or database dependency.
- `packages/api-contract` owns JSON request/response contracts, including login input. It never exports Prisma types or credentials.
- `packages/prisma` owns `Tenant`, `User`, `AuthSession`, and tenant-owned `Link` persistence.
- `apps/api/src/auth` owns password verification, session creation/revocation, cookie encryption, JWT signing/verification, and Nest guards.
- `apps/web/lib/auth` owns server-only JWT verification and BFF forwarding. It shares the JWT verification secret in this HS256 starter.
- `apps/api/src/auth/authorization-policy.ts` constructs the reviewed action-grant matrix. The shared evaluator never invents role policy.
- `apps/web/providers/auth-provider.tsx` receives only user ID and coarse permission names. It never receives credentials, subject scope, or grant conditions.
- Link services resolve signed grant conditions into the final Prisma query. Browser-provided role, grants, tenant, ownership, or capability data is ignored.

The Next BFF and Nest guards use `hasPermission()` for coarse endpoint admission. `LinksService` uses `resourceScope()` for database enforcement, and response mappers use `can()` to compute resource capabilities. A capability is a presentation hint; a mutation repeats authorization.

## Data model

`Tenant` owns users and links. `User` belongs to one tenant and has an `ADMIN` or `MEMBER` role. The API maps roles to the explicit permission vocabulary:

- `ADMIN`: `link.read`, `link.create`, `link.update`, `link.delete`
- `MEMBER`: `link.read`, `link.create`

`permissionsForRole()` determines which actions a role receives. `buildPermissionGrants()` then attaches an explicit tenant-equality condition to every action. Missing policy fails closed rather than becoming an unrestricted grant.

`AuthSession` stores a SHA-256 hash of a random 32-byte token, the owning user, expiry, creation time, and optional revocation time. The raw token exists only inside an AES-256-GCM encrypted/authenticated HttpOnly cookie. The cookie contains no identity or permission claims.

Each `Link` has a required `tenantId`. Reads, updates, and deletes include `tenantId` in their Prisma predicate. Update/delete use scoped bulk mutations and require exactly one affected row, so a deletion race becomes `409 Conflict` rather than an unscoped retry.

There is no migration history in this starter. `npm run db:push` applies this schema to a disposable local database; production adoption requires a reviewed migration and a backfill strategy for existing links before enforcing the required tenant relation.

## Login

1. The browser posts email/password to `POST /api/auth/login` on Next.js.
2. The BFF requires the configured same origin and forwards only the JSON credentials to internal NestJS.
3. Nest validation rejects unknown fields, malformed email, and invalid password length.
4. `AuthService` loads the user, rejects disabled users, and verifies the scrypt password hash with a timing-safe comparison.
5. Nest generates a cryptographically random session token, stores only its SHA-256 hash, and sets the encrypted raw value in `auth_session`.
6. Nest maps the role to actions, builds typed tenant-scoped grants, snapshots the matrix into a ten-minute HS256 JWT, and sets it in `access_token`.
7. The BFF relays both `Set-Cookie` headers without returning either token in JSON.

Both cookies are `HttpOnly`, `SameSite=Lax`, `Path=/`, explicitly aged, and `Secure` in production. Configure `AUTH_COOKIE_DOMAIN` only when a reviewed sibling-subdomain ingress requires it.

The seed creates two local demonstration accounts with the same configurable password:

- `admin@example.com`: all four Link actions; update/delete capabilities are allowed.
- `member@example.com`: read/create only; update/delete capabilities are denied.

`AUTH_SEED_EMAIL` and `AUTH_SEED_MEMBER_EMAIL` override the addresses, and `AUTH_SEED_PASSWORD` overrides the shared local password (`local-change-me` by default). Never deploy these credentials.

## Access JWT

The JWT contains only the stable authorization snapshot:

```ts
{
  sub: string;
  attributes: {
    tenantId: string;
  };
  grants: Array<{
    permission: Permission;
    conditions: Array<{
      operator: 'equals';
      subjectField: 'tenantId';
      resourceField: 'tenantId';
    }>;
  }>;
  iat: number;
  exp: number;
  iss: string;
  aud: string | string[];
}
```

Next and Nest both require HS256, signature validity, issuer, audience, expiry, subject, numeric timestamps, trusted subject attributes, and a valid grant matrix. Unknown permissions, operators, fields, duplicate grants, duplicate resource-field conditions, or malformed values produce `401 Unauthorized`.

The token is never written to local storage, session storage, client-readable cookies, React props, client context, logs, or JSON responses. Next server code retains the raw token only long enough to forward it as a bearer credential.

HS256 is suitable for this local starter but gives Next the ability to sign tokens because it shares `AUTH_JWT_SECRET`. Prefer asymmetric signing for production: Nest holds the private key and Next verifies with a public key.

## Protected rendering and requests

The `(protected)` server layout calls `getAuth()`. Missing, invalid, or expired access JWTs redirect through the renewal handler. Configuration errors are rethrown and are not disguised as user authentication failures.

For a browser link request:

1. `clientFetch()` calls same-origin `/api/links`.
2. The route handler verifies the access cookie and parses its claims.
3. The BFF calls shared `hasPermission()` for the named Link action.
4. Mutations require the exact configured `WEB_ORIGIN` as a CSRF boundary.
5. The BFF forwards the original JWT in `Authorization: Bearer ...`; it does not forward browser cookies or client-supplied authorization attributes.
6. Nest `JwtAuthGuard` independently verifies the JWT and writes the sanitized context to `request.user`.
7. `PermissionGuard` repeats `hasPermission()` for `@RequirePermission(...)`.
8. `LinksService` calls `resourceScope()` for that action and spreads the resolved tenant predicate into the Prisma query or mutation.
9. The response mapper calls `can()` with trusted Link attributes and returns compact update/delete capabilities.

Server Components call the internal API directly through `serverFetch()`, but perform the same Next verification and named-permission check first.

## Authorization model

The signed matrix separates three questions:

1. `hasPermission(auth, 'link.update')`: does this token contain the named action grant?
2. `can(auth, 'link.update', { tenantId })`: do the grant's stable conditions match this trusted resource?
3. `resourceScope(auth, 'link.update')`: which plain filter values must the API put into the authoritative database operation?

Every current Link grant contains:

```ts
{
  operator: 'equals',
  subjectField: 'tenantId',
  resourceField: 'tenantId',
}
```

Conditions within a grant use AND semantics. `can()` denies when the grant or a required resource attribute is absent. `resourceScope()` returns `null` when the action grant is absent. The service treats a missing or incomplete scope as `403`, even though the global guard should already have rejected the request. This keeps the domain service safe when invoked from another entry point.

The condition language is intentionally allowlisted. Adding another field requires updating subject/resource types, runtime claim validation, the API policy builder, database enforcement, and tests. Adding a new operator also requires explicit in-memory and query-translation semantics. Never accept arbitrary field paths, executable expressions, or Prisma filters in a token or request.

Dynamic business rules do not belong in the signed stable-grant evaluator. If links later gain workflow state, quotas, ownership, or time windows, load current values from PostgreSQL and repeat mutable predicates in the final update/delete operation.

## Backend-computed capabilities

`LinkResponse.capabilities` contains current update and delete decisions. The API mapper calculates them from the verified context and the Link's trusted `tenantId`. React renders those values; it does not receive tenant conditions or reconstruct policy. Capabilities can become stale, so the corresponding mutation still passes through the BFF, Nest guards, and scoped Prisma write.

The protected layout deliberately converts the full server context into `{ userId, permissions }` before crossing the server/client boundary. This is enough for coarse navigation and demo text without exposing resource-scope details.

## Renewal

The protected layout uses `GET /api/auth/refresh?returnTo=/local/path`. Client fetch retries use `POST /api/auth/refresh` once after a `401`; they do not refresh after `403`, `409`, or other errors.

Next forwards only the encrypted session cookie. Nest decrypts and authenticates it, checks envelope expiry, hashes the raw token, and loads an unrevoked/unexpired session whose user is still enabled. It reloads the current role and tenant, issues a fresh access JWT, and sets only the access cookie.

Redirect destinations must resolve to the current origin. Absolute, protocol-relative, backslash-based, malformed, and missing destinations fall back to `/`. Authentication-service failures other than `401` return an error rather than redirecting every failure to login.

## Logout and revocation

- `POST /api/auth/logout` conditionally revokes the row represented by the session cookie and clears both cookies. Repeating it is safe.
- `POST /api/auth/logout-all` requires a valid access JWT, revokes every active session for `request.user.subject.userId`, and clears both cookies.

Session revocation blocks future renewal immediately. It does not invalidate already issued access JWTs. Those remain usable until expiry, so the maximum stale-access and stale-permission window is `AUTH_ACCESS_TTL_SECONDS` (600 seconds by default). Permission changes become visible on the next login or successful renewal.

Do not promise immediate JWT revocation. Add a token version, denylist, or per-request session/version lookup only if emergency termination or highly dynamic permissions justify the additional state and availability cost.

## HTTP behavior

- `400`: malformed or unknown input and invalid route IDs.
- `401`: missing, malformed, invalid, expired, or revoked authentication/renewal.
- `403`: authenticated but missing permission, or an untrusted mutation origin.
- `404`: a link is absent from the authenticated tenant scope.
- `409`: a scoped link changed or disappeared between read and mutation.
- `200`/`201`: successful operations.

## Network and deployment posture

Nest defaults to `API_HOST=127.0.0.1`; only Next should be public. `API_INTERNAL_URL` is server-only and must never use a `NEXT_PUBLIC_` prefix. Swagger is disabled when `NODE_ENV=production`. PostgreSQL must remain private.

Deploy Next and Nest from the same commit. Both sides parse the access-token claim shape, so a mixed deployment rejects every token the other side issues: the protected layout's renewal then issues another token the web cannot parse, and the browser ends in a redirect loop. Access cookies issued before a same-commit deployment recover on their own: they fail parsing, return `401`, and one renewal issues a token in the new shape from the stored session.

Loopback binding does not work when Next and Nest run in separate containers. In that topology, bind Nest to the private container interface (often `0.0.0.0`) and restrict exposure with the container network, ingress, firewall, or security group. CORS is intentionally not used as a network boundary.

## Environment

Required production configuration:

```dotenv
API_PORT=3001
API_HOST="127.0.0.1"
API_INTERNAL_URL="http://127.0.0.1:3001"
WEB_ORIGIN="http://localhost:3000"

AUTH_COOKIE_SECRET="at-least-32-random-bytes-and-independent"
AUTH_JWT_SECRET="another-at-least-32-random-byte-secret"
AUTH_COOKIE_DOMAIN=""
AUTH_JWT_ISSUER="monex-api"
AUTH_JWT_AUDIENCE="monex-web"
AUTH_ACCESS_TTL_SECONDS=600
AUTH_SESSION_TTL_SECONDS=2592000
```

Generate independent secrets with an approved secret manager or cryptographically secure generator. Missing/short secrets are application configuration failures. Do not commit real values.

## Local setup and verification

After setting the environment and reviewing the target database:

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

`db:push` and `db:seed` mutate the selected database. The seed is now repeatable by tenant/email/link identity, but it generates a new salt and password hash on each run. The configured password remains valid when its value is unchanged.

Focused checks:

```bash
npm run db:validate
npm run test --workspace=@repo/authorization
npm run test --workspace=api
npm run test --workspace=web
npm run build --workspace=api
npm run check-types --workspace=web
```

## Removal and rollback

Preview removal with `npm run auth:remove`. Apply it with `npm run auth:remove -- --apply`. The script refuses a dirty working tree and reads its operation manifest plus authenticated/without-auth file versions from `scripts/auth-removal`.

Shared integration files are transformed with a three-way merge: the current workspace supplies later edits, while the stored versions describe the authentication delta to remove. Compatible changes made after authentication are preserved. A conflict, an unexpected file in an auth-owned directory, or a changed auth-owned file stops the preflight before source files are modified. Deleted pre-auth providers are restored, auth-owned files are removed, and `npm install` reconciles the lockfile and workspaces. The removal script and its version assets delete themselves only after successful verification and dependency installation.

The script does not alter PostgreSQL data or schema. If the auth schema was applied, create and review a separate database migration before dropping tables or columns. When authentication itself changes, update both stored versions and the manifest, then exercise dry-run, compatible-change, conflict, and full-removal cases before committing.
