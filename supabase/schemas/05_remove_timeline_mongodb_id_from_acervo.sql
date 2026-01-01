-- schema: remover coluna timeline_mongodb_id da tabela public.acervo
-- data: 2026-01-01
-- descricao: remove referencia ao mongodb apos migracao completa para postgresql jsonb

-- dropar indice (se existir)
drop index if exists public.idx_acervo_timeline_mongodb_id;

-- remover coluna (se existir)
alter table public.acervo
drop column if exists timeline_mongodb_id;

-- comentario atualizado para refletir armazenamento da timeline em jsonb
comment on table public.acervo is 'Acervo completo de processos capturados do PJE. Timeline armazenada em timeline_jsonb (JSONB).';


