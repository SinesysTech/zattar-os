-- ============================================================================
-- Schema: Importação e Conciliação Bancária
-- Sistema de Gestão Financeira (SGF)
-- ============================================================================
-- Importação de extratos bancários (OFX/CSV) e conciliação automática/manual
-- com lançamentos financeiros do sistema.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabela: transacoes_bancarias_importadas
-- ----------------------------------------------------------------------------
-- Transações importadas de extratos bancários. Armazena os dados originais
-- do extrato para auditoria e permite detecção de duplicatas via hash.

create table public.transacoes_bancarias_importadas (
  id bigint generated always as identity primary key,

  -- Conta bancária
  conta_bancaria_id bigint not null references public.contas_bancarias(id),

  -- Dados da transação
  data_transacao date not null,
  data_importacao timestamp with time zone not null default now(),
  descricao text not null,
  valor numeric(15,2) not null,
  tipo_transacao text,

  -- Informações adicionais
  documento text,
  saldo_extrato numeric(15,2),

  -- Dados originais e controle
  dados_originais jsonb not null,
  hash_transacao text,
  arquivo_importacao text,

  -- Auditoria
  created_by bigint references public.usuarios(id),
  created_at timestamp with time zone not null default now(),

  -- Constraints
  constraint transacoes_importadas_tipo_valido check (
    tipo_transacao is null or tipo_transacao in ('credito', 'debito')
  )
);

-- Comentário da tabela
comment on table public.transacoes_bancarias_importadas is 'Transações importadas de extratos bancários (OFX, CSV). Armazena os dados originais do extrato para auditoria. O hash_transacao permite detectar e evitar importação de duplicatas. Cada transação pode ser conciliada com lançamentos financeiros do sistema.';

-- Comentários das colunas
comment on column public.transacoes_bancarias_importadas.id is 'Identificador único da transação importada';
comment on column public.transacoes_bancarias_importadas.conta_bancaria_id is 'Conta bancária de origem do extrato';
comment on column public.transacoes_bancarias_importadas.data_transacao is 'Data da transação no extrato bancário';
comment on column public.transacoes_bancarias_importadas.data_importacao is 'Data e hora em que o extrato foi importado no sistema';
comment on column public.transacoes_bancarias_importadas.descricao is 'Descrição da transação conforme consta no extrato';
comment on column public.transacoes_bancarias_importadas.valor is 'Valor da transa‡Æo em valor absoluto; sentido (credito/debito) indicado por tipo_transacao.';
comment on column public.transacoes_bancarias_importadas.tipo_transacao is 'Tipo da transação: credito (entrada) ou debito (saída)';
comment on column public.transacoes_bancarias_importadas.documento is 'Número do documento/cheque conforme extrato';
comment on column public.transacoes_bancarias_importadas.saldo_extrato is 'Saldo após a transação, se disponível no extrato';
comment on column public.transacoes_bancarias_importadas.dados_originais is 'Dados completos da transação conforme arquivo importado (para auditoria)';
comment on column public.transacoes_bancarias_importadas.hash_transacao is 'Hash calculado para detectar transações duplicadas (conta+data+valor+descrição)';
comment on column public.transacoes_bancarias_importadas.arquivo_importacao is 'Path ou nome do arquivo de extrato importado';
comment on column public.transacoes_bancarias_importadas.created_by is 'Usuário que realizou a importação';
comment on column public.transacoes_bancarias_importadas.created_at is 'Data e hora de criação do registro';

-- ----------------------------------------------------------------------------
-- Índices para transacoes_bancarias_importadas
-- ----------------------------------------------------------------------------

create index idx_transacoes_importadas_conta on public.transacoes_bancarias_importadas (conta_bancaria_id);
comment on index public.idx_transacoes_importadas_conta is 'Índice para listar transações de uma conta bancária';

create index idx_transacoes_importadas_data on public.transacoes_bancarias_importadas (data_transacao);
comment on index public.idx_transacoes_importadas_data is 'Índice para filtrar transações por data';

create index idx_transacoes_importadas_hash on public.transacoes_bancarias_importadas (hash_transacao);
comment on index public.idx_transacoes_importadas_hash is 'Índice para detectar duplicatas via hash';

create index idx_transacoes_importadas_dados on public.transacoes_bancarias_importadas using gin (dados_originais);
comment on index public.idx_transacoes_importadas_dados is 'Índice GIN para busca em dados originais JSON';

-- ----------------------------------------------------------------------------
-- Tabela: conciliacoes_bancarias
-- ----------------------------------------------------------------------------
-- Conciliação entre transações importadas e lançamentos financeiros do sistema.
-- Suporta conciliação automática (por similaridade) e manual.

create table public.conciliacoes_bancarias (
  id bigint generated always as identity primary key,

  -- Vinculação
  transacao_importada_id bigint not null references public.transacoes_bancarias_importadas(id) on delete cascade,
  lancamento_financeiro_id bigint references public.lancamentos_financeiros(id) on delete set null,

  -- Status e tipo
  status public.status_conciliacao not null default 'pendente',
  tipo_conciliacao text,

  -- Score de similaridade (para conciliação automática)
  score_similaridade numeric(5,2),

  -- Informações adicionais
  observacoes text,
  dados_adicionais jsonb,

  -- Quem conciliou
  conciliado_por bigint references public.usuarios(id),
  data_conciliacao timestamp with time zone,

  -- Auditoria
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- Constraints
  constraint conciliacoes_transacao_unique unique (transacao_importada_id),
  constraint conciliacoes_tipo_valido check (
    tipo_conciliacao is null or tipo_conciliacao in ('automatica', 'manual')
  ),
  constraint conciliacoes_status_lancamento check (
    (status = 'conciliado' and lancamento_financeiro_id is not null and data_conciliacao is not null) or
    (status != 'conciliado')
  ),
  constraint conciliacoes_score_valido check (
    score_similaridade is null or (score_similaridade >= 0 and score_similaridade <= 100)
  )
);

-- Comentário da tabela
comment on table public.conciliacoes_bancarias is 'Conciliação entre transações importadas de extratos e lançamentos financeiros do sistema. Permite conciliação automática (baseada em similaridade de valores, datas e descrições) ou manual. Cada transação importada pode ter no máximo uma conciliação.';

-- Comentários das colunas
comment on column public.conciliacoes_bancarias.id is 'Identificador único da conciliação';
comment on column public.conciliacoes_bancarias.transacao_importada_id is 'Transação importada do extrato bancário';
comment on column public.conciliacoes_bancarias.lancamento_financeiro_id is 'Lançamento financeiro correspondente no sistema. NULL se não conciliado.';
comment on column public.conciliacoes_bancarias.status is 'Status da conciliação: pendente, conciliado, divergente ou ignorado';
comment on column public.conciliacoes_bancarias.tipo_conciliacao is 'Tipo de conciliação: automatica (sugestão do sistema) ou manual (usuário)';
comment on column public.conciliacoes_bancarias.score_similaridade is 'Score de similaridade (0-100) calculado para conciliação automática';
comment on column public.conciliacoes_bancarias.observacoes is 'Observações sobre a conciliação (motivo de divergência, etc.)';
comment on column public.conciliacoes_bancarias.dados_adicionais is 'Dados adicionais da conciliacao (ex.: sugestoes salvas para revisao)';
comment on column public.conciliacoes_bancarias.conciliado_por is 'Usuário que realizou a conciliação manual';
comment on column public.conciliacoes_bancarias.data_conciliacao is 'Data e hora em que a conciliação foi realizada';
comment on column public.conciliacoes_bancarias.created_at is 'Data e hora de criação do registro';
comment on column public.conciliacoes_bancarias.updated_at is 'Data e hora da última atualização';

-- ----------------------------------------------------------------------------
-- Índices para conciliacoes_bancarias
-- ----------------------------------------------------------------------------

create index idx_conciliacoes_transacao on public.conciliacoes_bancarias (transacao_importada_id);
comment on index public.idx_conciliacoes_transacao is 'Índice para buscar conciliação de uma transação';

create index idx_conciliacoes_lancamento on public.conciliacoes_bancarias (lancamento_financeiro_id);
comment on index public.idx_conciliacoes_lancamento is 'Índice para buscar conciliação de um lançamento';

create index idx_conciliacoes_status on public.conciliacoes_bancarias (status);
comment on index public.idx_conciliacoes_status is 'Índice para filtrar conciliações por status';

-- ----------------------------------------------------------------------------
-- Trigger: Atualizar updated_at automaticamente
-- ----------------------------------------------------------------------------

create trigger update_conciliacoes_bancarias_updated_at
  before update on public.conciliacoes_bancarias
  for each row
  execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------

-- RLS para transacoes_bancarias_importadas
alter table public.transacoes_bancarias_importadas enable row level security;

create policy "Service role tem acesso total às transações importadas"
  on public.transacoes_bancarias_importadas
  for all
  to service_role
  using (true)
  with check (true);

create policy "Usuários autenticados podem visualizar transações importadas"
  on public.transacoes_bancarias_importadas
  for select
  to authenticated
  using (true);

create policy "Usuários autenticados podem inserir transações importadas"
  on public.transacoes_bancarias_importadas
  for insert
  to authenticated
  with check (true);

-- RLS para conciliacoes_bancarias
alter table public.conciliacoes_bancarias enable row level security;

create policy "Service role tem acesso total às conciliações"
  on public.conciliacoes_bancarias
  for all
  to service_role
  using (true)
  with check (true);

create policy "Usuários autenticados podem visualizar conciliações"
  on public.conciliacoes_bancarias
  for select
  to authenticated
  using (true);

create policy "Usuários autenticados podem inserir conciliações"
  on public.conciliacoes_bancarias
  for insert
  to authenticated
  with check (true);

create policy "Usuários autenticados podem atualizar conciliações"
  on public.conciliacoes_bancarias
  for update
  to authenticated
  using (true)
  with check (true);
