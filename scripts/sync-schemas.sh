#!/bin/bash
# ============================================
# VidaCRM - Sync Schema Files
# ============================================
# This script copies the model definitions from schema.prisma (SQLite)
# to schema.prod.prisma (PostgreSQL), keeping only the provider different.
#
# Run this after editing schema.prisma to keep both in sync.
#
# Usage: bash scripts/sync-schemas.sh
# ============================================

set -e

SCHEMA_DIR="prisma"
DEV_SCHEMA="$SCHEMA_DIR/schema.prisma"
PROD_SCHEMA="$SCHEMA_DIR/schema.prod.prisma"

if [ ! -f "$DEV_SCHEMA" ]; then
  echo "❌ ERROR: $DEV_SCHEMA not found"
  exit 1
fi

echo "🔄 Syncing schema files..."
echo "   Source: $DEV_SCHEMA (SQLite)"
echo "   Target: $PROD_SCHEMA (PostgreSQL)"
echo ""

# Copy dev schema to prod and change the provider
cp "$DEV_SCHEMA" "$PROD_SCHEMA"

# Replace sqlite with postgresql in the datasource block
sed -i 's/provider = "sqlite"/provider = "postgresql"/' "$PROD_SCHEMA"

# Update the comment at the top
sed -i '1s|.*|// VidaCRM - Planes de Salud Argentina|' "$PROD_SCHEMA"

# Verify the change
if grep -q 'provider = "postgresql"' "$PROD_SCHEMA"; then
  echo "✅ Schema synced successfully!"
  echo "   $DEV_SCHEMA → provider = \"sqlite\" (dev)"
  echo "   $PROD_SCHEMA → provider = \"postgresql\" (prod)"
else
  echo "❌ ERROR: Failed to set PostgreSQL provider in $PROD_SCHEMA"
  exit 1
fi
