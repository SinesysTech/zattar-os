#!/bin/bash
# Script para atualizar tipos TypeScript do Supabase
# Uso: ./update-types.sh

echo "Gerando tipos TypeScript do Supabase..."
echo "Nota: Este script requer que o Supabase local esteja rodando"
echo "ou que você tenha acesso ao projeto Supabase via CLI"
echo ""
echo "Para gerar tipos localmente:"
echo "  npx supabase gen types typescript --local > src/lib/supabase/database.types.ts"
echo ""
echo "Para gerar tipos do projeto remoto:"
echo "  npx supabase gen types typescript --project-id <project-id> > src/lib/supabase/database.types.ts"
echo ""
echo "Ou use o Supabase Dashboard para gerar e baixar os tipos."
