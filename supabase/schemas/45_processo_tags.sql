-- Relação N:N entre processos (acervo) e tags

create table if not exists public.processo_tags (
  id bigint generated always as identity primary key,
  processo_id bigint not null references public.acervo(id) on delete cascade,
  tag_id bigint not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (processo_id, tag_id)
);

create index if not exists idx_processo_tags_processo_id on public.processo_tags using btree (processo_id);
create index if not exists idx_processo_tags_tag_id on public.processo_tags using btree (tag_id);

alter table public.processo_tags enable row level security;
