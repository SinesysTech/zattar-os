-- Migration: Adicionar coluna responsavel_id nas tabelas de processos
-- Esta migration adiciona a coluna responsavel_id (nullable) nas tabelas acervo,
-- audiencias e pendentes_manifestacao para permitir atribuição de responsáveis

-- Adicionar responsavel_id na tabela acervo
alter table public.acervo
add column responsavel_id bigint references public.usuarios(id) on delete set null;

comment on column public.acervo.responsavel_id is 'Usuário responsável pelo processo. Pode ser atribuído, transferido ou desatribuído. Todas as alterações são registradas em logs_alteracao';

-- Criar índice para performance
create index idx_acervo_responsavel_id on public.acervo using btree (responsavel_id);

-- Adicionar responsavel_id na tabela audiencias
alter table public.audiencias
add column responsavel_id bigint references public.usuarios(id) on delete set null;

comment on column public.audiencias.responsavel_id is 'Usuário responsável pela audiência. Pode ser atribuído, transferido ou desatribuído. Todas as alterações são registradas em logs_alteracao';

-- Criar índice para performance
create index idx_audiencias_responsavel_id on public.audiencias using btree (responsavel_id);

-- Adicionar responsavel_id na tabela pendentes_manifestacao
alter table public.pendentes_manifestacao
add column responsavel_id bigint references public.usuarios(id) on delete set null;

comment on column public.pendentes_manifestacao.responsavel_id is 'Usuário responsável pelo processo pendente de manifestação. Pode ser atribuído, transferido ou desatribuído. Todas as alterações são registradas em logs_alteracao';

-- Criar índice para performance
create index idx_pendentes_responsavel_id on public.pendentes_manifestacao using btree (responsavel_id);

