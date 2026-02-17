-- Migration: Criar VIEW materializada acervo_unificado
-- Agrupa processos com mesmo numero_processo em uma única visualização
-- Elimina necessidade de carregar e agrupar 35k+ registros em memória
-- Permite paginação real no banco de dados e índices específicos

-- VIEW materializada que agrupa processos por numero_processo
create materialized view public.acervo_unificado as
with instancias_agrupadas as (
  -- Agrupar instâncias por numero_processo e advogado_id
  -- Identificar qual é o grau atual usando window functions
  select
    a.id,
    a.id_pje,
    a.advogado_id,
    a.origem,
    a.trt,
    a.grau,
    a.numero_processo,
    a.numero,
    a.descricao_orgao_julgador,
    a.classe_judicial,
    a.segredo_justica,
    a.codigo_status_processo,
    a.prioridade_processual,
    a.nome_parte_autora,
    a.qtde_parte_autora,
    a.nome_parte_re,
    a.qtde_parte_re,
    a.data_autuacao,
    a.juizo_digital,
    a.data_arquivamento,
    a.data_proxima_audiencia,
    a.tem_associacao,
    a.responsavel_id,
    a.created_at,
    a.updated_at,
    -- Window function para identificar o grau atual
    -- Critério: maior data_autuacao, desempate com updated_at
    row_number() over (
      partition by a.numero_processo, a.advogado_id
      order by a.data_autuacao desc, a.updated_at desc
    ) as rn_grau_atual,
    -- Coletar todas as instâncias do mesmo processo como JSONB
    -- Ordenação será feita depois no SELECT final
    jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'grau', a.grau,
        'origem', a.origem,
        'trt', a.trt,
        'data_autuacao', a.data_autuacao,
        'updated_at', a.updated_at
      )
    ) over (
      partition by a.numero_processo, a.advogado_id
    ) as instances_json
  from public.acervo a
),
graus_ativos_agrupados as (
  -- Agrupar graus ativos por numero_processo
  select
    numero_processo,
    advogado_id,
    array_agg(distinct grau order by grau) as graus_ativos
  from public.acervo
  group by numero_processo, advogado_id
)
select
  -- Campos da instância principal (grau atual)
  ia.id,
  ia.id_pje,
  ia.advogado_id,
  ia.origem,
  ia.trt,
  ia.numero_processo,
  ia.numero,
  ia.descricao_orgao_julgador,
  ia.classe_judicial,
  ia.segredo_justica,
  ia.codigo_status_processo,
  ia.prioridade_processual,
  ia.nome_parte_autora,
  ia.qtde_parte_autora,
  ia.nome_parte_re,
  ia.qtde_parte_re,
  ia.data_autuacao,
  ia.juizo_digital,
  ia.data_arquivamento,
  ia.data_proxima_audiencia,
  ia.tem_associacao,
  ia.responsavel_id,
  ia.created_at,
  ia.updated_at,
  -- Campos específicos da unificação
  ia.grau as grau_atual,
  ga.graus_ativos,
  -- Instâncias como JSONB (ordenadas por data_autuacao desc, updated_at desc)
  -- Marcar qual é o grau atual
  (
    select jsonb_agg(
      jsonb_set(
        inst,
        '{is_grau_atual}',
        to_jsonb(inst->>'id' = ia.id::text)
      )
      order by (inst->>'data_autuacao')::timestamptz desc, (inst->>'updated_at')::timestamptz desc
    )
    from jsonb_array_elements(ia.instances_json) as inst
  ) as instances
from instancias_agrupadas ia
inner join graus_ativos_agrupados ga
  on ia.numero_processo = ga.numero_processo
  and ia.advogado_id = ga.advogado_id
where ia.rn_grau_atual = 1; -- Apenas a instância do grau atual

comment on materialized view public.acervo_unificado is 'VIEW materializada que unifica processos com mesmo numero_processo em uma única visualização. Agrupa todas as instâncias (graus) do mesmo processo, identificando o grau atual baseado em maior data_autuacao e updated_at como desempate. Elimina necessidade de carregar e agrupar grandes volumes de dados em memória, permitindo paginação real no banco de dados.';

-- Índices para performance na VIEW materializada
-- IMPORTANTE: Índice único é necessário para refresh CONCURRENTLY
create unique index idx_acervo_unificado_unique on public.acervo_unificado using btree (id, numero_processo, advogado_id);
create index idx_acervo_unificado_numero_processo on public.acervo_unificado using btree (numero_processo);
create index idx_acervo_unificado_advogado_id on public.acervo_unificado using btree (advogado_id);
create index idx_acervo_unificado_trt on public.acervo_unificado using btree (trt);
create index idx_acervo_unificado_grau_atual on public.acervo_unificado using btree (grau_atual);
create index idx_acervo_unificado_data_autuacao on public.acervo_unificado using btree (data_autuacao);
create index idx_acervo_unificado_responsavel_id on public.acervo_unificado using btree (responsavel_id);
create index idx_acervo_unificado_advogado_trt on public.acervo_unificado using btree (advogado_id, trt);
create index idx_acervo_unificado_numero_processo_advogado on public.acervo_unificado using btree (numero_processo, advogado_id);

-- Função para refresh da VIEW materializada
-- Tenta usar CONCURRENTLY se possível (requer índice único), caso contrário usa refresh normal
create or replace function public.refresh_acervo_unificado(use_concurrent boolean default true)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if use_concurrent then
    -- CONCURRENTLY requer que a VIEW já tenha sido criada pelo menos uma vez
    -- e que exista um índice único
    begin
      refresh materialized view concurrently public.acervo_unificado;
    exception
      when others then
        -- Se CONCURRENTLY falhar (ex: primeira execução), usar refresh normal
        refresh materialized view public.acervo_unificado;
    end;
  else
    refresh materialized view public.acervo_unificado;
  end if;
end;
$$;

comment on function public.refresh_acervo_unificado is 'Atualiza a VIEW materializada acervo_unificado. Por padrão usa CONCURRENTLY para evitar bloqueios, mas faz fallback para refresh normal se necessário (ex: primeira execução).';

-- Habilitar RLS na VIEW materializada
alter materialized view public.acervo_unificado owner to postgres;

-- Comentários nas colunas principais
comment on column public.acervo_unificado.id is 'ID da instância principal (grau atual) do processo';
comment on column public.acervo_unificado.grau_atual is 'Grau atual do processo (primeiro_grau ou segundo_grau), identificado pela maior data_autuacao';
comment on column public.acervo_unificado.graus_ativos is 'Array de graus onde o processo está ativo (ex: [primeiro_grau, segundo_grau])';
comment on column public.acervo_unificado.instances is 'JSONB contendo todas as instâncias do processo, cada uma com id, grau, origem, trt, data_autuacao, updated_at e is_grau_atual';

-- Instalar pg_cron se não estiver instalado
create extension if not exists pg_cron;

-- Criar job agendado para refresh diário da VIEW materializada
-- Executa todos os dias às 3h da manhã (horário de menor uso)
select cron.schedule(
  'refresh-acervo-unificado-daily',
  '0 3 * * *', -- Cron expression: 3h da manhã todos os dias
  $$select public.refresh_acervo_unificado(true)$$
);

