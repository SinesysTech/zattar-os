-- Tabela de processos pendentes de manifestação
-- Armazena processos que aguardam manifestação do advogado

create table public.expedientes (
  id bigint generated always as identity primary key,
  id_pje bigint not null,
  advogado_id bigint not null references public.advogados(id) on delete cascade,
  processo_id bigint references public.acervo(id) on delete set null,
  trt public.codigo_tribunal not null,
  grau public.grau_tribunal not null,
  numero_processo text not null,
  descricao_orgao_julgador text not null,
  classe_judicial text not null,
  numero bigint not null,
  segredo_justica boolean not null default false,
  codigo_status_processo text not null,
  prioridade_processual integer not null default 0,
  nome_parte_autora text not null,
  qtde_parte_autora integer not null default 1,
  nome_parte_re text not null,
  qtde_parte_re integer not null default 1,
  data_autuacao timestamptz not null,
  juizo_digital boolean not null default false,
  data_arquivamento timestamptz,
  id_documento bigint,
  data_ciencia_parte timestamptz,
  data_prazo_legal_parte timestamptz,
  data_criacao_expediente timestamptz,
  prazo_vencido boolean not null default false,
  sigla_orgao_julgador text,
  baixado_em timestamptz,
  protocolo_id text,
  justificativa_baixa text,
  observacoes text,
  dados_anteriores jsonb,
  responsavel_id bigint references public.usuarios(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  -- Garantir unicidade do expediente pendente: mesmo expediente pode aparecer para múltiplos advogados
  -- Não inclui advogado_id porque múltiplos advogados do mesmo escritório podem ver o mesmo expediente
  unique (id_pje, trt, grau, numero_processo),
  -- Constraint: se baixado_em não é null, então protocolo_id OU justificativa_baixa deve estar preenchido
  constraint check_baixa_valida check (
    baixado_em is null 
    or (
      protocolo_id is not null 
      or (justificativa_baixa is not null and trim(justificativa_baixa) != '')
    )
  )
);
comment on table public.expedientes is 'Processos pendentes de manifestação do advogado. A unicidade do expediente é garantida por (id_pje, trt, grau, numero_processo), permitindo que múltiplos advogados vejam o mesmo expediente sem duplicação';
comment on column public.expedientes.id_pje is 'ID do expediente no sistema PJE (não é o ID do processo)';
comment on column public.expedientes.advogado_id is 'Referência ao advogado que capturou o expediente (não faz parte da unicidade, pois múltiplos advogados podem ver o mesmo expediente)';
comment on column public.expedientes.processo_id is 'Referência ao processo na tabela acervo (preenchido via trigger baseado no numero_processo)';
comment on column public.expedientes.trt is 'Código do TRT onde o processo está tramitando';
comment on column public.expedientes.grau is 'Grau do processo (primeiro_grau ou segundo_grau)';
comment on column public.expedientes.numero_processo is 'Número do processo no formato CNJ (usado para relacionar com acervo)';
comment on column public.expedientes.descricao_orgao_julgador is 'Descrição completa do órgão julgador';
comment on column public.expedientes.classe_judicial is 'Classe judicial do processo (ex: ATOrd, ATSum)';
comment on column public.expedientes.numero is 'Número sequencial do processo';
comment on column public.expedientes.segredo_justica is 'Indica se o processo está em segredo de justiça';
comment on column public.expedientes.codigo_status_processo is 'Código do status do processo (ex: DISTRIBUIDO)';
comment on column public.expedientes.prioridade_processual is 'Prioridade processual do processo';
comment on column public.expedientes.nome_parte_autora is 'Nome da parte autora';
comment on column public.expedientes.qtde_parte_autora is 'Quantidade de partes autoras';
comment on column public.expedientes.nome_parte_re is 'Nome da parte ré';
comment on column public.expedientes.qtde_parte_re is 'Quantidade de partes rés';
comment on column public.expedientes.data_autuacao is 'Data de autuação do processo';
comment on column public.expedientes.juizo_digital is 'Indica se o processo é de juízo digital';
comment on column public.expedientes.data_arquivamento is 'Data de arquivamento do processo';
comment on column public.expedientes.id_documento is 'ID do documento/expediente pendente';
comment on column public.expedientes.data_ciencia_parte is 'Data em que a parte tomou ciência do expediente';
comment on column public.expedientes.data_prazo_legal_parte is 'Data limite para manifestação da parte';
comment on column public.expedientes.data_criacao_expediente is 'Data de criação do expediente';
comment on column public.expedientes.prazo_vencido is 'Indica se o prazo para manifestação já venceu';
comment on column public.expedientes.sigla_orgao_julgador is 'Sigla do órgão julgador (ex: VT33RJ)';
comment on column public.expedientes.baixado_em is 'Data e hora em que o expediente foi baixado (marcado como respondido). Null indica que o expediente ainda está pendente';
comment on column public.expedientes.protocolo_id is 'ID do protocolo da peça protocolada em resposta ao expediente. Deve estar preenchido quando houve protocolo de peça';
comment on column public.expedientes.justificativa_baixa is 'Justificativa para baixa do expediente sem protocolo de peça. Deve estar preenchido quando não houve protocolo';
comment on column public.expedientes.observacoes is 'Anotações/observações internas do expediente pendente de manifestação';
comment on column public.expedientes.dados_anteriores is 'Armazena o estado anterior do registro antes da última atualização. Null quando o registro foi inserido ou quando não houve mudanças na última captura.';
comment on column public.expedientes.responsavel_id is 'Usuário responsável pelo processo pendente de manifestação. Pode ser atribuído, transferido ou desatribuído. Todas as alterações são registradas em logs_alteracao';

-- Índices para melhor performance
create index idx_expedientes_advogado_id on public.expedientes using btree (advogado_id);
create index idx_expedientes_processo_id on public.expedientes using btree (processo_id);
create index idx_expedientes_trt on public.expedientes using btree (trt);
create index idx_expedientes_grau on public.expedientes using btree (grau);
create index idx_expedientes_numero_processo on public.expedientes using btree (numero_processo);
create index idx_expedientes_id_pje on public.expedientes using btree (id_pje);
create index idx_expedientes_prazo_vencido on public.expedientes using btree (prazo_vencido);
create index idx_expedientes_data_prazo_legal on public.expedientes using btree (data_prazo_legal_parte);
create index idx_expedientes_advogado_trt_grau on public.expedientes using btree (advogado_id, trt, grau);
create index idx_expedientes_numero_processo_advogado on public.expedientes using btree (numero_processo, advogado_id);
create index idx_expedientes_baixado_em on public.expedientes using btree (baixado_em) where baixado_em is not null;
create index idx_expedientes_advogado_baixado on public.expedientes using btree (advogado_id, baixado_em) where baixado_em is null;
create index idx_expedientes_responsavel_id on public.expedientes using btree (responsavel_id);

-- Trigger para atualizar updated_at automaticamente
create trigger update_expedientes_updated_at
before update on public.expedientes
for each row
execute function public.update_updated_at_column();

-- Function para preencher processo_id baseado no numero_processo
create or replace function public.sync_expedientes_processo_id()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Buscar o processo_id na tabela acervo baseado no numero_processo, trt e grau
  -- Não usa advogado_id porque a unicidade do processo não inclui advogado_id
  if new.processo_id is null and new.numero_processo is not null then
    select acervo.id
    into new.processo_id
    from public.acervo
    where acervo.numero_processo = new.numero_processo
      and acervo.trt = new.trt
      and acervo.grau = new.grau
    limit 1;
  end if;

  return new;
end;
$$;
comment on function public.sync_expedientes_processo_id() is 'Preenche automaticamente processo_id em expedientes baseado no numero_processo';

-- Trigger para preencher processo_id antes de inserir ou atualizar
create trigger sync_expedientes_processo_id_trigger
before insert or update on public.expedientes
for each row
when (new.processo_id is null)
execute function public.sync_expedientes_processo_id();

-- Função para registrar baixa nos logs
create or replace function public.registrar_baixa_expediente(
  p_expediente_id bigint,
  p_usuario_id bigint,
  p_protocolo_id text default null,
  p_justificativa text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.logs_alteracao (
    tipo_entidade,
    entidade_id,
    tipo_evento,
    usuario_que_executou_id,
    dados_evento
  ) values (
    'expedientes',
    p_expediente_id,
    'baixa_expediente',
    p_usuario_id,
    jsonb_build_object(
      'protocolo_id', p_protocolo_id,
      'justificativa_baixa', p_justificativa,
      'baixado_em', now()
    )
  );
end;
$$;

comment on function public.registrar_baixa_expediente is 'Registra a baixa de um expediente nos logs de alteração';

-- Função para registrar reversão nos logs
create or replace function public.registrar_reversao_baixa_expediente(
  p_expediente_id bigint,
  p_usuario_id bigint,
  p_protocolo_id_anterior text default null,
  p_justificativa_anterior text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.logs_alteracao (
    tipo_entidade,
    entidade_id,
    tipo_evento,
    usuario_que_executou_id,
    dados_evento
  ) values (
    'expedientes',
    p_expediente_id,
    'reversao_baixa_expediente',
    p_usuario_id,
    jsonb_build_object(
      'protocolo_id_anterior', p_protocolo_id_anterior,
      'justificativa_anterior', p_justificativa_anterior,
      'revertido_em', now()
    )
  );
end;
$$;

comment on function public.registrar_reversao_baixa_expediente is 'Registra a reversão da baixa de um expediente nos logs de alteração';

-- Habilitar RLS
alter table public.expedientes enable row level security;

