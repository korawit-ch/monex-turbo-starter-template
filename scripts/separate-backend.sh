#!/bin/bash

# Separate Backend from Monorepo
# Removes: apps/web, apps/admin, packages/design-system, and packages/ui

set -e

echo "🔧 Separating Backend from Monorepo..."
echo ""

# Confirm
read -p "This will remove frontend apps and packages. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Remove frontend apps
echo "📦 Removing frontend apps..."
rm -rf apps/web
rm -rf apps/admin

# Remove frontend packages
echo "📦 Removing frontend packages..."
rm -rf packages/design-system
rm -rf packages/ui

# Replace config files with backend versions
echo "📝 Updating config files..."
cp docs/package-backend.json package.json
cp docs/turbo-backend.json turbo.json
cp docs/README-backend.md README.md
cp docs/env-backend.example .env.example

# Clean up docs folder
echo "📦 Cleaning up..."
rm -rf docs/

# Remove separation scripts (no longer needed)
rm -f scripts/separate-frontend.sh
rm -f scripts/separate-backend.sh

# Clean up node_modules
rm -rf node_modules
rm -f package-lock.json

echo ""
echo "✅ Backend separation complete!"
echo ""
echo "Structure:"
echo "├── apps"
echo "│   ├── api     # NestJS API"
echo "│   └── db      # PostgreSQL"
echo "└── packages"
echo "    ├── api-contract # Shared API contracts"
echo "    ├── eslint-config"
echo "    ├── jest-config"
echo "    └── typescript-config"
echo ""
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Configure DATABASE_URL and run: npm run db:generate"
