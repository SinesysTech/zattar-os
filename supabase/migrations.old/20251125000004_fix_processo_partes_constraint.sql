-- Migration: Fix processo_partes unique constraint
-- This migration corrects the unique constraint on processo_partes table
--
-- PROBLEM: The table currently has constraint on (processo_id, id_pje, trt, grau)
--          but the code expects constraint on (processo_id, tipo_entidade, entidade_id, grau)
--
-- SOLUTION: Drop the incorrect constraint and add the correct one
--
-- This allows proper upsert operations in the partes capture logic

-- Drop the incorrect unique constraint
ALTER TABLE public.processo_partes
  DROP CONSTRAINT IF EXISTS processo_partes_processo_id_id_pje_trt_grau_key;

-- Add the correct unique constraint (as originally intended in the create migration)
-- This prevents duplicate entity participation in the same process-degree combination
ALTER TABLE public.processo_partes
  ADD CONSTRAINT unique_processo_entidade_grau
  UNIQUE (processo_id, tipo_entidade, entidade_id, grau);

-- Update table comment to match the original migration intent
COMMENT ON TABLE public.processo_partes IS 'N:N relationship table between processes (acervo) and entities (clients/opposing parties/third parties). Each record represents a unique participation in a process-degree combination.';
