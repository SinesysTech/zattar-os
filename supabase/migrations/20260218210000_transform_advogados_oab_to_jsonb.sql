-- Migration: Transformar campos OAB em JSONB na tabela advogados
--
-- PROPÓSITO:
-- A tabela advogados tinha campos individuais (oab, uf_oab) para uma única OAB.
-- Todo o código da aplicação espera uma coluna 'oabs' JSONB (array de OabEntry).
-- Esta migration alinha o banco com a interface Advogado do TypeScript.
--
-- FORMATO DO JSONB:
-- [{"numero": "12345", "uf": "SP"}]

-- 1. Adicionar nova coluna JSONB para OABs
alter table advogados add column if not exists oabs jsonb default '[]'::jsonb;

-- 2. Popular a coluna oabs com os dados existentes de oab/uf_oab
update advogados
set oabs = jsonb_build_array(
  jsonb_build_object(
    'numero', oab,
    'uf', uf_oab
  )
)
where oab is not null and oab <> '';

-- 3. Criar índice GIN para buscas eficientes no JSONB
create index if not exists idx_advogados_oabs on advogados using gin (oabs);

-- 4. Remover colunas antigas
alter table advogados drop column if exists oab;
alter table advogados drop column if exists uf_oab;

-- 5. Remover índice antigo (usava oab, uf_oab que não existem mais)
drop index if exists idx_advogados_oab;

-- 6. Comentário descritivo
comment on column advogados.oabs is
'Array de inscrições na OAB. Formato: [{"numero": "12345", "uf": "SP"}]. Um advogado pode ter inscrições em múltiplos estados.';
