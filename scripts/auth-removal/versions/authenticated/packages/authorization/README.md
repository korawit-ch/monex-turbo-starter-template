# `@repo/authorization`

Pure authorization vocabulary shared by Next.js and NestJS. It exports the complete link permission list, access-claim parser, sanitized authorization context, and `can()` evaluator.

It deliberately does not verify signatures, read cookies, access Prisma, call a network, or import either framework. Signature/issuer/audience/expiry verification remains in each server runtime; dynamic resource rules remain in API domain services.

See [the authentication architecture](../../docs/authentication.md) for the complete trust flow.
