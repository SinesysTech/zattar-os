#!/bin/bash

# Reset local migrations and pull fresh from production
# This will backup your current migrations and get a clean copy from production

echo "🔧 Resetting local migrations and pulling from production..."

# 1. Backup current migrations
echo "📦 Backing up current migrations..."
BACKUP_DIR="supabase/migrations.backup.$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r supabase/migrations/* "$BACKUP_DIR/" 2>/dev/null || true
echo "✅ Backup created: $BACKUP_DIR"

# 2. Remove all migrations except the ones we want to keep
echo "🗑️  Clearing local migrations..."
rm -rf supabase/migrations/*

# 3. Pull fresh migrations from production
echo "⬇️  Pulling migrations from production..."
supabase db pull

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Successfully pulled migrations from production!"
  echo ""
  echo "Next steps:"
  echo "1. Run: supabase start"
  echo "2. Your old migrations are backed up in: $BACKUP_DIR"
else
  echo ""
  echo "❌ Failed to pull migrations"
  echo "Restoring backup..."
  cp -r "$BACKUP_DIR"/* supabase/migrations/
  echo "Backup restored"
fi
