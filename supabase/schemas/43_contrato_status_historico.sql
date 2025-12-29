-- Histórico de mudanças de status do contrato

create table if not exists public.contrato_status_historico (
  id bigint generated always as identity primary key,
  contrato_id bigint not null references public.contratos(id) on delete cascade,
  from_status public.status_contrato null,
  to_status public.status_contrato not null,
  changed_at timestamptz not null default now(),
  changed_by bigint null references public.usuarios(id) on delete set null,
  reason text null,
  metadata jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists idx_contrato_status_historico_contrato_id on public.contrato_status_historico using btree (contrato_id);
create index if not exists idx_contrato_status_historico_changed_at on public.contrato_status_historico using btree (changed_at);

alter table public.contrato_status_historico enable row level security;
