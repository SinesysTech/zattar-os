-- ============================================================================
-- Migration: Adicionar constraints de unicidade para salas de chat
-- ============================================================================
-- Garante que existe apenas uma Sala Geral no sistema e evita duplicidade
-- de conversas privadas entre dois usuários.
-- ============================================================================

-- Adicionar constraint única para garantir apenas uma Sala Geral
-- A Sala Geral deve ter tipo 'geral' e nome 'Sala Geral'
ALTER TABLE public.salas_chat
ADD CONSTRAINT salas_chat_unico_sala_geral 
UNIQUE (tipo, nome)
WHERE (tipo = 'geral');

-- Criar índice parcial único para evitar duplicidade de conversas privadas
-- Garante no máximo uma sala privada por par de usuários (em qualquer ordem)
-- Usa LEAST/GREATEST para normalizar a ordem dos IDs
CREATE UNIQUE INDEX idx_salas_chat_unico_privado
ON public.salas_chat (
  tipo,
  LEAST(criado_por, participante_id),
  GREATEST(criado_por, participante_id)
)
WHERE tipo = 'privado';

-- Comentários
COMMENT ON CONSTRAINT salas_chat_unico_sala_geral ON public.salas_chat IS 
'Garante que existe apenas uma Sala Geral no sistema com nome canônico "Sala Geral"';

COMMENT ON INDEX idx_salas_chat_unico_privado IS 
'Evita duplicidade de conversas privadas 1-para-1 entre os mesmos usuários';
