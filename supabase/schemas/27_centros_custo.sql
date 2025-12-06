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
-- Function: validar_hierarquia_centros_custo
-- ----------------------------------------------------------------------------
-- Valida que a atribuição de centro_pai_id não cria ciclos na hierarquia.
-- Um ciclo ocorre quando um ancestral é definido como filho de um descendente.

create or replace function public.validar_hierarquia_centros_custo()
returns trigger
language plpgsql
security invoker
as $$
declare
  v_ancestral_id bigint;
begin
  -- Se não há centro pai, não há risco de ciclo
  if new.centro_pai_id is null then
    return new;
  end if;

  -- Verifica se o novo pai é descendente do registro atual (o que criaria um ciclo)
  -- Percorre a hierarquia a partir do novo pai até encontrar o registro atual ou chegar à raiz
  with recursive ancestrais as (
    -- Começa com o novo pai proposto
    select id, centro_pai_id, 1 as nivel
    from public.centros_custo
    where id = new.centro_pai_id

    union all

    -- Sobe na hierarquia
    select c.id, c.centro_pai_id, a.nivel + 1
    from public.centros_custo c
    join ancestrais a on c.id = a.centro_pai_id
    where a.nivel < 100 -- Limite de segurança para evitar loops infinitos
  )
  select id into v_ancestral_id
  from ancestrais
  where id = new.id
  limit 1;

  -- Se encontrou o registro atual na cadeia de ancestrais, temos um ciclo
  if v_ancestral_id is not null then
    raise exception 'Operação criaria ciclo na hierarquia de centros de custo. O centro "%" (ID %) não pode ter como pai o centro ID % pois isso criaria uma referência circular.',
      new.nome, new.id, new.centro_pai_id;
  end if;

  return new;
end;
$$;

comment on function public.validar_hierarquia_centros_custo() is 'Trigger function que valida a hierarquia de centros de custo para evitar ciclos. Um ciclo ocorre quando um centro é definido como filho de um de seus próprios descendentes, criando uma referência circular infinita.';

-- Trigger para validar hierarquia antes de inserir/atualizar
create trigger trigger_validar_hierarquia_centros_custo
  before insert or update of centro_pai_id on public.centros_custo
  for each row
  when (new.centro_pai_id is not null)
  execute function public.validar_hierarquia_centros_custo();

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
