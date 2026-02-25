-- Tabelas de tipos configuráveis de contrato
-- Substituem os enums fixos tipo_contrato e tipo_cobranca

-- Tipos de contrato (ex: ajuizamento, defesa, assessoria...)
create table if not exists public.contrato_tipos (
  id bigint generated always as identity primary key,
  nome text not null,
  slug text not null unique,
  descricao text,
  ativo boolean not null default true,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.contrato_tipos is 'Tipos de contrato configuráveis pelo admin (substitui enum tipo_contrato)';
comment on column public.contrato_tipos.slug is 'Identificador único em kebab-case (ex: ajuizamento, defesa)';
comment on column public.contrato_tipos.ordem is 'Ordem de exibição em selects e listas';

create index if not exists idx_contrato_tipos_ativo on public.contrato_tipos(ativo);
create index if not exists idx_contrato_tipos_ordem_nome on public.contrato_tipos(ordem, nome);

create trigger update_contrato_tipos_updated_at
before update on public.contrato_tipos
for each row
execute function public.update_updated_at_column();

alter table public.contrato_tipos enable row level security;

create policy "service role full access - contrato_tipos"
  on public.contrato_tipos for all
  to service_role
  using (true) with check (true);

create policy "authenticated select - contrato_tipos"
  on public.contrato_tipos for select
  to authenticated
  using (true);

-- Tipos de cobrança (ex: pró-êxito, pró-labore...)
create table if not exists public.contrato_tipos_cobranca (
  id bigint generated always as identity primary key,
  nome text not null,
  slug text not null unique,
  descricao text,
  ativo boolean not null default true,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.contrato_tipos_cobranca is 'Tipos de cobrança configuráveis pelo admin (substitui enum tipo_cobranca)';
comment on column public.contrato_tipos_cobranca.slug is 'Identificador único em kebab-case (ex: pro_exito, pro_labore)';

create index if not exists idx_contrato_tipos_cobranca_ativo on public.contrato_tipos_cobranca(ativo);
create index if not exists idx_contrato_tipos_cobranca_ordem_nome on public.contrato_tipos_cobranca(ordem, nome);

create trigger update_contrato_tipos_cobranca_updated_at
before update on public.contrato_tipos_cobranca
for each row
execute function public.update_updated_at_column();

alter table public.contrato_tipos_cobranca enable row level security;

create policy "service role full access - contrato_tipos_cobranca"
  on public.contrato_tipos_cobranca for all
  to service_role
  using (true) with check (true);

create policy "authenticated select - contrato_tipos_cobranca"
  on public.contrato_tipos_cobranca for select
  to authenticated
  using (true);
