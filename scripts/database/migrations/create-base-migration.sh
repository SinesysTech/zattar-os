#!/bin/bash

# Create a base migration from schema files
# This consolidates all schema files into a single migration that runs before others

echo "🔧 Creating base migration from schema files..."

# Create output file
OUTPUT="supabase/migrations/20240101000000_base_schema.sql"

# Start with header
cat > "$OUTPUT" << 'EOF'
-- Base Schema Migration
-- Consolidated from supabase/schemas/*.sql
-- This migration creates all base tables, enums, and functions

-- =====================================================
-- SECTION 1: EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS hypopg WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS index_advisor WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

EOF

# Concatenate all schema files in order
echo "📝 Adding schema files..."
for file in supabase/schemas/*.sql; do
  if [ -f "$file" ]; then
    echo "   - $(basename "$file")"
    echo "" >> "$OUTPUT"
    echo "-- =====================================================" >> "$OUTPUT"
    echo "-- From: $(basename "$file")" >> "$OUTPUT"
    echo "-- =====================================================" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
    cat "$file" >> "$OUTPUT"
  fi
done

echo ""
echo "✅ Base migration created: $OUTPUT"
echo ""
echo "Next steps:"
echo "1. Review the migration file"
echo "2. Run: supabase db reset"
echo "3. Or run: supabase start"
