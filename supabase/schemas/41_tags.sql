-- Tabela de tags (sistema unificado de tags)

create table if not exists public.tags (
  id bigint generated always as identity primary key,
  nome text not null,
  slug text not null,
  cor text null,
  created_at timestamptz not null default now(),
  unique (slug)
);

alter table public.tags enable row level security;
