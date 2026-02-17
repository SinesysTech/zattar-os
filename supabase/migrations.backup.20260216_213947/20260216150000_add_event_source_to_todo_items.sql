-- Migration: Adicionar colunas de rastreamento de origem a todo_items
-- Permite replicação física de eventos (audiências, expedientes, perícias, obrigações) como to-dos

-- 1. Adicionar colunas de source tracking
ALTER TABLE public.todo_items
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS source_entity_id text;

-- 2. Constraint: source deve ser um dos tipos conhecidos ou null (itens manuais)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'todo_items_source_check'
  ) THEN
    ALTER TABLE public.todo_items
      ADD CONSTRAINT todo_items_source_check
      CHECK (source IS NULL OR source IN ('audiencias', 'expedientes', 'pericias', 'obrigacoes'));
  END IF;
END
$$;

-- 3. Unique index: apenas um todo por entidade de origem (idempotência)
CREATE UNIQUE INDEX IF NOT EXISTS idx_todo_items_source_entity
  ON public.todo_items(source, source_entity_id)
  WHERE source IS NOT NULL;

-- 4. Index para buscas rápidas por source
CREATE INDEX IF NOT EXISTS idx_todo_items_source
  ON public.todo_items(source)
  WHERE source IS NOT NULL;
