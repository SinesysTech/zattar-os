-- ============================================================================
-- Schema: Lançamentos Financeiros
-- Sistema de Gestão Financeira (SGF)
-- ============================================================================
-- Lançamentos financeiros (receitas, despesas, transferências) com integração
-- a clientes, contratos, acordos judiciais e outras entidades do sistema.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabela: lancamentos_financeiros
-- ----------------------------------------------------------------------------
-- Lançamentos financeiros do escritório. Podem ser manuais, originados de
-- acordos judiciais, folha de pagamento, importação bancária ou recorrentes.
-- Suporta transferências entre contas com lançamento de contrapartida.

create table public.lancamentos_financeiros (
  id bigint generated always as identity primary key,

  -- Tipo e identificação
  tipo public.tipo_lancamento not null,
  descricao text not null,
  valor numeric(15,2) not null,

  -- Datas
  data_lancamento date not null,
  data_competencia date not null,
  data_vencimento date,
  data_efetivacao timestamp with time zone,

  -- Status e origem
  status public.status_lancamento not null default 'pendente',
  origem public.origem_lancamento not null,
  forma_pagamento public.forma_pagamento_financeiro,

  -- Contas e classificação
  conta_bancaria_id bigint references public.contas_bancarias(id),
  conta_contabil_id bigint not null references public.plano_contas(id),
  centro_custo_id bigint references public.centros_custo(id),

  -- Categorização adicional
  categoria text,
  documento text,
  observacoes text,

  -- Dados flexíveis
  anexos jsonb default '[]'::jsonb,
  dados_adicionais jsonb default '{}'::jsonb,

  -- Relacionamentos com outras entidades
  cliente_id bigint references public.clientes(id),
  contrato_id bigint references public.contratos(id),
  acordo_condenacao_id bigint references public.acordos_condenacoes(id),
  parcela_id bigint references public.parcelas(id),
  usuario_id bigint references public.usuarios(id),

  -- Transferências (quando tipo = 'transferencia')
  conta_destino_id bigint references public.contas_bancarias(id),
  lancamento_contrapartida_id bigint references public.lancamentos_financeiros(id),

  -- Recorrência
  recorrente boolean not null default false,
  frequencia_recorrencia text,
  lancamento_origem_id bigint references public.lancamentos_financeiros(id),

  -- Auditoria
  created_by bigint references public.usuarios(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- Constraints
  constraint lancamentos_valor_positivo check (valor > 0),
  constraint lancamentos_transferencia_destino check (
    (tipo = 'transferencia' and conta_destino_id is not null) or
    (tipo != 'transferencia')
  ),
  constraint lancamentos_confirmado_efetivado check (
    (status = 'confirmado' and data_efetivacao is not null) or
    (status != 'confirmado')
  ),
  constraint lancamentos_frequencia_valida check (
    frequencia_recorrencia is null or
    frequencia_recorrencia in ('mensal', 'trimestral', 'semestral', 'anual')
  )
);

-- Comentário da tabela
comment on table public.lancamentos_financeiros is 'Lançamentos financeiros do escritório. Registra todas as movimentações: receitas, despesas, transferências entre contas, aplicações e resgates. Integra-se com acordos judiciais, contratos, folha de pagamento e importação bancária. Suporta lançamentos recorrentes com geração automática.';

-- Comentários das colunas
comment on column public.lancamentos_financeiros.id is 'Identificador único do lançamento';
comment on column public.lancamentos_financeiros.tipo is 'Tipo do lançamento: receita, despesa, transferencia, aplicacao ou resgate';
comment on column public.lancamentos_financeiros.descricao is 'Descrição do lançamento (ex: Honorários processo 0001234-56.2024, Aluguel Jan/2025)';
comment on column public.lancamentos_financeiros.valor is 'Valor do lançamento. Sempre positivo; o tipo indica se é entrada ou saída.';
comment on column public.lancamentos_financeiros.data_lancamento is 'Data em que o lançamento foi registrado no sistema';
comment on column public.lancamentos_financeiros.data_competencia is 'Data de competência contábil. Usada para DRE e relatórios gerenciais.';
comment on column public.lancamentos_financeiros.data_vencimento is 'Data de vencimento para contas a pagar/receber. NULL para lançamentos à vista.';
comment on column public.lancamentos_financeiros.data_efetivacao is 'Data e hora em que o pagamento/recebimento foi efetivado. Preenchido quando status = confirmado.';
comment on column public.lancamentos_financeiros.status is 'Status do lançamento: pendente, confirmado, cancelado ou estornado';
comment on column public.lancamentos_financeiros.origem is 'Origem do lançamento: manual, acordo_judicial, contrato, folha_pagamento, importacao_bancaria ou recorrente';
comment on column public.lancamentos_financeiros.forma_pagamento is 'Forma de pagamento/recebimento: dinheiro, pix, boleto, transferência, etc.';
comment on column public.lancamentos_financeiros.conta_bancaria_id is 'Conta bancária de origem (para saídas) ou destino (para entradas)';
comment on column public.lancamentos_financeiros.conta_contabil_id is 'Conta do plano de contas. Deve ser uma conta analítica que aceita lançamentos.';
comment on column public.lancamentos_financeiros.centro_custo_id is 'Centro de custo para rastreamento departamental';
comment on column public.lancamentos_financeiros.categoria is 'Categoria adicional para classificação (ex: Aluguel, Salários, Custas Processuais)';
comment on column public.lancamentos_financeiros.documento is 'Número do documento fiscal ou comprovante (nota fiscal, recibo, etc.)';
comment on column public.lancamentos_financeiros.observacoes is 'Observações adicionais sobre o lançamento';
comment on column public.lancamentos_financeiros.anexos is 'Array JSON com paths de arquivos anexados (comprovantes, notas fiscais)';
comment on column public.lancamentos_financeiros.dados_adicionais is 'Dados extras em formato JSON (número da parcela, informações de importação, etc.)';
comment on column public.lancamentos_financeiros.cliente_id is 'Cliente relacionado ao lançamento (quando aplicável)';
comment on column public.lancamentos_financeiros.contrato_id is 'Contrato relacionado ao lançamento (quando aplicável)';
comment on column public.lancamentos_financeiros.acordo_condenacao_id is 'Acordo/condenação que originou o lançamento (quando origem = acordo_judicial)';
comment on column public.lancamentos_financeiros.parcela_id is 'Parcela específica do acordo que originou o lançamento';
comment on column public.lancamentos_financeiros.usuario_id is 'Usuário relacionado (ex: funcionário em lançamento de salário)';
comment on column public.lancamentos_financeiros.conta_destino_id is 'Conta de destino para transferências entre contas';
comment on column public.lancamentos_financeiros.lancamento_contrapartida_id is 'Lançamento espelho criado automaticamente em transferências';
comment on column public.lancamentos_financeiros.recorrente is 'Se true, o lançamento é base para geração automática de recorrentes';
comment on column public.lancamentos_financeiros.frequencia_recorrencia is 'Frequência de geração: mensal, trimestral, semestral ou anual';
comment on column public.lancamentos_financeiros.lancamento_origem_id is 'Lançamento que originou este (quando gerado automaticamente de recorrente)';
comment on column public.lancamentos_financeiros.created_by is 'Usuário que criou o registro';
comment on column public.lancamentos_financeiros.created_at is 'Data e hora de criação do registro';
comment on column public.lancamentos_financeiros.updated_at is 'Data e hora da última atualização';

-- ----------------------------------------------------------------------------
-- Índices
-- ----------------------------------------------------------------------------

create index idx_lancamentos_tipo on public.lancamentos_financeiros (tipo);
comment on index public.idx_lancamentos_tipo is 'Índice para filtrar lançamentos por tipo';

create index idx_lancamentos_status on public.lancamentos_financeiros (status);
comment on index public.idx_lancamentos_status is 'Índice para filtrar lançamentos por status';

create index idx_lancamentos_origem on public.lancamentos_financeiros (origem);
comment on index public.idx_lancamentos_origem is 'Índice para filtrar lançamentos por origem';

create index idx_lancamentos_data_lancamento on public.lancamentos_financeiros (data_lancamento);
comment on index public.idx_lancamentos_data_lancamento is 'Índice para buscar lançamentos por data de registro';

create index idx_lancamentos_data_competencia on public.lancamentos_financeiros (data_competencia);
comment on index public.idx_lancamentos_data_competencia is 'Índice para relatórios por competência (DRE, balancetes)';

create index idx_lancamentos_data_vencimento on public.lancamentos_financeiros (data_vencimento);
comment on index public.idx_lancamentos_data_vencimento is 'Índice para controle de contas a pagar/receber por vencimento';

create index idx_lancamentos_conta_bancaria on public.lancamentos_financeiros (conta_bancaria_id);
comment on index public.idx_lancamentos_conta_bancaria is 'Índice para listar movimentações de uma conta bancária';

create index idx_lancamentos_conta_contabil on public.lancamentos_financeiros (conta_contabil_id);
comment on index public.idx_lancamentos_conta_contabil is 'Índice para relatórios por conta contábil';

create index idx_lancamentos_centro_custo on public.lancamentos_financeiros (centro_custo_id);
comment on index public.idx_lancamentos_centro_custo is 'Índice para relatórios por centro de custo';

create index idx_lancamentos_cliente on public.lancamentos_financeiros (cliente_id);
comment on index public.idx_lancamentos_cliente is 'Índice para listar lançamentos de um cliente';

create index idx_lancamentos_contrato on public.lancamentos_financeiros (contrato_id);
comment on index public.idx_lancamentos_contrato is 'Índice para listar lançamentos de um contrato';

create index idx_lancamentos_acordo on public.lancamentos_financeiros (acordo_condenacao_id);
comment on index public.idx_lancamentos_acordo is 'Índice para listar lançamentos de um acordo/condenação';

create index idx_lancamentos_parcela on public.lancamentos_financeiros (parcela_id);
comment on index public.idx_lancamentos_parcela is 'Índice para buscar lançamento de uma parcela específica';

create index idx_lancamentos_recorrente on public.lancamentos_financeiros (recorrente) where recorrente = true;
comment on index public.idx_lancamentos_recorrente is 'Índice parcial para listar apenas lançamentos recorrentes';

create index idx_lancamentos_anexos on public.lancamentos_financeiros using gin (anexos);
comment on index public.idx_lancamentos_anexos is 'Índice GIN para busca em anexos JSON';

create index idx_lancamentos_dados_adicionais on public.lancamentos_financeiros using gin (dados_adicionais);
comment on index public.idx_lancamentos_dados_adicionais is 'Índice GIN para busca em dados adicionais JSON';

-- ----------------------------------------------------------------------------
-- Trigger: Atualizar updated_at automaticamente
-- ----------------------------------------------------------------------------

create trigger update_lancamentos_financeiros_updated_at
  before update on public.lancamentos_financeiros
  for each row
  execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------

alter table public.lancamentos_financeiros enable row level security;

-- Política para service role (acesso total)
create policy "Service role tem acesso total aos lançamentos financeiros"
  on public.lancamentos_financeiros
  for all
  to service_role
  using (true)
  with check (true);

-- Política para usuários autenticados (somente leitura)
create policy "Usuários autenticados podem visualizar lançamentos"
  on public.lancamentos_financeiros
  for select
  to authenticated
  using (true);

-- Política para inserção por usuários autenticados
create policy "Usuários autenticados podem inserir lançamentos"
  on public.lancamentos_financeiros
  for insert
  to authenticated
  with check (true);

-- Política para atualização por usuários autenticados
create policy "Usuários autenticados podem atualizar lançamentos"
  on public.lancamentos_financeiros
  for update
  to authenticated
  using (true)
  with check (true);
