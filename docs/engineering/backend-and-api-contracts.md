# Backend and API Contracts

## The boundary

```text
PostgreSQL
  -> Prisma schema and generated model
  -> NestJS service
  -> mapper
  -> @repo/api-contract response
  -> frontend data access
  -> UI
```

Share API contracts, not Prisma database types. Database fields may be private, renamed, non-JSON values, or changed independently from the public API.

## Adding or changing a feature

Use this order so producers and consumers move together:

1. Model persistence in `packages/prisma/prisma/schema.prisma`.
2. Add the JSON-safe request, response, and endpoint description in `packages/api-contract/src/<feature>.ts`.
3. Export the contract from the package manifest and `src/index.ts`.
4. Add Nest DTO classes that `implements` the request contracts.
5. Add validation and Swagger decorators to every DTO field.
6. Implement the service with tenant/ownership scope and explicit failure behavior.
7. Map Prisma results into response contracts.
8. Type controller return values with the response contract.
9. Add the web BFF route when a protected browser call is required.
10. Add server/client data access in the web app.
11. Test contracts, mapping, permissions, service behavior, and UI states.

## Contract example

```ts
export interface CreateOrderRequest {
  reference: string;
}

export interface OrderResponse {
  id: string;
  reference: string;
  createdAt: string;
}

export const ordersApi = {
  create: (body: CreateOrderRequest) => ({
    url: '/orders',
    method: 'POST' as const,
    body,
  }),
};
```

Transport dates are ISO strings. Do not expose `Date`, `Decimal`, `BigInt`, buffers, relations, password hashes, internal tenant keys, or Prisma enums without an intentional JSON representation.

## DTOs, validation, and Swagger

TypeScript interfaces disappear at runtime. Nest DTO classes bridge the shared compile-time contract to runtime validation and Swagger:

```ts
export class CreateOrderDto implements CreateOrderRequest {
  @ApiProperty({ example: 'ORDER-001' })
  @IsString()
  @MaxLength(100)
  reference: string;
}
```

The global `ValidationPipe` uses `whitelist`, `forbidNonWhitelisted`, and `transform`. Therefore:

- every accepted property needs a class-validator decorator;
- optional contract fields need both `@IsOptional()` and Swagger `required: false`;
- validation rules should match database limits and business rules;
- Swagger examples should be realistic but never contain secrets;
- DTOs validate transport shape, while services enforce business invariants.

Swagger is generated in non-production environments at `/api`. A controller method appears automatically when its module is imported and its DTO/response decorators are discoverable. Explicit return types still matter for compile-time contract enforcement.

## Controller, mapper, and service roles

### Controller

- Declares HTTP method/path, parameter parsing, permission metadata, and response type.
- Delegates business behavior.
- Does not return Prisma records directly.

### Mapper

- Converts persistence values to the exact JSON-safe response contract.
- Is the explicit boundary for renamed fields, hidden fields, enums, decimals, and dates.
- Should have focused unit tests.

### Service

- Owns business rules and database interaction.
- Receives sanitized authorization context, not raw JWT claims.
- Includes tenant/owner predicates in reads and final writes.
- Uses transactions when several writes must succeed together.
- Defines retry, idempotency, uniqueness, and concurrency behavior for mutations.

For update/delete flows, a preceding read is not enough authorization or concurrency protection. Scope the final mutation too and verify the affected-row count.

## Prisma workflow

1. Edit the schema.
2. Run `npm run db:validate`.
3. Run `npm run db:generate`.
4. Create/review a migration with `npm run db:migrate` when changing a real development database.
5. Update the seed only for repeatable development fixtures.
6. Build the Prisma package and API.
7. Test services against realistic constraints.

`db:push`, `db:migrate`, and `db:seed` change persistent state. Confirm the selected `DATABASE_URL` first. Production migrations require a reviewed rollout, backfill, compatibility window, and rollback/forward-fix plan; this repository does not automate production deployment.
