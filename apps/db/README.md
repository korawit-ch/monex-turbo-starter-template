# Database Service

PostgreSQL database service running in Docker.

## Usage

Run these npm commands from `apps/db` after root environment distribution.

```bash
# Start the database
npm run dev
# or
npm start

# Stop the database
npm run stop
# or
npm run down

# View logs
npm run logs

# Check status
npm run ps
```

## Environment Variables

Compose uses the linked workspace `.env` after `npm run env:distribute`, or an explicitly supplied root env file:

- `DB_USER` - PostgreSQL username (default: postgres)
- `DB_PASSWORD` - PostgreSQL password (default: postgres)
- `DB_NAME` - Database name (root example: monex-turbo-starter-template-db; Compose fallback: monex-turbo-starter-template-db)
- `DB_PORT` - Host port mapping (default: 5433)
- `DB_CONTAINER_NAME` - Docker container name (root example: monex-turbo-starter-template-db; Compose fallback: monex-turbo-starter-template-db)
- `DATABASE_URL` - Full connection string for Prisma

## Connection

With the root example configuration, the database is accessible from this machine only (the port binds to `127.0.0.1`) at:

- **Host**: localhost
- **Port**: ${DB_PORT:-5433}
- **Database**: ${DB_NAME:-monex-turbo-starter-template-db}
- **User**: ${DB_USER:-postgres}
- **Password**: ${DB_PASSWORD:-postgres}

## Operations

From the root after creating/reviewing `.env`:

```bash
docker-compose --env-file .env -f apps/db/docker-compose.yml config --quiet
docker-compose --env-file .env -f apps/db/docker-compose.yml up -d --wait postgres
docker-compose --env-file .env -f apps/db/docker-compose.yml ps
docker-compose --env-file .env -f apps/db/docker-compose.yml logs -f postgres
docker-compose --env-file .env -f apps/db/docker-compose.yml down
```

These commands require the `docker-compose` executable; startup/status/logs require a reachable Docker daemon. `config --quiet` validates configuration without dumping credentials. `down` stops/removes containers and the Compose network while retaining the named data volume. Adding `-v` would delete persisted data.

Root shortcuts `db:up`, `db:down`, `db:logs`, and `db:ps` run Compose from this workspace. They use the linked `.env` after `npm run env:distribute`. Workspace scripts include `dev`, `start`, `stop`, `down`, `logs`, and `ps`. `dev`/`start` include `|| true`, so check status rather than trusting their successful exit.

## Improvements

- **IMPORTANT:** Remove masked startup failures from the workspace scripts and keep database defaults aligned across Compose, setup helpers, and Prisma.
- **IMPORTANT:** Give each project its own Compose project name. The project name comes from this folder (`db`), so projects built from the template share the `db_postgres_data` volume and container name. Renaming it moves an existing project to a new, empty volume, so plan the data move before changing it.
- **SUGGESTION:** Define a separate deployment configuration if PostgreSQL will run beyond local development; the current repository supplies no production backup/restore or application deployment workflow.

See [local agent instructions](AGENTS.md).
