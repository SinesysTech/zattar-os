-- Migration: Add Disk IO Metrics Function (Placeholder for Management API)
-- Created: 2026-01-09

-- Function para obter métricas de Disk IO via Management API
-- (Placeholder - dados reais vêm da Management API via server-side)
create or replace function obter_metricas_disk_io()
returns table (
  disk_io_budget_percent numeric,
  disk_io_consumption_mbps numeric,
  disk_io_limit_mbps numeric,
  disk_iops_consumption numeric,
  disk_iops_limit numeric,
  compute_tier text
) language plpgsql security definer as $$
begin
  -- Esta função é um placeholder
  -- Dados reais são obtidos via Management API no server-side
  return query select 
    0::numeric as disk_io_budget_percent,
    0::numeric as disk_io_consumption_mbps,
    0::numeric as disk_io_limit_mbps,
    0::numeric as disk_iops_consumption,
    0::numeric as disk_iops_limit,
    'unknown'::text as compute_tier;
end;
$$;

comment on function obter_metricas_disk_io is 'Placeholder para métricas de Disk IO (dados reais via Management API)';
