-- ============================================================================
-- Torna coluna area_direito nullable na tabela contratos
-- Migração para usar segmento_id em vez de area_direito
-- ============================================================================

-- ATENÇÃO: Esta é uma migração de transição
-- area_direito está sendo substituído por segmento_id
-- Durante a transição, permitimos valores NULL em area_direito

-- Remover constraint NOT NULL da coluna area_direito
alter table public.contratos
  alter column area_direito drop not null;

-- Atualizar comentário da coluna para refletir status de deprecação
comment on column public.contratos.area_direito is '@deprecated Usar segmento_id. Coluna mantida para compatibilidade com dados existentes.';
