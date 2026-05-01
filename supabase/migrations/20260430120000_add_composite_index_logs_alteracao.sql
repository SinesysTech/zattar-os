-- Composite index for the most common query pattern: filter by tipo_entidade + entidade_id simultaneously.
-- The existing separate indexes on each column force a bitmap-AND scan; this composite index makes
-- the timeline audit query O(log n) instead of a full scan on large tables.
create index if not exists idx_logs_alteracao_tipo_entidade_id
  on public.logs_alteracao(tipo_entidade, entidade_id);
