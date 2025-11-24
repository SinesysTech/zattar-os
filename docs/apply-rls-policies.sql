-- ============================================================================
-- Script de Correção: Adicionar Políticas RLS à Tabela usuarios
-- ============================================================================
-- Este script corrige o erro de autenticação "Database error loading user"
-- adicionando as políticas RLS necessárias à tabela public.usuarios
--
-- COMO APLICAR:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em "SQL Editor"
-- 3. Copie e cole este script completo
-- 4. Clique em "Run" (ou pressione Ctrl+Enter)
--
-- IMPORTANTE: Este script é IDEMPOTENTE (pode ser executado múltiplas vezes
-- sem causar erros). Se as políticas já existirem, elas serão recriadas.
-- ============================================================================

-- Primeiro, removemos as políticas existentes (se houver)
-- Isso permite que o script seja executado múltiplas vezes
DROP POLICY IF EXISTS "Service role tem acesso total" ON public.usuarios;
DROP POLICY IF EXISTS "Usuários podem ler seus próprios dados" ON public.usuarios;
DROP POLICY IF EXISTS "Usuários autenticados podem ler outros usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON public.usuarios;

-- Agora criamos as políticas RLS

-- 1. Service Role: Acesso total (bypass RLS por padrão, mas explicitado aqui)
CREATE POLICY "Service role tem acesso total"
  ON public.usuarios
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Leitura: Usuários podem ler seus próprios dados
CREATE POLICY "Usuários podem ler seus próprios dados"
  ON public.usuarios
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

-- 3. Leitura: Usuários autenticados podem ler dados de outros usuários
--    (necessário para colaboração, atribuição de responsáveis, etc.)
CREATE POLICY "Usuários autenticados podem ler outros usuários"
  ON public.usuarios
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. Atualização: Usuários podem atualizar apenas seus próprios dados
CREATE POLICY "Usuários podem atualizar seus próprios dados"
  ON public.usuarios
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- ============================================================================
-- Verificação: Liste as políticas criadas
-- ============================================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'usuarios'
ORDER BY policyname;

-- ============================================================================
-- RESULTADO ESPERADO:
-- Você deverá ver 4 políticas listadas:
-- 1. Service role tem acesso total
-- 2. Usuários autenticados podem ler outros usuários
-- 3. Usuários podem atualizar seus próprios dados
-- 4. Usuários podem ler seus próprios dados
-- ============================================================================
