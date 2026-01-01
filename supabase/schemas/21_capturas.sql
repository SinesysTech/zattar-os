-- ============================================================================
-- Tabela: capturas_log
-- Histórico de capturas executadas no sistema
-- ============================================================================

create table if not exists public.capturas_log (
  id bigint generated always as identity primary key,
  tipo_captura public.tipo_captura not null,
  advogado_id bigint references public.advogados(id),
  credencial_ids bigint[] default '{}',
  status public.status_captura not null default 'pending',
  resultado jsonb,
  erro text,
  iniciado_em timestamp with time zone default now(),
  concluido_em timestamp with time zone,
  created_at timestamp with time zone default now()
);

comment on table public.capturas_log is 'Histórico de capturas executadas no sistema. Registra todas as execuções de capturas de processos, audiências e expedientes do PJE.';
comment on column public.capturas_log.tipo_captura is 'Tipo de captura (acervo_geral, arquivados, audiencias, pendentes, partes)';
comment on column public.capturas_log.advogado_id is 'ID do advogado que possui o agendamento';
comment on column public.capturas_log.credencial_ids is 'Array de IDs das credenciais utilizadas na captura';
comment on column public.capturas_log.status is 'Status da captura: pending, in_progress, completed, failed';
comment on column public.capturas_log.resultado is 'Resultado da captura em JSONB';
comment on column public.capturas_log.erro is 'Mensagem de erro (se houver)';
comment on column public.capturas_log.iniciado_em is 'Data/hora de início da captura';
comment on column public.capturas_log.concluido_em is 'Data/hora de conclusão da captura';

-- Índices
create index if not exists idx_capturas_log_tipo on public.capturas_log(tipo_captura);
create index if not exists idx_capturas_log_status on public.capturas_log(status);
create index if not exists idx_capturas_log_advogado on public.capturas_log(advogado_id);
create index if not exists idx_capturas_log_iniciado_em on public.capturas_log(iniciado_em);
create index if not exists idx_capturas_log_credencial_ids on public.capturas_log using gin (credencial_ids);

-- RLS
alter table public.capturas_log enable row level security;

create policy "Service role tem acesso total a capturas_log"
on public.capturas_log for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler capturas_log"
on public.capturas_log for select
to authenticated
using (true);


-- ============================================================================
-- Tabela: agendamentos
-- Agendamentos de execução automática de capturas
-- ============================================================================

create table if not exists public.agendamentos (
  id bigint generated always as identity primary key,
  tipo_captura public.tipo_captura not null,
  advogado_id bigint references public.advogados(id),
  credencial_ids bigint[] not null,
  periodicidade text not null check (periodicidade in ('diario', 'a_cada_N_dias')),
  dias_intervalo integer,
  horario time not null,
  ativo boolean default true,
  parametros_extras jsonb,
  ultima_execucao timestamp with time zone,
  proxima_execucao timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.agendamentos is 'Agendamentos de execução automática de capturas';
comment on column public.agendamentos.tipo_captura is 'Tipo de captura (acervo_geral, arquivados, audiencias, pendentes)';
comment on column public.agendamentos.advogado_id is 'ID do advogado que possui o agendamento';
comment on column public.agendamentos.credencial_ids is 'Array de IDs das credenciais a serem utilizadas na captura';
comment on column public.agendamentos.periodicidade is 'Tipo de periodicidade: diario ou a_cada_N_dias';
comment on column public.agendamentos.dias_intervalo is 'Número de dias entre execuções (usado quando periodicidade = a_cada_N_dias)';
comment on column public.agendamentos.horario is 'Horário de execução no formato HH:mm';
comment on column public.agendamentos.ativo is 'Indica se o agendamento está ativo';
comment on column public.agendamentos.parametros_extras is 'Parâmetros extras específicos do tipo de captura (dataInicio, dataFim, filtroPrazo)';
comment on column public.agendamentos.ultima_execucao is 'Timestamp da última execução do agendamento';
comment on column public.agendamentos.proxima_execucao is 'Timestamp calculado da próxima execução';

-- Índices
create index if not exists idx_agendamentos_tipo on public.agendamentos(tipo_captura);
create index if not exists idx_agendamentos_ativo on public.agendamentos(ativo);
create index if not exists idx_agendamentos_proxima_execucao on public.agendamentos(proxima_execucao);
create index if not exists idx_agendamentos_advogado on public.agendamentos(advogado_id);

-- RLS
alter table public.agendamentos enable row level security;

create policy "Service role tem acesso total a agendamentos"
on public.agendamentos for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler agendamentos"
on public.agendamentos for select
to authenticated
using (true);
