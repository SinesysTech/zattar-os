-- ============================================================================
-- Funções Auxiliares para Tabela Acervo
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: random_acervo_sample
-- ----------------------------------------------------------------------------
-- Retorna uma amostra aleatória de registros da tabela acervo.
-- Usado para validação e benchmark de migrations da timeline.
--
-- Parâmetros:
--   limit_n: Número de registros a retornar
--
-- Retorna: setof acervo (conjunto de linhas da tabela acervo)
-- ----------------------------------------------------------------------------

create or replace function public.random_acervo_sample(limit_n integer)
returns setof public.acervo
language sql
security invoker
set search_path = ''
stable
as $$
  select *
  from public.acervo
  order by random()
  limit limit_n;
$$;

comment on function public.random_acervo_sample(integer) is 'Retorna uma amostra aleatória de registros da tabela acervo. Usado para validação e benchmark de migrations da timeline.';

