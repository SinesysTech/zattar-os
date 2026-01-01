-- ============================================================================
-- Tabela: especialidades_pericia
-- Especialidades de perícia disponíveis no PJE
-- ============================================================================

create table public.especialidades_pericia (
  id bigint generated always as identity primary key,
  id_pje bigint not null,
  trt public.codigo_tribunal not null,
  grau public.grau_tribunal not null,
  descricao text not null,
  ativo boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  -- Garantir unicidade por ID do PJE, TRT e grau
  unique (id_pje, trt, grau)
);

comment on table public.especialidades_pericia is 'Especialidades de perícia disponíveis no PJE (ex: Insalubridade, Medicina do Trabalho, Psiquiatria)';
comment on column public.especialidades_pericia.id_pje is 'ID da especialidade no sistema PJE';
comment on column public.especialidades_pericia.trt is 'Código do TRT onde a especialidade está cadastrada';
comment on column public.especialidades_pericia.grau is 'Grau do processo (primeiro_grau ou segundo_grau)';
comment on column public.especialidades_pericia.descricao is 'Descrição da especialidade (ex: Perícia de Insalubridade, Medicina do Trabalho)';
comment on column public.especialidades_pericia.ativo is 'Indica se a especialidade está ativa no sistema';

-- Índices
create index idx_especialidades_pericia_id_pje on public.especialidades_pericia using btree (id_pje);
create index idx_especialidades_pericia_trt on public.especialidades_pericia using btree (trt);
create index idx_especialidades_pericia_grau on public.especialidades_pericia using btree (grau);
create index idx_especialidades_pericia_trt_grau on public.especialidades_pericia using btree (trt, grau);
create index idx_especialidades_pericia_descricao on public.especialidades_pericia using btree (descricao);

-- Trigger para atualizar updated_at
create trigger update_especialidades_pericia_updated_at
before update on public.especialidades_pericia
for each row
execute function public.update_updated_at_column();

-- RLS
alter table public.especialidades_pericia enable row level security;

-- ============================================================================
-- Tabela: pericias
-- Perícias designadas nos processos
-- ============================================================================

create table public.pericias (
  id bigint generated always as identity primary key,
  id_pje bigint not null,
  advogado_id bigint not null references public.advogados(id) on delete cascade,
  processo_id bigint not null references public.acervo(id) on delete cascade,
  orgao_julgador_id bigint references public.orgao_julgador(id) on delete set null,
  trt public.codigo_tribunal not null,
  grau public.grau_tribunal not null,
  numero_processo text not null,
  
  -- Datas
  prazo_entrega timestamptz,
  data_aceite timestamptz,
  data_criacao timestamptz not null,
  
  -- Situação
  situacao_codigo public.situacao_pericia not null,
  situacao_descricao text,
  situacao_pericia text,  -- Versão em maiúsculas da descrição (ex: FINALIZADA)
  
  -- Laudo
  id_documento_laudo bigint,
  laudo_juntado boolean not null default false,
  
  -- Especialidade e Perito
  especialidade_id bigint references public.especialidades_pericia(id) on delete set null,
  perito_id bigint references public.terceiros(id) on delete set null,
  
  -- Processo
  classe_judicial_sigla text,
  data_proxima_audiencia timestamptz,
  segredo_justica boolean not null default false,
  juizo_digital boolean not null default false,
  arquivado boolean not null default false,
  prioridade_processual boolean not null default false,
  
  -- Permissões (armazenadas como JSONB)
  permissoes_pericia jsonb,
  
  -- Editor
  funcionalidade_editor text,
  
  -- Controle
  responsavel_id bigint references public.usuarios(id) on delete set null,
  observacoes text,
  dados_anteriores jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  -- Garantir unicidade da perícia
  unique (id_pje, trt, grau, numero_processo)
);

comment on table public.pericias is 'Perícias designadas nos processos capturados do PJE. A unicidade é garantida por (id_pje, trt, grau, numero_processo), permitindo que múltiplos advogados vejam a mesma perícia sem duplicação';
comment on column public.pericias.id_pje is 'ID da perícia no sistema PJE';
comment on column public.pericias.advogado_id is 'Referência ao advogado que capturou a perícia (não faz parte da unicidade)';
comment on column public.pericias.processo_id is 'Referência ao processo na tabela acervo';
comment on column public.pericias.orgao_julgador_id is 'Referência ao órgão julgador da perícia';
comment on column public.pericias.trt is 'Código do TRT onde a perícia está designada';
comment on column public.pericias.grau is 'Grau do processo (primeiro_grau ou segundo_grau)';
comment on column public.pericias.numero_processo is 'Número do processo no formato CNJ';
comment on column public.pericias.prazo_entrega is 'Prazo para entrega do laudo pericial';
comment on column public.pericias.data_aceite is 'Data em que o perito aceitou a perícia';
comment on column public.pericias.data_criacao is 'Data de criação da perícia no PJE';
comment on column public.pericias.situacao_codigo is 'Código da situação (S, L, C, F, P, R)';
comment on column public.pericias.situacao_descricao is 'Descrição da situação (ex: Finalizada, Cancelada)';
comment on column public.pericias.situacao_pericia is 'Situação em maiúsculas (ex: FINALIZADA, CANCELADA)';
comment on column public.pericias.id_documento_laudo is 'ID do documento do laudo pericial no PJE';
comment on column public.pericias.laudo_juntado is 'Indica se o laudo foi juntado aos autos';
comment on column public.pericias.especialidade_id is 'FK para especialidades_pericia';
comment on column public.pericias.perito_id is 'FK para terceiros (tipo_parte=PERITO)';
comment on column public.pericias.classe_judicial_sigla is 'Sigla da classe judicial do processo (ex: ATOrd, ATSum)';
comment on column public.pericias.data_proxima_audiencia is 'Data da próxima audiência do processo';
comment on column public.pericias.segredo_justica is 'Indica se o processo está em segredo de justiça';
comment on column public.pericias.juizo_digital is 'Indica se o processo está em juízo digital';
comment on column public.pericias.arquivado is 'Indica se o processo está arquivado';
comment on column public.pericias.prioridade_processual is 'Indica se o processo tem prioridade processual';
comment on column public.pericias.permissoes_pericia is 'Objeto JSON com permissões da perícia (permitidoPeticionar, permitidoJuntarLaudo, etc)';
comment on column public.pericias.funcionalidade_editor is 'Código da funcionalidade do editor (ex: Z)';
comment on column public.pericias.responsavel_id is 'Usuário responsável pela perícia. Pode ser atribuído, transferido ou desatribuído';
comment on column public.pericias.observacoes is 'Observações sobre a perícia';
comment on column public.pericias.dados_anteriores is 'Armazena o estado anterior do registro antes da última atualização';

-- Índices para melhor performance
create index idx_pericias_advogado_id on public.pericias using btree (advogado_id);
create index idx_pericias_processo_id on public.pericias using btree (processo_id);
create index idx_pericias_orgao_julgador_id on public.pericias using btree (orgao_julgador_id);
create index idx_pericias_trt on public.pericias using btree (trt);
create index idx_pericias_grau on public.pericias using btree (grau);
create index idx_pericias_id_pje on public.pericias using btree (id_pje);
create index idx_pericias_numero_processo on public.pericias using btree (numero_processo);
create index idx_pericias_situacao_codigo on public.pericias using btree (situacao_codigo);
create index idx_pericias_prazo_entrega on public.pericias using btree (prazo_entrega);
create index idx_pericias_data_criacao on public.pericias using btree (data_criacao);
create index idx_pericias_responsavel_id on public.pericias using btree (responsavel_id);
create index idx_pericias_especialidade_id on public.pericias using btree (especialidade_id);
create index idx_pericias_perito_id on public.pericias using btree (perito_id);
create index idx_pericias_laudo_juntado on public.pericias using btree (laudo_juntado);
create index idx_pericias_advogado_trt_grau on public.pericias using btree (advogado_id, trt, grau);
create index idx_pericias_processo_data on public.pericias using btree (processo_id, data_criacao);

-- Trigger para atualizar updated_at automaticamente
create trigger update_pericias_updated_at
before update on public.pericias
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.pericias enable row level security;

