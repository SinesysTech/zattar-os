-- ============================================================================
-- Schema: Centros de Custo
-- Sistema de Gestão Financeira (SGF)
-- ============================================================================
-- Centros de custo para rastreamento de despesas e receitas por departamento,
-- projeto ou área do escritório.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabela: centros_custo
-- ----------------------------------------------------------------------------
-- Centros de custo com estrutura hierárquica opcional. Permitem acompanhar
-- gastos e receitas por área do escritório (Administrativo, Judicial, etc.).

create table public.centros_custo (
  id bigint generated always as identity primary key,

  -- Identificação
  codigo text not null,
  nome text not null,
  descricao text,

  -- Hierarquia
  centro_pai_id bigint references public.centros_custo(id) on delete restrict,

  -- Responsável
  responsavel_id bigint references public.usuarios(id),

  -- Status
  ativo boolean not null default true,

  -- Auditoria
  created_by bigint references public.usuarios(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- Constraints
  constraint centros_custo_codigo_unique unique (codigo),
  constraint centros_custo_sem_auto_referencia_check check (centro_pai_id != id)
);

-- Comentário da tabela
comment on table public.centros_custo is 'Centros de custo para rastreamento financeiro por departamento ou área. Permitem análise de gastos e receitas segmentada por unidade de negócio, projeto ou setor do escritório. Estrutura hierárquica opcional.';

-- Comentários das colunas
comment on column public.centros_custo.id is 'Identificador único do centro de custo';
comment on column public.centros_custo.codigo is 'Código único do centro de custo (ex: ADM, JUD, MKT). Recomenda-se usar siglas curtas e padronizadas.';
comment on column public.centros_custo.nome is 'Nome descritivo do centro de custo (ex: Administrativo, Judicial, Marketing)';
comment on column public.centros_custo.descricao is 'Descrição detalhada do propósito e escopo do centro de custo';
comment on column public.centros_custo.centro_pai_id is 'Referência ao centro de custo pai na hierarquia. NULL para centros de primeiro nível.';
comment on column public.centros_custo.responsavel_id is 'Usuário responsável pelo controle orçamentário do centro de custo';
comment on column public.centros_custo.ativo is 'Se false, o centro de custo não aparece em seleções e não pode receber novos lançamentos';
comment on column public.centros_custo.created_by is 'Usuário que criou o registro';
comment on column public.centros_custo.created_at is 'Data e hora de criação do registro';
comment on column public.centros_custo.updated_at is 'Data e hora da última atualização';

-- ----------------------------------------------------------------------------
-- Índices
-- ----------------------------------------------------------------------------

create index idx_centros_custo_codigo on public.centros_custo (codigo);
comment on index public.idx_centros_custo_codigo is 'Índice para busca rápida por código do centro de custo';

create index idx_centros_custo_responsavel on public.centros_custo (responsavel_id);
comment on index public.idx_centros_custo_responsavel is 'Índice para listar centros de custo por responsável';

create index idx_centros_custo_ativo on public.centros_custo (ativo);
comment on index public.idx_centros_custo_ativo is 'Índice para filtrar apenas centros de custo ativos';

create index idx_centros_custo_pai on public.centros_custo (centro_pai_id);
comment on index public.idx_centros_custo_pai is 'Índice para navegação hierárquica (buscar filhos de um centro pai)';

-- ----------------------------------------------------------------------------
-- Trigger: Atualizar updated_at automaticamente
-- ----------------------------------------------------------------------------

create trigger update_centros_custo_updated_at
  before update on public.centros_custo
  for each row
  execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------

alter table public.centros_custo enable row level security;

-- Política para service role (acesso total)
create policy "Service role tem acesso total aos centros de custo"
  on public.centros_custo
  for all
  to service_role
  using (true)
  with check (true);

-- Política para usuários autenticados (somente leitura)
create policy "Usuários autenticados podem visualizar centros de custo"
  on public.centros_custo
  for select
  to authenticated
  using (true);

-- Política para inserção por usuários autenticados
create policy "Usuários autenticados podem inserir centros de custo"
  on public.centros_custo
  for insert
  to authenticated
  with check (true);

-- Política para atualização por usuários autenticados
create policy "Usuários autenticados podem atualizar centros de custo"
  on public.centros_custo
  for update
  to authenticated
  using (true)
  with check (true);
