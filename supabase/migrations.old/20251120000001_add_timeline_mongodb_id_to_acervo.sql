-- Migration: Adicionar coluna timeline_mongodb_id na tabela acervo
-- Data: 2025-11-20
-- Descrição: Adiciona referência ao documento MongoDB contendo a timeline do processo

-- Adicionar coluna para armazenar ID do documento MongoDB
ALTER TABLE acervo
ADD COLUMN timeline_mongodb_id TEXT;

-- Comentário da coluna
COMMENT ON COLUMN acervo.timeline_mongodb_id IS 'ID do documento da timeline no MongoDB (ObjectId como string)';

-- Criar índice para melhorar performance de queries
CREATE INDEX idx_acervo_timeline_mongodb_id ON acervo(timeline_mongodb_id)
WHERE timeline_mongodb_id IS NOT NULL;

-- Comentário do índice
COMMENT ON INDEX idx_acervo_timeline_mongodb_id IS 'Índice para melhorar performance de queries por timeline_mongodb_id';
