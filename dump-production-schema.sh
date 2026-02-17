#!/bin/bash

# Dump production schema directly (bypasses migration history)
# This creates a single migration with the complete current schema

echo "🔧 Dumping production schema..."

# Create output file
OUTPUT="supabase/migrations/00000000000001_production_schema.sql"

echo "⬇️  Dumping schema from production..."
supabase db dump --schema public --data-only=false > "$OUTPUT"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Successfully dumped production schema!"
  echo "📄 Created: $OUTPUT"
  echo ""
  echo "Next steps:"
  echo "1. Run: supabase db reset"
  echo "2. Or run: supabase start"
else
  echo ""
  echo "❌ Failed to dump schema"
  echo ""
  echo "Alternative: Use remote database directly"
  echo "Set DATABASE_URL in .env.local to your production connection string"
fi
