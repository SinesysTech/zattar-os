-- ============================================================================
-- migration: fix_enderecos_logradouro_composto
-- created_at (utc): 2026-01-02t17:36:32z
--
-- purpose:
-- - corrigir registros em public.enderecos onde um "endereço completo" foi salvo
--   indevidamente na coluna logradouro, deixando os demais campos (numero, bairro,
--   municipio, estado_sigla, cep) vazios.
--
-- scope:
-- - tabela: public.enderecos (data fix / dml)
--
-- safety:
-- - atualiza apenas linhas "suspeitas" (campos principais vazios e logradouro contendo cep)
-- - não sobrescreve campos já preenchidos (usa coalesce para preencher apenas nulos/vazios)
-- - só atualiza quando conseguir extrair município/uf/cep/logradouro de forma consistente
-- ============================================================================

begin;

with candidates as (
  select
    public.enderecos.id,
    public.enderecos.logradouro,
    regexp_split_to_array(public.enderecos.logradouro, '\\s*,\\s*') as parts,
    regexp_match(public.enderecos.logradouro, '(\\d{5})-?(\\d{3})') as cep_match
  from public.enderecos
  where public.enderecos.logradouro is not null
    and btrim(public.enderecos.logradouro) <> ''
    and public.enderecos.logradouro ~* '(cep\\s*[:\\-]?\\s*)?\\d{5}-?\\d{3}'
    and (public.enderecos.numero is null or btrim(public.enderecos.numero) = '')
    and (public.enderecos.bairro is null or btrim(public.enderecos.bairro) = '')
    and (public.enderecos.municipio is null or btrim(public.enderecos.municipio) = '')
    and (public.enderecos.estado_sigla is null or btrim(public.enderecos.estado_sigla) = '')
),
mun_idx as (
  select
    candidates.*,
    (
      select min(i)
      from generate_subscripts(candidates.parts, 1) as i
      where candidates.parts[i] ~* '/\\s*[a-z]{2}(\\b|\\s|\\-|,|$)'
    ) as idx_mun
  from candidates
),
parsed as (
  select
    mun_idx.id,
    nullif(btrim(mun_idx.parts[1]), '') as logradouro_new,
    nullif(
      btrim(
        regexp_replace(
          coalesce(mun_idx.parts[2], ''),
          '^\\s*(?:n[º°o]?|no|n|numero)\\s*',
          '',
          'i'
        )
      ),
      ''
    ) as numero_new,
    case
      when mun_idx.idx_mun is not null
      then nullif(btrim(regexp_replace(mun_idx.parts[mun_idx.idx_mun], '\\s*/\\s*[a-z]{2}.*$', '', 'i')), '')
      else null
    end as municipio_new,
    case
      when mun_idx.idx_mun is not null
      then upper((regexp_match(mun_idx.parts[mun_idx.idx_mun], '/\\s*([a-z]{2})', 'i'))[1])
      else null
    end as estado_sigla_new,
    case
      when mun_idx.idx_mun is not null and mun_idx.idx_mun > 1
      then nullif(btrim(regexp_replace(mun_idx.parts[mun_idx.idx_mun - 1], '^bairro\\s+', '', 'i')), '')
      else null
    end as bairro_new,
    case
      when mun_idx.cep_match is not null
      then (mun_idx.cep_match[1] || '-' || mun_idx.cep_match[2])
      else null
    end as cep_new,
    case
      when mun_idx.idx_mun is not null and (mun_idx.idx_mun - 2) >= 3
      then nullif(
        btrim(
          regexp_replace(
            array_to_string(mun_idx.parts[3:(mun_idx.idx_mun - 2)], ', '),
            '^bairro\\s+',
            '',
            'i'
          )
        ),
        ''
      )
      else null
    end as complemento_new
  from mun_idx
  where mun_idx.idx_mun is not null
)
update public.enderecos
set
  logradouro = coalesce(parsed.logradouro_new, public.enderecos.logradouro),
  numero = coalesce(nullif(btrim(public.enderecos.numero), ''), parsed.numero_new),
  complemento = coalesce(nullif(btrim(public.enderecos.complemento), ''), parsed.complemento_new),
  bairro = coalesce(nullif(btrim(public.enderecos.bairro), ''), parsed.bairro_new),
  municipio = coalesce(nullif(btrim(public.enderecos.municipio), ''), parsed.municipio_new),
  estado_sigla = coalesce(nullif(btrim(public.enderecos.estado_sigla), ''), parsed.estado_sigla_new),
  cep = coalesce(nullif(btrim(public.enderecos.cep), ''), parsed.cep_new),
  updated_at = now()
from parsed
where public.enderecos.id = parsed.id
  and parsed.logradouro_new is not null
  and parsed.municipio_new is not null
  and parsed.estado_sigla_new is not null
  and parsed.cep_new is not null;

commit;


