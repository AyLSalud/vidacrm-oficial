#!/bin/bash
# ============================================
# VidaCRM - Production Build Script
# ============================================
# This script builds VidaCRM for production using PostgreSQL.
# 
# Prisma requires the provider to be a literal string (not env variable),
# so we use two schema files:
#   - prisma/schema.prisma      → SQLite (local dev)
#   - prisma/schema.prod.prisma → PostgreSQL (production)
#
# Usage: bash scripts/build-prod.sh
# ============================================

set -e

echo "🔧 VidaCRM Production Build"
echo "============================"
echo ""

# Verify DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo "   Set it to your PostgreSQL connection string, e.g.:"
  echo "   export DATABASE_URL=postgresql://user:pass@host:5432/db"
  exit 1
fi

# Verify it's a PostgreSQL URL
if [[ ! "$DATABASE_URL" == postgresql://* ]]; then
  echo "⚠️  WARNING: DATABASE_URL doesn't look like a PostgreSQL URL"
  echo "   Production builds require PostgreSQL"
fi

# Step 1: Generate Prisma Client with PostgreSQL schema
echo "📦 Generating Prisma Client for PostgreSQL..."
npx prisma generate --schema prisma/schema.prod.prisma

# Step 2: Push schema / run migrations
if [ "$SKIP_DB_PUSH" != "true" ]; then
  echo "🗄️  Pushing database schema..."
  npx prisma db push --schema prisma/schema.prod.prisma --accept-data-loss 2>/dev/null || {
    echo "⚠️  Database push failed. Trying migrations..."
    npx prisma migrate deploy --schema prisma/schema.prod.prisma 2>/dev/null || {
      echo "⚠️  No migrations found. Creating initial migration..."
      echo "   Run: npx prisma migrate dev --schema prisma/schema.prod.prisma --name init"
    }
  }
fi

# Step 3: Build Next.js
echo "🏗️  Building Next.js application..."
next build

echo ""
echo "✅ Production build complete!"
echo ""
echo "To start the server:"
echo "  NODE_ENV=production node .next/standalone/server.js"
