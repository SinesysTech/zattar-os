-- ============================================================================
-- Schema: Views Financeiras
-- Sistema de Gestão Financeira (SGF)
-- ============================================================================
-- Views materializadas e regulares para consultas e relatórios financeiros.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- View Materializada: v_lancamentos_pendentes
-- ----------------------------------------------------------------------------
-- Lançamentos pendentes com detalhes de relacionamentos.
-- Atualizar periodicamente via REFRESH MATERIALIZED VIEW.

create materialized view public.v_lancamentos_pendentes as
select
  l.id,
  l.tipo,
  l.descricao,
  l.valor,
  l.data_lancamento,
  l.data_competencia,
  l.data_vencimento,
  l.status,
  l.origem,
  l.forma_pagamento,
  l.categoria,
  l.documento,
  l.observacoes,
  l.conta_bancaria_id,
  cb.nome as conta_bancaria_nome,
  l.conta_contabil_id,
  pc.codigo as conta_contabil_codigo,
  pc.nome as conta_contabil_nome,
  l.centro_custo_id,
  cc.codigo as centro_custo_codigo,
  cc.nome as centro_custo_nome,
  l.cliente_id,
  c.nome as cliente_nome,
  l.contrato_id,
  l.acordo_condenacao_id,
  l.parcela_id,
  l.usuario_id,
  u.nome_exibicao as usuario_nome,
  (l.data_vencimento - current_date) as dias_ate_vencimento,
  case
    when l.data_vencimento < current_date then 'vencido'
    when l.data_vencimento = current_date then 'vence_hoje'
    when l.data_vencimento <= current_date + 7 then 'vence_em_7_dias'
    when l.data_vencimento <= current_date + 30 then 'vence_em_30_dias'
    else 'futuro'
  end as situacao_vencimento,
  l.created_at,
  l.updated_at
from public.lancamentos_financeiros l
left join public.contas_bancarias cb on l.conta_bancaria_id = cb.id
left join public.plano_contas pc on l.conta_contabil_id = pc.id
left join public.centros_custo cc on l.centro_custo_id = cc.id
left join public.clientes c on l.cliente_id = c.id
left join public.usuarios u on l.usuario_id = u.id
where l.status = 'pendente'
order by l.data_vencimento nulls last, l.data_lancamento;

comment on materialized view public.v_lancamentos_pendentes is 'View materializada com lançamentos pendentes e seus relacionamentos. Inclui dias até vencimento e situação (vencido, vence_hoje, etc.). Atualizar via REFRESH MATERIALIZED VIEW.';

-- Índices na view materializada
create unique index idx_v_lancamentos_pendentes_id on public.v_lancamentos_pendentes (id);
create index idx_v_lancamentos_pendentes_vencimento on public.v_lancamentos_pendentes (data_vencimento);
create index idx_v_lancamentos_pendentes_tipo on public.v_lancamentos_pendentes (tipo);
create index idx_v_lancamentos_pendentes_situacao on public.v_lancamentos_pendentes (situacao_vencimento);

-- ----------------------------------------------------------------------------
-- View: v_fluxo_caixa_mensal
-- ----------------------------------------------------------------------------
-- Fluxo de caixa mensal (receitas, despesas, saldo).
-- Nota: Transferências internas não afetam o saldo líquido global, pois
-- representam apenas movimentação entre contas do próprio escritório.
-- A contrapartida gerada automaticamente anula o efeito da transferência.

create or replace view public.v_fluxo_caixa_mensal as
select
  extract(year from data_competencia)::integer as ano,
  extract(month from data_competencia)::integer as mes,
  -- Receitas: exclui contrapartidas de transferência (identificadas via dados_adicionais)
  sum(case
    when tipo = 'receita' and coalesce((dados_adicionais->>'eh_contrapartida')::boolean, false) = false
    then valor
    else 0
  end) as total_receitas,
  sum(case when tipo = 'despesa' then valor else 0 end) as total_despesas,
  -- Transferências: apenas saídas (tipo = 'transferencia'), entradas são contrapartidas
  sum(case when tipo = 'transferencia' then valor else 0 end) as total_transferencias,
  -- Saldo líquido: transferências se anulam (saída + entrada contrapartida = 0)
  -- Exclui lançamentos que são contrapartida de transferência
  sum(case
    when tipo = 'receita' and coalesce((dados_adicionais->>'eh_contrapartida')::boolean, false) = false
    then valor
    when tipo = 'despesa' then -valor
    when tipo = 'aplicacao' then -valor
    when tipo = 'resgate' then valor
    -- Transferências não afetam saldo líquido global (origem -valor, destino +valor = 0)
    else 0
  end) as saldo_liquido
from public.lancamentos_financeiros
where status = 'confirmado'
group by ano, mes
order by ano desc, mes desc;

comment on view public.v_fluxo_caixa_mensal is 'Fluxo de caixa mensal consolidado. Mostra total de receitas, despesas e saldo líquido por mês. Transferências internas são exibidas separadamente e não afetam o saldo líquido global, pois apenas movimentam valores entre contas do próprio escritório.';

-- ----------------------------------------------------------------------------
-- View: v_fluxo_caixa_diario
-- ----------------------------------------------------------------------------
-- Fluxo de caixa diário para análise detalhada.
-- Nota: Transferências internas não afetam o saldo líquido global.

create or replace view public.v_fluxo_caixa_diario as
select
  data_competencia as data,
  -- Receitas: exclui contrapartidas de transferência
  sum(case
    when tipo = 'receita' and coalesce((dados_adicionais->>'eh_contrapartida')::boolean, false) = false
    then valor
    else 0
  end) as total_receitas,
  sum(case when tipo = 'despesa' then valor else 0 end) as total_despesas,
  -- Saldo líquido: transferências não afetam (contrapartidas se anulam)
  sum(case
    when tipo = 'receita' and coalesce((dados_adicionais->>'eh_contrapartida')::boolean, false) = false
    then valor
    when tipo = 'despesa' then -valor
    when tipo = 'aplicacao' then -valor
    when tipo = 'resgate' then valor
    -- Transferências não afetam saldo líquido global
    else 0
  end) as saldo_liquido,
  -- Quantidade exclui contrapartidas para não duplicar contagem
  count(*) filter (where coalesce((dados_adicionais->>'eh_contrapartida')::boolean, false) = false) as quantidade_lancamentos
from public.lancamentos_financeiros
where status = 'confirmado'
group by data_competencia
order by data_competencia desc;

comment on view public.v_fluxo_caixa_diario is 'Fluxo de caixa diário consolidado. Mostra movimentações e saldo líquido por dia. Transferências internas não afetam o saldo líquido global.';

-- ----------------------------------------------------------------------------
-- View: v_saldo_contas_bancarias
-- ----------------------------------------------------------------------------
-- Saldo atual de todas as contas bancárias ativas.

create or replace view public.v_saldo_contas_bancarias as
select
  cb.id,
  cb.nome,
  cb.tipo,
  cb.banco_nome,
  cb.agencia,
  cb.numero_conta,
  cb.saldo_inicial,
  cb.saldo_atual,
  cb.data_saldo_inicial,
  cb.status,
  pc.codigo as conta_contabil_codigo,
  pc.nome as conta_contabil_nome,
  (
    select count(*)
    from public.lancamentos_financeiros l
    where (l.conta_bancaria_id = cb.id or l.conta_destino_id = cb.id)
      and l.status = 'pendente'
  ) as lancamentos_pendentes
from public.contas_bancarias cb
left join public.plano_contas pc on cb.conta_contabil_id = pc.id
where cb.ativo = true
order by cb.nome;

comment on view public.v_saldo_contas_bancarias is 'Saldo atual de todas as contas bancárias ativas, incluindo vinculação contábil e quantidade de lançamentos pendentes.';

-- ----------------------------------------------------------------------------
-- View: v_orcamento_vs_realizado
-- ----------------------------------------------------------------------------
-- Comparação entre valores orçados e realizados.

create or replace view public.v_orcamento_vs_realizado as
select
  o.id as orcamento_id,
  o.nome as orcamento_nome,
  o.ano,
  o.periodo,
  o.status as orcamento_status,
  oi.id as item_id,
  oi.conta_contabil_id,
  pc.codigo as conta_codigo,
  pc.nome as conta_nome,
  pc.tipo_conta,
  oi.centro_custo_id,
  cc.codigo as centro_custo_codigo,
  cc.nome as centro_custo_nome,
  oi.mes,
  oi.valor_orcado,
  coalesce((
    select sum(l.valor)
    from public.lancamentos_financeiros l
    where l.conta_contabil_id = oi.conta_contabil_id
      and (oi.centro_custo_id is null or l.centro_custo_id = oi.centro_custo_id)
      and l.status = 'confirmado'
      and l.data_competencia between o.data_inicio and o.data_fim
      and (oi.mes is null or extract(month from l.data_competencia) = oi.mes)
  ), 0) as valor_realizado,
  coalesce((
    select sum(l.valor)
    from public.lancamentos_financeiros l
    where l.conta_contabil_id = oi.conta_contabil_id
      and (oi.centro_custo_id is null or l.centro_custo_id = oi.centro_custo_id)
      and l.status = 'confirmado'
      and l.data_competencia between o.data_inicio and o.data_fim
      and (oi.mes is null or extract(month from l.data_competencia) = oi.mes)
  ), 0) - oi.valor_orcado as variacao,
  case
    when oi.valor_orcado = 0 then null
    else round(
      (coalesce((
        select sum(l.valor)
        from public.lancamentos_financeiros l
        where l.conta_contabil_id = oi.conta_contabil_id
          and (oi.centro_custo_id is null or l.centro_custo_id = oi.centro_custo_id)
          and l.status = 'confirmado'
          and l.data_competencia between o.data_inicio and o.data_fim
          and (oi.mes is null or extract(month from l.data_competencia) = oi.mes)
      ), 0) / oi.valor_orcado) * 100,
      2
    )
  end as percentual_realizado
from public.orcamentos o
join public.orcamento_itens oi on oi.orcamento_id = o.id
join public.plano_contas pc on oi.conta_contabil_id = pc.id
left join public.centros_custo cc on oi.centro_custo_id = cc.id
order by o.ano desc, o.id, pc.codigo, oi.mes;

comment on view public.v_orcamento_vs_realizado is 'Comparação entre valores orçados e realizados por conta contábil e centro de custo. Inclui variação absoluta e percentual de realização.';

-- ----------------------------------------------------------------------------
-- View: v_lancamentos_por_centro_custo
-- ----------------------------------------------------------------------------
-- Totais de lançamentos por centro de custo.

create or replace view public.v_lancamentos_por_centro_custo as
select
  cc.id as centro_custo_id,
  cc.codigo as centro_custo_codigo,
  cc.nome as centro_custo_nome,
  extract(year from l.data_competencia)::integer as ano,
  extract(month from l.data_competencia)::integer as mes,
  sum(case when l.tipo = 'receita' then l.valor else 0 end) as total_receitas,
  sum(case when l.tipo = 'despesa' then l.valor else 0 end) as total_despesas,
  sum(case
    when l.tipo = 'receita' then l.valor
    when l.tipo = 'despesa' then -l.valor
    else 0
  end) as saldo,
  count(*) as quantidade_lancamentos
from public.centros_custo cc
left join public.lancamentos_financeiros l on
  l.centro_custo_id = cc.id
  and l.status = 'confirmado'
where cc.ativo = true
group by cc.id, cc.codigo, cc.nome, ano, mes
having count(*) > 0
order by cc.codigo, ano desc, mes desc;

comment on view public.v_lancamentos_por_centro_custo is 'Totais de lançamentos agrupados por centro de custo e mês. Mostra receitas, despesas e saldo por período.';

-- ----------------------------------------------------------------------------
-- View: v_conciliacoes_pendentes
-- ----------------------------------------------------------------------------
-- Transações importadas não conciliadas.

create or replace view public.v_conciliacoes_pendentes as
select
  ti.id as transacao_id,
  ti.conta_bancaria_id,
  cb.nome as conta_bancaria_nome,
  ti.data_transacao,
  ti.descricao,
  ti.valor,
  ti.tipo_transacao,
  ti.documento,
  ti.data_importacao,
  c.id as conciliacao_id,
  c.status as conciliacao_status,
  c.score_similaridade,
  c.lancamento_financeiro_id,
  lf.descricao as lancamento_descricao,
  lf.valor as lancamento_valor,
  lf.data_lancamento as lancamento_data
from public.transacoes_bancarias_importadas ti
join public.contas_bancarias cb on ti.conta_bancaria_id = cb.id
left join public.conciliacoes_bancarias c on c.transacao_importada_id = ti.id
left join public.lancamentos_financeiros lf on c.lancamento_financeiro_id = lf.id
where c.id is null or c.status = 'pendente'
order by ti.data_transacao desc, ti.data_importacao desc;

comment on view public.v_conciliacoes_pendentes is 'Transações bancárias importadas que ainda não foram conciliadas ou têm conciliação pendente. Inclui sugestões de lançamentos quando disponíveis.';

-- ----------------------------------------------------------------------------
-- View: v_folhas_pagamento_resumo
-- ----------------------------------------------------------------------------
-- Resumo das folhas de pagamento.

create or replace view public.v_folhas_pagamento_resumo as
select
  f.id,
  f.mes_referencia,
  f.ano_referencia,
  to_char(make_date(f.ano_referencia, f.mes_referencia, 1), 'TMMonth/YYYY') as periodo_formatado,
  f.status,
  f.data_geracao,
  f.data_pagamento,
  f.valor_total,
  (
    select count(*)
    from public.itens_folha_pagamento i
    where i.folha_pagamento_id = f.id
  ) as quantidade_funcionarios,
  (
    select count(*)
    from public.itens_folha_pagamento i
    where i.folha_pagamento_id = f.id
      and i.lancamento_financeiro_id is not null
  ) as lancamentos_gerados,
  f.created_by,
  u.nome_exibicao as criado_por_nome,
  f.created_at
from public.folhas_pagamento f
left join public.usuarios u on f.created_by = u.id
order by f.ano_referencia desc, f.mes_referencia desc;

comment on view public.v_folhas_pagamento_resumo is 'Resumo das folhas de pagamento com contagem de funcionários e lançamentos gerados.';

-- ----------------------------------------------------------------------------
-- View: v_plano_contas_hierarquico
-- ----------------------------------------------------------------------------
-- Plano de contas com hierarquia formatada.

create or replace view public.v_plano_contas_hierarquico as
with recursive hierarquia as (
  -- Contas raiz (sem pai)
  select
    id,
    codigo,
    nome,
    tipo_conta,
    natureza,
    nivel,
    aceita_lancamento,
    conta_pai_id,
    ativo,
    1 as profundidade,
    codigo as caminho,
    nome as caminho_nome
  from public.plano_contas
  where conta_pai_id is null

  union all

  -- Contas filhas
  select
    pc.id,
    pc.codigo,
    pc.nome,
    pc.tipo_conta,
    pc.natureza,
    pc.nivel,
    pc.aceita_lancamento,
    pc.conta_pai_id,
    pc.ativo,
    h.profundidade + 1,
    h.caminho || ' > ' || pc.codigo,
    h.caminho_nome || ' > ' || pc.nome
  from public.plano_contas pc
  join hierarquia h on pc.conta_pai_id = h.id
)
select
  id,
  codigo,
  nome,
  tipo_conta,
  natureza,
  nivel,
  aceita_lancamento,
  conta_pai_id,
  ativo,
  profundidade,
  caminho,
  caminho_nome,
  repeat('  ', profundidade - 1) || nome as nome_indentado
from hierarquia
order by caminho;

comment on view public.v_plano_contas_hierarquico is 'Plano de contas com estrutura hierárquica recursiva. Inclui profundidade, caminho completo e nome indentado para exibição.';

-- ----------------------------------------------------------------------------
-- View Materializada: v_dre
-- ----------------------------------------------------------------------------
-- Demonstração de Resultado do Exercício (DRE) agregando receitas e despesas
-- por período, conta contábil e categoria. Base para relatórios gerenciais.
-- Atualizar periodicamente via REFRESH MATERIALIZED VIEW ou trigger.

create materialized view public.v_dre as
select
  extract(year from l.data_competencia)::integer as ano,
  extract(month from l.data_competencia)::integer as mes,
  to_char(l.data_competencia, 'YYYY-MM') as periodo_completo,
  l.conta_contabil_id,
  pc.codigo as conta_codigo,
  pc.nome as conta_nome,
  pc.tipo_conta,
  coalesce(l.categoria, 'Sem Categoria') as categoria,
  sum(l.valor) as valor_total,
  count(*)::integer as quantidade_lancamentos
from public.lancamentos_financeiros l
join public.plano_contas pc on l.conta_contabil_id = pc.id
where l.status = 'confirmado'
  and l.tipo in ('receita', 'despesa')
  -- Exclui contrapartidas de transferências para não duplicar contagem
  and coalesce((l.dados_adicionais->>'eh_contrapartida')::boolean, false) = false
group by
  extract(year from l.data_competencia),
  extract(month from l.data_competencia),
  to_char(l.data_competencia, 'YYYY-MM'),
  l.conta_contabil_id,
  pc.codigo,
  pc.nome,
  pc.tipo_conta,
  coalesce(l.categoria, 'Sem Categoria')
order by ano desc, mes desc, pc.codigo;

comment on materialized view public.v_dre is 'View materializada para DRE. Agrega receitas e despesas confirmadas por período, conta contábil e categoria. Atualizar via REFRESH MATERIALIZED VIEW ou trigger após confirmação de lançamentos.';

-- Índices na view materializada v_dre
create unique index idx_v_dre_unique on public.v_dre (ano, mes, conta_contabil_id, categoria);
create index idx_v_dre_ano on public.v_dre (ano);
create index idx_v_dre_mes on public.v_dre (mes);
create index idx_v_dre_tipo_conta on public.v_dre (tipo_conta);
create index idx_v_dre_categoria on public.v_dre (categoria);
create index idx_v_dre_periodo on public.v_dre (periodo_completo);

-- ----------------------------------------------------------------------------
-- Função: refresh_v_dre
-- ----------------------------------------------------------------------------
-- Atualiza a view materializada v_dre. Pode ser chamada manualmente
-- ou via trigger/scheduler após confirmação de lançamentos.

create or replace function public.refresh_v_dre()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently public.v_dre;
  raise notice 'View v_dre atualizada com sucesso em %', now();
exception
  when others then
    -- Se refresh concorrente falhar (ex: primeira vez sem índice unique),
    -- tenta refresh normal
    refresh materialized view public.v_dre;
    raise notice 'View v_dre atualizada (modo normal) em %', now();
end;
$$;

comment on function public.refresh_v_dre() is 'Atualiza a view materializada v_dre com dados agregados de DRE. Prefere refresh concorrente para não bloquear leituras.';
