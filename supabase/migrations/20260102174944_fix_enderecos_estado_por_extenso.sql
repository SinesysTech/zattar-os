-- ============================================================================
-- migration: fix_enderecos_estado_por_extenso
-- created_at (utc): 2026-01-02t17:49:44z
--
-- purpose:
-- - corrigir casos residuais em public.enderecos onde o trecho "municipio/estado"
--   foi salvo com estado por extenso (ex: "Belo Horizonte/MINAS GERAIS-09400-234"),
--   impedindo o parse por UF (2 letras).
--
-- scope:
-- - tabela: public.enderecos (data fix / dml)
--
-- safety:
-- - atua apenas quando numero/bairro/municipio/estado_sigla estão vazios e logradouro contém CEP
-- - só atualiza quando conseguir mapear estado por extenso -> UF
-- - não sobrescreve campos já preenchidos (null ou string vazia)
-- ============================================================================

begin;

with candidates as (
  select
    public.enderecos.id,
    public.enderecos.logradouro,
    regexp_split_to_array(public.enderecos.logradouro, '[[:space:]]*,[[:space:]]*') as parts,
    regexp_match(public.enderecos.logradouro, '([0-9]{5})-?([0-9]{3})') as cep_match
  from public.enderecos
  where public.enderecos.logradouro is not null
    and btrim(public.enderecos.logradouro) <> ''
    and public.enderecos.logradouro ~* '([0-9]{5})-?([0-9]{3})'
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
      where candidates.parts[i] ~* '/[[:space:]]*[^,]+-[0-9]{5}-?[0-9]{3}'
        and candidates.parts[i] !~* '/[[:space:]]*[a-z]{2}([[:space:]]|-|,|$)'
    ) as idx_mun
  from candidates
),
parsed as (
  select
    mun_idx.id,
    case
      when mun_idx.parts[1] ~ '^[[:space:]]*[0-9]+[[:space:]]*$' and mun_idx.parts[2] is not null
        then nullif(btrim(mun_idx.parts[2]), '')
      else nullif(btrim(mun_idx.parts[1]), '')
    end as logradouro_new,
    case
      when mun_idx.parts[1] ~ '^[[:space:]]*[0-9]+[[:space:]]*$'
        then nullif(btrim(mun_idx.parts[1]), '')
      else nullif(
        btrim(
          regexp_replace(
            coalesce(mun_idx.parts[2], ''),
            '^[[:space:]]*(?:n[º°o]?|no|n|numero)[[:space:]]*',
            '',
            'i'
          )
        ),
        ''
      )
    end as numero_new,
    nullif(btrim(regexp_replace(mun_idx.parts[mun_idx.idx_mun], '[[:space:]]*/.*$', '', 'i')), '') as municipio_new,
    nullif(
      btrim(
        regexp_replace(
          regexp_replace(mun_idx.parts[mun_idx.idx_mun], '^.*?/[[:space:]]*', '', 'i'),
          '-[0-9]{5}-?[0-9]{3}.*$',
          '',
          'i'
        )
      ),
      ''
    ) as estado_full_new,
    case
      when upper(btrim(regexp_replace(regexp_replace(mun_idx.parts[mun_idx.idx_mun], '^.*?/[[:space:]]*', '', 'i'), '-[0-9]{5}-?[0-9]{3}.*$', '', 'i'))) in ('MINAS GERAIS') then 'MG'
      when upper(btrim(regexp_replace(regexp_replace(mun_idx.parts[mun_idx.idx_mun], '^.*?/[[:space:]]*', '', 'i'), '-[0-9]{5}-?[0-9]{3}.*$', '', 'i'))) in ('DISTRITO FEDERAL') then 'DF'
      when upper(btrim(regexp_replace(regexp_replace(mun_idx.parts[mun_idx.idx_mun], '^.*?/[[:space:]]*', '', 'i'), '-[0-9]{5}-?[0-9]{3}.*$', '', 'i'))) in ('PARA', 'PARÁ') then 'PA'
      when upper(btrim(regexp_replace(regexp_replace(mun_idx.parts[mun_idx.idx_mun], '^.*?/[[:space:]]*', '', 'i'), '-[0-9]{5}-?[0-9]{3}.*$', '', 'i'))) in ('PARAIBA', 'PARAÍBA') then 'PB'
      else null
    end as estado_sigla_new,
    case
      when mun_idx.idx_mun is not null and mun_idx.idx_mun > 1
        then nullif(btrim(regexp_replace(mun_idx.parts[mun_idx.idx_mun - 1], '^[[:space:]]*bairro[[:space:]]+', '', 'i')), '')
      else null
    end as bairro_new,
    case
      when mun_idx.cep_match is not null
        then (mun_idx.cep_match[1] || '-' || mun_idx.cep_match[2])
      else null
    end as cep_new
  from mun_idx
  where mun_idx.idx_mun is not null
)
update public.enderecos
set
  logradouro = coalesce(parsed.logradouro_new, public.enderecos.logradouro),
  numero = coalesce(nullif(btrim(public.enderecos.numero), ''), parsed.numero_new),
  bairro = coalesce(nullif(btrim(public.enderecos.bairro), ''), parsed.bairro_new),
  municipio = coalesce(nullif(btrim(public.enderecos.municipio), ''), parsed.municipio_new),
  estado_sigla = coalesce(nullif(btrim(public.enderecos.estado_sigla), ''), parsed.estado_sigla_new),
  estado = coalesce(nullif(btrim(public.enderecos.estado), ''), parsed.estado_full_new),
  cep = coalesce(nullif(btrim(public.enderecos.cep), ''), parsed.cep_new),
  updated_at = now()
from parsed
where public.enderecos.id = parsed.id
  and parsed.municipio_new is not null
  and parsed.estado_sigla_new is not null
  and parsed.cep_new is not null;

commit;


