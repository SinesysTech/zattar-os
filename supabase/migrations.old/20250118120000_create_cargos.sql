-- Migration: Criar tabela de cargos
-- Permite organizar usuários por cargo para controle interno (sem relação com permissões)

-- Criar tabela cargos
CREATE TABLE public.cargos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_by BIGINT REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint de unicidade de nome (case-insensitive)
  CONSTRAINT cargos_nome_unique UNIQUE (nome)
);

-- Comentários nas colunas
COMMENT ON TABLE public.cargos IS 'Cargos para organização interna de usuários (ex: Advogado Sênior, Estagiário)';
COMMENT ON COLUMN public.cargos.id IS 'ID sequencial do cargo';
COMMENT ON COLUMN public.cargos.nome IS 'Nome do cargo (único, obrigatório)';
COMMENT ON COLUMN public.cargos.descricao IS 'Descrição opcional do cargo';
COMMENT ON COLUMN public.cargos.ativo IS 'Indica se o cargo está ativo (default: true)';
COMMENT ON COLUMN public.cargos.created_by IS 'ID do usuário que criou o cargo';
COMMENT ON COLUMN public.cargos.created_at IS 'Data e hora de criação';
COMMENT ON COLUMN public.cargos.updated_at IS 'Data e hora da última atualização';

-- Índices para performance
CREATE INDEX idx_cargos_nome ON public.cargos USING btree (nome);
CREATE INDEX idx_cargos_ativo ON public.cargos USING btree (ativo);
CREATE INDEX idx_cargos_created_by ON public.cargos USING btree (created_by);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_cargos_updated_at
  BEFORE UPDATE ON public.cargos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem ler cargos
CREATE POLICY "Usuários autenticados podem ler cargos"
  ON public.cargos
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política: Usuários autenticados podem criar cargos
CREATE POLICY "Usuários autenticados podem criar cargos"
  ON public.cargos
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política: Usuários autenticados podem atualizar cargos
CREATE POLICY "Usuários autenticados podem atualizar cargos"
  ON public.cargos
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Política: Usuários autenticados podem deletar cargos
CREATE POLICY "Usuários autenticados podem deletar cargos"
  ON public.cargos
  FOR DELETE
  USING (auth.role() = 'authenticated');
