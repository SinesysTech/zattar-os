-- Migration: Create integracoes table and populate with existing integrations
-- Date: 2026-02-16
-- Description: Creates integracoes table for centralized integration management

-- =============================================================================
-- CREATE TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.integracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('twofauth', 'zapier', 'dify', 'webhook', 'api')),
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  configuracao JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by_auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT integracoes_nome_tipo_unique UNIQUE (tipo, nome)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_integracoes_tipo ON public.integracoes(tipo);
CREATE INDEX IF NOT EXISTS idx_integracoes_ativo ON public.integracoes(ativo);
CREATE INDEX IF NOT EXISTS idx_integracoes_tipo_ativo ON public.integracoes(tipo, ativo);
CREATE INDEX IF NOT EXISTS idx_integracoes_created_at ON public.integracoes(created_at DESC);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.integracoes IS 'Tabela centralizada para gerenciar integrações externas (2FAuth, Zapier, Dify, Webhooks, APIs)';
COMMENT ON COLUMN public.integracoes.id IS 'Identificador único da integração';
COMMENT ON COLUMN public.integracoes.tipo IS 'Tipo de integração: twofauth, zapier, dify, webhook, api';
COMMENT ON COLUMN public.integracoes.nome IS 'Nome da integração';
COMMENT ON COLUMN public.integracoes.descricao IS 'Descrição da integração';
COMMENT ON COLUMN public.integracoes.ativo IS 'Se a integração está ativa';
COMMENT ON COLUMN public.integracoes.configuracao IS 'Configurações específicas da integração (JSON)';
COMMENT ON COLUMN public.integracoes.metadata IS 'Metadados adicionais (JSON)';
COMMENT ON COLUMN public.integracoes.created_by_auth_id IS 'ID do usuário que criou a integração';
COMMENT ON COLUMN public.integracoes.updated_by_auth_id IS 'ID do usuário que atualizou a integração';

-- =============================================================================
-- TRIGGER: updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_integracoes_updated_at
  BEFORE UPDATE ON public.integracoes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE public.integracoes ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all integrations
CREATE POLICY "Authenticated users can read integrations"
  ON public.integracoes
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert integrations
CREATE POLICY "Authenticated users can insert integrations"
  ON public.integracoes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update integrations
CREATE POLICY "Authenticated users can update integrations"
  ON public.integracoes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can delete integrations
CREATE POLICY "Authenticated users can delete integrations"
  ON public.integracoes
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================================================
-- POPULATE WITH EXISTING INTEGRATIONS
-- =============================================================================

-- Note: This section will be populated based on environment variables
-- Users should manually add their integrations via the UI at /app/configuracoes?tab=integracoes
-- or use the Server Actions from @/features/integracoes

-- Example: Insert 2FAuth integration (commented out - configure via UI)
-- INSERT INTO public.integracoes (tipo, nome, descricao, ativo, configuracao)
-- VALUES (
--   'twofauth',
--   '2FAuth Principal',
--   'Servidor de autenticação de dois fatores',
--   true,
--   jsonb_build_object(
--     'api_url', 'https://your-2fauth-instance.com',
--     'api_token', 'your-api-token-here',
--     'account_id', 1
--   )
-- )
-- ON CONFLICT (tipo, nome) DO NOTHING;

-- Example: Insert Dify integration (commented out - configure via UI)
-- INSERT INTO public.integracoes (tipo, nome, descricao, ativo, configuracao)
-- VALUES (
--   'dify',
--   'Dify AI Principal',
--   'Plataforma de agentes e workflows de IA',
--   false,
--   jsonb_build_object(
--     'api_url', 'https://api.dify.ai/v1',
--     'api_key', 'your-dify-api-key'
--   )
-- )
-- ON CONFLICT (tipo, nome) DO NOTHING;

-- Example: Insert Zapier integration (commented out - configure via UI)
-- INSERT INTO public.integracoes (tipo, nome, descricao, ativo, configuracao)
-- VALUES (
--   'zapier',
--   'Zapier Principal',
--   'Automação de workflows',
--   false,
--   jsonb_build_object(
--     'webhook_url', 'https://hooks.zapier.com/hooks/catch/...'
--   )
-- )
-- ON CONFLICT (tipo, nome) DO NOTHING;

