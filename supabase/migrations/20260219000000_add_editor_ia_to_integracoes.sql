-- Migration: Add editor_ia to integracoes tipo enum
-- Purpose: Allow storing AI editor configuration in integracoes table
-- Date: 2026-02-19

-- =============================================================================
-- UPDATE CHECK CONSTRAINT
-- =============================================================================

-- Drop existing check constraint
ALTER TABLE public.integracoes
DROP CONSTRAINT integracoes_tipo_check;

-- Add new check constraint with 'editor_ia' added
ALTER TABLE public.integracoes
ADD CONSTRAINT integracoes_tipo_check
CHECK (tipo IN ('twofauth', 'zapier', 'dify', 'webhook', 'api', 'chatwoot', 'dyte', 'editor_ia'));

-- =============================================================================
-- DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.integracoes IS 'Tabela centralizada para gerenciar integrações externas (2FAuth, Zapier, Dify, Webhooks, APIs, Chatwoot, Dyte, Editor IA)';
