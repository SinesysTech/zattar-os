-- ============================================================================
-- Migration: Função de Diagnóstico de Bloat
-- Created: 2026-01-10
-- Description: Cria função RPC para diagnosticar bloat e dead tuples
-- Related: Disk IO Budget optimization (Phase 7 - VACUUM Maintenance)
-- ============================================================================

create or replace function public.diagnosticar_bloat_tabelas()
returns table (
  tabela text,
  tamanho_total text,
  dead_tuples bigint,
  live_tuples bigint,
  bloat_percent numeric,
  last_vacuum timestamp with time zone,
  last_autovacuum timestamp with time zone,
  requer_vacuum boolean
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $
begin
  return query
  select 
    schemaname || '.' || relname as tabela,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || relname)) as tamanho_total,
    n_dead_tup as dead_tuples,
    n_live_tup as live_tuples,
    case 
      when n_live_tup > 0 then round((n_dead_tup::numeric / n_live_tup::numeric) * 100, 2)
      else 0
    end as bloat_percent,
    last_vacuum,
    last_autovacuum,
    case 
      when n_live_tup > 0 and (n_dead_tup::numeric / n_live_tup::numeric) > 0.2 then true
      else false
    end as requer_vacuum
  from pg_stat_user_tables
  where schemaname = 'public'
    and relname in ('acervo', 'audiencias', 'notificacoes', 'mensagens_chat', 
                    'embeddings_conhecimento', 'embeddings', 'clientes', 
                    'partes_contrarias', 'terceiros')
  order by n_dead_tup desc;
end;
$;

comment on function public.diagnosticar_bloat_tabelas is 
  'Retorna estatísticas de bloat e dead tuples para tabelas críticas. Requer_vacuum=true quando bloat >20%';

-- Grant para authenticated users (apenas leitura)
grant execute on function public.diagnosticar_bloat_tabelas to authenticated;
