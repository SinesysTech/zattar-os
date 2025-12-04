-- Migration: Popular vínculos de representantes em processo_partes
--
-- PROPÓSITO:
-- Esta migration extrai os dados de representantes do campo dados_pje_completo
-- em processo_partes e cria entradas com tipo_entidade='representante',
-- permitindo consultar facilmente em quais processos cada representante atua.
--
-- CONTEXTO:
-- Anteriormente, os representantes estavam apenas armazenados no JSONB dentro
-- de processo_partes. Agora, com a tabela representantes deduplicada por CPF,
-- precisamos criar os vínculos explícitos em processo_partes.
--
-- RESULTADO ESPERADO:
-- ~29.901 novos registros em processo_partes com tipo_entidade='representante'
--
-- NOTA: Esta migration foi aplicada como 'populate_representantes_vinculos_v2'
-- devido a ajustes no DISTINCT ON para respeitar constraint UNIQUE

-- Primeiro, alterar a constraint para incluir 'representante'
alter table processo_partes drop constraint if exists processo_partes_tipo_entidade_check;

alter table processo_partes add constraint processo_partes_tipo_entidade_check
check (tipo_entidade = any (array['cliente'::text, 'parte_contraria'::text, 'terceiro'::text, 'representante'::text]));

-- Inserir vínculos de representantes extraídos dos dados_pje_completo
insert into processo_partes (
  processo_id,
  tipo_entidade,
  entidade_id,
  id_pje,
  id_pessoa_pje,
  id_tipo_parte,
  tipo_parte,
  polo,
  principal,
  ordem,
  status_pje,
  situacao_pje,
  autoridade,
  endereco_desconhecido,
  dados_pje_completo,
  trt,
  grau,
  numero_processo,
  created_at,
  updated_at
)
-- DISTINCT ON (processo_id, grau, entidade_id) para respeitar constraint UNIQUE
select distinct on (pp.processo_id, pp.grau, r.id)
  pp.processo_id,
  'representante'::text as tipo_entidade,
  r.id as entidade_id,
  (rep->>'id')::bigint as id_pje,
  (rep->>'idPessoa')::bigint as id_pessoa_pje,
  (rep->>'idTipoParte')::bigint as id_tipo_parte,
  coalesce(rep->>'tipo', 'ADVOGADO') as tipo_parte,
  coalesce(rep->>'polo', lower(pp.polo)) as polo,
  coalesce((rep->>'principal')::boolean, false) as principal,
  null::integer as ordem,
  rep->>'status' as status_pje,
  rep->>'situacao' as situacao_pje,
  coalesce((rep->>'autoridade')::boolean, false) as autoridade,
  coalesce((rep->>'enderecoDesconhecido')::boolean, false) as endereco_desconhecido,
  rep as dados_pje_completo,
  pp.trt,
  pp.grau,
  pp.numero_processo,
  now() as created_at,
  now() as updated_at
from processo_partes pp
cross join lateral jsonb_array_elements(pp.dados_pje_completo->'representantes') as rep
join representantes r on replace(replace(r.cpf, '.', ''), '-', '') = replace(replace(rep->>'cpf', '.', ''), '-', '')
where pp.dados_pje_completo->'representantes' is not null
  and jsonb_array_length(pp.dados_pje_completo->'representantes') > 0
  -- Evitar duplicatas se a migration for executada novamente
  and not exists (
    select 1 from processo_partes existing
    where existing.processo_id = pp.processo_id
      and existing.grau = pp.grau
      and existing.tipo_entidade = 'representante'
      and existing.entidade_id = r.id
  );

-- Criar índice para otimizar consultas de processos por representante
create index if not exists idx_processo_partes_representante_entidade
on processo_partes (entidade_id)
where tipo_entidade = 'representante';

-- Registrar também os cadastros_pje para os representantes (se ainda não existirem)
insert into cadastros_pje (
  tipo_entidade,
  entidade_id,
  id_pessoa_pje,
  sistema,
  tribunal,
  grau,
  dados_cadastro_pje,
  created_at,
  updated_at
)
select distinct on (r.id, (rep->>'idPessoa')::bigint, pp.trt, pp.grau)
  'representante'::text as tipo_entidade,
  r.id as entidade_id,
  (rep->>'idPessoa')::bigint as id_pessoa_pje,
  'pje_trt'::text as sistema,
  pp.trt::text as tribunal,
  pp.grau::text as grau,
  jsonb_build_object(
    'nome', rep->>'nome',
    'cpf', rep->>'cpf',
    'numeroOab', rep->>'numeroOab',
    'situacaoOab', rep->>'situacaoOab',
    'email', rep->>'email',
    'emails', rep->'emails'
  ) as dados_cadastro_pje,
  now() as created_at,
  now() as updated_at
from processo_partes pp
cross join lateral jsonb_array_elements(pp.dados_pje_completo->'representantes') as rep
join representantes r on replace(replace(r.cpf, '.', ''), '-', '') = replace(replace(rep->>'cpf', '.', ''), '-', '')
where pp.dados_pje_completo->'representantes' is not null
  and jsonb_array_length(pp.dados_pje_completo->'representantes') > 0
  and (rep->>'idPessoa') is not null
  -- Evitar duplicatas
  and not exists (
    select 1 from cadastros_pje cp
    where cp.tipo_entidade = 'representante'
      and cp.entidade_id = r.id
      and cp.id_pessoa_pje = (rep->>'idPessoa')::bigint
      and cp.sistema = 'pje_trt'
      and cp.tribunal = pp.trt::text
      and cp.grau = pp.grau::text
  );

-- Comentário descritivo
comment on index idx_processo_partes_representante_entidade is
'Índice parcial para otimizar consultas de processos vinculados a representantes';
