-- ============================================================================
-- Schema: Salários e Folha de Pagamento
-- Sistema de Gestão Financeira (SGF)
-- ============================================================================
-- Gestão de salários fixos mensais e folhas de pagamento do escritório.
-- Integra-se com lançamentos financeiros para controle de despesas.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabela: salarios
-- ----------------------------------------------------------------------------
-- Salários fixos mensais dos usuários (funcionários). Mantém histórico de
-- alterações salariais através da vigência.

create table public.salarios (
  id bigint generated always as identity primary key,

  -- Funcionário
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  cargo_id bigint references public.cargos(id),

  -- Valor
  salario_bruto numeric(15,2) not null,

  -- Vigência
  data_inicio_vigencia date not null,
  data_fim_vigencia date,

  -- Informações adicionais
  observacoes text,

  -- Status
  ativo boolean not null default true,

  -- Auditoria
  created_by bigint references public.usuarios(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- Constraints
  constraint salarios_valor_positivo check (salario_bruto > 0),
  constraint salarios_vigencia_valida check (
    data_fim_vigencia is null or data_fim_vigencia > data_inicio_vigencia
  ),
  constraint salarios_usuario_data_inicio_unique unique (usuario_id, data_inicio_vigencia)
);

-- Comentário da tabela
comment on table public.salarios is 'Salários fixos mensais dos funcionários do escritório. Mantém histórico de alterações salariais através do campo de vigência. Um funcionário pode ter múltiplos registros, mas apenas um ativo por período.';

-- Comentários das colunas
comment on column public.salarios.id is 'Identificador único do registro de salário';
comment on column public.salarios.usuario_id is 'Funcionário titular do salário';
comment on column public.salarios.cargo_id is 'Cargo associado ao salário (opcional)';
comment on column public.salarios.salario_bruto is 'Valor bruto do salário mensal';
comment on column public.salarios.data_inicio_vigencia is 'Data de início da vigência deste salário';
comment on column public.salarios.data_fim_vigencia is 'Data de fim da vigência. NULL indica salário atual/vigente.';
comment on column public.salarios.observacoes is 'Observações sobre o salário (motivo de alteração, etc.)';
comment on column public.salarios.ativo is 'Se false, o registro está inativo';
comment on column public.salarios.created_by is 'Usuário que criou o registro';
comment on column public.salarios.created_at is 'Data e hora de criação do registro';
comment on column public.salarios.updated_at is 'Data e hora da última atualização';

-- ----------------------------------------------------------------------------
-- Índices para salarios
-- ----------------------------------------------------------------------------

create index idx_salarios_usuario on public.salarios (usuario_id);
comment on index public.idx_salarios_usuario is 'Índice para listar salários de um funcionário';

create index idx_salarios_cargo on public.salarios (cargo_id);
comment on index public.idx_salarios_cargo is 'Índice para listar salários por cargo';

create index idx_salarios_vigencia on public.salarios (data_inicio_vigencia, data_fim_vigencia);
comment on index public.idx_salarios_vigencia is 'Índice para buscar salário vigente em determinada data';

create index idx_salarios_ativo on public.salarios (ativo);
comment on index public.idx_salarios_ativo is 'Índice para filtrar salários ativos';

-- ----------------------------------------------------------------------------
-- Trigger: Atualizar updated_at automaticamente
-- ----------------------------------------------------------------------------

create trigger update_salarios_updated_at
  before update on public.salarios
  for each row
  execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Tabela: folhas_pagamento
-- ----------------------------------------------------------------------------
-- Folhas de pagamento mensais consolidadas. Agrupa os pagamentos de todos
-- os funcionários em um período.

create table public.folhas_pagamento (
  id bigint generated always as identity primary key,

  -- Período de referência
  mes_referencia integer not null,
  ano_referencia integer not null,

  -- Datas
  data_geracao timestamp with time zone not null default now(),
  data_pagamento date,

  -- Totais
  valor_total numeric(15,2) not null default 0,

  -- Status
  status text not null default 'rascunho',

  -- Informações adicionais
  observacoes text,

  -- Auditoria
  created_by bigint references public.usuarios(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- Constraints
  constraint folhas_pagamento_mes_valido check (mes_referencia between 1 and 12),
  constraint folhas_pagamento_ano_valido check (ano_referencia >= 2020),
  constraint folhas_pagamento_status_valido check (
    status in ('rascunho', 'aprovada', 'paga', 'cancelada')
  ),
  constraint folhas_pagamento_valor_valido check (valor_total >= 0),
  constraint folhas_pagamento_periodo_unique unique (mes_referencia, ano_referencia)
);

-- Comentário da tabela
comment on table public.folhas_pagamento is 'Folhas de pagamento mensais do escritório. Consolida os pagamentos de todos os funcionários em um período. O status controla o fluxo: rascunho -> aprovada -> paga. Ao aprovar, lançamentos financeiros são gerados automaticamente.';

-- Comentários das colunas
comment on column public.folhas_pagamento.id is 'Identificador único da folha de pagamento';
comment on column public.folhas_pagamento.mes_referencia is 'Mês de referência (1 a 12)';
comment on column public.folhas_pagamento.ano_referencia is 'Ano de referência (>= 2020)';
comment on column public.folhas_pagamento.data_geracao is 'Data e hora em que a folha foi gerada';
comment on column public.folhas_pagamento.data_pagamento is 'Data prevista ou realizada do pagamento';
comment on column public.folhas_pagamento.valor_total is 'Soma de todos os itens da folha';
comment on column public.folhas_pagamento.status is 'Status da folha: rascunho, aprovada, paga ou cancelada';
comment on column public.folhas_pagamento.observacoes is 'Observações adicionais sobre a folha';
comment on column public.folhas_pagamento.created_by is 'Usuário que criou o registro';
comment on column public.folhas_pagamento.created_at is 'Data e hora de criação do registro';
comment on column public.folhas_pagamento.updated_at is 'Data e hora da última atualização';

-- ----------------------------------------------------------------------------
-- Índices para folhas_pagamento
-- ----------------------------------------------------------------------------

create index idx_folhas_pagamento_referencia on public.folhas_pagamento (ano_referencia, mes_referencia);
comment on index public.idx_folhas_pagamento_referencia is 'Índice para buscar folha por período de referência';

create index idx_folhas_pagamento_status on public.folhas_pagamento (status);
comment on index public.idx_folhas_pagamento_status is 'Índice para filtrar folhas por status';

-- ----------------------------------------------------------------------------
-- Trigger: Atualizar updated_at automaticamente
-- ----------------------------------------------------------------------------

create trigger update_folhas_pagamento_updated_at
  before update on public.folhas_pagamento
  for each row
  execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Tabela: itens_folha_pagamento
-- ----------------------------------------------------------------------------
-- Itens individuais da folha de pagamento. Um registro por funcionário
-- por folha.

create table public.itens_folha_pagamento (
  id bigint generated always as identity primary key,

  -- Vinculação
  folha_pagamento_id bigint not null references public.folhas_pagamento(id) on delete cascade,
  usuario_id bigint not null references public.usuarios(id),
  salario_id bigint not null references public.salarios(id),

  -- Valores
  valor_bruto numeric(15,2) not null,

  -- Lançamento gerado
  lancamento_financeiro_id bigint references public.lancamentos_financeiros(id),

  -- Informações adicionais
  observacoes text,

  -- Auditoria
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- Constraints
  constraint itens_folha_valor_positivo check (valor_bruto > 0),
  constraint itens_folha_usuario_unique unique (folha_pagamento_id, usuario_id)
);

-- Comentário da tabela
comment on table public.itens_folha_pagamento is 'Itens individuais da folha de pagamento. Cada registro representa o pagamento de um funcionário em uma folha específica. Vincula o salário vigente usado e o lançamento financeiro gerado após aprovação.';

-- Comentários das colunas
comment on column public.itens_folha_pagamento.id is 'Identificador único do item';
comment on column public.itens_folha_pagamento.folha_pagamento_id is 'Folha de pagamento à qual pertence o item';
comment on column public.itens_folha_pagamento.usuario_id is 'Funcionário que receberá o pagamento';
comment on column public.itens_folha_pagamento.salario_id is 'Salário vigente usado como base para o cálculo';
comment on column public.itens_folha_pagamento.valor_bruto is 'Valor bruto a pagar ao funcionário';
comment on column public.itens_folha_pagamento.lancamento_financeiro_id is 'Lançamento financeiro gerado quando a folha é aprovada. NULL enquanto em rascunho.';
comment on column public.itens_folha_pagamento.observacoes is 'Observações específicas deste item';
comment on column public.itens_folha_pagamento.created_at is 'Data e hora de criação do registro';
comment on column public.itens_folha_pagamento.updated_at is 'Data e hora da última atualização';

-- ----------------------------------------------------------------------------
-- Índices para itens_folha_pagamento
-- ----------------------------------------------------------------------------

create index idx_itens_folha_folha on public.itens_folha_pagamento (folha_pagamento_id);
comment on index public.idx_itens_folha_folha is 'Índice para listar itens de uma folha';

create index idx_itens_folha_usuario on public.itens_folha_pagamento (usuario_id);
comment on index public.idx_itens_folha_usuario is 'Índice para listar pagamentos de um funcionário';

create index idx_itens_folha_lancamento on public.itens_folha_pagamento (lancamento_financeiro_id);
comment on index public.idx_itens_folha_lancamento is 'Índice para buscar item pelo lançamento gerado';

-- ----------------------------------------------------------------------------
-- Trigger: Atualizar updated_at automaticamente
-- ----------------------------------------------------------------------------

create trigger update_itens_folha_pagamento_updated_at
  before update on public.itens_folha_pagamento
  for each row
  execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------

-- RLS para salarios
alter table public.salarios enable row level security;

create policy "Service role tem acesso total aos salários"
  on public.salarios
  for all
  to service_role
  using (true)
  with check (true);

-- Usuário pode ver apenas seu próprio salário
-- Nota: Usa subquery para mapear auth.uid() (uuid) para usuarios.id (bigint) via auth_user_id
create policy "Usuário pode visualizar próprio salário"
  on public.salarios
  for select
  to authenticated
  using (usuario_id in (select id from public.usuarios where auth_user_id = (select auth.uid())));

-- RLS para folhas_pagamento
alter table public.folhas_pagamento enable row level security;

create policy "Service role tem acesso total às folhas de pagamento"
  on public.folhas_pagamento
  for all
  to service_role
  using (true)
  with check (true);

create policy "Usuários autenticados podem visualizar folhas de pagamento"
  on public.folhas_pagamento
  for select
  to authenticated
  using (true);

-- RLS para itens_folha_pagamento
alter table public.itens_folha_pagamento enable row level security;

create policy "Service role tem acesso total aos itens da folha"
  on public.itens_folha_pagamento
  for all
  to service_role
  using (true)
  with check (true);

-- Usuário pode ver apenas seu próprio item na folha
-- Nota: Usa subquery para mapear auth.uid() (uuid) para usuarios.id (bigint) via auth_user_id
create policy "Usuário pode visualizar próprio item da folha"
  on public.itens_folha_pagamento
  for select
  to authenticated
  using (usuario_id in (select id from public.usuarios where auth_user_id = (select auth.uid())));
