#!/bin/bash

# Separate Frontend from Monorepo
# Removes: apps/api, apps/db, and packages/prisma

set -e

echo "🔧 Separating Frontend from Monorepo..."
echo ""

# Confirm
echo ""
read -p "This will remove backend apps and packages. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Remove backend apps
echo "📦 Removing backend apps..."
rm -rf apps/api
rm -rf apps/db

# Remove backend packages
echo "📦 Removing backend packages..."
rm -rf packages/prisma

# Replace config files with frontend versions
echo "📝 Updating config files..."
cp docs/package-frontend.json package.json
cp docs/turbo-frontend.json turbo.json
cp docs/README-frontend.md README.md
cp docs/env-frontend.example .env.example

# Remove db scripts
echo "📝 Removing database scripts..."
rm -f scripts/db-start.sh
rm -f scripts/db-stop.sh

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
echo "✅ Frontend separation complete!"
echo ""
echo "Structure:"
echo "├── apps"
echo "│   ├── admin   # Next.js Admin"
echo "│   └── web     # Next.js Web"
echo "└── packages"
echo "    ├── api-contract    # Shared API contracts"
echo "    ├── design-system   # Tailwind config"
echo "    ├── eslint-config"
echo "    ├── jest-config"
echo "    ├── typescript-config"
echo "    └── ui              # React components"
echo ""
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Set NEXT_PUBLIC_API_URL in .env"
