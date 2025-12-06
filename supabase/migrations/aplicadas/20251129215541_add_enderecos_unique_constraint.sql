-- ============================================================================
-- Migration: Adicionar constraint unique para deduplicação de endereços
-- Descrição: Adiciona índice unique parcial em (id_pje, entidade_tipo, entidade_id)
--            para permitir upsert idempotente de endereços capturados do PJE
-- ============================================================================

-- Índice unique parcial: só aplica quando id_pje não é null
-- Isso permite que endereços criados manualmente (sem id_pje) não entrem em conflito
create unique index if not exists idx_enderecos_pje_unique
on public.enderecos(id_pje, entidade_tipo, entidade_id)
where id_pje is not null;

comment on index public.idx_enderecos_pje_unique is
  'Índice unique parcial para deduplicação de endereços do PJE. Permite upsert idempotente por (id_pje, entidade_tipo, entidade_id).';

