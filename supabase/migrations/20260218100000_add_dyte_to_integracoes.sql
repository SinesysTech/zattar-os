-- Migration: Add dyte to integracoes tipo enum
-- Purpose: Allow storing Dyte video/audio configuration in integracoes table
-- Date: 2026-02-18

-- =============================================================================
-- UPDATE CHECK CONSTRAINT
-- =============================================================================

-- Drop existing check constraint
ALTER TABLE public.integracoes
DROP CONSTRAINT integracoes_tipo_check;

-- Add new check constraint with 'dyte' added
ALTER TABLE public.integracoes
ADD CONSTRAINT integracoes_tipo_check
CHECK (tipo IN ('twofauth', 'zapier', 'dify', 'webhook', 'api', 'chatwoot', 'dyte'));

-- =============================================================================
-- DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.integracoes IS 'Tabela centralizada para gerenciar integrações externas (2FAuth, Zapier, Dify, Webhooks, APIs, Chatwoot, Dyte)';
