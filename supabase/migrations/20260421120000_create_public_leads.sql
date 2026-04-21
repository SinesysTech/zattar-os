-- ============================================================================
-- Migration: create_public_leads
-- Data: 2026-04-21
-- Contexto: Sprint 1 Item 1 do redesign do website público. Captura leads do
-- formulário de /contato (e futuros forms públicos) com colunas já preparadas
-- para o módulo admin /leads que será construído na sequência
-- (ver project_leads_admin_module.md na memória).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.public_leads (
  id BIGSERIAL PRIMARY KEY,

  -- Campos capturados no formulário público
  nome TEXT NOT NULL CHECK (char_length(nome) BETWEEN 2 AND 200),
  email TEXT NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  telefone TEXT CHECK (telefone IS NULL OR char_length(telefone) <= 32),
  assunto TEXT CHECK (assunto IS NULL OR char_length(assunto) <= 200),
  mensagem TEXT NOT NULL CHECK (char_length(mensagem) BETWEEN 10 AND 5000),

  -- Metadata de origem
  source TEXT NOT NULL DEFAULT 'website-contato'
    CHECK (source IN ('website-contato', 'website-faq', 'website-solucoes',
                      'website-expertise', 'website-insights', 'api', 'import', 'other')),
  user_agent TEXT,
  ip INET,

  -- Gestão interna (preenchidas pelo admin no módulo futuro)
  status TEXT NOT NULL DEFAULT 'novo'
    CHECK (status IN ('novo', 'em_contato', 'qualificado', 'convertido', 'descartado', 'spam')),
  atribuido_a BIGINT REFERENCES public.usuarios(id) ON DELETE SET NULL,
  cliente_id BIGINT REFERENCES public.clientes(id) ON DELETE SET NULL,
  notas_internas TEXT,
  motivo_descarte TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lida_em TIMESTAMPTZ,
  respondida_em TIMESTAMPTZ
);

COMMENT ON TABLE public.public_leads IS
  'Leads capturados via formulários públicos do website. Insert aberto para anon; gerenciamento apenas para admins autenticados.';
COMMENT ON COLUMN public.public_leads.source IS
  'Origem do lead. Use slugs estáveis — o módulo admin filtra por eles.';
COMMENT ON COLUMN public.public_leads.cliente_id IS
  'Preenchido quando o lead é convertido em cliente (partes.clientes) pelo módulo admin.';

-- ============================================================================
-- Índices
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_public_leads_status_created
  ON public.public_leads(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_public_leads_atribuido_a
  ON public.public_leads(atribuido_a) WHERE atribuido_a IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_public_leads_cliente_id
  ON public.public_leads(cliente_id) WHERE cliente_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_public_leads_email
  ON public.public_leads(email);

-- Dedupe suporte: rapidamente verificar se há lead recente do mesmo email
-- (anti-spam de aplicação; complementa rate-limit do Redis por IP).
CREATE INDEX IF NOT EXISTS idx_public_leads_email_created_desc
  ON public.public_leads(email, created_at DESC);

-- ============================================================================
-- Trigger updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.tg_public_leads_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS public_leads_set_updated_at ON public.public_leads;
CREATE TRIGGER public_leads_set_updated_at
  BEFORE UPDATE ON public.public_leads
  FOR EACH ROW EXECUTE FUNCTION public.tg_public_leads_set_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE public.public_leads ENABLE ROW LEVEL SECURITY;

-- INSERT aberto para anon e authenticated: qualquer visitante pode enviar
-- o formulário. Rate-limit e validação são aplicados na camada de aplicação
-- (Server Action com Redis + Zod + honeypot).
DROP POLICY IF EXISTS "public_leads_insert_any" ON public.public_leads;
CREATE POLICY "public_leads_insert_any"
  ON public.public_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- SELECT/UPDATE/DELETE apenas para usuários autenticados com is_super_admin = true.
-- O módulo admin poderá refinar essa política depois (adicionar perfil "operacional").
DROP POLICY IF EXISTS "public_leads_select_admin" ON public.public_leads;
CREATE POLICY "public_leads_select_admin"
  ON public.public_leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.auth_user_id = (SELECT auth.uid())
        AND u.ativo = true
        AND u.is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "public_leads_update_admin" ON public.public_leads;
CREATE POLICY "public_leads_update_admin"
  ON public.public_leads
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.auth_user_id = (SELECT auth.uid())
        AND u.ativo = true
        AND u.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.auth_user_id = (SELECT auth.uid())
        AND u.ativo = true
        AND u.is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "public_leads_delete_admin" ON public.public_leads;
CREATE POLICY "public_leads_delete_admin"
  ON public.public_leads
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.auth_user_id = (SELECT auth.uid())
        AND u.ativo = true
        AND u.is_super_admin = true
    )
  );

-- ============================================================================
-- Grants (reforço explícito além das policies)
-- ============================================================================

GRANT INSERT ON public.public_leads TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.public_leads TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.public_leads_id_seq TO anon, authenticated;
