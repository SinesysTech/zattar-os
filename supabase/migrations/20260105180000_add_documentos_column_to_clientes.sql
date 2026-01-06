-- Migration: Add documentos column to clientes and processos tables
-- Purpose: Store Backblaze folder path for documents

-- Add column to clientes table (documentos do cliente)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS documentos TEXT;
COMMENT ON COLUMN clientes.documentos IS 'Path da pasta no Backblaze (ex: clientes/12345678901)';

-- Add column to processos table (documentos do processo)
ALTER TABLE processos ADD COLUMN IF NOT EXISTS documentos TEXT;
COMMENT ON COLUMN processos.documentos IS 'Path da pasta no Backblaze para documentos do processo';
