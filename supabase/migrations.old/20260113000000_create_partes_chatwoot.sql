-- =============================================================================
-- Migration: Criar tabela partes_chatwoot
-- Descrição: Mapeamento entre partes locais e contatos do Chatwoot
-- Data: 2026-01-13
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabela: partes_chatwoot
-- Mapeia entidades locais (clientes, partes_contrarias, terceiros) para
-- contatos do Chatwoot, permitindo sincronização bidirecional.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.partes_chatwoot (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Referência polimórfica para a parte local
  -- tipo_entidade: discriminador para identificar a tabela de origem
  -- entidade_id: ID da parte na tabela correspondente
  tipo_entidade text NOT NULL CHECK (tipo_entidade IN ('cliente', 'parte_contraria', 'terceiro')),
  entidade_id bigint NOT NULL,

  -- Referência para o Chatwoot
  -- chatwoot_contact_id: ID do contato no Chatwoot
  -- chatwoot_account_id: ID da conta (suporte multi-tenant)
  chatwoot_contact_id bigint NOT NULL,
  chatwoot_account_id integer NOT NULL,

  -- Metadata de sincronização
  -- ultima_sincronizacao: timestamp da última sincronização bem-sucedida
  -- dados_sincronizados: snapshot dos dados sincronizados (para detecção de mudanças)
  ultima_sincronizacao timestamptz DEFAULT now(),
  dados_sincronizados jsonb DEFAULT '{}',

  -- Controle de sincronização
  -- sincronizado: flag para indicar se está sincronizado
  -- erro_sincronizacao: mensagem de erro da última tentativa (se houver)
  sincronizado boolean DEFAULT true,
  erro_sincronizacao text,

  -- Audit
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraints de unicidade
  -- Cada parte local pode ter apenas um contato Chatwoot
  CONSTRAINT uq_partes_chatwoot_entidade UNIQUE (tipo_entidade, entidade_id),
  -- Cada contato Chatwoot pode estar vinculado a apenas uma parte local (por account)
  CONSTRAINT uq_partes_chatwoot_contact UNIQUE (chatwoot_account_id, chatwoot_contact_id)
);

-- -----------------------------------------------------------------------------
-- Índices para queries frequentes
-- -----------------------------------------------------------------------------

-- Busca por entidade local (usado na sincronização)
CREATE INDEX IF NOT EXISTS idx_partes_chatwoot_entidade
  ON public.partes_chatwoot(tipo_entidade, entidade_id);

-- Busca por contato Chatwoot (usado na importação)
CREATE INDEX IF NOT EXISTS idx_partes_chatwoot_contact
  ON public.partes_chatwoot(chatwoot_contact_id);

-- Busca por account_id (multi-tenant)
CREATE INDEX IF NOT EXISTS idx_partes_chatwoot_account
  ON public.partes_chatwoot(chatwoot_account_id);

-- Busca por itens não sincronizados (para retry)
CREATE INDEX IF NOT EXISTS idx_partes_chatwoot_nao_sincronizado
  ON public.partes_chatwoot(sincronizado)
  WHERE sincronizado = false;

-- -----------------------------------------------------------------------------
-- Trigger para atualizar updated_at automaticamente
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_partes_chatwoot_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_partes_chatwoot_updated_at ON public.partes_chatwoot;
CREATE TRIGGER trg_partes_chatwoot_updated_at
  BEFORE UPDATE ON public.partes_chatwoot
  FOR EACH ROW
  EXECUTE FUNCTION public.update_partes_chatwoot_updated_at();

-- -----------------------------------------------------------------------------
-- RLS (Row Level Security)
-- -----------------------------------------------------------------------------
ALTER TABLE public.partes_chatwoot ENABLE ROW LEVEL SECURITY;

-- Policy para SELECT: usuários autenticados podem ver todos os mapeamentos
CREATE POLICY partes_chatwoot_select_policy ON public.partes_chatwoot
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy para INSERT: usuários autenticados podem criar mapeamentos
CREATE POLICY partes_chatwoot_insert_policy ON public.partes_chatwoot
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy para UPDATE: usuários autenticados podem atualizar mapeamentos
CREATE POLICY partes_chatwoot_update_policy ON public.partes_chatwoot
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy para DELETE: usuários autenticados podem excluir mapeamentos
CREATE POLICY partes_chatwoot_delete_policy ON public.partes_chatwoot
  FOR DELETE
  TO authenticated
  USING (true);

-- Policy para service_role: acesso total
CREATE POLICY partes_chatwoot_service_policy ON public.partes_chatwoot
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- Comentários na tabela e colunas
-- -----------------------------------------------------------------------------
COMMENT ON TABLE public.partes_chatwoot IS
  'Mapeamento entre partes locais (clientes, partes_contrarias, terceiros) e contatos do Chatwoot';

COMMENT ON COLUMN public.partes_chatwoot.tipo_entidade IS
  'Tipo da entidade local: cliente, parte_contraria, terceiro';

COMMENT ON COLUMN public.partes_chatwoot.entidade_id IS
  'ID da entidade na tabela correspondente (clientes, partes_contrarias, terceiros)';

COMMENT ON COLUMN public.partes_chatwoot.chatwoot_contact_id IS
  'ID do contato no Chatwoot';

COMMENT ON COLUMN public.partes_chatwoot.chatwoot_account_id IS
  'ID da conta no Chatwoot (suporte multi-tenant)';

COMMENT ON COLUMN public.partes_chatwoot.ultima_sincronizacao IS
  'Timestamp da última sincronização bem-sucedida';

COMMENT ON COLUMN public.partes_chatwoot.dados_sincronizados IS
  'Snapshot JSON dos dados sincronizados para detecção de mudanças';

COMMENT ON COLUMN public.partes_chatwoot.sincronizado IS
  'Flag indicando se o registro está sincronizado com o Chatwoot';

COMMENT ON COLUMN public.partes_chatwoot.erro_sincronizacao IS
  'Mensagem de erro da última tentativa de sincronização (se houver)';
