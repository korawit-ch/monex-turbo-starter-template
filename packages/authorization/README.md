# `@repo/authorization`

Pure authorization vocabulary shared by Next.js and NestJS. It exports the complete Link action list, typed grant/condition model, strict access-claim parser, sanitized server and client contexts, `hasPermission()` for coarse checks, `can()` for trusted resource evaluation, and `resourceScope()` for database enforcement input.

It deliberately does not build role policy, verify signatures, read cookies, access Prisma, call a network, or import either framework. Signature/issuer/audience/expiry verification remains in each server runtime; the API constructs grants and owns dynamic resource/business rules.

See [the authentication architecture](../../docs/authentication.md) for the complete trust flow.
