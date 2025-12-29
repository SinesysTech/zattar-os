-- Partes do contrato (modelo relacional)

create table if not exists public.contrato_partes (
  id bigint generated always as identity primary key,
  contrato_id bigint not null references public.contratos(id) on delete cascade,
  tipo_entidade text not null check (tipo_entidade in ('cliente', 'parte_contraria')),
  entidade_id bigint not null,
  papel_contratual public.papel_contratual not null,
  ordem integer not null default 0 check (ordem >= 0),
  nome_snapshot text null,
  cpf_cnpj_snapshot text null,
  created_at timestamptz not null default now(),
  unique (contrato_id, tipo_entidade, entidade_id, papel_contratual)
);

create index if not exists idx_contrato_partes_contrato_id on public.contrato_partes using btree (contrato_id);
create index if not exists idx_contrato_partes_entidade on public.contrato_partes using btree (tipo_entidade, entidade_id);
create index if not exists idx_contrato_partes_papel on public.contrato_partes using btree (papel_contratual);

alter table public.contrato_partes enable row level security;
