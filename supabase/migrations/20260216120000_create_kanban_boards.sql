-- =============================================================================
-- Migration: Kanban Multi-Board System
-- Cria tabela kanban_boards e adiciona board_id a kanban_columns
-- =============================================================================

-- Tabela: kanban_boards
CREATE TABLE IF NOT EXISTS kanban_boards (
  id TEXT PRIMARY KEY DEFAULT ('BRD-' || upper(substr(md5(random()::text), 1, 8))),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('system', 'custom')),
  source TEXT CHECK (source IN ('expedientes', 'audiencias', 'obrigacoes')),
  icone TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_system_board UNIQUE (usuario_id, source),
  CONSTRAINT system_board_requires_source CHECK (
    (tipo = 'system' AND source IS NOT NULL) OR (tipo = 'custom' AND source IS NULL)
  )
);

-- Índice para listar boards por usuário
CREATE INDEX IF NOT EXISTS idx_kanban_boards_usuario_id ON kanban_boards(usuario_id);

-- RLS
ALTER TABLE kanban_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own boards"
  ON kanban_boards FOR ALL
  USING (usuario_id = (current_setting('request.jwt.claims', true)::json->>'sub')::integer)
  WITH CHECK (usuario_id = (current_setting('request.jwt.claims', true)::json->>'sub')::integer);

-- Trigger updated_at
CREATE OR REPLACE TRIGGER set_kanban_boards_updated_at
  BEFORE UPDATE ON kanban_boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Alteração: kanban_columns recebe board_id
-- =============================================================================

ALTER TABLE kanban_columns ADD COLUMN IF NOT EXISTS board_id TEXT REFERENCES kanban_boards(id) ON DELETE CASCADE;

-- Criar board default "Meu Quadro" para cada usuário com colunas existentes
INSERT INTO kanban_boards (usuario_id, titulo, tipo, source, ordem)
SELECT DISTINCT usuario_id, 'Meu Quadro', 'custom', NULL, 0
FROM kanban_columns
WHERE board_id IS NULL
ON CONFLICT DO NOTHING;

-- Backfill board_id nas colunas existentes
UPDATE kanban_columns
SET board_id = (
  SELECT kb.id FROM kanban_boards kb
  WHERE kb.usuario_id = kanban_columns.usuario_id
    AND kb.tipo = 'custom'
    AND kb.titulo = 'Meu Quadro'
  LIMIT 1
)
WHERE board_id IS NULL;

-- Índice para buscar colunas por board
CREATE INDEX IF NOT EXISTS idx_kanban_columns_board_id ON kanban_columns(board_id);
