-- Tabela de audiências
-- Armazena audiências agendadas dos processos

create table public.audiencias (
  id bigint generated always as identity primary key,
  id_pje bigint not null,
  advogado_id bigint not null references public.advogados(id) on delete cascade,
  processo_id bigint not null references public.acervo(id) on delete cascade,
  orgao_julgador_id bigint references public.orgao_julgador(id) on delete set null,
  trt public.codigo_tribunal not null,
  grau public.grau_tribunal not null,
  numero_processo text not null,
  data_inicio timestamptz not null,
  data_fim timestamptz not null,
  sala_audiencia_nome text,
  sala_audiencia_id bigint,
  status text not null,
  status_descricao text,
  tipo_id bigint,
  tipo_descricao text,
  tipo_codigo text,
  tipo_is_virtual boolean default false,
  designada boolean not null default false,
  em_andamento boolean not null default false,
  documento_ativo boolean not null default false,
  polo_ativo_nome text,
  polo_ativo_cpf text,
  polo_passivo_nome text,
  polo_passivo_cnpj text,
  url_audiencia_virtual text,
  hora_inicial time,
  hora_final time,
  responsavel_id bigint references public.usuarios(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  -- Garantir unicidade da audiência: mesmo processo pode ter múltiplos advogados habilitados
  -- Não inclui advogado_id porque múltiplos advogados do mesmo escritório podem ver a mesma audiência
  unique (id_pje, trt, grau, numero_processo)
);
comment on table public.audiencias is 'Audiências agendadas dos processos capturados do PJE. A unicidade da audiência é garantida por (id_pje, trt, grau, numero_processo), permitindo que múltiplos advogados vejam a mesma audiência do mesmo processo sem duplicação';
comment on column public.audiencias.id_pje is 'ID da audiência no sistema PJE';
comment on column public.audiencias.advogado_id is 'Referência ao advogado que capturou a audiência (não faz parte da unicidade, pois múltiplos advogados podem ver a mesma audiência)';
comment on column public.audiencias.processo_id is 'Referência ao processo na tabela acervo (ID do processo no PJE)';
comment on column public.audiencias.orgao_julgador_id is 'Referência ao órgão julgador da audiência';
comment on column public.audiencias.trt is 'Código do TRT onde a audiência está agendada';
comment on column public.audiencias.grau is 'Grau do processo (primeiro_grau ou segundo_grau)';
comment on column public.audiencias.numero_processo is 'Número do processo no formato CNJ (usado para garantir unicidade junto com id_pje, trt e grau)';
comment on column public.audiencias.data_inicio is 'Data e hora de início da audiência';
comment on column public.audiencias.data_fim is 'Data e hora de fim da audiência';
comment on column public.audiencias.sala_audiencia_nome is 'Nome da sala de audiência';
comment on column public.audiencias.sala_audiencia_id is 'ID da sala de audiência no PJE';
comment on column public.audiencias.status is 'Status da audiência (M=Marcada, R=Realizada, C=Cancelada)';
comment on column public.audiencias.status_descricao is 'Descrição do status da audiência';
comment on column public.audiencias.tipo_id is 'ID do tipo de audiência no PJE';
comment on column public.audiencias.tipo_descricao is 'Descrição do tipo de audiência (ex: Una, Instrução)';
comment on column public.audiencias.tipo_codigo is 'Código do tipo de audiência';
comment on column public.audiencias.tipo_is_virtual is 'Indica se a audiência é virtual';
comment on column public.audiencias.designada is 'Indica se a audiência está designada';
comment on column public.audiencias.em_andamento is 'Indica se a audiência está em andamento';
comment on column public.audiencias.documento_ativo is 'Indica se há documento ativo relacionado';
comment on column public.audiencias.polo_ativo_nome is 'Nome da parte autora';
comment on column public.audiencias.polo_ativo_cpf is 'CPF da parte autora';
comment on column public.audiencias.polo_passivo_nome is 'Nome da parte ré';
comment on column public.audiencias.polo_passivo_cnpj is 'CNPJ da parte ré';
comment on column public.audiencias.url_audiencia_virtual is 'URL para audiências virtuais (Zoom, Google Meet, etc)';
comment on column public.audiencias.hora_inicial is 'Hora inicial da audiência';
comment on column public.audiencias.hora_final is 'Hora final da audiência';
comment on column public.audiencias.responsavel_id is 'Usuário responsável pela audiência. Pode ser atribuído, transferido ou desatribuído. Todas as alterações são registradas em logs_alteracao';

-- Índices para melhor performance
create index idx_audiencias_advogado_id on public.audiencias using btree (advogado_id);
create index idx_audiencias_processo_id on public.audiencias using btree (processo_id);
create index idx_audiencias_orgao_julgador_id on public.audiencias using btree (orgao_julgador_id);
create index idx_audiencias_trt on public.audiencias using btree (trt);
create index idx_audiencias_grau on public.audiencias using btree (grau);
create index idx_audiencias_id_pje on public.audiencias using btree (id_pje);
create index idx_audiencias_numero_processo on public.audiencias using btree (numero_processo);
create index idx_audiencias_status on public.audiencias using btree (status);
create index idx_audiencias_data_inicio on public.audiencias using btree (data_inicio);
create index idx_audiencias_data_fim on public.audiencias using btree (data_fim);
create index idx_audiencias_responsavel_id on public.audiencias using btree (responsavel_id);
create index idx_audiencias_advogado_trt_grau on public.audiencias using btree (advogado_id, trt, grau);
create index idx_audiencias_processo_data on public.audiencias using btree (processo_id, data_inicio);

-- Trigger para atualizar updated_at automaticamente
create trigger update_audiencias_updated_at
before update on public.audiencias
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.audiencias enable row level security;

