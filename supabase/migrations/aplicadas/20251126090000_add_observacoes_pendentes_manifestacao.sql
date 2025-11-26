-- Migration: Adicionar coluna observacoes em pendentes_manifestacao

alter table public.pendentes_manifestacao
  add column if not exists observacoes text;

comment on column public.pendentes_manifestacao.observacoes is 'Anotações/observações internas do expediente pendente de manifestação';

