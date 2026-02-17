-- Migration: Corrigir VIEW acervo_unificado - Fonte da Verdade
--
-- PROBLEMA:
-- A view atual seleciona dados do registro com maior data_autuacao (grau mais recente).
-- Isso faz com que processos no TST ou 2º grau mostrem dados incorretos:
-- - TRT mostra "TST" ao invés do tribunal de origem (ex: TRT3)
-- - Partes podem estar invertidas (quem recorre vira polo ativo no grau superior)
--
-- SOLUÇÃO:
-- O 1º grau é SEMPRE a fonte da verdade para dados identificadores:
-- - trt_origem: Tribunal de origem (1º grau)
-- - nome_parte_autora_origem: Quem ajuizou a ação
-- - nome_parte_re_origem: Contra quem foi ajuizada
-- - data_autuacao_origem: Data de início do processo
--
-- Quando não existe registro de 1º grau (ex: segredo de justiça que nasce no 2º grau),
-- usa-se o registro mais antigo disponível como fallback.

-- Dropar a view materializada existente
drop materialized view if exists public.acervo_unificado cascade;

-- Recriar a view materializada com campos de origem (fonte da verdade)
create materialized view public.acervo_unificado as
with
-- CTE 1: Buscar dados do 1º grau (fonte da verdade)
-- Se não existir 1º grau, pegar o registro mais antigo disponível (fallback)
dados_primeiro_grau as (
  select distinct on (numero_processo, advogado_id)
    numero_processo,
    advogado_id,
    trt as trt_origem,
    nome_parte_autora as nome_parte_autora_origem,
    nome_parte_re as nome_parte_re_origem,
    descricao_orgao_julgador as orgao_julgador_origem,
    data_autuacao as data_autuacao_origem,
    grau as grau_origem
  from public.acervo
  order by
    numero_processo,
    advogado_id,
    -- Priorizar 1º grau, depois ordenar por data_autuacao ASC (mais antigo)
    case when grau = 'primeiro_grau' then 0 else 1 end,
    data_autuacao asc
),
-- CTE 2: Agrupar instâncias identificando o grau atual
instancias_agrupadas as (
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
-- CTE 3: Agrupar graus ativos por numero_processo
graus_ativos_agrupados as (
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
  -- ==========================================
  -- NOVOS CAMPOS: Fonte da Verdade (1º grau)
  -- ==========================================
  dpg.trt_origem,
  dpg.nome_parte_autora_origem,
  dpg.nome_parte_re_origem,
  dpg.orgao_julgador_origem,
  dpg.data_autuacao_origem,
  dpg.grau_origem,
  -- Instâncias como JSONB (ordenadas por data_autuacao desc)
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
left join dados_primeiro_grau dpg
  on ia.numero_processo = dpg.numero_processo
  and ia.advogado_id = dpg.advogado_id
where ia.rn_grau_atual = 1; -- Apenas a instância do grau atual

comment on materialized view public.acervo_unificado is
'VIEW materializada que unifica processos com mesmo numero_processo em uma única visualização.
Agrupa todas as instâncias (graus) do mesmo processo, identificando o grau atual.
IMPORTANTE: Os campos *_origem representam a fonte da verdade (dados do 1º grau).
- trt_origem: Tribunal de origem (sempre do 1º grau)
- nome_parte_autora_origem: Quem ajuizou a ação (não inverte com recurso)
- nome_parte_re_origem: Contra quem foi ajuizada (não inverte com recurso)
- data_autuacao_origem: Data de início do processo no 1º grau
Quando não existe 1º grau, usa o registro mais antigo como fallback.';

-- Recriar índices para performance
create unique index idx_acervo_unificado_unique
  on public.acervo_unificado using btree (id, numero_processo, advogado_id);
create index idx_acervo_unificado_numero_processo
  on public.acervo_unificado using btree (numero_processo);
create index idx_acervo_unificado_advogado_id
  on public.acervo_unificado using btree (advogado_id);
create index idx_acervo_unificado_trt
  on public.acervo_unificado using btree (trt);
create index idx_acervo_unificado_trt_origem
  on public.acervo_unificado using btree (trt_origem);
create index idx_acervo_unificado_grau_atual
  on public.acervo_unificado using btree (grau_atual);
create index idx_acervo_unificado_data_autuacao
  on public.acervo_unificado using btree (data_autuacao);
create index idx_acervo_unificado_responsavel_id
  on public.acervo_unificado using btree (responsavel_id);
create index idx_acervo_unificado_advogado_trt
  on public.acervo_unificado using btree (advogado_id, trt);
create index idx_acervo_unificado_advogado_trt_origem
  on public.acervo_unificado using btree (advogado_id, trt_origem);
create index idx_acervo_unificado_numero_processo_advogado
  on public.acervo_unificado using btree (numero_processo, advogado_id);

-- Comentários nas novas colunas
comment on column public.acervo_unificado.trt_origem is
'Tribunal de origem do processo (1º grau). FONTE DA VERDADE - não muda com recursos.';
comment on column public.acervo_unificado.nome_parte_autora_origem is
'Nome da parte que ajuizou a ação (1º grau). FONTE DA VERDADE - não inverte com recursos.';
comment on column public.acervo_unificado.nome_parte_re_origem is
'Nome da parte contra quem foi ajuizada a ação (1º grau). FONTE DA VERDADE - não inverte com recursos.';
comment on column public.acervo_unificado.orgao_julgador_origem is
'Órgão julgador do 1º grau. FONTE DA VERDADE.';
comment on column public.acervo_unificado.data_autuacao_origem is
'Data de autuação do processo no 1º grau. FONTE DA VERDADE.';
comment on column public.acervo_unificado.grau_origem is
'Grau de origem dos dados (normalmente primeiro_grau, ou mais antigo disponível se não houver 1º grau).';

-- Atualizar owner
alter materialized view public.acervo_unificado owner to postgres;

-- Fazer refresh inicial da view
select public.refresh_acervo_unificado(false);
