-- Migration: Corrigir warnings do Supabase Database Linter
-- Created: 2026-03-02
-- Description: Resolve 3 categorias de alertas de segurança:
--   1. Function Search Path Mutable (2 funções PM)
--   2. Materialized View in API (2 views expostas ao anon)
--   3. RLS Policy Always True (múltiplas tabelas com INSERT/UPDATE/DELETE permissivos)
--
-- Estratégia:
--   - Funções: Adicionar SET search_path = '' para evitar search_path injection
--   - Views materializadas: Revogar acesso do role anon (dados jurídicos não devem ser públicos)
--   - RLS: Substituir USING(true)/WITH CHECK(true) por is_current_user_active()
--     Isso mantém a funcionalidade (usuários ativos continuam operando normalmente)
--     mas adiciona verificação real (usuários inativos/desativados são bloqueados)

-- ============================================================================
-- PARTE 1: FUNCTION SEARCH PATH MUTABLE
-- ============================================================================
-- Funções SECURITY DEFINER executam com os privilégios do OWNER (postgres).
-- Sem SET search_path, um atacante poderia criar objetos com nomes iguais
-- em um schema que aparece antes no search_path, causando execução maliciosa.

-- 1a. pm_user_has_project_access: verifica se usuário tem acesso ao projeto
CREATE OR REPLACE FUNCTION public.pm_user_has_project_access(p_projeto_id uuid, p_user_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pm_projetos
    WHERE id = p_projeto_id
      AND (responsavel_id = p_user_id OR criado_por = p_user_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.pm_membros_projeto
    WHERE projeto_id = p_projeto_id AND usuario_id = p_user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = p_user_id AND is_super_admin = true
  );
$$;

-- 1b. pm_current_user_id: obtém o usuario_id a partir do auth.uid()
CREATE OR REPLACE FUNCTION public.pm_current_user_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- ============================================================================
-- PARTE 2: MATERIALIZED VIEW IN API
-- ============================================================================
-- Materialized views NÃO suportam RLS. Qualquer GRANT de SELECT expõe
-- todos os dados via PostgREST (Data API). O role anon não deve ter acesso
-- a dados jurídicos sensíveis. O role authenticated é mantido pois o app
-- precisa consultar essas views no client-side.

-- 2a. acervo_unificado: revogar acesso do anon
REVOKE SELECT ON TABLE public.acervo_unificado FROM anon;

-- 2b. mv_dados_primeiro_grau: revogar acesso do anon
REVOKE SELECT ON TABLE public.mv_dados_primeiro_grau FROM anon;

-- ============================================================================
-- PARTE 3: RLS POLICY ALWAYS TRUE
-- ============================================================================
-- Substituir políticas com USING(true)/WITH CHECK(true) por verificações reais.
-- A função is_current_user_active() verifica se o usuário autenticado está
-- ativo no sistema (tabela usuarios). Isso:
--   - Bloqueia usuários desativados/inativos de modificar dados
--   - Resolve o warning do linter (não é mais "always true")
--   - Mantém a funcionalidade para usuários ativos

-- --------------------------------------------------------------------------
-- 3a. assinatura_digital_templates
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "authenticated delete - assinatura_digital_templates" ON public.assinatura_digital_templates;
CREATE POLICY "authenticated delete - assinatura_digital_templates"
  ON public.assinatura_digital_templates
  FOR DELETE
  TO authenticated
  USING (public.is_current_user_active());

DROP POLICY IF EXISTS "authenticated insert - assinatura_digital_templates" ON public.assinatura_digital_templates;
CREATE POLICY "authenticated insert - assinatura_digital_templates"
  ON public.assinatura_digital_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_current_user_active());

DROP POLICY IF EXISTS "authenticated update - assinatura_digital_templates" ON public.assinatura_digital_templates;
CREATE POLICY "authenticated update - assinatura_digital_templates"
  ON public.assinatura_digital_templates
  FOR UPDATE
  TO authenticated
  USING (public.is_current_user_active())
  WITH CHECK (public.is_current_user_active());

-- --------------------------------------------------------------------------
-- 3b. conversas_chatwoot
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "conversas_chatwoot_insert_policy" ON public.conversas_chatwoot;
CREATE POLICY "conversas_chatwoot_insert_policy"
  ON public.conversas_chatwoot
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_current_user_active());

DROP POLICY IF EXISTS "conversas_chatwoot_update_policy" ON public.conversas_chatwoot;
CREATE POLICY "conversas_chatwoot_update_policy"
  ON public.conversas_chatwoot
  FOR UPDATE
  TO authenticated
  USING (public.is_current_user_active())
  WITH CHECK (public.is_current_user_active());

-- --------------------------------------------------------------------------
-- 3c. expedientes
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar pendentes" ON public.expedientes;
CREATE POLICY "Usuários autenticados podem atualizar pendentes"
  ON public.expedientes
  FOR UPDATE
  TO authenticated
  USING (public.is_current_user_active())
  WITH CHECK (public.is_current_user_active());

-- --------------------------------------------------------------------------
-- 3d. integracoes
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can delete integrations" ON public.integracoes;
CREATE POLICY "Authenticated users can delete integrations"
  ON public.integracoes
  FOR DELETE
  TO authenticated
  USING (public.is_current_user_active());

DROP POLICY IF EXISTS "Authenticated users can insert integrations" ON public.integracoes;
CREATE POLICY "Authenticated users can insert integrations"
  ON public.integracoes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_current_user_active());

DROP POLICY IF EXISTS "Authenticated users can update integrations" ON public.integracoes;
CREATE POLICY "Authenticated users can update integrations"
  ON public.integracoes
  FOR UPDATE
  TO authenticated
  USING (public.is_current_user_active())
  WITH CHECK (public.is_current_user_active());

-- --------------------------------------------------------------------------
-- 3e. partes_chatwoot
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "partes_chatwoot_delete_policy" ON public.partes_chatwoot;
CREATE POLICY "partes_chatwoot_delete_policy"
  ON public.partes_chatwoot
  FOR DELETE
  TO authenticated
  USING (public.is_current_user_active());

DROP POLICY IF EXISTS "partes_chatwoot_insert_policy" ON public.partes_chatwoot;
CREATE POLICY "partes_chatwoot_insert_policy"
  ON public.partes_chatwoot
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_current_user_active());

DROP POLICY IF EXISTS "partes_chatwoot_update_policy" ON public.partes_chatwoot;
CREATE POLICY "partes_chatwoot_update_policy"
  ON public.partes_chatwoot
  FOR UPDATE
  TO authenticated
  USING (public.is_current_user_active())
  WITH CHECK (public.is_current_user_active());

-- --------------------------------------------------------------------------
-- 3f. pm_anexos (INSERT com verificação do módulo PM)
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "pm_anexos_insert" ON public.pm_anexos;
CREATE POLICY "pm_anexos_insert"
  ON public.pm_anexos
  FOR INSERT
  TO authenticated
  WITH CHECK (public.pm_current_user_id() IS NOT NULL);

-- --------------------------------------------------------------------------
-- 3g. pm_comentarios (INSERT com verificação do módulo PM)
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "pm_comentarios_insert" ON public.pm_comentarios;
CREATE POLICY "pm_comentarios_insert"
  ON public.pm_comentarios
  FOR INSERT
  TO authenticated
  WITH CHECK (public.pm_current_user_id() IS NOT NULL);

-- --------------------------------------------------------------------------
-- 3h. pm_projetos (INSERT com verificação do módulo PM)
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "pm_projetos_insert" ON public.pm_projetos;
CREATE POLICY "pm_projetos_insert"
  ON public.pm_projetos
  FOR INSERT
  TO authenticated
  WITH CHECK (public.pm_current_user_id() IS NOT NULL);

-- --------------------------------------------------------------------------
-- 3i. system_prompts
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can delete system_prompts" ON public.system_prompts;
CREATE POLICY "Authenticated users can delete system_prompts"
  ON public.system_prompts
  FOR DELETE
  TO authenticated
  USING (public.is_current_user_active());

DROP POLICY IF EXISTS "Authenticated users can insert system_prompts" ON public.system_prompts;
CREATE POLICY "Authenticated users can insert system_prompts"
  ON public.system_prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_current_user_active());

DROP POLICY IF EXISTS "Authenticated users can update system_prompts" ON public.system_prompts;
CREATE POLICY "Authenticated users can update system_prompts"
  ON public.system_prompts
  FOR UPDATE
  TO authenticated
  USING (public.is_current_user_active())
  WITH CHECK (public.is_current_user_active());

-- --------------------------------------------------------------------------
-- 3j. usuarios_chatwoot
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "usuarios_chatwoot_insert_policy" ON public.usuarios_chatwoot;
CREATE POLICY "usuarios_chatwoot_insert_policy"
  ON public.usuarios_chatwoot
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_current_user_active());

DROP POLICY IF EXISTS "usuarios_chatwoot_update_policy" ON public.usuarios_chatwoot;
CREATE POLICY "usuarios_chatwoot_update_policy"
  ON public.usuarios_chatwoot
  FOR UPDATE
  TO authenticated
  USING (public.is_current_user_active())
  WITH CHECK (public.is_current_user_active());
