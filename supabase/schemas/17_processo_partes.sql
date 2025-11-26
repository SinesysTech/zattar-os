-- ============================================================================
-- Tabela: processo_partes
-- Relacionamento N:N entre processos e partes (clientes, partes contrárias, terceiros)
-- ============================================================================

create table if not exists public.processo_partes (
  id bigint generated always as identity primary key,
  processo_id bigint not null references public.acervo(id) on delete cascade,
  parte_tipo text not null check (parte_tipo in ('cliente', 'parte_contraria', 'terceiro')),
  parte_id bigint not null,
  polo text not null check (polo in ('ativo', 'passivo', 'outros')),
  tipo_parte text,
  principal boolean default false,
  ordem integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  -- Constraint única: uma parte só pode estar uma vez no processo com determinado polo
  unique (processo_id, parte_tipo, parte_id, polo)
);

comment on table public.processo_partes is 'Relacionamento N:N entre processos e partes (clientes, partes contrárias, terceiros)';
comment on column public.processo_partes.processo_id is 'ID do processo na tabela acervo';
comment on column public.processo_partes.parte_tipo is 'Tipo da parte: cliente, parte_contraria, terceiro';
comment on column public.processo_partes.parte_id is 'ID da parte na respectiva tabela';
comment on column public.processo_partes.polo is 'Polo processual: ativo, passivo, outros';
comment on column public.processo_partes.tipo_parte is 'Tipo específico da parte (RECLAMANTE, RECLAMADO, PERITO, etc)';
comment on column public.processo_partes.principal is 'Indica se é a parte principal do polo';
comment on column public.processo_partes.ordem is 'Ordem de exibição da parte';

-- Índices
create index if not exists idx_processo_partes_processo_id on public.processo_partes(processo_id);
create index if not exists idx_processo_partes_parte on public.processo_partes(parte_tipo, parte_id);
create index if not exists idx_processo_partes_polo on public.processo_partes(polo);

-- RLS
alter table public.processo_partes enable row level security;

create policy "Service role tem acesso total ao processo_partes"
on public.processo_partes for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler processo_partes"
on public.processo_partes for select
to authenticated
using (true);
