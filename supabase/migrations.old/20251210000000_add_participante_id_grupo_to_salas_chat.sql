-- Adicionar coluna participante_id
ALTER TABLE public.salas_chat 
ADD COLUMN participante_id bigint REFERENCES public.usuarios(id) ON DELETE CASCADE;

-- Atualizar constraint de tipo para incluir 'grupo'
ALTER TABLE public.salas_chat 
DROP CONSTRAINT salas_chat_tipo_check;

ALTER TABLE public.salas_chat 
ADD CONSTRAINT salas_chat_tipo_check 
CHECK (tipo IN ('geral', 'documento', 'privado', 'grupo'));

-- Adicionar constraint para conversas privadas
ALTER TABLE public.salas_chat 
ADD CONSTRAINT salas_chat_privado_participante CHECK (
  (tipo = 'privado' AND participante_id IS NOT NULL) OR
  (tipo != 'privado')
);

-- Criar índice para participante_id
CREATE INDEX idx_salas_chat_participante_id ON public.salas_chat(participante_id);

-- Adicionar coluna updated_at
ALTER TABLE public.salas_chat 
ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

-- Criar trigger para updated_at
CREATE TRIGGER update_salas_chat_updated_at
  BEFORE UPDATE ON public.salas_chat
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Atualizar RLS policies para incluir participante_id
DROP POLICY IF EXISTS "Users can view chat rooms they have access to" ON public.salas_chat;

CREATE POLICY "Users can view chat rooms they have access to"
  ON public.salas_chat
  FOR SELECT
  TO authenticated
  USING (
    tipo = 'geral' OR
    criado_por = get_current_user_id() OR
    participante_id = get_current_user_id() OR
    (tipo = 'documento' AND documento_id IN (
      SELECT id FROM public.documentos
      WHERE criado_por = get_current_user_id() OR
      id IN (
        SELECT documento_id FROM public.documentos_compartilhados
        WHERE usuario_id = get_current_user_id()
      )
    ))
  );

-- Comentários
COMMENT ON COLUMN public.salas_chat.participante_id IS 'ID do segundo participante em conversas privadas (1-para-1)';
COMMENT ON COLUMN public.salas_chat.updated_at IS 'Timestamp da última atualização da sala';