#!/bin/bash

# Fix Supabase migration issues
# This script renames incorrectly formatted migrations and removes problematic ones

echo "🔧 Fixing Supabase migrations..."

# Navigate to migrations directory
cd supabase/migrations || exit 1

# Rename files with incorrect format (YYYY-MM-DD-name.sql → YYYYMMDDHHMMSS_name.sql)
echo "📝 Renaming incorrectly formatted files..."

# 2025-12-06 → 20251206000000
if [ -f "2025-12-06-create-conciliacao-bancaria-tables.sql" ]; then
  mv "2025-12-06-create-conciliacao-bancaria-tables.sql" "20251206000000_create_conciliacao_bancaria_tables.sql"
  echo "✅ Renamed conciliacao-bancaria-tables"
fi

# 2025-12-07 → 20251207000000
if [ -f "2025-12-07-add-dados-adicionais-conciliacoes.sql" ]; then
  mv "2025-12-07-add-dados-adicionais-conciliacoes.sql" "20251207000000_add_dados_adicionais_conciliacoes.sql"
  echo "✅ Renamed dados-adicionais-conciliacoes"
fi

# 2025-12-12 → 20251212000000
if [ -f "2025-12-12-create-embeddings-system.sql" ]; then
  mv "2025-12-12-create-embeddings-system.sql" "20251212000000_create_embeddings_system.sql"
  echo "✅ Renamed embeddings-system"
fi

# 2025-12-29 → 20251229000000
if [ -f "2025-12-29-refactor-contratos-modelo-relacional.sql" ]; then
  mv "2025-12-29-refactor-contratos-modelo-relacional.sql" "20251229000000_refactor_contratos_modelo_relacional.sql"
  echo "✅ Renamed contratos-modelo-relacional"
fi

# Rename files without proper timestamp format
if [ -f "add-tipo-captura-combinada.sql" ]; then
  mv "add-tipo-captura-combinada.sql" "20251125000010_add_tipo_captura_combinada.sql"
  echo "✅ Renamed add-tipo-captura-combinada"
fi

if [ -f "add_dados_anteriores_auditoria.sql" ]; then
  mv "add_dados_anteriores_auditoria.sql" "20260216130001_add_dados_anteriores_auditoria.sql"
  echo "✅ Renamed add_dados_anteriores_auditoria"
fi

# Remove the problematic timeline migration (table doesn't exist yet)
echo "🗑️  Removing problematic migrations..."
if [ -f "20250101000001_add_timeline_jsonb_to_acervo.sql" ]; then
  mv "20250101000001_add_timeline_jsonb_to_acervo.sql" "20250101000001_add_timeline_jsonb_to_acervo.sql.disabled"
  echo "✅ Disabled add_timeline_jsonb_to_acervo (acervo table doesn't exist in migrations)"
fi

# Remove APPLY_MANUALLY file (should not be in migrations)
if [ -f "APPLY_MANUALLY_add_chatflow_to_dify_apps.sql" ]; then
  mv "APPLY_MANUALLY_add_chatflow_to_dify_apps.sql" "../APPLY_MANUALLY_add_chatflow_to_dify_apps.sql"
  echo "✅ Moved APPLY_MANUALLY file out of migrations"
fi

echo ""
echo "✨ Migration fixes complete!"
echo ""
echo "Next steps:"
echo "1. Run: supabase db reset"
echo "2. Or run: supabase start"
echo ""
echo "Note: The acervo table needs to be created via schema files or a proper migration."
