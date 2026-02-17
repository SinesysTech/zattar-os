-- Migration: Add chatwoot to integracoes tipo enum
-- Purpose: Allow storing Chatwoot configuration in integracoes table instead of env vars
-- Date: 2026-02-18

-- =============================================================================
-- UPDATE CHECK CONSTRAINT
-- =============================================================================

-- Drop existing check constraint
ALTER TABLE public.integracoes
DROP CONSTRAINT integracoes_tipo_check;

-- Add new check constraint with 'chatwoot' added
ALTER TABLE public.integracoes
ADD CONSTRAINT integracoes_tipo_check 
CHECK (tipo IN ('twofauth', 'zapier', 'dify', 'webhook', 'api', 'chatwoot'));

-- =============================================================================
-- DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.integracoes IS 'Tabela centralizada para gerenciar integrações externas (2FAuth, Zapier, Dify, Webhooks, APIs, Chatwoot)';

-- Example Chatwoot configuration (commented out - configure via UI):
-- INSERT INTO public.integracoes (tipo, nome, descricao, ativo, configuracao)
-- VALUES (
--   'chatwoot',
--   'Chatwoot Principal',
--   'Sistema de atendimento e conversas integrado',
--   true,
--   jsonb_build_object(
--     'api_url', 'https://chatwoot.seu-dominio.com',
--     'api_key', 'your-api-key-here',
--     'account_id', 1,
--     'default_inbox_id', 1
--   )
-- )
-- ON CONFLICT (tipo, nome) DO NOTHING;
