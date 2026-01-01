-- ============================================================================
-- Tabela: captura_logs_brutos
-- Logs brutos de captura (payloads e metadados) para auditoria e reprocessamento
-- Persistência de logs brutos em PostgreSQL (jsonb) para auditoria e reprocessamento
-- ============================================================================

create table if not exists public.captura_logs_brutos (
  id bigint generated always as identity primary key,

  -- Identificador estável (UUID v4 gerado na aplicação) para referenciar o log bruto
  raw_log_id text not null unique,

  -- ID do log de captura em public.capturas_log
  -- Pode ser -1 quando a falha ocorreu antes de existir capturas_log (erros “pré-log”)
  captura_log_id bigint not null,

  -- Contexto da captura
  tipo_captura text not null,
  advogado_id bigint references public.advogados(id),
  credencial_id bigint references public.credenciais(id),
  credencial_ids bigint[],
  trt public.codigo_tribunal,
  grau public.grau_tribunal,

  -- Status do item (sucesso/erro por processo ou unidade de captura)
  status text not null check (status in ('success', 'error')),

  -- Dados (JSONB)
  requisicao jsonb,
  payload_bruto jsonb,
  resultado_processado jsonb,
  logs jsonb,

  -- Erro (texto) para buscas e triagem rápida
  erro text,

  -- Timestamps
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.captura_logs_brutos is 'Logs brutos de captura (payloads e metadados) para auditoria e reprocessamento. Persistido em PostgreSQL (jsonb).';
comment on column public.captura_logs_brutos.raw_log_id is 'Identificador estável do log bruto (string/UUID).';
comment on column public.captura_logs_brutos.captura_log_id is 'ID do log de captura em capturas_log (pode ser -1 quando a falha ocorreu antes de existir capturas_log).';
comment on column public.captura_logs_brutos.payload_bruto is 'Payload bruto retornado pelo PJE (JSONB). Pode ser null quando a falha ocorre antes da chamada ao PJE.';

-- Índices para consultas frequentes (listagem, filtros, contagens e ordenação)
create index if not exists idx_captura_logs_brutos_captura_log_id
on public.captura_logs_brutos using btree (captura_log_id);

create index if not exists idx_captura_logs_brutos_captura_log_id_criado_em_desc
on public.captura_logs_brutos using btree (captura_log_id, criado_em desc);

create index if not exists idx_captura_logs_brutos_status
on public.captura_logs_brutos using btree (status);

create index if not exists idx_captura_logs_brutos_status_criado_em_desc
on public.captura_logs_brutos using btree (status, criado_em desc);

create index if not exists idx_captura_logs_brutos_advogado_id
on public.captura_logs_brutos using btree (advogado_id);

create index if not exists idx_captura_logs_brutos_credencial_id
on public.captura_logs_brutos using btree (credencial_id);

create index if not exists idx_captura_logs_brutos_trt_grau_status_criado_em_desc
on public.captura_logs_brutos using btree (trt, grau, status, criado_em desc);

-- RLS
alter table public.captura_logs_brutos enable row level security;

-- Service role: acesso total (operações administrativas e jobs)
create policy "Service role pode selecionar captura_logs_brutos"
on public.captura_logs_brutos for select
to service_role
using (true);

create policy "Service role pode inserir captura_logs_brutos"
on public.captura_logs_brutos for insert
to service_role
with check (true);

create policy "Service role pode atualizar captura_logs_brutos"
on public.captura_logs_brutos for update
to service_role
using (true)
with check (true);

create policy "Service role pode deletar captura_logs_brutos"
on public.captura_logs_brutos for delete
to service_role
using (true);


