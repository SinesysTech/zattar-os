-- Migration: Criar tabela de integrações
-- Data: 2026-02-16
-- Descrição: Tabela para armazenar configurações de integrações externas (2FAuth, Zapier, etc.)

-- Criar tabela de integrações
CREATE TABLE IF NOT EXISTS public.integracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(50) NOT NULL, -- 'twofauth', 'zapier', 'dify', etc.
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  configuracao JSONB NOT NULL DEFAULT '{}'::jsonb, -- Configurações específicas da integração
  metadata JSONB DEFAULT '{}'::jsonb, -- Metadados adicionais
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by_auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT integracoes_tipo_check CHECK (tipo IN ('twofauth', 'zapier', 'dify', 'webhook', 'api')),
  CONSTRAINT integracoes_nome_unique UNIQUE (tipo, nome)
);

-- Índices
CREATE INDEX idx_integracoes_tipo ON public.integracoes(tipo);
CREATE INDEX idx_integracoes_ativo ON public.integracoes(ativo);
CREATE INDEX idx_integracoes_created_at ON public.integracoes(created_at DESC);

-- Trigger para updated_at
CREATE TRIGGER tr_integracoes_updated_at
  BEFORE UPDATE ON public.integracoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.integracoes ENABLE ROW LEVEL SECURITY;

-- Policy: Todos usuários autenticados podem ler integrações ativas
CREATE POLICY "Usuários autenticados podem ler integrações ativas"
  ON public.integracoes
  FOR SELECT
  TO authenticated
  USING (ativo = true);

-- Policy: Apenas admins podem inserir integrações
CREATE POLICY "Apenas admins podem inserir integrações"
  ON public.integracoes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.auth_user_id = auth.uid()
      AND usuarios.role = 'admin'
    )
  );

-- Policy: Apenas admins podem atualizar integrações
CREATE POLICY "Apenas admins podem atualizar integrações"
  ON public.integracoes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.auth_user_id = auth.uid()
      AND usuarios.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.auth_user_id = auth.uid()
      AND usuarios.role = 'admin'
    )
  );

-- Policy: Apenas admins podem deletar integrações
CREATE POLICY "Apenas admins podem deletar integrações"
  ON public.integracoes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.auth_user_id = auth.uid()
      AND usuarios.role = 'admin'
    )
  );

-- Comentários
COMMENT ON TABLE public.integracoes IS 'Armazena configurações de integrações externas';
COMMENT ON COLUMN public.integracoes.tipo IS 'Tipo da integração (twofauth, zapier, dify, etc.)';
COMMENT ON COLUMN public.integracoes.configuracao IS 'Configurações específicas da integração em formato JSONB';
COMMENT ON COLUMN public.integracoes.metadata IS 'Metadados adicionais (última sincronização, status, etc.)';

-- Inserir integração padrão do 2FAuth (se houver variáveis de ambiente configuradas)
-- Nota: Os valores reais devem ser inseridos via interface ou script de migração
INSERT INTO public.integracoes (tipo, nome, descricao, ativo, configuracao)
VALUES (
  'twofauth',
  '2FAuth Principal',
  'Servidor de autenticação de dois fatores',
  true,
  jsonb_build_object(
    'api_url', '',
    'api_token', '',
    'account_id', null
  )
)
ON CONFLICT (tipo, nome) DO NOTHING;
