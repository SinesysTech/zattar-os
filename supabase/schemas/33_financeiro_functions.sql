-- ============================================================================
-- Schema: Functions e Triggers Auxiliares
-- Sistema de Gestão Financeira (SGF)
-- ============================================================================
-- Funções e triggers para validações, cálculos automáticos e integrações
-- entre as tabelas do módulo financeiro.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: validar_conta_aceita_lancamento
-- ----------------------------------------------------------------------------
-- Valida se a conta contábil selecionada aceita lançamentos diretos.
-- Apenas contas analíticas podem receber lançamentos.

create or replace function public.validar_conta_aceita_lancamento()
returns trigger
language plpgsql
security invoker
as $$
declare
  v_aceita_lancamento boolean;
  v_nome_conta text;
begin
  -- Busca informações da conta contábil
  select aceita_lancamento, nome
  into v_aceita_lancamento, v_nome_conta
  from public.plano_contas
  where id = new.conta_contabil_id;

  -- Valida se a conta existe
  if not found then
    raise exception 'Conta contábil com ID % não encontrada.', new.conta_contabil_id;
  end if;

  -- Valida se a conta aceita lançamentos
  if not v_aceita_lancamento then
    raise exception 'A conta contábil "%" (ID %) é sintética e não aceita lançamentos diretos. Utilize uma conta analítica.',
      v_nome_conta, new.conta_contabil_id;
  end if;

  return new;
end;
$$;

comment on function public.validar_conta_aceita_lancamento() is 'Trigger function que valida se a conta contábil selecionada aceita lançamentos. Apenas contas analíticas (aceita_lancamento = true) podem receber lançamentos financeiros diretos.';

-- Trigger para validar conta antes de inserir/atualizar lançamento
create trigger trigger_validar_conta_aceita_lancamento
  before insert or update of conta_contabil_id on public.lancamentos_financeiros
  for each row
  execute function public.validar_conta_aceita_lancamento();

-- ----------------------------------------------------------------------------
-- Function: atualizar_saldo_conta_bancaria
-- ----------------------------------------------------------------------------
-- Atualiza o saldo atual da conta bancária quando um lançamento é confirmado,
-- cancelado ou estornado.

create or replace function public.atualizar_saldo_conta_bancaria()
returns trigger
language plpgsql
security invoker
as $$
declare
  v_diferenca numeric(15,2);
begin
  -- Ignora se não há conta bancária associada
  if new.conta_bancaria_id is null then
    return new;
  end if;

  -- Calcula a diferença de saldo baseada na mudança de status
  v_diferenca := 0;

  -- Lançamento sendo confirmado (de qualquer status para confirmado)
  if new.status = 'confirmado' and (old is null or old.status != 'confirmado') then
    case new.tipo
      when 'receita' then v_diferenca := new.valor;
      when 'despesa' then v_diferenca := -new.valor;
      when 'transferencia' then v_diferenca := -new.valor; -- Saída da conta origem
      when 'aplicacao' then v_diferenca := -new.valor; -- Saída para investimento
      when 'resgate' then v_diferenca := new.valor; -- Entrada de resgate
    end case;
  end if;

  -- Lançamento sendo cancelado ou estornado (de confirmado para outro status)
  if old is not null and old.status = 'confirmado' and new.status in ('cancelado', 'estornado') then
    case new.tipo
      when 'receita' then v_diferenca := -new.valor;
      when 'despesa' then v_diferenca := new.valor;
      when 'transferencia' then v_diferenca := new.valor;
      when 'aplicacao' then v_diferenca := new.valor;
      when 'resgate' then v_diferenca := -new.valor;
    end case;
  end if;

  -- Atualiza o saldo da conta bancária
  if v_diferenca != 0 then
    update public.contas_bancarias
    set saldo_atual = saldo_atual + v_diferenca
    where id = new.conta_bancaria_id;
  end if;

  return new;
end;
$$;

comment on function public.atualizar_saldo_conta_bancaria() is 'Trigger function que atualiza o saldo_atual da conta bancária quando o status do lançamento muda. Receitas aumentam o saldo, despesas diminuem. Transferências diminuem na conta origem.';

-- Trigger para atualizar saldo após mudança de status
create trigger trigger_atualizar_saldo_conta_bancaria
  after insert or update of status on public.lancamentos_financeiros
  for each row
  execute function public.atualizar_saldo_conta_bancaria();

-- ----------------------------------------------------------------------------
-- Function: atualizar_saldo_conta_destino_transferencia
-- ----------------------------------------------------------------------------
-- Atualiza o saldo da conta destino quando uma transferência é confirmada.

create or replace function public.atualizar_saldo_conta_destino_transferencia()
returns trigger
language plpgsql
security invoker
as $$
begin
  -- Ignora se não é transferência ou não tem conta destino
  if new.tipo != 'transferencia' or new.conta_destino_id is null then
    return new;
  end if;

  -- Transferência sendo confirmada
  if new.status = 'confirmado' and (old is null or old.status != 'confirmado') then
    update public.contas_bancarias
    set saldo_atual = saldo_atual + new.valor
    where id = new.conta_destino_id;
  end if;

  -- Transferência sendo cancelada ou estornada
  if old is not null and old.status = 'confirmado' and new.status in ('cancelado', 'estornado') then
    update public.contas_bancarias
    set saldo_atual = saldo_atual - new.valor
    where id = new.conta_destino_id;
  end if;

  return new;
end;
$$;

comment on function public.atualizar_saldo_conta_destino_transferencia() is 'Trigger function que atualiza o saldo da conta destino quando uma transferência é confirmada ou cancelada.';

-- Trigger para atualizar saldo da conta destino
create trigger trigger_atualizar_saldo_conta_destino
  after insert or update of status on public.lancamentos_financeiros
  for each row
  execute function public.atualizar_saldo_conta_destino_transferencia();

-- ----------------------------------------------------------------------------
-- Function: calcular_saldo_periodo
-- ----------------------------------------------------------------------------
-- Calcula o saldo de uma conta bancária em um período específico.

create or replace function public.calcular_saldo_periodo(
  p_conta_bancaria_id bigint,
  p_data_inicio date,
  p_data_fim date
)
returns table (
  saldo_inicial numeric(15,2),
  total_entradas numeric(15,2),
  total_saidas numeric(15,2),
  saldo_final numeric(15,2)
)
language plpgsql
security invoker
as $$
declare
  v_saldo_inicial_conta numeric(15,2);
  v_data_saldo_inicial date;
  v_entradas_antes numeric(15,2);
  v_saidas_antes numeric(15,2);
begin
  -- Busca dados da conta
  select saldo_inicial, data_saldo_inicial
  into v_saldo_inicial_conta, v_data_saldo_inicial
  from public.contas_bancarias
  where id = p_conta_bancaria_id;

  if not found then
    raise exception 'Conta bancária com ID % não encontrada.', p_conta_bancaria_id;
  end if;

  -- Calcula movimentações antes do período para obter saldo inicial
  select
    coalesce(sum(case when l.tipo in ('receita', 'resgate') then l.valor else 0 end), 0) +
    coalesce(sum(case when l.tipo = 'transferencia' and l.conta_destino_id = p_conta_bancaria_id then l.valor else 0 end), 0),
    coalesce(sum(case when l.tipo in ('despesa', 'aplicacao') then l.valor else 0 end), 0) +
    coalesce(sum(case when l.tipo = 'transferencia' and l.conta_bancaria_id = p_conta_bancaria_id then l.valor else 0 end), 0)
  into v_entradas_antes, v_saidas_antes
  from public.lancamentos_financeiros l
  where l.status = 'confirmado'
    and l.data_efetivacao::date < p_data_inicio
    and l.data_efetivacao::date >= v_data_saldo_inicial
    and (l.conta_bancaria_id = p_conta_bancaria_id or l.conta_destino_id = p_conta_bancaria_id);

  -- Saldo inicial do período
  saldo_inicial := v_saldo_inicial_conta + coalesce(v_entradas_antes, 0) - coalesce(v_saidas_antes, 0);

  -- Calcula movimentações do período
  select
    coalesce(sum(case when l.tipo in ('receita', 'resgate') then l.valor else 0 end), 0) +
    coalesce(sum(case when l.tipo = 'transferencia' and l.conta_destino_id = p_conta_bancaria_id then l.valor else 0 end), 0),
    coalesce(sum(case when l.tipo in ('despesa', 'aplicacao') then l.valor else 0 end), 0) +
    coalesce(sum(case when l.tipo = 'transferencia' and l.conta_bancaria_id = p_conta_bancaria_id then l.valor else 0 end), 0)
  into total_entradas, total_saidas
  from public.lancamentos_financeiros l
  where l.status = 'confirmado'
    and l.data_efetivacao::date between p_data_inicio and p_data_fim
    and (l.conta_bancaria_id = p_conta_bancaria_id or l.conta_destino_id = p_conta_bancaria_id);

  total_entradas := coalesce(total_entradas, 0);
  total_saidas := coalesce(total_saidas, 0);
  saldo_final := saldo_inicial + total_entradas - total_saidas;

  return next;
end;
$$;

comment on function public.calcular_saldo_periodo(bigint, date, date) is 'Calcula o saldo de uma conta bancária em um período específico, retornando saldo inicial, total de entradas, total de saídas e saldo final.';

-- ----------------------------------------------------------------------------
-- Function: obter_dre
-- ----------------------------------------------------------------------------
-- Gera Demonstração de Resultado do Exercício (DRE) para um período.

create or replace function public.obter_dre(
  p_data_inicio date,
  p_data_fim date
)
returns table (
  tipo_conta public.tipo_conta_contabil,
  conta_id bigint,
  conta_codigo text,
  conta_nome text,
  valor_total numeric(15,2)
)
language plpgsql
security invoker
as $$
begin
  return query
  select
    pc.tipo_conta,
    pc.id as conta_id,
    pc.codigo as conta_codigo,
    pc.nome as conta_nome,
    coalesce(sum(l.valor), 0) as valor_total
  from public.plano_contas pc
  left join public.lancamentos_financeiros l on
    l.conta_contabil_id = pc.id
    and l.status = 'confirmado'
    and l.data_competencia between p_data_inicio and p_data_fim
  where pc.tipo_conta in ('receita', 'despesa')
    and pc.aceita_lancamento = true
  group by pc.tipo_conta, pc.id, pc.codigo, pc.nome
  having coalesce(sum(l.valor), 0) > 0
  order by pc.tipo_conta, pc.codigo;
end;
$$;

comment on function public.obter_dre(date, date) is 'Gera Demonstração de Resultado do Exercício (DRE) para um período, agrupando receitas e despesas por conta contábil analítica.';

-- ----------------------------------------------------------------------------
-- Function: obter_salario_vigente
-- ----------------------------------------------------------------------------
-- Retorna o salário vigente de um usuário em uma data específica.

create or replace function public.obter_salario_vigente(
  p_usuario_id bigint,
  p_data date default current_date
)
returns public.salarios
language plpgsql
security invoker
as $$
declare
  v_salario public.salarios;
begin
  select *
  into v_salario
  from public.salarios
  where usuario_id = p_usuario_id
    and ativo = true
    and data_inicio_vigencia <= p_data
    and (data_fim_vigencia is null or data_fim_vigencia >= p_data)
  order by data_inicio_vigencia desc
  limit 1;

  return v_salario;
end;
$$;

comment on function public.obter_salario_vigente(bigint, date) is 'Retorna o registro de salário vigente de um usuário em uma data específica. Se não informada, usa a data atual.';

-- ----------------------------------------------------------------------------
-- Function: atualizar_valor_total_folha
-- ----------------------------------------------------------------------------
-- Atualiza o valor total da folha de pagamento quando itens são modificados.

create or replace function public.atualizar_valor_total_folha()
returns trigger
language plpgsql
security invoker
as $$
declare
  v_folha_id bigint;
  v_total numeric(15,2);
begin
  -- Determina qual folha atualizar
  if tg_op = 'DELETE' then
    v_folha_id := old.folha_pagamento_id;
  else
    v_folha_id := new.folha_pagamento_id;
  end if;

  -- Recalcula o total
  select coalesce(sum(valor_bruto), 0)
  into v_total
  from public.itens_folha_pagamento
  where folha_pagamento_id = v_folha_id;

  -- Atualiza a folha
  update public.folhas_pagamento
  set valor_total = v_total
  where id = v_folha_id;

  if tg_op = 'DELETE' then
    return old;
  else
    return new;
  end if;
end;
$$;

comment on function public.atualizar_valor_total_folha() is 'Trigger function que recalcula o valor_total da folha de pagamento quando itens são inseridos, atualizados ou deletados.';

-- Trigger para atualizar valor total da folha
create trigger trigger_atualizar_valor_total_folha
  after insert or update or delete on public.itens_folha_pagamento
  for each row
  execute function public.atualizar_valor_total_folha();

-- ----------------------------------------------------------------------------
-- Function: gerar_lancamento_contrapartida_transferencia
-- ----------------------------------------------------------------------------
-- Cria automaticamente o lançamento de contrapartida quando uma transferência
-- é inserida, vinculando origem e destino via lancamento_contrapartida_id.

create or replace function public.gerar_lancamento_contrapartida_transferencia()
returns trigger
language plpgsql
security invoker
as $$
declare
  v_lancamento_contrapartida_id bigint;
begin
  -- Só processa transferências que ainda não têm contrapartida
  if new.tipo != 'transferencia' or new.lancamento_contrapartida_id is not null then
    return new;
  end if;

  -- Verifica se tem conta destino
  if new.conta_destino_id is null then
    raise exception 'Transferência requer conta_destino_id';
  end if;

  -- Cria o lançamento de contrapartida (entrada na conta destino)
  insert into public.lancamentos_financeiros (
    tipo,
    descricao,
    valor,
    data_lancamento,
    data_competencia,
    data_vencimento,
    data_efetivacao,
    status,
    origem,
    forma_pagamento,
    conta_bancaria_id,
    conta_contabil_id,
    centro_custo_id,
    categoria,
    documento,
    observacoes,
    lancamento_contrapartida_id,
    created_by,
    dados_adicionais
  ) values (
    'receita', -- Na conta destino, é uma entrada
    'Contrapartida: ' || new.descricao,
    new.valor,
    new.data_lancamento,
    new.data_competencia,
    new.data_vencimento,
    new.data_efetivacao,
    new.status,
    new.origem,
    new.forma_pagamento,
    new.conta_destino_id, -- Entra na conta destino
    new.conta_contabil_id,
    new.centro_custo_id,
    new.categoria,
    new.documento,
    'Lançamento de contrapartida gerado automaticamente para transferência ID ' || new.id,
    new.id, -- Vincula ao lançamento original
    new.created_by,
    jsonb_build_object(
      'transferencia_origem_id', new.id,
      'conta_origem_id', new.conta_bancaria_id,
      'eh_contrapartida', true
    )
  )
  returning id into v_lancamento_contrapartida_id;

  -- Atualiza o lançamento original com a referência à contrapartida
  -- Nota: Isso é feito diretamente via UPDATE para evitar loop de trigger
  update public.lancamentos_financeiros
  set lancamento_contrapartida_id = v_lancamento_contrapartida_id
  where id = new.id;

  return new;
end;
$$;

comment on function public.gerar_lancamento_contrapartida_transferencia() is 'Trigger function que cria automaticamente um lançamento de contrapartida quando uma transferência entre contas é inserida. A contrapartida representa a entrada na conta destino, vinculada ao lançamento de saída original via lancamento_contrapartida_id.';

-- Trigger para gerar contrapartida ao inserir transferência
create trigger trigger_gerar_lancamento_contrapartida_transferencia
  after insert on public.lancamentos_financeiros
  for each row
  when (new.tipo = 'transferencia' and new.lancamento_contrapartida_id is null)
  execute function public.gerar_lancamento_contrapartida_transferencia();

-- ----------------------------------------------------------------------------
-- Function: gerar_hash_transacao
-- ----------------------------------------------------------------------------
-- Gera hash para transação bancária importada (detecção de duplicatas).

create or replace function public.gerar_hash_transacao()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.hash_transacao := encode(
    sha256(
      convert_to(
        new.conta_bancaria_id::text ||
        new.data_transacao::text ||
        new.valor::text ||
        coalesce(new.descricao, ''),
        'UTF8'
      )
    ),
    'hex'
  );
  return new;
end;
$$;

comment on function public.gerar_hash_transacao() is 'Trigger function que gera hash SHA256 para transações bancárias importadas, permitindo detecção de duplicatas.';

-- Trigger para gerar hash antes de inserir transação
create trigger trigger_gerar_hash_transacao
  before insert on public.transacoes_bancarias_importadas
  for each row
  when (new.hash_transacao is null)
  execute function public.gerar_hash_transacao();
