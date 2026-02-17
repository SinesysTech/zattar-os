-- Migration: Adicionar coluna arquivo_file_id na tabela pendentes_manifestacao
-- Permite armazenar o ID do arquivo no Google Drive para referência direta

-- Adicionar coluna para ID do arquivo no Google Drive
ALTER TABLE public.pendentes_manifestacao
ADD COLUMN arquivo_file_id TEXT;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.pendentes_manifestacao.arquivo_file_id IS 'ID do arquivo no Google Drive (file_id retornado pelo webhook N8N)';

-- Adicionar índice para facilitar buscas por file_id
CREATE INDEX idx_pendentes_arquivo_file_id ON public.pendentes_manifestacao USING btree (arquivo_file_id) 
WHERE arquivo_file_id IS NOT NULL;
