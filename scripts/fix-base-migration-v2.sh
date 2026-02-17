#!/bin/bash

# Fix base migration by removing files that depend on later migrations
# These files should be applied after their dependencies

echo "🔧 Fixing base migration (v2)..."

# Files that depend on later migrations or are ALTER-only
SKIP_FILES=(
  "03_credenciais.sql"                          # ALTER-only
  "05_acervo_unificado_view.sql"                # Depends on responsavel_id (added in 20251117015305)
  "05_remove_timeline_mongodb_id_from_acervo.sql"  # ALTER-only
  "25_credenciais_add_usuario.sql"              # ALTER-only
)

# Create output file
OUTPUT="supabase/migrations/20240101000000_base_schema.sql"
TEMP_OUTPUT="${OUTPUT}.tmp"

# Start with header
cat > "$TEMP_OUTPUT" << 'EOF'
-- Base Schema Migration
-- Consolidated from supabase/schemas/*.sql (CREATE statements only)
-- Files with dependencies on later migrations are skipped

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

# Concatenate schema files, skipping problematic ones
echo "📝 Adding schema files..."
for file in supabase/schemas/*.sql; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    
    # Check if file should be skipped
    skip=false
    for skip_file in "${SKIP_FILES[@]}"; do
      if [ "$filename" = "$skip_file" ]; then
        skip=true
        echo "   ⏭️  Skipping $filename"
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
echo "⚠️  Note: The following files were skipped:"
for skip_file in "${SKIP_FILES[@]}"; do
  echo "   - $skip_file"
done
echo ""
echo "Next steps:"
echo "1. Run: supabase start"
