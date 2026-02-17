-- ============================================================================
-- Migration: Remover coluna escopo da tabela assinatura_digital_segmentos
-- ============================================================================
-- 
-- Descrição: Remove o campo `escopo` da tabela de segmentos, unificando
--            segmentos como entidade global do sistema.
-- 
-- Data: 2025-12-15
-- ============================================================================

-- Verificar se a coluna existe antes de remover
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'assinatura_digital_segmentos'
      and column_name = 'escopo'
  ) then
    -- Remover constraint se existir
    alter table public.assinatura_digital_segmentos
      drop constraint if exists segmentos_escopo_check;

    -- Remover índice se existir
    drop index if exists public.idx_segmentos_escopo;

    -- Remover coluna
    alter table public.assinatura_digital_segmentos
      drop column escopo;
  end if;
end $$;

comment on table public.assinatura_digital_segmentos is 'Segmentos de negócio para formulários e templates de assinatura digital (entidade global, sem escopo)';
