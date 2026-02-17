-- ============================================================================
-- MIGRATION: Relação Assistentes x Tipos de Expedientes
-- ============================================================================
-- Cria tabela para configurar qual assistente Dify deve ser usado automaticamente
-- quando um expediente de determinado tipo é criado.
--
-- Exemplo: Tipo "Contestação" → Assistente "Petição Inicial"
-- Quando um expediente é criado com tipo_expediente_id=5 (Contestação),
-- o sistema automaticamente dispara o assistente configurado e gera a peça.
-- ============================================================================

-- 1. Criar tabela
CREATE TABLE IF NOT EXISTS public.assistentes_tipos_expedientes (
  id SERIAL PRIMARY KEY,
  assistente_id INT NOT NULL REFERENCES public.assistentes(id) ON DELETE CASCADE,
  tipo_expediente_id INT NOT NULL REFERENCES public.tipos_expedientes(id) ON DELETE CASCADE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_por INT NOT NULL REFERENCES public.usuarios(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Comentários
COMMENT ON TABLE public.assistentes_tipos_expedientes IS 
  'Relacionamento entre assistentes Dify e tipos de expedientes para automação';
COMMENT ON COLUMN public.assistentes_tipos_expedientes.assistente_id IS 
  'ID do assistente que será usado para gerar a peça';
COMMENT ON COLUMN public.assistentes_tipos_expedientes.tipo_expediente_id IS 
  'ID do tipo de expediente que dispara o assistente';
COMMENT ON COLUMN public.assistentes_tipos_expedientes.ativo IS 
  'Se true, o assistente será disparado automaticamente ao criar expediente deste tipo';
COMMENT ON COLUMN public.assistentes_tipos_expedientes.criado_por IS 
  'Usuário que configurou este relacionamento';

-- 3. Índices
CREATE INDEX idx_assistentes_tipos_expedientes_assistente 
  ON public.assistentes_tipos_expedientes(assistente_id);
CREATE INDEX idx_assistentes_tipos_expedientes_tipo 
  ON public.assistentes_tipos_expedientes(tipo_expediente_id);
CREATE INDEX idx_assistentes_tipos_expedientes_ativo 
  ON public.assistentes_tipos_expedientes(ativo) WHERE ativo = true;

-- 4. Unique constraint parcial: um tipo pode ter apenas um assistente ativo por vez
CREATE UNIQUE INDEX uk_tipo_expediente_ativo 
  ON public.assistentes_tipos_expedientes(tipo_expediente_id) 
  WHERE ativo = true;

-- 5. Trigger para updated_at
CREATE TRIGGER set_updated_at_assistentes_tipos_expedientes
  BEFORE UPDATE ON public.assistentes_tipos_expedientes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();

-- 6. RLS (Row Level Security)
ALTER TABLE public.assistentes_tipos_expedientes ENABLE ROW LEVEL SECURITY;

-- Policy: Todos usuários autenticados podem ler
CREATE POLICY select_assistentes_tipos_expedientes
  ON public.assistentes_tipos_expedientes
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Usuários autenticados podem inserir/atualizar/deletar
CREATE POLICY insert_assistentes_tipos_expedientes
  ON public.assistentes_tipos_expedientes
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY update_assistentes_tipos_expedientes
  ON public.assistentes_tipos_expedientes
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY delete_assistentes_tipos_expedientes
  ON public.assistentes_tipos_expedientes
  FOR DELETE
  USING (auth.role() = 'authenticated');
