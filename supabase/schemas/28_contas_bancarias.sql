-- ============================================================================
-- Schema: Contas Bancárias
-- Sistema de Gestão Financeira (SGF)
-- ============================================================================
-- Cadastro de contas bancárias e caixas do escritório para controle de saldos
-- e movimentações financeiras.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabela: contas_bancarias
-- ----------------------------------------------------------------------------
-- Contas bancárias (corrente, poupança, investimento) e caixas físicos do
-- escritório. O saldo_atual é atualizado automaticamente via trigger quando
-- lançamentos são confirmados.

create table public.contas_bancarias (
  id bigint generated always as identity primary key,

  -- Identificação
  nome text not null,
  tipo public.tipo_conta_bancaria not null,

  -- Dados bancários
  banco_codigo text,
  banco_nome text,
  agencia text,
  numero_conta text,
  digito_conta text,
  pix_chave text,

  -- Saldos
  saldo_inicial numeric(15,2) not null default 0,
  saldo_atual numeric(15,2) not null default 0,
  data_saldo_inicial date not null,

  -- Vinculação contábil
  conta_contabil_id bigint references public.plano_contas(id),

  -- Informações adicionais
  observacoes text,

  -- Status
  status public.status_conta_bancaria not null default 'ativa',
  ativo boolean not null default true,

  -- Auditoria
  created_by bigint references public.usuarios(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Comentário da tabela
comment on table public.contas_bancarias is 'Contas bancárias e caixas do escritório. Inclui contas correntes, poupanças, investimentos e caixas físicos. O saldo_atual é atualizado automaticamente quando lançamentos são confirmados. Pode ser vinculada a uma conta do plano de contas para integração contábil.';

-- Comentários das colunas
comment on column public.contas_bancarias.id is 'Identificador único da conta bancária';
comment on column public.contas_bancarias.nome is 'Nome identificador da conta (ex: Banco do Brasil - CC 12345-6, Caixa Principal)';
comment on column public.contas_bancarias.tipo is 'Tipo da conta: corrente, poupanca, investimento ou caixa (dinheiro em espécie)';
comment on column public.contas_bancarias.banco_codigo is 'Código COMPE/ISPB do banco (ex: 001 para Banco do Brasil, 341 para Itaú)';
comment on column public.contas_bancarias.banco_nome is 'Nome do banco (ex: Banco do Brasil, Itaú Unibanco)';
comment on column public.contas_bancarias.agencia is 'Número da agência sem dígito verificador';
comment on column public.contas_bancarias.numero_conta is 'Número da conta sem dígito verificador';
comment on column public.contas_bancarias.digito_conta is 'Dígito verificador da conta';
comment on column public.contas_bancarias.pix_chave is 'Chave PIX cadastrada para esta conta (CPF, CNPJ, e-mail, telefone ou aleatória)';
comment on column public.contas_bancarias.saldo_inicial is 'Saldo inicial da conta na data de cadastro. Base para cálculo do saldo atual.';
comment on column public.contas_bancarias.saldo_atual is 'Saldo atual da conta. Atualizado automaticamente por trigger ao confirmar lançamentos.';
comment on column public.contas_bancarias.data_saldo_inicial is 'Data de referência do saldo inicial. Lançamentos anteriores a esta data não são considerados.';
comment on column public.contas_bancarias.conta_contabil_id is 'Conta do plano de contas vinculada. Permite integração com contabilidade.';
comment on column public.contas_bancarias.observacoes is 'Observações adicionais sobre a conta';
comment on column public.contas_bancarias.status is 'Status da conta: ativa, inativa ou encerrada';
comment on column public.contas_bancarias.ativo is 'Se false, a conta não aparece em seleções para novos lançamentos';
comment on column public.contas_bancarias.created_by is 'Usuário que criou o registro';
comment on column public.contas_bancarias.created_at is 'Data e hora de criação do registro';
comment on column public.contas_bancarias.updated_at is 'Data e hora da última atualização';

-- ----------------------------------------------------------------------------
-- Índices
-- ----------------------------------------------------------------------------

create index idx_contas_bancarias_tipo on public.contas_bancarias (tipo);
comment on index public.idx_contas_bancarias_tipo is 'Índice para filtrar contas por tipo (corrente, poupança, etc.)';

create index idx_contas_bancarias_status on public.contas_bancarias (status);
comment on index public.idx_contas_bancarias_status is 'Índice para filtrar contas por status';

create index idx_contas_bancarias_ativo on public.contas_bancarias (ativo);
comment on index public.idx_contas_bancarias_ativo is 'Índice para filtrar apenas contas ativas';

create index idx_contas_bancarias_conta_contabil on public.contas_bancarias (conta_contabil_id);
comment on index public.idx_contas_bancarias_conta_contabil is 'Índice para buscar conta bancária por conta contábil vinculada';

-- ----------------------------------------------------------------------------
-- Trigger: Atualizar updated_at automaticamente
-- ----------------------------------------------------------------------------

create trigger update_contas_bancarias_updated_at
  before update on public.contas_bancarias
  for each row
  execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------

alter table public.contas_bancarias enable row level security;

-- Política para service role (acesso total)
create policy "Service role tem acesso total às contas bancárias"
  on public.contas_bancarias
  for all
  to service_role
  using (true)
  with check (true);

-- Política para usuários autenticados (somente leitura)
create policy "Usuários autenticados podem visualizar contas bancárias"
  on public.contas_bancarias
  for select
  to authenticated
  using (true);

-- Política para inserção por usuários autenticados
create policy "Usuários autenticados podem inserir contas bancárias"
  on public.contas_bancarias
  for insert
  to authenticated
  with check (true);

-- Política para atualização por usuários autenticados
create policy "Usuários autenticados podem atualizar contas bancárias"
  on public.contas_bancarias
  for update
  to authenticated
  using (true)
  with check (true);
