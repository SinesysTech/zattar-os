#!/bin/bash

# Fix base migration by removing ALTER-only schema files
# These files assume tables already exist and should be separate migrations

echo "🔧 Fixing base migration..."

# Files that are ALTER-only (not CREATE)
ALTER_ONLY_FILES=(
  "03_credenciais.sql"
  "05_remove_timeline_mongodb_id_from_acervo.sql"
  "25_credenciais_add_usuario.sql"
)

# Create output file
OUTPUT="supabase/migrations/20240101000000_base_schema.sql"
TEMP_OUTPUT="${OUTPUT}.tmp"

# Start with header
cat > "$TEMP_OUTPUT" << 'EOF'
-- Base Schema Migration
-- Consolidated from supabase/schemas/*.sql (CREATE statements only)
-- ALTER-only files are skipped and should be separate migrations

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

# Concatenate schema files, skipping ALTER-only ones
echo "📝 Adding schema files (skipping ALTER-only)..."
for file in supabase/schemas/*.sql; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    
    # Check if file is in ALTER_ONLY list
    skip=false
    for alter_file in "${ALTER_ONLY_FILES[@]}"; do
      if [ "$filename" = "$alter_file" ]; then
        skip=true
        echo "   ⏭️  Skipping $filename (ALTER-only)"
        break
      fi
    done
    
    if [ "$skip" = false ]; then
      echo "   ✅ Adding $filename"
      echo "" >> "$TEMP_OUTPUT"
      echo "-- =====================================================" >> "$TEMP_OUTPUT"
      echo "-- From: $filename" >> "$TEMP_OUTPUT"
      echo "-- =====================================================" >> "$TEMP_OUTPUT"
      echo "" >> "$TEMP_OUTPUT"
      cat "$file" >> "$TEMP_OUTPUT"
    fi
  fi
done

# Replace old file with new one
mv "$TEMP_OUTPUT" "$OUTPUT"

echo ""
echo "✅ Base migration fixed: $OUTPUT"
echo ""
echo "⚠️  Note: The following files were skipped (should be separate migrations):"
for alter_file in "${ALTER_ONLY_FILES[@]}"; do
  echo "   - $alter_file"
done
echo ""
echo "Next steps:"
echo "1. Run: supabase start"
