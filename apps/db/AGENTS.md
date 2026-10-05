# Local Database Instructions

- This workspace runs PostgreSQL 16 through `docker-compose.yml`; it is infrastructure, not an API or schema package. Schema, client generation, and seeding belong to `packages/prisma`.
- Preserve the distinction between host `DB_PORT` (default 5433) and container port 5432. `DATABASE_URL` configures Prisma; Compose consumes the `DB_*` variables separately.
- The named `postgres_data` volume persists across `docker-compose down`. Removing the volume destroys local data and is not a normal stop or verification step.
- Compose and root setup use the same project database/container defaults. Use an explicit root env file and keep the connection URL consistent with Compose settings; see [README.md](README.md).
- Workspace `dev`/`start` mask failures with `|| true`; their exit status does not prove the database is ready. Check Compose status and readiness separately.
- `scripts/db-start.sh` prints credentials and waits without a timeout. Prefer the documented direct Compose commands when inspecting startup, and do not copy its secret logging into new code.
- Validate Compose changes with `docker-compose --env-file .env -f apps/db/docker-compose.yml config --quiet` from the root. Actual startup/readiness and persistence require Docker access; report when those checks are unavailable.
