#!/bin/bash

# Script para aplicar migration via SQL Editor do Supabase
# Este script exibe o SQL que deve ser executado manualmente

echo "📋 Migration SQL para Tabela de Integrações"
echo "============================================"
echo ""
echo "⚠️  Execute este SQL no Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/[PROJECT_ID]/sql/new"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat supabase/migrations/20260216220000_create_integracoes_table.sql

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Após executar o SQL acima, rode:"
echo "   npm run integrations:migrate"
echo ""
