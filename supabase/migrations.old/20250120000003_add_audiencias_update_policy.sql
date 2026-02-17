-- Migration: Adicionar política RLS de UPDATE para audiências
-- 
-- Fix: Erro 42501 "permission denied for schema public" ao atualizar observações
-- 
-- Problema:
-- A tabela audiencias tinha apenas políticas para SELECT, mas não para UPDATE.
-- Quando o backend tenta atualizar observações via service_role client, a operação
-- falha porque usuários autenticados não têm permissão de UPDATE.
-- 
-- Solução:
-- Adicionar política que permite service_role fazer UPDATE (o backend já verifica
-- permissões granulares antes de chamar o Supabase).

-- ============================================================================
-- ADICIONAR POLÍTICA DE UPDATE PARA AUDIÊNCIAS
-- ============================================================================

-- Remover política antiga se existir (para evitar conflitos)
DROP POLICY IF EXISTS "Service role pode atualizar audiências" ON public.audiencias;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar audiências" ON public.audiencias;

-- Criar política permitindo UPDATE via service_role
-- O backend já verifica permissões granulares antes de chamar esta operação
CREATE POLICY "Service role pode atualizar audiências"
  ON public.audiencias
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY "Service role pode atualizar audiências" ON public.audiencias IS
'Service role (backend) pode atualizar audiências. Backend já verificou permissões granulares (audiencias.editar)';

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Listar todas as políticas da tabela audiencias
DO $$
DECLARE
  policy_count int;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' 
    AND tablename = 'audiencias';
  
  RAISE NOTICE 'Total de políticas RLS em audiencias: %', policy_count;
END $$;
