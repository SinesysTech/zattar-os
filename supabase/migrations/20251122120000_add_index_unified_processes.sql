-- Migration: Add composite index for unified process grouping
-- Change: unify-multi-instance-processes
-- Purpose: Optimize queries that group processes by numero_processo and select the most recent instance

-- Create composite index (numero_processo, updated_at DESC)
-- This index supports:
-- 1. GROUP BY numero_processo queries
-- 2. Selecting the principal instance (MAX(updated_at) within each group)
-- 3. Efficient sorting of unified processes
create index if not exists idx_acervo_numero_updated
on public.acervo(numero_processo, updated_at desc);

comment on index idx_acervo_numero_updated is 'Composite index for unified process grouping: optimizes GROUP BY numero_processo and selection of principal instance (most recent updated_at)';
