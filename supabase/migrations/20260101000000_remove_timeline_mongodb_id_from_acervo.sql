-- =============================================================================
-- migration: remover coluna timeline_mongodb_id da tabela public.acervo
-- data (utc): 2026-01-01
-- descricao: remove referencia ao mongodb apos migracao completa para postgresql jsonb
-- observacoes:
-- - remove indice legado (se existir)
-- - remove coluna legada (se existir)
-- - atualiza comentario da tabela para refletir timeline em jsonb
-- =============================================================================

-- dropar indice (se existir)
drop index if exists public.idx_acervo_timeline_mongodb_id;

-- remover coluna (se existir)
alter table public.acervo
drop column if exists timeline_mongodb_id;

-- comentario atualizado
comment on table public.acervo is 'Acervo completo de processos capturados do PJE. Timeline armazenada em timeline_jsonb (JSONB).';


