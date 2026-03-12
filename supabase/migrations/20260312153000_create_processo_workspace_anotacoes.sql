-- =============================================================================
-- PROCESSO WORKSPACE ANOTACOES
-- Persistência de anotações contextuais da página de processo.
-- Liga o usuário ao processo e ao item da timeline sem depender do módulo genérico de notas.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.processo_workspace_anotacoes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  processo_id BIGINT NOT NULL,
  numero_processo TEXT NOT NULL,
  timeline_item_id BIGINT NOT NULL,
  item_titulo TEXT,
  item_data TIMESTAMPTZ,
  conteudo TEXT NOT NULL,
  anchor JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT processo_workspace_anotacoes_conteudo_chk CHECK (char_length(btrim(conteudo)) > 0)
);

COMMENT ON TABLE public.processo_workspace_anotacoes IS 'Anotações do workspace jurídico na visualização do processo.';
COMMENT ON COLUMN public.processo_workspace_anotacoes.usuario_id IS 'Usuário dono da anotação.';
COMMENT ON COLUMN public.processo_workspace_anotacoes.processo_id IS 'ID lógico do processo aberto no workspace.';
COMMENT ON COLUMN public.processo_workspace_anotacoes.numero_processo IS 'Número CNJ do processo para referência humana e integração.';
COMMENT ON COLUMN public.processo_workspace_anotacoes.timeline_item_id IS 'ID do item da timeline ao qual a anotação está vinculada.';
COMMENT ON COLUMN public.processo_workspace_anotacoes.item_titulo IS 'Título do item da timeline no momento da anotação.';
COMMENT ON COLUMN public.processo_workspace_anotacoes.item_data IS 'Data do item da timeline no momento da anotação.';
COMMENT ON COLUMN public.processo_workspace_anotacoes.conteudo IS 'Conteúdo livre da anotação contextual.';
COMMENT ON COLUMN public.processo_workspace_anotacoes.anchor IS 'Metadados de ancoragem no viewer/documento para evolução futura.';

CREATE INDEX IF NOT EXISTS idx_proc_workspace_anotacoes_usuario_id
  ON public.processo_workspace_anotacoes USING BTREE (usuario_id);

CREATE INDEX IF NOT EXISTS idx_proc_workspace_anotacoes_processo_id
  ON public.processo_workspace_anotacoes USING BTREE (processo_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proc_workspace_anotacoes_timeline_item_id
  ON public.processo_workspace_anotacoes USING BTREE (timeline_item_id, created_at DESC);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    DROP TRIGGER IF EXISTS update_processo_workspace_anotacoes_updated_at ON public.processo_workspace_anotacoes;
    CREATE TRIGGER update_processo_workspace_anotacoes_updated_at
    BEFORE UPDATE ON public.processo_workspace_anotacoes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

ALTER TABLE public.processo_workspace_anotacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role acesso total processo workspace anotacoes" ON public.processo_workspace_anotacoes;
CREATE POLICY "Service role acesso total processo workspace anotacoes"
  ON public.processo_workspace_anotacoes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios autenticados gerenciam proprias anotacoes de processo" ON public.processo_workspace_anotacoes;
CREATE POLICY "Usuarios autenticados gerenciam proprias anotacoes de processo"
  ON public.processo_workspace_anotacoes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.usuarios u
      WHERE u.id = processo_workspace_anotacoes.usuario_id
        AND u.auth_user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.usuarios u
      WHERE u.id = processo_workspace_anotacoes.usuario_id
        AND u.auth_user_id = (select auth.uid())
    )
  );