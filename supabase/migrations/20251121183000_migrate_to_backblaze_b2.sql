-- Migration: Migrar campos de arquivo de Google Drive para Backblaze B2
-- Data: 2025-11-21 18:30:00 UTC

-- Adicionar coluna para URL pública do arquivo no Backblaze
alter table public.pendentes_manifestacao
add column arquivo_url text;

comment on column public.pendentes_manifestacao.arquivo_url is 'URL pública do arquivo no Backblaze B2';

-- Adicionar coluna para nome do bucket
alter table public.pendentes_manifestacao
add column arquivo_bucket text;

comment on column public.pendentes_manifestacao.arquivo_bucket is 'Nome do bucket no Backblaze B2';

-- Adicionar coluna para a chave S3
alter table public.pendentes_manifestacao
add column arquivo_key text;

comment on column public.pendentes_manifestacao.arquivo_key is 'Chave do arquivo no Backblaze B2';

-- Copiar arquivo_file_id para arquivo_key
update public.pendentes_manifestacao
set arquivo_key = arquivo_file_id
where arquivo_file_id is not null;

-- Atualizar comentário do arquivo_nome
comment on column public.pendentes_manifestacao.arquivo_nome is 'Nome do arquivo no Backblaze B2';

-- Remover índices antigos
drop index if exists public.idx_pendentes_arquivo_nome;
drop index if exists public.idx_pendentes_arquivo_file_id;

-- Remover colunas antigas do Google Drive
alter table public.pendentes_manifestacao
drop column if exists arquivo_url_visualizacao;

alter table public.pendentes_manifestacao
drop column if exists arquivo_url_download;

alter table public.pendentes_manifestacao
drop column if exists arquivo_file_id;

-- Criar índices para os novos campos
create index idx_pendentes_arquivo_nome on public.pendentes_manifestacao using btree (arquivo_nome) 
where arquivo_nome is not null;

create index idx_pendentes_arquivo_key on public.pendentes_manifestacao using btree (arquivo_key) 
where arquivo_key is not null;

create index idx_pendentes_arquivo_bucket on public.pendentes_manifestacao using btree (arquivo_bucket) 
where arquivo_bucket is not null;
