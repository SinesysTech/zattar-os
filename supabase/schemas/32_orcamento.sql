-- ============================================================================
-- Schema: Orçamento
-- Sistema de Gestão Financeira (SGF)
-- ============================================================================
-- Gestão orçamentária com planejamento por conta contábil e centro de custo.
-- Permite comparação entre orçado e realizado.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabela: orcamentos
-- ----------------------------------------------------------------------------
-- Orçamentos anuais/mensais do escritório. Define período e status do
-- planejamento orçamentário.

create table public.orcamentos (
  id bigint generated always as identity primary key,

  -- Identificação
  nome text not null,
  descricao text,

  -- Período
  ano integer not null,
  periodo public.periodo_orcamento not null,
  data_inicio date not null,
  data_fim date not null,

  -- Status
  status public.status_orcamento not null default 'rascunho',

  -- Informações adicionais
  observacoes text,

  -- Auditoria
  created_by bigint references public.usuarios(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- Constraints
  constraint orcamentos_ano_valido check (ano >= 2020),
  constraint orcamentos_periodo_valido check (data_fim > data_inicio)
);

-- Comentário da tabela
comment on table public.orcamentos is 'Orçamentos do escritório. Define o planejamento financeiro para um período específico. O status controla o ciclo de vida: rascunho (elaboração) -> aprovado (validado) -> em_execucao (período corrente) -> encerrado (período finalizado). Cada orçamento tem itens detalhados por conta contábil e centro de custo.';

-- Comentários das colunas
comment on column public.orcamentos.id is 'Identificador único do orçamento';
comment on column public.orcamentos.nome is 'Nome do orçamento (ex: Orçamento 2025, Orçamento 1º Semestre 2025)';
comment on column public.orcamentos.descricao is 'Descrição detalhada do orçamento';
comment on column public.orcamentos.ano is 'Ano de referência do orçamento';
comment on column public.orcamentos.periodo is 'Período do orçamento: mensal, trimestral, semestral ou anual';
comment on column public.orcamentos.data_inicio is 'Data de início do período orçado';
comment on column public.orcamentos.data_fim is 'Data de fim do período orçado';
comment on column public.orcamentos.status is 'Status do orçamento: rascunho, aprovado, em_execucao ou encerrado';
comment on column public.orcamentos.observacoes is 'Observações adicionais sobre o orçamento';
comment on column public.orcamentos.created_by is 'Usuário que criou o registro';
comment on column public.orcamentos.created_at is 'Data e hora de criação do registro';
comment on column public.orcamentos.updated_at is 'Data e hora da última atualização';

-- ----------------------------------------------------------------------------
-- Índices para orcamentos
-- ----------------------------------------------------------------------------

create index idx_orcamentos_ano on public.orcamentos (ano);
comment on index public.idx_orcamentos_ano is 'Índice para buscar orçamentos por ano';

create index idx_orcamentos_periodo on public.orcamentos (periodo);
comment on index public.idx_orcamentos_periodo is 'Índice para filtrar orçamentos por tipo de período';

create index idx_orcamentos_status on public.orcamentos (status);
comment on index public.idx_orcamentos_status is 'Índice para filtrar orçamentos por status';

-- ----------------------------------------------------------------------------
-- Trigger: Atualizar updated_at automaticamente
-- ----------------------------------------------------------------------------

create trigger update_orcamentos_updated_at
  before update on public.orcamentos
  for each row
  execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Tabela: orcamento_itens
-- ----------------------------------------------------------------------------
-- Itens do orçamento detalhados por conta contábil e centro de custo.
-- Permite orçamento mensal ou total do período.

create table public.orcamento_itens (
  id bigint generated always as identity primary key,

  -- Vinculação
  orcamento_id bigint not null references public.orcamentos(id) on delete cascade,
  conta_contabil_id bigint not null references public.plano_contas(id),
  centro_custo_id bigint references public.centros_custo(id),

  -- Período específico (opcional)
  mes integer,

  -- Valor
  valor_orcado numeric(15,2) not null,

  -- Informações adicionais
  observacoes text,

  -- Auditoria
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- Constraints
  constraint orcamento_itens_mes_valido check (mes is null or (mes between 1 and 12)),
  constraint orcamento_itens_valor_valido check (valor_orcado >= 0),
  constraint orcamento_itens_unique unique (orcamento_id, conta_contabil_id, centro_custo_id, mes)
);

-- Comentário da tabela
comment on table public.orcamento_itens is 'Itens detalhados do orçamento. Cada item representa o valor orçado para uma combinação de conta contábil e centro de custo. O campo mês permite orçamento mensal (quando preenchido) ou total do período (quando NULL).';

-- Comentários das colunas
comment on column public.orcamento_itens.id is 'Identificador único do item';
comment on column public.orcamento_itens.orcamento_id is 'Orçamento ao qual o item pertence';
comment on column public.orcamento_itens.conta_contabil_id is 'Conta contábil do plano de contas';
comment on column public.orcamento_itens.centro_custo_id is 'Centro de custo (opcional, NULL para todos os centros)';
comment on column public.orcamento_itens.mes is 'Mês específico (1-12). NULL para orçamento total do período.';
comment on column public.orcamento_itens.valor_orcado is 'Valor orçado para a combinação conta/centro/mês';
comment on column public.orcamento_itens.observacoes is 'Observações sobre o item orçado';
comment on column public.orcamento_itens.created_at is 'Data e hora de criação do registro';
comment on column public.orcamento_itens.updated_at is 'Data e hora da última atualização';

-- ----------------------------------------------------------------------------
-- Índices para orcamento_itens
-- ----------------------------------------------------------------------------

create index idx_orcamento_itens_orcamento on public.orcamento_itens (orcamento_id);
comment on index public.idx_orcamento_itens_orcamento is 'Índice para listar itens de um orçamento';

create index idx_orcamento_itens_conta on public.orcamento_itens (conta_contabil_id);
comment on index public.idx_orcamento_itens_conta is 'Índice para buscar orçamento de uma conta contábil';

create index idx_orcamento_itens_centro on public.orcamento_itens (centro_custo_id);
comment on index public.idx_orcamento_itens_centro is 'Índice para buscar orçamento de um centro de custo';

create index idx_orcamento_itens_mes on public.orcamento_itens (mes);
comment on index public.idx_orcamento_itens_mes is 'Índice para filtrar orçamento por mês';

-- ----------------------------------------------------------------------------
-- Trigger: Atualizar updated_at automaticamente
-- ----------------------------------------------------------------------------

create trigger update_orcamento_itens_updated_at
  before update on public.orcamento_itens
  for each row
  execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------

-- RLS para orcamentos
alter table public.orcamentos enable row level security;

create policy "Service role tem acesso total aos orçamentos"
  on public.orcamentos
  for all
  to service_role
  using (true)
  with check (true);

create policy "Usuários autenticados podem visualizar orçamentos"
  on public.orcamentos
  for select
  to authenticated
  using (true);

create policy "Usuários autenticados podem inserir orçamentos"
  on public.orcamentos
  for insert
  to authenticated
  with check (true);

create policy "Usuários autenticados podem atualizar orçamentos"
  on public.orcamentos
  for update
  to authenticated
  using (true)
  with check (true);

-- RLS para orcamento_itens
alter table public.orcamento_itens enable row level security;

create policy "Service role tem acesso total aos itens de orçamento"
  on public.orcamento_itens
  for all
  to service_role
  using (true)
  with check (true);

create policy "Usuários autenticados podem visualizar itens de orçamento"
  on public.orcamento_itens
  for select
  to authenticated
  using (true);

create policy "Usuários autenticados podem inserir itens de orçamento"
  on public.orcamento_itens
  for insert
  to authenticated
  with check (true);

create policy "Usuários autenticados podem atualizar itens de orçamento"
  on public.orcamento_itens
  for update
  to authenticated
  using (true)
  with check (true);
