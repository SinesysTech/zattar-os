-- Migration: Criar tabela de agendamentos de captura
-- Permite agendar execuções automáticas de capturas com periodicidade customizável

create table public.agendamentos (
  id bigint generated always as identity primary key,
  tipo_captura text not null, -- 'acervo_geral', 'arquivados', 'audiencias', 'pendentes'
  advogado_id bigint references public.advogados(id) on delete cascade,
  credencial_ids bigint[] not null,
  periodicidade text not null check (periodicidade in ('diario', 'a_cada_N_dias')),
  dias_intervalo integer, -- Número de dias (usado quando periodicidade = 'a_cada_N_dias', NULL quando 'diario')
  horario time not null, -- HH:mm format
  ativo boolean default true,
  parametros_extras jsonb,
  ultima_execucao timestamptz,
  proxima_execucao timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  constraint check_dias_intervalo check (
    (periodicidade = 'diario' and dias_intervalo is null) or
    (periodicidade = 'a_cada_N_dias' and dias_intervalo is not null and dias_intervalo > 0)
  )
);

comment on table public.agendamentos is 'Agendamentos de execução automática de capturas';
comment on column public.agendamentos.tipo_captura is 'Tipo de captura (acervo_geral, arquivados, audiencias, pendentes)';
comment on column public.agendamentos.advogado_id is 'ID do advogado que possui o agendamento';
comment on column public.agendamentos.credencial_ids is 'Array de IDs das credenciais a serem utilizadas na captura';
comment on column public.agendamentos.periodicidade is 'Tipo de periodicidade: diario ou a_cada_N_dias';
comment on column public.agendamentos.dias_intervalo is 'Número de dias entre execuções (usado quando periodicidade = a_cada_N_dias)';
comment on column public.agendamentos.horario is 'Horário de execução no formato HH:mm';
comment on column public.agendamentos.ativo is 'Indica se o agendamento está ativo e deve ser executado';
comment on column public.agendamentos.parametros_extras is 'Parâmetros extras específicos do tipo de captura (dataInicio, dataFim, filtroPrazo)';
comment on column public.agendamentos.ultima_execucao is 'Timestamp da última execução do agendamento';
comment on column public.agendamentos.proxima_execucao is 'Timestamp calculado da próxima execução';

-- Índices para performance
create index idx_agendamentos_advogado_id on public.agendamentos using btree (advogado_id);
create index idx_agendamentos_ativo on public.agendamentos using btree (ativo);
create index idx_agendamentos_proxima_execucao on public.agendamentos using btree (proxima_execucao);
create index idx_agendamentos_tipo_captura on public.agendamentos using btree (tipo_captura);
create index idx_agendamentos_ativo_proxima_execucao on public.agendamentos using btree (ativo, proxima_execucao) where ativo = true;

-- Trigger para atualizar updated_at
create trigger update_agendamentos_updated_at
  before update on public.agendamentos
  for each row
  execute function update_updated_at_column();

-- RLS (Row Level Security)
alter table public.agendamentos enable row level security;

-- Política: Permitir leitura para usuários autenticados
create policy "Usuários autenticados podem ler agendamentos"
  on public.agendamentos
  for select
  using (auth.role() = 'authenticated');

-- Política: Permitir criação para usuários autenticados
create policy "Usuários autenticados podem criar agendamentos"
  on public.agendamentos
  for insert
  with check (auth.role() = 'authenticated');

-- Política: Permitir atualização para usuários autenticados
create policy "Usuários autenticados podem atualizar agendamentos"
  on public.agendamentos
  for update
  using (auth.role() = 'authenticated');

-- Política: Permitir deleção para usuários autenticados
create policy "Usuários autenticados podem deletar agendamentos"
  on public.agendamentos
  for delete
  using (auth.role() = 'authenticated');

