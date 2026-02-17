-- Migration: Add documentos column to clientes and contratos tables
-- Purpose: Store Backblaze folder path for documents

-- Add column to clientes table (pasta geral do cliente)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS documentos TEXT;
COMMENT ON COLUMN clientes.documentos IS 'Path da pasta no Backblaze (ex: clientes/12345678901)';

-- Add column to contratos table (documentos do contrato)
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS documentos TEXT;
COMMENT ON COLUMN contratos.documentos IS 'Path da pasta no Backblaze para documentos do contrato';
