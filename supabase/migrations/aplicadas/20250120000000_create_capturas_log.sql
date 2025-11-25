-- Tabela de histórico de capturas
-- Registra todas as capturas realizadas para auditoria e acompanhamento

create table public.capturas_log (
  id bigint generated always as identity primary key,
  tipo_captura text not null,
  advogado_id bigint references public.advogados(id) on delete set null,
  credencial_ids bigint[] not null,
  status text not null default 'pending',
  resultado jsonb,
  erro text,
  iniciado_em timestamptz default now() not null,
  concluido_em timestamptz,
  created_at timestamptz default now() not null
);

comment on table public.capturas_log is 'Histórico de todas as capturas realizadas no sistema';
comment on column public.capturas_log.tipo_captura is 'Tipo de captura: acervo_geral, arquivados, audiencias, pendentes, partes';
comment on column public.capturas_log.advogado_id is 'ID do advogado que realizou a captura';
comment on column public.capturas_log.credencial_ids is 'Array de IDs das credenciais utilizadas na captura';
comment on column public.capturas_log.status is 'Status da captura: pending, in_progress, completed, failed';
comment on column public.capturas_log.resultado is 'Resultado da captura em formato JSON (dados capturados, estatísticas, etc)';
comment on column public.capturas_log.erro is 'Mensagem de erro se a captura falhou';
comment on column public.capturas_log.iniciado_em is 'Data e hora em que a captura foi iniciada';
comment on column public.capturas_log.concluido_em is 'Data e hora em que a captura foi concluída';
comment on column public.capturas_log.created_at is 'Data de criação do registro';

-- Índices para consultas frequentes
create index idx_capturas_log_tipo_captura on public.capturas_log using btree (tipo_captura);
create index idx_capturas_log_advogado_id on public.capturas_log using btree (advogado_id);
create index idx_capturas_log_status on public.capturas_log using btree (status);
create index idx_capturas_log_iniciado_em on public.capturas_log using btree (iniciado_em desc);

-- Índice GIN para busca em array de credenciais
create index idx_capturas_log_credencial_ids on public.capturas_log using gin (credencial_ids);

-- Habilitar RLS
alter table public.capturas_log enable row level security;

-- Política RLS: usuários autenticados podem visualizar histórico
create policy "Usuários autenticados podem visualizar histórico de capturas"
  on public.capturas_log
  for select
  using (auth.role() = 'authenticated');

-- Política RLS: apenas o sistema pode inserir/atualizar (via service role)
-- Service role já tem acesso completo por padrão

