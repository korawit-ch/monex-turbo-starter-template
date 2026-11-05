#!/bin/bash

# Stop the local PostgreSQL container. The named data volume is kept.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DB_DIR="$ROOT_DIR/apps/db"
ENV_FILE="$ROOT_DIR/.env"

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

echo "Stopping PostgreSQL database..."
"${compose[@]}" "${compose_args[@]}" down

echo "✅ PostgreSQL database stopped!"
