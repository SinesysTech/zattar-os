-- Relação N:N entre contratos e tags

create table if not exists public.contrato_tags (
  id bigint generated always as identity primary key,
  contrato_id bigint not null references public.contratos(id) on delete cascade,
  tag_id bigint not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (contrato_id, tag_id)
);

create index if not exists idx_contrato_tags_contrato_id on public.contrato_tags using btree (contrato_id);
create index if not exists idx_contrato_tags_tag_id on public.contrato_tags using btree (tag_id);

alter table public.contrato_tags enable row level security;
