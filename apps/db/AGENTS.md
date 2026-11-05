# Local Database Instructions

- This workspace runs PostgreSQL 16 through `docker-compose.yml`; it is infrastructure, not an API or schema package. Schema, client generation, migrations, and seeding belong to `packages/prisma` unless Prisma has intentionally been localized into an API app.
- Preserve the distinction between host `DB_PORT` (default 5433) and container port 5432. `DATABASE_URL` configures Prisma; Compose consumes the `DB_*` variables separately.
- The named `postgres_data` volume persists across `docker-compose down`. Removing the volume destroys local data and is not a normal stop or verification step.
- Compose and root setup use the same project database/container defaults. Use an explicit root env file and keep the connection URL consistent with Compose settings; see [README.md](README.md).
- Workspace `dev`/`start` mask failures with `|| true`; their exit status does not prove the database is ready. Check Compose status and readiness separately.
- The published port binds to `127.0.0.1` only, because the default credentials are public. Keep it on loopback unless a change deliberately exposes the database.
- `scripts/db-start.sh` and `db-stop.sh` pass the root `.env` to Compose with `--env-file` (the shell never parses it), prefer `docker compose` over the v1 `docker-compose` binary, fail on errors, and wait at most 60 seconds for readiness. They print the bound address, never credentials.
- The Compose project name comes from this folder (`db`), so every project built from the template shares the `db_postgres_data` volume and the container name unless `DB_CONTAINER_NAME` and a project name are changed. Check `docker volume ls` before assuming the data belongs to this project.
- Validate Compose changes with `docker-compose --env-file .env -f apps/db/docker-compose.yml config --quiet` from the root. Actual startup/readiness and persistence require Docker access; report when those checks are unavailable.
