-- Pipelines de contrato por segmento
-- Cada segmento tem exatamente um pipeline (1:1 via UNIQUE)

create table if not exists public.contrato_pipelines (
  id bigint generated always as identity primary key,
  segmento_id bigint not null references public.segmentos(id) on delete restrict,
  nome text not null,
  descricao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_contrato_pipelines_segmento unique (segmento_id)
);

comment on table public.contrato_pipelines is 'Pipelines de contrato configuráveis por segmento (1 pipeline por segmento)';
comment on column public.contrato_pipelines.segmento_id is 'Segmento associado (UNIQUE — 1:1)';

create index if not exists idx_contrato_pipelines_ativo on public.contrato_pipelines(ativo);

create trigger update_contrato_pipelines_updated_at
before update on public.contrato_pipelines
for each row
execute function public.update_updated_at_column();

alter table public.contrato_pipelines enable row level security;

create policy "service role full access - contrato_pipelines"
  on public.contrato_pipelines for all
  to service_role
  using (true) with check (true);

create policy "authenticated select - contrato_pipelines"
  on public.contrato_pipelines for select
  to authenticated
  using (true);

-- Estágios de pipeline
create table if not exists public.contrato_pipeline_estagios (
  id bigint generated always as identity primary key,
  pipeline_id bigint not null references public.contrato_pipelines(id) on delete cascade,
  nome text not null,
  slug text not null,
  cor text not null default '#6B7280',
  ordem integer not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.contrato_pipeline_estagios is 'Estágios configuráveis dentro de um pipeline de contrato';
comment on column public.contrato_pipeline_estagios.cor is 'Cor hex para exibição no Kanban (ex: #3B82F6)';
comment on column public.contrato_pipeline_estagios.is_default is 'Estágio default para novos contratos (exatamente 1 por pipeline)';
comment on column public.contrato_pipeline_estagios.ordem is 'Ordem de exibição das colunas no Kanban';

create index if not exists idx_contrato_pipeline_estagios_pipeline_ordem on public.contrato_pipeline_estagios(pipeline_id, ordem);
create index if not exists idx_contrato_pipeline_estagios_is_default on public.contrato_pipeline_estagios(pipeline_id, is_default) where is_default = true;

create trigger update_contrato_pipeline_estagios_updated_at
before update on public.contrato_pipeline_estagios
for each row
execute function public.update_updated_at_column();

alter table public.contrato_pipeline_estagios enable row level security;

create policy "service role full access - contrato_pipeline_estagios"
  on public.contrato_pipeline_estagios for all
  to service_role
  using (true) with check (true);

create policy "authenticated select - contrato_pipeline_estagios"
  on public.contrato_pipeline_estagios for select
  to authenticated
  using (true);
