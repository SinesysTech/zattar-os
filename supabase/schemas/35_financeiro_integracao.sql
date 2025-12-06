-- ============================================================================
-- Schema: Integração Financeira
-- Sistema de Gestão Financeira (SGF)
-- ============================================================================
-- Triggers de integração entre o módulo financeiro e outras entidades do
-- sistema (acordos/condenações, folhas de pagamento, etc.).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: criar_lancamento_de_parcela
-- ----------------------------------------------------------------------------
-- Cria automaticamente um lançamento financeiro quando uma parcela de
-- acordo/condenação é marcada como recebida ou paga.

create or replace function public.criar_lancamento_de_parcela()
returns trigger
language plpgsql
security invoker
as $$
declare
  v_acordo public.acordos_condenacoes;
  v_tipo_lancamento public.tipo_lancamento;
  v_descricao text;
  v_conta_contabil_id bigint;
  v_valor_total numeric(15,2);
  v_lancamento_id bigint;
  v_forma_pagamento_fin public.forma_pagamento_financeiro;
begin
  -- Ignora se não houve mudança de status relevante
  if new.status = old.status then
    return new;
  end if;

  -- Só cria lançamento quando status muda para 'recebida' ou 'paga'
  if new.status not in ('recebida', 'paga') then
    return new;
  end if;

  -- Busca dados do acordo
  select * into v_acordo
  from public.acordos_condenacoes
  where id = new.acordo_condenacao_id;

  -- Define tipo de lançamento baseado na direção
  if v_acordo.direcao = 'recebimento' then
    v_tipo_lancamento := 'receita';
  else
    v_tipo_lancamento := 'despesa';
  end if;

  -- Monta descrição do lançamento
  v_descricao := format(
    'Parcela %s/%s - %s (%s)',
    new.numero_parcela,
    v_acordo.numero_parcelas,
    initcap(v_acordo.tipo),
    case when v_acordo.direcao = 'recebimento' then 'Recebimento' else 'Pagamento' end
  );

  -- Calcula valor total (principal + honorários sucumbenciais)
  v_valor_total := new.valor_bruto_credito_principal + coalesce(new.honorarios_sucumbenciais, 0);

  -- Busca conta contábil adequada (primeira conta analítica de honorários ou despesas)
  -- NOTA: Em produção, configurar via tabela de mapeamento
  if v_tipo_lancamento = 'receita' then
    select id into v_conta_contabil_id
    from public.plano_contas
    where tipo_conta = 'receita'
      and aceita_lancamento = true
      and ativo = true
    order by codigo
    limit 1;
  else
    select id into v_conta_contabil_id
    from public.plano_contas
    where tipo_conta = 'despesa'
      and aceita_lancamento = true
      and ativo = true
    order by codigo
    limit 1;
  end if;

  -- Mapeia forma de pagamento
  v_forma_pagamento_fin := case new.forma_pagamento
    when 'transferencia_direta' then 'transferencia_bancaria'::public.forma_pagamento_financeiro
    when 'deposito_judicial' then 'deposito_judicial'::public.forma_pagamento_financeiro
    when 'deposito_recursal' then 'deposito_judicial'::public.forma_pagamento_financeiro
    else 'transferencia_bancaria'::public.forma_pagamento_financeiro
  end;

  -- Cria o lançamento financeiro (apenas se temos conta contábil)
  if v_conta_contabil_id is not null then
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
      conta_contabil_id,
      acordo_condenacao_id,
      parcela_id,
      created_by,
      dados_adicionais
    ) values (
      v_tipo_lancamento,
      v_descricao,
      v_valor_total,
      current_date,
      new.data_vencimento,
      new.data_vencimento,
      new.data_efetivacao,
      'confirmado',
      'acordo_judicial',
      v_forma_pagamento_fin,
      v_conta_contabil_id,
      new.acordo_condenacao_id,
      new.id,
      -- Busca o usuario.id correspondente ao auth_user_id do criador do acordo
      (select id from public.usuarios where auth_user_id = v_acordo.created_by),
      jsonb_build_object(
        'numero_parcela', new.numero_parcela,
        'total_parcelas', v_acordo.numero_parcelas,
        'valor_principal', new.valor_bruto_credito_principal,
        'honorarios_sucumbenciais', new.honorarios_sucumbenciais,
        'honorarios_contratuais', new.honorarios_contratuais,
        'tipo_acordo', v_acordo.tipo,
        'direcao', v_acordo.direcao
      )
    )
    returning id into v_lancamento_id;

    -- Log para debug (remover em produção)
    raise notice 'Lançamento financeiro % criado para parcela %', v_lancamento_id, new.id;
  else
    raise warning 'Não foi possível criar lançamento financeiro para parcela %: conta contábil não encontrada', new.id;
  end if;

  return new;
end;
$$;

comment on function public.criar_lancamento_de_parcela() is 'Trigger function que cria automaticamente um lançamento financeiro quando uma parcela de acordo/condenação é marcada como recebida ou paga. O tipo de lançamento (receita/despesa) é determinado pela direção do acordo.';

-- Trigger para criar lançamento ao atualizar parcela
create trigger trigger_criar_lancamento_de_parcela
  after update of status on public.parcelas
  for each row
  when (old.status is distinct from new.status and new.status in ('recebida', 'paga'))
  execute function public.criar_lancamento_de_parcela();

-- ----------------------------------------------------------------------------
-- Function: criar_lancamentos_folha_pagamento
-- ----------------------------------------------------------------------------
-- Cria lançamentos financeiros para cada item da folha quando aprovada.

create or replace function public.criar_lancamentos_folha_pagamento()
returns trigger
language plpgsql
security invoker
as $$
declare
  v_item record;
  v_conta_contabil_id bigint;
  v_lancamento_id bigint;
  v_descricao text;
begin
  -- Ignora se não houve mudança de status para 'aprovada'
  if new.status != 'aprovada' or (old is not null and old.status = 'aprovada') then
    return new;
  end if;

  -- Busca conta contábil para salários (primeira conta analítica de despesa com 'Salário' no nome)
  -- NOTA: Em produção, configurar via tabela de mapeamento
  select id into v_conta_contabil_id
  from public.plano_contas
  where tipo_conta = 'despesa'
    and aceita_lancamento = true
    and ativo = true
    and lower(nome) like '%salário%'
  order by codigo
  limit 1;

  -- Fallback: qualquer conta de despesa analítica
  if v_conta_contabil_id is null then
    select id into v_conta_contabil_id
    from public.plano_contas
    where tipo_conta = 'despesa'
      and aceita_lancamento = true
      and ativo = true
    order by codigo
    limit 1;
  end if;

  -- Se não encontrou conta contábil, emite warning e retorna
  if v_conta_contabil_id is null then
    raise warning 'Não foi possível criar lançamentos da folha %: conta contábil não encontrada', new.id;
    return new;
  end if;

  -- Itera sobre cada item da folha
  for v_item in
    select
      i.*,
      u.nome_exibicao as usuario_nome
    from public.itens_folha_pagamento i
    join public.usuarios u on i.usuario_id = u.id
    where i.folha_pagamento_id = new.id
      and i.lancamento_financeiro_id is null
  loop
    -- Monta descrição do lançamento
    v_descricao := format(
      'Salário %s/%s - %s',
      lpad(new.mes_referencia::text, 2, '0'),
      new.ano_referencia,
      v_item.usuario_nome
    );

    -- Cria o lançamento financeiro
    insert into public.lancamentos_financeiros (
      tipo,
      descricao,
      valor,
      data_lancamento,
      data_competencia,
      data_vencimento,
      status,
      origem,
      forma_pagamento,
      conta_contabil_id,
      usuario_id,
      created_by,
      dados_adicionais
    ) values (
      'despesa',
      v_descricao,
      v_item.valor_bruto,
      current_date,
      make_date(new.ano_referencia, new.mes_referencia, 1),
      new.data_pagamento,
      'pendente',
      'folha_pagamento',
      'transferencia_bancaria',
      v_conta_contabil_id,
      v_item.usuario_id,
      new.created_by,
      jsonb_build_object(
        'folha_id', new.id,
        'mes_referencia', new.mes_referencia,
        'ano_referencia', new.ano_referencia,
        'salario_id', v_item.salario_id
      )
    )
    returning id into v_lancamento_id;

    -- Atualiza o item da folha com o ID do lançamento
    update public.itens_folha_pagamento
    set lancamento_financeiro_id = v_lancamento_id
    where id = v_item.id;

    raise notice 'Lançamento financeiro % criado para item da folha % (usuário %)',
      v_lancamento_id, new.id, v_item.usuario_id;
  end loop;

  return new;
end;
$$;

comment on function public.criar_lancamentos_folha_pagamento() is 'Trigger function que cria lançamentos financeiros para cada item da folha de pagamento quando a folha é aprovada. Vincula cada lançamento ao respectivo item da folha.';

-- Trigger para criar lançamentos ao aprovar folha
create trigger trigger_criar_lancamentos_folha_pagamento
  after update of status on public.folhas_pagamento
  for each row
  when (new.status = 'aprovada' and (old.status is null or old.status != 'aprovada'))
  execute function public.criar_lancamentos_folha_pagamento();

-- ----------------------------------------------------------------------------
-- Function: atualizar_lancamento_folha_para_pago
-- ----------------------------------------------------------------------------
-- Atualiza os lançamentos da folha para 'confirmado' quando a folha é paga.

create or replace function public.atualizar_lancamento_folha_para_pago()
returns trigger
language plpgsql
security invoker
as $$
begin
  -- Ignora se não houve mudança de status para 'paga'
  if new.status != 'paga' or (old is not null and old.status = 'paga') then
    return new;
  end if;

  -- Atualiza todos os lançamentos da folha para confirmado
  update public.lancamentos_financeiros
  set
    status = 'confirmado',
    data_efetivacao = now()
  where id in (
    select lancamento_financeiro_id
    from public.itens_folha_pagamento
    where folha_pagamento_id = new.id
      and lancamento_financeiro_id is not null
  );

  return new;
end;
$$;

comment on function public.atualizar_lancamento_folha_para_pago() is 'Trigger function que atualiza os lançamentos da folha para status confirmado quando a folha é marcada como paga.';

-- Trigger para atualizar lançamentos ao pagar folha
create trigger trigger_atualizar_lancamento_folha_para_pago
  after update of status on public.folhas_pagamento
  for each row
  when (new.status = 'paga' and (old.status is null or old.status != 'paga'))
  execute function public.atualizar_lancamento_folha_para_pago();

-- ----------------------------------------------------------------------------
-- Function: cancelar_lancamentos_folha
-- ----------------------------------------------------------------------------
-- Cancela os lançamentos financeiros quando a folha é cancelada.

create or replace function public.cancelar_lancamentos_folha()
returns trigger
language plpgsql
security invoker
as $$
begin
  -- Ignora se não houve mudança de status para 'cancelada'
  if new.status != 'cancelada' or (old is not null and old.status = 'cancelada') then
    return new;
  end if;

  -- Atualiza todos os lançamentos da folha para cancelado
  update public.lancamentos_financeiros
  set status = 'cancelado'
  where id in (
    select lancamento_financeiro_id
    from public.itens_folha_pagamento
    where folha_pagamento_id = new.id
      and lancamento_financeiro_id is not null
  )
  and status != 'confirmado'; -- Não cancela lançamentos já confirmados

  -- Estorna lançamentos já confirmados
  update public.lancamentos_financeiros
  set status = 'estornado'
  where id in (
    select lancamento_financeiro_id
    from public.itens_folha_pagamento
    where folha_pagamento_id = new.id
      and lancamento_financeiro_id is not null
  )
  and status = 'confirmado';

  return new;
end;
$$;

comment on function public.cancelar_lancamentos_folha() is 'Trigger function que cancela ou estorna os lançamentos financeiros quando a folha de pagamento é cancelada.';

-- Trigger para cancelar lançamentos ao cancelar folha
create trigger trigger_cancelar_lancamentos_folha
  after update of status on public.folhas_pagamento
  for each row
  when (new.status = 'cancelada' and (old.status is null or old.status != 'cancelada'))
  execute function public.cancelar_lancamentos_folha();

-- ----------------------------------------------------------------------------
-- Function: sugerir_conciliacao_automatica
-- ----------------------------------------------------------------------------
-- Sugere conciliações automáticas para transações importadas.

create or replace function public.sugerir_conciliacao_automatica(
  p_transacao_id bigint
)
returns table (
  lancamento_id bigint,
  lancamento_descricao text,
  lancamento_valor numeric(15,2),
  lancamento_data date,
  score_similaridade numeric(5,2)
)
language plpgsql
security invoker
as $$
declare
  v_transacao record;
begin
  -- Busca dados da transação
  select * into v_transacao
  from public.transacoes_bancarias_importadas
  where id = p_transacao_id;

  if not found then
    raise exception 'Transação % não encontrada', p_transacao_id;
  end if;

  -- Busca lançamentos similares
  return query
  select
    l.id as lancamento_id,
    l.descricao as lancamento_descricao,
    l.valor as lancamento_valor,
    l.data_lancamento as lancamento_data,
    (
      -- Score baseado em múltiplos critérios
      case when abs(l.valor - abs(v_transacao.valor)) < 0.01 then 40 else 0 end + -- Valor exato
      case when abs(l.valor - abs(v_transacao.valor)) / greatest(l.valor, abs(v_transacao.valor)) < 0.05 then 20 else 0 end + -- Valor similar (5%)
      case when l.data_lancamento = v_transacao.data_transacao then 20 else 0 end + -- Data exata
      case when abs(l.data_lancamento - v_transacao.data_transacao) <= 3 then 10 else 0 end + -- Data próxima
      case when lower(l.descricao) like '%' || lower(substring(v_transacao.descricao from 1 for 10)) || '%' then 10 else 0 end -- Descrição similar
    )::numeric(5,2) as score_similaridade
  from public.lancamentos_financeiros l
  where l.conta_bancaria_id = v_transacao.conta_bancaria_id
    and l.status in ('pendente', 'confirmado')
    and abs(l.data_lancamento - v_transacao.data_transacao) <= 30 -- Máximo 30 dias de diferença
    and (
      -- Receita para créditos, despesa para débitos
      (v_transacao.valor > 0 and l.tipo = 'receita') or
      (v_transacao.valor < 0 and l.tipo in ('despesa', 'transferencia', 'aplicacao'))
    )
    -- Exclui lançamentos já conciliados
    and not exists (
      select 1 from public.conciliacoes_bancarias c
      where c.lancamento_financeiro_id = l.id
        and c.status = 'conciliado'
    )
  order by score_similaridade desc
  limit 5;
end;
$$;

comment on function public.sugerir_conciliacao_automatica(bigint) is 'Sugere lançamentos financeiros para conciliação automática com uma transação bancária importada. Retorna os 5 melhores candidatos com score de similaridade.';
