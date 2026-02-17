-- Migration: fix_notificacoes_realtime_rls
-- Description: Corrige políticas RLS da tabela notificacoes para funcionar com Realtime
--
-- Problema: As políticas RLS usam get_current_user_id() que pode não funcionar
-- corretamente no contexto do Supabase Realtime. A função faz uma query na tabela
-- usuarios, mas o Realtime avalia as políticas de forma diferente.
--
-- Solução: Usar subqueries diretas ao invés de funções SECURITY DEFINER

-- Remover políticas antigas que usam get_current_user_id()
DROP POLICY IF EXISTS "Usuários podem ler suas próprias notificações" ON public.notificacoes;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias notificações" ON public.notificacoes;

-- Criar políticas otimizadas para Realtime
-- Usar subquery direta ao invés de função para melhor compatibilidade com Realtime
CREATE POLICY "Usuários podem ler suas próprias notificações"
ON public.notificacoes FOR SELECT
TO authenticated
USING (
  usuario_id IN (
    SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem atualizar suas próprias notificações"
ON public.notificacoes FOR UPDATE
TO authenticated
USING (
  usuario_id IN (
    SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  usuario_id IN (
    SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid()
  )
);

-- Adicionar comentários explicativos
COMMENT ON POLICY "Usuários podem ler suas próprias notificações" ON public.notificacoes IS
'Política otimizada para Realtime - usa subquery direta ao invés de função get_current_user_id()';

COMMENT ON POLICY "Usuários podem atualizar suas próprias notificações" ON public.notificacoes IS
'Política otimizada para Realtime - usa subquery direta ao invés de função get_current_user_id()';
