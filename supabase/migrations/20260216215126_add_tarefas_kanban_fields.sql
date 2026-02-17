-- Migration: Add fields for Tarefas + Kanban unification
-- Date: 2026-02-16
-- Description: Creates quadros table and adds quadro_id, source, source_entity_id, and label columns to todo_items

-- Create quadros table first
CREATE TABLE IF NOT EXISTS public.quadros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id BIGINT NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('sistema', 'custom')),
  source TEXT CHECK (source IN ('expedientes', 'audiencias', 'obrigacoes')),
  icone TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for quadros
CREATE INDEX IF NOT EXISTS idx_quadros_usuario_id ON public.quadros(usuario_id);
CREATE INDEX IF NOT EXISTS idx_quadros_tipo ON public.quadros(tipo);
CREATE INDEX IF NOT EXISTS idx_quadros_usuario_ordem ON public.quadros(usuario_id, ordem);

-- Add comments for quadros
COMMENT ON TABLE public.quadros IS 'Quadros personalizados do Kanban';
COMMENT ON COLUMN public.quadros.id IS 'Identificador único do quadro';
COMMENT ON COLUMN public.quadros.usuario_id IS 'ID do usuário dono do quadro';
COMMENT ON COLUMN public.quadros.titulo IS 'Título do quadro';
COMMENT ON COLUMN public.quadros.tipo IS 'Tipo: sistema ou custom';
COMMENT ON COLUMN public.quadros.source IS 'Origem para quadros sistema (expedientes, audiencias, obrigacoes)';
COMMENT ON COLUMN public.quadros.icone IS 'Nome do ícone (opcional)';
COMMENT ON COLUMN public.quadros.ordem IS 'Ordem de exibição';

-- Add quadro_id column (references quadros table, nullable for tasks not in custom boards)
ALTER TABLE public.todo_items 
ADD COLUMN IF NOT EXISTS quadro_id UUID REFERENCES public.quadros(id) ON DELETE SET NULL;

-- Add source column (for virtual events: audiencias, expedientes, pericias, obrigacoes)
ALTER TABLE public.todo_items 
ADD COLUMN IF NOT EXISTS source TEXT;

-- Add source_entity_id column (ID of the source entity)
ALTER TABLE public.todo_items 
ADD COLUMN IF NOT EXISTS source_entity_id TEXT;

-- Add label column (task type/category)
ALTER TABLE public.todo_items 
ADD COLUMN IF NOT EXISTS label TEXT NOT NULL DEFAULT 'feature';

-- Add constraint for label values
ALTER TABLE public.todo_items 
ADD CONSTRAINT IF NOT EXISTS todo_items_label_check 
CHECK (label IN ('bug', 'feature', 'documentation', 'audiencia', 'expediente', 'pericia', 'obrigacao'));

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_todo_items_quadro_id ON public.todo_items(quadro_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_source ON public.todo_items(source);
CREATE INDEX IF NOT EXISTS idx_todo_items_label ON public.todo_items(usuario_id, label);

-- Add comments
COMMENT ON COLUMN public.todo_items.quadro_id IS 'ID do quadro personalizado (NULL = quadro sistema)';
COMMENT ON COLUMN public.todo_items.source IS 'Origem do evento virtual (audiencias, expedientes, etc.)';
COMMENT ON COLUMN public.todo_items.source_entity_id IS 'ID da entidade de origem';
COMMENT ON COLUMN public.todo_items.label IS 'Tipo/categoria da tarefa';
