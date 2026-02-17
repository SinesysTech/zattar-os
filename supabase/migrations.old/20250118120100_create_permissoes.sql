-- Migration: Criar tabela de permissões granulares
-- Permite atribuir permissões específicas a usuários (não baseado em papéis/roles)

-- Criar tabela permissoes
CREATE TABLE public.permissoes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  recurso TEXT NOT NULL,
  operacao TEXT NOT NULL,
  permitido BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint de unicidade: um usuário só pode ter uma permissão por recurso/operação
  CONSTRAINT permissoes_usuario_recurso_operacao_unique UNIQUE (usuario_id, recurso, operacao)
);

-- Comentários nas colunas
COMMENT ON TABLE public.permissoes IS 'Permissões granulares por usuário (não baseado em roles)';
COMMENT ON COLUMN public.permissoes.id IS 'ID sequencial da permissão';
COMMENT ON COLUMN public.permissoes.usuario_id IS 'ID do usuário que possui a permissão';
COMMENT ON COLUMN public.permissoes.recurso IS 'Recurso (ex: advogados, contratos, acervo)';
COMMENT ON COLUMN public.permissoes.operacao IS 'Operação (ex: listar, criar, editar, deletar, atribuir_responsavel)';
COMMENT ON COLUMN public.permissoes.permitido IS 'Indica se a permissão está permitida (default: true)';
COMMENT ON COLUMN public.permissoes.created_at IS 'Data e hora de criação';
COMMENT ON COLUMN public.permissoes.updated_at IS 'Data e hora da última atualização';

-- Índices para performance
CREATE INDEX idx_permissoes_usuario_id ON public.permissoes USING btree (usuario_id);
CREATE INDEX idx_permissoes_recurso ON public.permissoes USING btree (recurso);
CREATE INDEX idx_permissoes_operacao ON public.permissoes USING btree (operacao);

-- Índice composto para queries rápidas de verificação de permissão
CREATE INDEX idx_permissoes_usuario_recurso_operacao
  ON public.permissoes USING btree (usuario_id, recurso, operacao);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_permissoes_updated_at
  BEFORE UPDATE ON public.permissoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.permissoes ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ler suas próprias permissões
CREATE POLICY "Usuários podem ler suas próprias permissões"
  ON public.permissoes
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    usuario_id = (SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid())
  );

-- Política: Usuários autenticados podem gerenciar permissões (verificação adicional no backend)
CREATE POLICY "Usuários autenticados podem gerenciar permissões"
  ON public.permissoes
  FOR ALL
  USING (auth.role() = 'authenticated');
