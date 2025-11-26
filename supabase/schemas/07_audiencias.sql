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
  hora_inicio time,
  hora_fim time,
  modalidade public.modalidade_audiencia,
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
  polo_passivo_nome text,
  url_audiencia_virtual text,
  responsavel_id bigint references public.usuarios(id) on delete set null,
  observacoes text,
  dados_anteriores jsonb,
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
comment on column public.audiencias.hora_inicio is 'Hora de início da audiência (extraída de pautaAudienciaHorario.horaInicial do PJE)';
comment on column public.audiencias.hora_fim is 'Hora de fim da audiência (extraída de pautaAudienciaHorario.horaFinal do PJE)';
comment on column public.audiencias.modalidade is 'Modalidade da audiência: virtual, presencial ou híbrida. Populada automaticamente por trigger, exceto híbrida que é manual.';
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
comment on column public.audiencias.polo_passivo_nome is 'Nome da parte ré';
comment on column public.audiencias.url_audiencia_virtual is 'URL para audiências virtuais (Zoom, Google Meet, etc)';
comment on column public.audiencias.responsavel_id is 'Usuário responsável pela audiência. Pode ser atribuído, transferido ou desatribuído. Todas as alterações são registradas em logs_alteracao';
comment on column public.audiencias.observacoes is 'Observações sobre a audiência';
comment on column public.audiencias.dados_anteriores is 'Armazena o estado anterior do registro antes da última atualização. Null quando o registro foi inserido ou quando não houve mudanças na última captura.';

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
create index idx_audiencias_modalidade on public.audiencias using btree (modalidade);

-- Função e trigger para popular modalidade automaticamente
create or replace function public.populate_modalidade_audiencia()
returns trigger
language plpgsql
security definer
as $$
declare
  v_tipo_descricao text;
begin
  -- Buscar descrição do tipo de audiência se houver tipo_audiencia_id
  if new.tipo_audiencia_id is not null then
    select descricao into v_tipo_descricao
    from public.tipo_audiencia
    where id = new.tipo_audiencia_id;
  end if;

  -- Regra 1: Se já é híbrida (definida manualmente), não altera
  if new.modalidade = 'hibrida' then
    return new;
  end if;

  -- Regra 2: Se tem URL de audiência virtual OU tipo contém 'videoconfer' → virtual
  if new.url_audiencia_virtual is not null and trim(new.url_audiencia_virtual) != '' then
    new.modalidade := 'virtual';
    return new;
  end if;

  if v_tipo_descricao is not null and lower(v_tipo_descricao) like '%videoconfer%' then
    new.modalidade := 'virtual';
    return new;
  end if;

  -- Regra 3: Se tem endereço presencial preenchido → presencial
  if new.endereco_presencial is not null and new.endereco_presencial != '{}'::jsonb then
    new.modalidade := 'presencial';
    return new;
  end if;

  -- Caso contrário, mantém o valor atual (pode ser null)
  return new;
end;
$$;
comment on function public.populate_modalidade_audiencia() is 'Popula automaticamente a modalidade da audiência baseado em URL virtual, tipo de audiência ou endereço presencial';

create trigger trigger_set_modalidade_audiencia
  before insert or update of url_audiencia_virtual, endereco_presencial, tipo_audiencia_id, modalidade
  on public.audiencias
  for each row
  execute function public.populate_modalidade_audiencia();

-- Trigger para atualizar updated_at automaticamente
create trigger update_audiencias_updated_at
before update on public.audiencias
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.audiencias enable row level security;

