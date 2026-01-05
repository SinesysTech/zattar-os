-- Migration: Add documentos column to clientes table
-- Purpose: Store Backblaze folder path for client documents

-- Add column to clientes table
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS documentos TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN clientes.documentos IS 'Path da pasta no Backblaze (ex: clientes/12345678901)';

-- Also add to partes_contrarias for consistency (future use)
ALTER TABLE partes_contrarias ADD COLUMN IF NOT EXISTS documentos TEXT;
COMMENT ON COLUMN partes_contrarias.documentos IS 'Path da pasta no Backblaze (ex: partes_contrarias/12345678901)';
