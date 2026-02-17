-- ============================================================================
-- Migration: Corrigir SECURITY DEFINER na view repasses_pendentes
-- Issue: Security Advisor - security_definer_view
-- ============================================================================
-- A view repasses_pendentes foi criada com SECURITY DEFINER (implícito),
-- o que faz com que ela execute com as permissões do criador da view,
-- ignorando as políticas RLS das tabelas subjacentes.
--
-- Esta migration altera a view para usar SECURITY INVOKER, garantindo que
-- as políticas RLS das tabelas parcelas e acordos_condenacoes sejam
-- respeitadas para cada usuário que consulta a view.
-- ============================================================================

-- Alterar a view para usar SECURITY INVOKER
alter view public.repasses_pendentes set (security_invoker = true);

comment on view public.repasses_pendentes is 'View com repasses que precisam ser processados (declaração ou transferência pendente). Usa SECURITY INVOKER para respeitar políticas RLS.';

