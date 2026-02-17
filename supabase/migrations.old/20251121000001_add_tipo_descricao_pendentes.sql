-- Migration: Adicionar colunas tipo_expediente_id e descricao_arquivos em pendentes_manifestacao
-- Permite classificar e descrever expedientes do PJE

-- Adicionar colunas
alter table public.pendentes_manifestacao
add column if not exists tipo_expediente_id bigint references public.tipos_expedientes(id) on delete set null,
add column if not exists descricao_arquivos text;

-- Adicionar comentários
comment on column public.pendentes_manifestacao.tipo_expediente_id is 'Tipo do expediente (opcional, para classificação)';
comment on column public.pendentes_manifestacao.descricao_arquivos is 'Descrição adicional de arquivos do expediente (preenchida manualmente)';

-- Índice para filtrar por tipo
create index if not exists idx_pendentes_tipo_expediente on public.pendentes_manifestacao using btree (tipo_expediente_id) where tipo_expediente_id is not null;
