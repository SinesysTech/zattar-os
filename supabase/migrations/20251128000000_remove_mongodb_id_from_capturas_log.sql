-- Migration: Remove mongodb_id column from capturas_log
-- Reason: Column was added but never used; MongoDB IDs are stored in resultado.mongodb_ids (JSONB array)

-- UP: Remove the unused mongodb_id column and its index
ALTER TABLE public.capturas_log DROP COLUMN IF EXISTS mongodb_id;
DROP INDEX IF EXISTS idx_capturas_log_mongodb_id;

-- Update comment on resultado column to clarify mongodb_ids usage
COMMENT ON COLUMN public.capturas_log.resultado IS 'Resultado da captura em formato JSONB (dados capturados, estatísticas, etc). IDs dos documentos MongoDB são armazenados em mongodb_ids (array de strings)';

-- DOWN: Revert by adding back the column and index (for rollback)
-- ALTER TABLE public.capturas_log ADD COLUMN mongodb_id TEXT;
-- COMMENT ON COLUMN public.capturas_log.mongodb_id IS 'ID do documento no MongoDB (collection captura_logs_brutos) contendo o JSON bruto da raspagem';
-- CREATE INDEX idx_capturas_log_mongodb_id ON public.capturas_log USING BTREE (mongodb_id);