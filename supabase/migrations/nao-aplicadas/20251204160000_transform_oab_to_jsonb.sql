-- Migration: Transformar campo OAB em JSONB (array de OABs)
--
-- PROPÓSITO:
-- Um representante pode ter inscrições na OAB em múltiplos estados.
-- Esta migration transforma os campos individuais (numero_oab, uf_oab, situacao_oab)
-- em um array JSONB que suporta múltiplas inscrições.
--
-- FORMATO DO JSONB:
-- [
--   {"numero": "MG128404", "uf": "MG", "situacao": "REGULAR"},
--   {"numero": "PB50550", "uf": "PB", "situacao": "REGULAR"}
-- ]
--
-- CONTEXTO:
-- Exemplo: Pedro Zattar tem OAB em MG e PB (advoga em múltiplos estados)
-- Raissa Bressanim tem OAB em 9 estados diferentes

-- 1. Adicionar nova coluna JSONB para OABs
alter table representantes add column if not exists oabs jsonb default '[]'::jsonb;

-- 2. Popular a coluna oabs com os dados existentes
update representantes
set oabs = jsonb_build_array(
  jsonb_build_object(
    'numero', numero_oab,
    'uf', coalesce(uf_oab, substring(numero_oab from '^[A-Z]{2}')),
    'situacao', coalesce(situacao_oab, 'REGULAR')
  )
)
where numero_oab is not null;

-- 3. Extrair e adicionar OABs adicionais dos dados_pje_completo
-- Usa uma CTE para coletar todas as OABs únicas por CPF
with oabs_extraidas as (
  select distinct
    r.id as representante_id,
    rep->>'numeroOab' as numero_oab,
    substring(rep->>'numeroOab' from '^[A-Z]{2}') as uf,
    coalesce(rep->>'situacaoOab', 'REGULAR') as situacao
  from processo_partes pp
  cross join lateral jsonb_array_elements(pp.dados_pje_completo->'representantes') as rep
  join representantes r on replace(replace(r.cpf, '.', ''), '-', '') = replace(replace(rep->>'cpf', '.', ''), '-', '')
  where pp.dados_pje_completo->'representantes' is not null
    and jsonb_array_length(pp.dados_pje_completo->'representantes') > 0
    and rep->>'numeroOab' is not null
),
oabs_agregadas as (
  select
    representante_id,
    jsonb_agg(
      distinct jsonb_build_object(
        'numero', numero_oab,
        'uf', uf,
        'situacao', situacao
      )
    ) as oabs_array
  from oabs_extraidas
  group by representante_id
)
update representantes r
set oabs = oa.oabs_array
from oabs_agregadas oa
where r.id = oa.representante_id;

-- 4. Criar índice GIN para buscas eficientes no JSONB
create index if not exists idx_representantes_oabs on representantes using gin (oabs);

-- 5. Adicionar comentário descritivo
comment on column representantes.oabs is
'Array de inscrições na OAB. Formato: [{"numero": "MG128404", "uf": "MG", "situacao": "REGULAR"}]. Um advogado pode ter inscrições em múltiplos estados.';
