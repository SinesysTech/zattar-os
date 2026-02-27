-- Migration: Garantir que políticas RLS de chamadas estão corretas
-- Created: 2026-02-27
-- Description: Recria políticas RLS da tabela chamadas e chamadas_participantes
--              para garantir que INSERT, SELECT e UPDATE funcionam corretamente.
--              Também garante que get_current_user_id() tem SECURITY DEFINER.

-- ============================================================================
-- PASSO 1: Garantir que get_current_user_id() tem SECURITY DEFINER
-- ============================================================================
-- A migração 20251130220000 acidentalmente removeu SECURITY DEFINER.
-- A 20251130230000 restaurou, mas aplicamos novamente por segurança.

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid()
$$;

COMMENT ON FUNCTION public.get_current_user_id() IS
  'Retorna o ID numérico do usuário atual. SECURITY DEFINER para bypass RLS em políticas.';

-- ============================================================================
-- PASSO 2: Garantir que funções auxiliares de chamadas existem
-- ============================================================================

-- Função: user_is_chamada_participant
CREATE OR REPLACE FUNCTION public.user_is_chamada_participant(
    p_chamada_id BIGINT,
    p_usuario_id BIGINT
)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.chamadas_participantes
        WHERE chamada_id = p_chamada_id
        AND usuario_id = p_usuario_id
    );
$$;

COMMENT ON FUNCTION public.user_is_chamada_participant IS
    'Verifica se usuário é participante de chamada. SECURITY DEFINER para bypass RLS.';

-- Função: user_initiated_chamada
CREATE OR REPLACE FUNCTION public.user_initiated_chamada(
    p_chamada_id BIGINT,
    p_usuario_id BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    PERFORM set_config('row_security', 'off', true);
    RETURN EXISTS (
        SELECT 1
        FROM public.chamadas
        WHERE id = p_chamada_id
        AND iniciado_por = p_usuario_id
    );
END;
$$;

COMMENT ON FUNCTION public.user_initiated_chamada IS
    'Verifica se usuário iniciou a chamada. SECURITY DEFINER para bypass RLS.';

-- Função: user_can_view_chamada
CREATE OR REPLACE FUNCTION public.user_can_view_chamada(
    p_chamada_id BIGINT,
    p_current_user_id BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_iniciado_por BIGINT;
    v_sala_id BIGINT;
BEGIN
    PERFORM set_config('row_security', 'off', true);

    SELECT iniciado_por, sala_id INTO v_iniciado_por, v_sala_id
    FROM public.chamadas
    WHERE id = p_chamada_id;

    IF v_iniciado_por IS NULL THEN
        RETURN false;
    END IF;

    IF v_iniciado_por = p_current_user_id THEN
        RETURN true;
    END IF;

    IF public.user_is_chamada_participant(p_chamada_id, p_current_user_id) THEN
        RETURN true;
    END IF;

    IF public.user_is_sala_member(v_sala_id, p_current_user_id) THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$;

COMMENT ON FUNCTION public.user_can_view_chamada IS
    'Verifica se usuário pode ver chamada. SECURITY DEFINER para bypass RLS.';

-- Função: user_can_view_participant
CREATE OR REPLACE FUNCTION public.user_can_view_participant(
    p_chamada_id BIGINT,
    p_participante_usuario_id BIGINT,
    p_current_user_id BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_sala_id BIGINT;
    v_iniciado_por BIGINT;
BEGIN
    PERFORM set_config('row_security', 'off', true);

    IF p_participante_usuario_id = p_current_user_id THEN
        RETURN true;
    END IF;

    SELECT sala_id, iniciado_por INTO v_sala_id, v_iniciado_por
    FROM public.chamadas
    WHERE id = p_chamada_id;

    IF v_sala_id IS NULL THEN
        RETURN false;
    END IF;

    IF v_iniciado_por = p_current_user_id THEN
        RETURN true;
    END IF;

    IF public.user_is_sala_member(v_sala_id, p_current_user_id) THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$;

COMMENT ON FUNCTION public.user_can_view_participant IS
    'Verifica se usuário pode ver participante de chamada. SECURITY DEFINER para bypass RLS.';

-- ============================================================================
-- PASSO 3: Habilitar RLS (idempotente)
-- ============================================================================

ALTER TABLE public.chamadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamadas_participantes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASSO 4: Drop e recria políticas de chamadas
-- ============================================================================

-- Drop todas as políticas existentes (idempotente)
DROP POLICY IF EXISTS "Usuários podem ver chamadas que iniciaram ou participam" ON public.chamadas;
DROP POLICY IF EXISTS "Usuários podem criar chamadas" ON public.chamadas;
DROP POLICY IF EXISTS "Participantes podem atualizar chamadas" ON public.chamadas;

DROP POLICY IF EXISTS "Usuários podem ver participantes de chamadas que têm acesso" ON public.chamadas_participantes;
DROP POLICY IF EXISTS "Sistema/Iniciador pode adicionar participantes" ON public.chamadas_participantes;
DROP POLICY IF EXISTS "Participantes podem atualizar seus próprios status" ON public.chamadas_participantes;

-- Políticas de chamadas

CREATE POLICY "Usuários podem ver chamadas que iniciaram ou participam"
    ON public.chamadas FOR SELECT
    TO authenticated
    USING (
        public.user_can_view_chamada(id, (SELECT public.get_current_user_id()))
    );

CREATE POLICY "Usuários podem criar chamadas"
    ON public.chamadas FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT public.get_current_user_id()) = iniciado_por
    );

CREATE POLICY "Participantes podem atualizar chamadas"
    ON public.chamadas FOR UPDATE
    TO authenticated
    USING (
        public.user_initiated_chamada(id, (SELECT public.get_current_user_id()))
        OR public.user_is_chamada_participant(id, (SELECT public.get_current_user_id()))
    );

-- Políticas de chamadas_participantes

CREATE POLICY "Usuários podem ver participantes de chamadas que têm acesso"
    ON public.chamadas_participantes FOR SELECT
    TO authenticated
    USING (
        public.user_can_view_participant(chamada_id, usuario_id, (SELECT public.get_current_user_id()))
    );

CREATE POLICY "Sistema/Iniciador pode adicionar participantes"
    ON public.chamadas_participantes FOR INSERT
    TO authenticated
    WITH CHECK (
        public.user_initiated_chamada(chamada_id, (SELECT public.get_current_user_id()))
        OR usuario_id = (SELECT public.get_current_user_id())
    );

CREATE POLICY "Participantes podem atualizar seus próprios status"
    ON public.chamadas_participantes FOR UPDATE
    TO authenticated
    USING (
        usuario_id = (SELECT public.get_current_user_id())
    );

-- ============================================================================
-- PASSO 5: Grants necessários
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.chamadas TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.chamadas_participantes TO authenticated;
GRANT SELECT, USAGE ON SEQUENCE public.chamadas_id_seq TO authenticated;
GRANT SELECT, USAGE ON SEQUENCE public.chamadas_participantes_id_seq TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_chamada_participant(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_initiated_chamada(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_view_chamada(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_view_participant(bigint, bigint, bigint) TO authenticated;
