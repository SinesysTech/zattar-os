-- Funcoes para monitoramento de Disk I/O e cache

-- Funcao: obter_cache_hit_rate
create or replace function public.obter_cache_hit_rate()
returns table (
  name text,
  ratio numeric
)
language sql
security definer
as $$
  select 'index hit rate' as name,
         (sum(idx_blks_hit)) / nullif(sum(idx_blks_hit + idx_blks_read), 0) * 100 as ratio
  from pg_statio_user_indexes
  union all
  select 'table hit rate' as name,
         sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100 as ratio
  from pg_statio_user_tables;
$$;

comment on function public.obter_cache_hit_rate() is 'Retorna cache hit rate de indices e tabelas';

-- Funcao: obter_queries_lentas (requer pg_stat_statements habilitado)
create or replace function public.obter_queries_lentas(p_limite int default 20)
returns table (
  rolname text,
  query text,
  calls bigint,
  total_time numeric,
  max_time numeric
)
language sql
security definer
as $$
  select
    auth.rolname::text,
    statements.query::text,
    statements.calls,
    (statements.total_exec_time + statements.total_plan_time)::numeric as total_time,
    (statements.max_exec_time + statements.max_plan_time)::numeric as max_time
  from pg_stat_statements as statements
  inner join pg_authid as auth on statements.userid = auth.oid
  order by max_time desc
  limit p_limite;
$$;

comment on function public.obter_queries_lentas(int) is 'Retorna top N queries mais lentas via pg_stat_statements';

-- Funcao: obter_tabelas_sequential_scan
create or replace function public.obter_tabelas_sequential_scan(p_limite int default 20)
returns table (
  relname text,
  seq_scan bigint,
  seq_tup_read bigint,
  idx_scan bigint,
  avg_seq_tup numeric,
  n_live_tup bigint
)
language sql
security definer
as $$
  select
    relname::text,
    seq_scan,
    seq_tup_read,
    idx_scan,
    (seq_tup_read / nullif(seq_scan, 0))::numeric as avg_seq_tup,
    n_live_tup
  from pg_stat_user_tables
  where seq_scan > 0
  order by seq_tup_read desc
  limit p_limite;
$$;

comment on function public.obter_tabelas_sequential_scan(int) is 'Retorna tabelas com muitos sequential scans (candidatas a indices)';

-- Funcao: obter_indices_nao_utilizados
create or replace function public.obter_indices_nao_utilizados()
returns table (
  relname text,
  indexrelname text,
  idx_scan bigint,
  idx_tup_read bigint,
  idx_tup_fetch bigint
)
language sql
security definer
as $$
  select
    psui.relname::text,
    psui.indexrelname::text,
    psui.idx_scan,
    psui.idx_tup_read,
    psui.idx_tup_fetch
  from pg_stat_user_indexes psui
  join pg_index idx on psui.indexrelid = idx.indexrelid
  where psui.idx_scan = 0
    and idx.indisunique = false
    and idx.indisprimary = false
  order by psui.relname asc, psui.indexrelname asc;
$$;

comment on function public.obter_indices_nao_utilizados() is 'Retorna indices com idx_scan = 0 (exceto primarios e unicos)';
