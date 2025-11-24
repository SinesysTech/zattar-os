-- Migration: Fix representantes fields naming
-- Description: Rename fields for consistency with other tables (ddd_telefone/numero_telefone -> ddd_residencial/numero_residencial, dados_pje_completo -> dados_anteriores)

-- Rename ddd_telefone to ddd_residencial
ALTER TABLE representantes RENAME COLUMN ddd_telefone TO ddd_residencial;

-- Rename numero_telefone to numero_residencial
ALTER TABLE representantes RENAME COLUMN numero_telefone TO numero_residencial;

-- Rename dados_pje_completo to dados_anteriores
ALTER TABLE representantes RENAME COLUMN dados_pje_completo TO dados_anteriores;

-- Update comment for dados_anteriores
COMMENT ON COLUMN representantes.dados_anteriores IS 'Previous state of the record for auditing purposes (not to be confused with PJE data)';