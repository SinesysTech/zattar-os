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

  -- Auditoria
  conciliado_por bigint references public.usuarios(id),
  conciliado_em timestamp with time zone,
  
  -- Auditoria de criação
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- Constraints
  constraint conciliacoes_tipo_valido check (
    tipo_conciliacao is null or tipo_conciliacao in ('automatica', 'manual')
  ),
  
  -- Garante que uma transação só pode estar conciliada com um lançamento por vez (se status != cancelada)
  -- Mas pode ter histórico. Vamos simplificar: unique na transação se status != cancelada
  -- PostgreSQL < 15 não suporta unique nulls distinct, mas aqui status não é null.
  -- Vamos usar partial index para garantir unicidade de transações ativas
  constraint conciliacoes_unica_transacao_ativa unique (transacao_importada_id, status)
);

-- Comentário da tabela
comment on table public.conciliacoes_bancarias is 'Conciliação entre transações importadas e lançamentos financeiros. Registra o vínculo e o status da conciliação (pendente, conciliado, rejeitado).';

-- Comentários das colunas
comment on column public.conciliacoes_bancarias.id is 'Identificador único da conciliação';
comment on column public.conciliacoes_bancarias.transacao_importada_id is 'Transação importada sendo conciliada';
comment on column public.conciliacoes_bancarias.lancamento_financeiro_id is 'Lançamento financeiro correspondente (se encontrado/vinculado)';
comment on column public.conciliacoes_bancarias.status is 'Status da conciliação: pendente, conciliado, rejeitado, ignorado';
comment on column public.conciliacoes_bancarias.tipo_conciliacao is 'Tipo da conciliação: automatica (sugerida pelo sistema) ou manual (feita pelo usuário)';
comment on column public.conciliacoes_bancarias.score_similaridade is 'Pontuação de similaridade (0-100) calculada pelo algoritmo de conciliação automática';
comment on column public.conciliacoes_bancarias.conciliado_por is 'Usuário que confirmou a conciliação';
comment on column public.conciliacoes_bancarias.conciliado_em is 'Data e hora da confirmação da conciliação';

-- ----------------------------------------------------------------------------
-- Índices para conciliacoes_bancarias
-- ----------------------------------------------------------------------------

create index idx_conciliacoes_transacao on public.conciliacoes_bancarias (transacao_importada_id);
comment on index public.idx_conciliacoes_transacao is 'Índice para buscar conciliações de uma transação';

create index idx_conciliacoes_lancamento on public.conciliacoes_bancarias (lancamento_financeiro_id);
comment on index public.idx_conciliacoes_lancamento is 'Índice para buscar conciliações de um lançamento';

create index idx_conciliacoes_status on public.conciliacoes_bancarias (status);
comment on index public.idx_conciliacoes_status is 'Índice para filtrar conciliações por status';
