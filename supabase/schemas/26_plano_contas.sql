-- ============================================================================
-- Schema: Plano de Contas
-- Sistema de Gestão Financeira (SGF)
-- ============================================================================
-- Estrutura hierárquica de contas contábeis para classificação de receitas,
-- despesas, ativos e passivos do escritório.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabela: plano_contas
-- ----------------------------------------------------------------------------
-- Plano de contas contábil com estrutura hierárquica. Contas sintéticas agrupam
-- outras contas, enquanto contas analíticas recebem lançamentos diretos.

create table public.plano_contas (
  id bigint generated always as identity primary key,

  -- Identificação da conta
  codigo text not null,
  nome text not null,
  descricao text,

  -- Classificação contábil
  tipo_conta public.tipo_conta_contabil not null,
  natureza public.natureza_conta not null,
  nivel public.nivel_conta not null,

  -- Hierarquia
  conta_pai_id bigint references public.plano_contas(id) on delete restrict,

  -- Configurações
  aceita_lancamento boolean not null default false,
  ordem_exibicao integer,
  ativo boolean not null default true,

  -- Auditoria
  created_by bigint references public.usuarios(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- Constraints
  constraint plano_contas_codigo_unique unique (codigo),
  constraint plano_contas_nivel_aceita_lancamento_check check (
    (nivel = 'analitica' and aceita_lancamento = true) or
    (nivel = 'sintetica' and aceita_lancamento = false)
  ),
  constraint plano_contas_sem_auto_referencia_check check (conta_pai_id != id)
);

-- Comentário da tabela
comment on table public.plano_contas is 'Plano de contas contábil hierárquico. Contas sintéticas agrupam outras contas para fins de totalização em relatórios. Contas analíticas recebem lançamentos financeiros diretos. Segue estrutura padrão de contabilidade: Ativo, Passivo, Receita, Despesa e Patrimônio Líquido.';

-- Comentários das colunas
comment on column public.plano_contas.id is 'Identificador único da conta contábil';
comment on column public.plano_contas.codigo is 'Código hierárquico da conta (ex: 1.1.01, 3.2.05). Formato livre, mas recomenda-se usar pontos como separadores de níveis.';
comment on column public.plano_contas.nome is 'Nome descritivo da conta (ex: Caixa e Bancos, Honorários Advocatícios)';
comment on column public.plano_contas.descricao is 'Descrição detalhada do propósito e uso da conta';
comment on column public.plano_contas.tipo_conta is 'Tipo da conta: ativo (bens e direitos), passivo (obrigações), receita, despesa ou patrimonio_liquido';
comment on column public.plano_contas.natureza is 'Natureza contábil: devedora (aumenta com débito) ou credora (aumenta com crédito)';
comment on column public.plano_contas.nivel is 'Nível da conta: sintetica (agrupa outras contas) ou analitica (recebe lançamentos)';
comment on column public.plano_contas.conta_pai_id is 'Referência à conta pai na hierarquia. NULL para contas de primeiro nível.';
comment on column public.plano_contas.aceita_lancamento is 'Se true, a conta pode receber lançamentos financeiros. Apenas contas analíticas aceitam lançamentos.';
comment on column public.plano_contas.ordem_exibicao is 'Ordem de exibição em relatórios e listagens. Menor número aparece primeiro.';
comment on column public.plano_contas.ativo is 'Se false, a conta não aparece em seleções e não pode receber novos lançamentos';
comment on column public.plano_contas.created_by is 'Usuário que criou o registro';
comment on column public.plano_contas.created_at is 'Data e hora de criação do registro';
comment on column public.plano_contas.updated_at is 'Data e hora da última atualização';

-- ----------------------------------------------------------------------------
-- Índices
-- ----------------------------------------------------------------------------

create index idx_plano_contas_codigo on public.plano_contas (codigo);
comment on index public.idx_plano_contas_codigo is 'Índice para busca rápida por código da conta';

create index idx_plano_contas_tipo_conta on public.plano_contas (tipo_conta);
comment on index public.idx_plano_contas_tipo_conta is 'Índice para filtrar contas por tipo (ativo, passivo, receita, etc.)';

create index idx_plano_contas_conta_pai on public.plano_contas (conta_pai_id);
comment on index public.idx_plano_contas_conta_pai is 'Índice para navegação hierárquica (buscar filhos de uma conta pai)';

create index idx_plano_contas_ativo on public.plano_contas (ativo);
comment on index public.idx_plano_contas_ativo is 'Índice para filtrar apenas contas ativas';

create index idx_plano_contas_aceita_lancamento on public.plano_contas (aceita_lancamento) where aceita_lancamento = true;
comment on index public.idx_plano_contas_aceita_lancamento is 'Índice parcial para listar apenas contas que aceitam lançamentos (analíticas)';

-- ----------------------------------------------------------------------------
-- Trigger: Atualizar updated_at automaticamente
-- ----------------------------------------------------------------------------

create trigger update_plano_contas_updated_at
  before update on public.plano_contas
  for each row
  execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Function: validar_hierarquia_plano_contas
-- ----------------------------------------------------------------------------
-- Valida que a atribuição de conta_pai_id não cria ciclos na hierarquia.
-- Um ciclo ocorre quando um ancestral é definido como filho de um descendente.

create or replace function public.validar_hierarquia_plano_contas()
returns trigger
language plpgsql
security invoker
as $$
declare
  v_ancestral_id bigint;
begin
  -- Se não há conta pai, não há risco de ciclo
  if new.conta_pai_id is null then
    return new;
  end if;

  -- Verifica se o novo pai é descendente do registro atual (o que criaria um ciclo)
  -- Percorre a hierarquia a partir do novo pai até encontrar o registro atual ou chegar à raiz
  with recursive ancestrais as (
    -- Começa com o novo pai proposto
    select id, conta_pai_id, 1 as nivel
    from public.plano_contas
    where id = new.conta_pai_id

    union all

    -- Sobe na hierarquia
    select p.id, p.conta_pai_id, a.nivel + 1
    from public.plano_contas p
    join ancestrais a on p.id = a.conta_pai_id
    where a.nivel < 100 -- Limite de segurança para evitar loops infinitos
  )
  select id into v_ancestral_id
  from ancestrais
  where id = new.id
  limit 1;

  -- Se encontrou o registro atual na cadeia de ancestrais, temos um ciclo
  if v_ancestral_id is not null then
    raise exception 'Operação criaria ciclo na hierarquia do plano de contas. A conta "%" (ID %) não pode ter como pai a conta ID % pois isso criaria uma referência circular.',
      new.nome, new.id, new.conta_pai_id;
  end if;

  return new;
end;
$$;

comment on function public.validar_hierarquia_plano_contas() is 'Trigger function que valida a hierarquia do plano de contas para evitar ciclos. Um ciclo ocorre quando uma conta é definida como filha de um de seus próprios descendentes, criando uma referência circular infinita.';

-- Trigger para validar hierarquia antes de inserir/atualizar
create trigger trigger_validar_hierarquia_plano_contas
  before insert or update of conta_pai_id on public.plano_contas
  for each row
  when (new.conta_pai_id is not null)
  execute function public.validar_hierarquia_plano_contas();

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------

alter table public.plano_contas enable row level security;

-- Política para service role (acesso total)
create policy "Service role tem acesso total ao plano de contas"
  on public.plano_contas
  for all
  to service_role
  using (true)
  with check (true);

-- Política para usuários autenticados (somente leitura)
create policy "Usuários autenticados podem visualizar plano de contas"
  on public.plano_contas
  for select
  to authenticated
  using (true);

-- Política para inserção por usuários autenticados (opcional - pode ser restrito via permissões)
create policy "Usuários autenticados podem inserir no plano de contas"
  on public.plano_contas
  for insert
  to authenticated
  with check (true);

-- Política para atualização por usuários autenticados
create policy "Usuários autenticados podem atualizar plano de contas"
  on public.plano_contas
  for update
  to authenticated
  using (true)
  with check (true);
