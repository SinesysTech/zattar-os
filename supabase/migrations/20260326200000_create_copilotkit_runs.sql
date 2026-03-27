-- ============================================================================
-- Migration: Criar tabela para persistência de threads do CopilotKit
--
-- Armazena runs do BuiltInAgent v2 com eventos AG-UI compactados.
-- Cada run pertence a um thread (identificado por thread_id = "user-{id}").
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.copilotkit_runs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  thread_id text NOT NULL,
  run_id text NOT NULL,
  parent_run_id text,
  events jsonb NOT NULL DEFAULT '[]',
  created_at bigint NOT NULL,           -- epoch ms (compatível com AG-UI)
  inserted_at timestamptz DEFAULT now() -- timestamp real para queries

  -- Nota: thread_id é "user-{usuario_id}" — não FK direta pois é string formatada.
  -- Pode ser extraído para queries: split_part(thread_id, '-', 2)::bigint
);

-- Índices para performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_copilotkit_runs_thread_run
  ON public.copilotkit_runs(thread_id, run_id);

CREATE INDEX IF NOT EXISTS idx_copilotkit_runs_thread_id
  ON public.copilotkit_runs(thread_id);

CREATE INDEX IF NOT EXISTS idx_copilotkit_runs_created_at
  ON public.copilotkit_runs(created_at);

-- RLS: apenas service role pode acessar (backend-only)
ALTER TABLE public.copilotkit_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON public.copilotkit_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE public.copilotkit_runs IS 'Persistência de threads/runs do CopilotKit BuiltInAgent v2';
COMMENT ON COLUMN public.copilotkit_runs.thread_id IS 'Identificador do thread (formato: user-{usuario_id})';
COMMENT ON COLUMN public.copilotkit_runs.run_id IS 'ID único da run (gerado pelo CopilotKit)';
COMMENT ON COLUMN public.copilotkit_runs.events IS 'Eventos AG-UI compactados (BaseEvent[])';
COMMENT ON COLUMN public.copilotkit_runs.created_at IS 'Timestamp epoch ms (compatível com AG-UI)';
