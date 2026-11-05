#!/bin/bash

# Start the local PostgreSQL container and wait until it accepts connections.
# Compose reads the root .env itself, so the shell never parses its values and
# the script never prints credentials.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DB_DIR="$ROOT_DIR/apps/db"
ENV_FILE="$ROOT_DIR/.env"
READY_ATTEMPTS=30

# Docker Compose v2 is "docker compose"; fall back to the v1 binary.
if docker compose version >/dev/null 2>&1; then
  compose=(docker compose)
else
  compose=(docker-compose)
fi
compose_args=(-f "$DB_DIR/docker-compose.yml")
if [ -f "$ENV_FILE" ]; then
  compose_args+=(--env-file "$ENV_FILE")
fi

echo "Starting PostgreSQL database..."
"${compose[@]}" "${compose_args[@]}" up -d postgres

echo "Waiting for database to be ready..."
for ((attempt = 1; attempt <= READY_ATTEMPTS; attempt++)); do
  if "${compose[@]}" "${compose_args[@]}" exec -T postgres \
    sh -c 'pg_isready -U "$POSTGRES_USER"' >/dev/null 2>&1; then
    address="$("${compose[@]}" "${compose_args[@]}" port postgres 5432)"
    echo "✅ PostgreSQL database is ready on ${address}."
    echo "Credentials and DATABASE_URL are in ${ENV_FILE}."
    exit 0
  fi
  sleep 2
done

echo "❌ PostgreSQL was not ready after $((READY_ATTEMPTS * 2)) seconds." >&2
echo "Inspect it with: npm run db:logs" >&2
exit 1
