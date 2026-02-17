-- Migration: Corrigir Dependência Circular em Políticas RLS
-- Created: 2025-12-21 18:00:00 UTC
-- Description: Resolve erro 42P17 (infinite recursion) causado por políticas RLS
--              que referenciam múltiplas tabelas em cadeia circular.
--
-- Problema: salas_chat → documentos → documentos_compartilhados → documentos
-- Solução: SECURITY DEFINER functions que executam com privilégios elevados,
--          quebrando a cadeia de avaliação de políticas RLS.

-- ============================================================================
-- FUNÇÃO 1: user_has_document_access
-- Verifica se usuário tem acesso a um documento específico
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_has_document_access(
  p_documento_id bigint,
  p_usuario_id bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SECURITY DEFINER: Executa com privilégios do owner da função,
  -- evitando avaliação recursiva de políticas RLS
  RETURN EXISTS (
    SELECT 1 FROM public.documentos d
    WHERE d.id = p_documento_id
      AND d.deleted_at IS NULL
      AND (
        d.criado_por = p_usuario_id
        OR EXISTS (
          SELECT 1 FROM public.documentos_compartilhados dc
          WHERE dc.documento_id = p_documento_id
            AND dc.usuario_id = p_usuario_id
        )
      )
  );
END;
$$;

COMMENT ON FUNCTION public.user_has_document_access IS
  'Verifica se usuário tem acesso a documento (criador ou compartilhado). SECURITY DEFINER para evitar recursão RLS.';

-- ============================================================================
-- FUNÇÃO 2: get_accessible_documento_ids
-- Retorna lista de IDs de documentos acessíveis pelo usuário
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_accessible_documento_ids(
  p_usuario_id bigint
)
RETURNS TABLE(documento_id bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SECURITY DEFINER: Executa com privilégios do owner da função,
  -- evitando avaliação recursiva de políticas RLS
  RETURN QUERY
  SELECT DISTINCT d.id
  FROM public.documentos d
  WHERE d.deleted_at IS NULL
    AND (
      d.criado_por = p_usuario_id
      OR EXISTS (
        SELECT 1 FROM public.documentos_compartilhados dc
        WHERE dc.documento_id = d.id
          AND dc.usuario_id = p_usuario_id
      )
    );
END;
$$;

COMMENT ON FUNCTION public.get_accessible_documento_ids IS
  'Retorna IDs de documentos acessíveis pelo usuário. SECURITY DEFINER para evitar recursão RLS.';

-- ============================================================================
-- FUNÇÃO 3: user_can_access_chat_room
-- Verifica se usuário pode acessar uma sala de chat específica
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_can_access_chat_room(
  p_sala_id bigint,
  p_usuario_id bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sala RECORD;
BEGIN
  -- Buscar dados da sala
  SELECT tipo, documento_id, criado_por, participante_id
  INTO v_sala
  FROM public.salas_chat
  WHERE id = p_sala_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Verificar acesso baseado no tipo
  IF v_sala.tipo = 'geral' THEN
    RETURN TRUE;
  ELSIF v_sala.criado_por = p_usuario_id THEN
    RETURN TRUE;
  ELSIF v_sala.participante_id = p_usuario_id THEN
    RETURN TRUE;
  ELSIF v_sala.tipo = 'documento' AND v_sala.documento_id IS NOT NULL THEN
    -- Usar função auxiliar para verificar acesso ao documento
    RETURN public.user_has_document_access(v_sala.documento_id, p_usuario_id);
  END IF;

  RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION public.user_can_access_chat_room IS
  'Verifica se usuário pode acessar sala de chat. SECURITY DEFINER para evitar recursão RLS.';

-- ============================================================================
-- DROPAR POLÍTICAS RLS ANTIGAS (que causam recursão)
-- ============================================================================

-- Políticas de documentos
DROP POLICY IF EXISTS "Users can view their own documents and shared documents" ON public.documentos;

-- Políticas de documentos_compartilhados
DROP POLICY IF EXISTS "Users can view shares for their documents" ON public.documentos_compartilhados;

-- Políticas de salas_chat
DROP POLICY IF EXISTS "Users can view chat rooms they have access to" ON public.salas_chat;

-- Políticas de mensagens_chat
DROP POLICY IF EXISTS "Users can view messages in accessible chat rooms" ON public.mensagens_chat;
DROP POLICY IF EXISTS "Users can send messages in accessible chat rooms" ON public.mensagens_chat;

-- ============================================================================
-- NOVAS POLÍTICAS RLS: documentos (usando função security definer)
-- ============================================================================

CREATE POLICY "Users can view accessible documents"
  ON public.documentos
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND id IN (
      SELECT documento_id
      FROM public.get_accessible_documento_ids(get_current_user_id())
    )
  );

-- ============================================================================
-- NOVAS POLÍTICAS RLS: documentos_compartilhados (simplificada)
-- ============================================================================

CREATE POLICY "Users can view document shares"
  ON public.documentos_compartilhados
  FOR SELECT
  TO authenticated
  USING (
    -- Pode ver compartilhamentos onde é o criador, destinatário, ou dono do documento
    compartilhado_por = get_current_user_id()
    OR usuario_id = get_current_user_id()
    OR documento_id IN (
      SELECT documento_id
      FROM public.get_accessible_documento_ids(get_current_user_id())
    )
  );

-- ============================================================================
-- NOVAS POLÍTICAS RLS: salas_chat (usando função security definer)
-- ============================================================================

CREATE POLICY "Users can view accessible chat rooms"
  ON public.salas_chat
  FOR SELECT
  TO authenticated
  USING (
    tipo = 'geral'
    OR criado_por = get_current_user_id()
    OR participante_id = get_current_user_id()
    OR (
      tipo = 'documento'
      AND documento_id IS NOT NULL
      AND public.user_has_document_access(documento_id, get_current_user_id())
    )
  );

-- ============================================================================
-- NOVAS POLÍTICAS RLS: mensagens_chat (simplificada)
-- ============================================================================

CREATE POLICY "Users can view messages in accessible rooms"
  ON public.mensagens_chat
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.user_can_access_chat_room(sala_id, get_current_user_id())
  );

CREATE POLICY "Users can send messages in accessible rooms"
  ON public.mensagens_chat
  FOR INSERT
  TO authenticated
  WITH CHECK (
    usuario_id = get_current_user_id()
    AND public.user_can_access_chat_room(sala_id, get_current_user_id())
  );

-- ============================================================================
-- ÍNDICES PARA OTIMIZAÇÃO DE PERFORMANCE
-- ============================================================================

-- Índice para otimizar busca de documentos por criador (com soft delete)
CREATE INDEX IF NOT EXISTS idx_documentos_criado_por_active
  ON public.documentos(criado_por)
  WHERE deleted_at IS NULL;

-- Índice composto para otimizar lookup de compartilhamentos
CREATE INDEX IF NOT EXISTS idx_documentos_compartilhados_lookup
  ON public.documentos_compartilhados(documento_id, usuario_id);

-- Índice para otimizar busca de salas de documento
CREATE INDEX IF NOT EXISTS idx_salas_chat_documento_lookup
  ON public.salas_chat(documento_id, tipo)
  WHERE tipo = 'documento';

-- Índice composto para otimizar query de salas por usuário
CREATE INDEX IF NOT EXISTS idx_salas_chat_usuario_acesso
  ON public.salas_chat(criado_por, participante_id, tipo);

-- Índice para otimizar busca de mensagens por sala
CREATE INDEX IF NOT EXISTS idx_mensagens_chat_sala_active
  ON public.mensagens_chat(sala_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- GRANT para tabelas (necessário para RLS funcionar com role authenticated)
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.salas_chat TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mensagens_chat TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documentos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documentos_compartilhados TO authenticated;

-- ============================================================================
-- GRANT EXECUTE para funções auxiliares
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.user_has_document_access(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_accessible_documento_ids(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_access_chat_room(bigint, bigint) TO authenticated;

-- ============================================================================
-- COMENTÁRIOS ADICIONAIS
-- ============================================================================

COMMENT ON FUNCTION get_current_user_id() IS
  'Retorna o id (bigint) do usuário atual baseado no auth_user_id (uuid). Usada em políticas RLS.';
