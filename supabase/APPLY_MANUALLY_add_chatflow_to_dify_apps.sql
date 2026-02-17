-- ============================================================================
-- Migration: Adicionar tipo 'chatflow' ao enum app_type da tabela dify_apps
-- Data: 2026-02-16
-- Descrição: Adiciona o tipo 'chatflow' que estava faltando na integração com Dify
-- ============================================================================
-- 
-- INSTRUÇÕES PARA APLICAR MANUALMENTE:
-- 1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
-- 2. Vá em SQL Editor
-- 3. Cole e execute este script
-- 
-- ============================================================================

-- Remover a constraint antiga
ALTER TABLE dify_apps DROP CONSTRAINT IF EXISTS dify_apps_app_type_check;

-- Adicionar nova constraint com 'chatflow' incluído
ALTER TABLE dify_apps ADD CONSTRAINT dify_apps_app_type_check 
  CHECK (app_type IN ('chat', 'chatflow', 'workflow', 'completion', 'agent'));

-- Comentário explicativo
COMMENT ON COLUMN dify_apps.app_type IS 
  'Tipo do aplicativo Dify: chat (chatbot básico), chatflow (conversas multi-turn com memória), workflow (tarefas single-turn), completion (geração de texto), agent (agente com ferramentas)';

-- Verificar se a constraint foi aplicada corretamente
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'dify_apps'::regclass
  AND conname = 'dify_apps_app_type_check';
