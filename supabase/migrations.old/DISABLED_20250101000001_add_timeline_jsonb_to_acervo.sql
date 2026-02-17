-- Migration: Adicionar coluna timeline_jsonb na tabela acervo
-- Data: 2025-01-01
-- Descrição: Adiciona coluna JSONB para armazenar timeline do processo diretamente no PostgreSQL

-- Adicionar coluna JSONB para timeline
ALTER TABLE acervo
ADD COLUMN timeline_jsonb JSONB DEFAULT NULL;

-- Comentário da coluna
COMMENT ON COLUMN acervo.timeline_jsonb IS 'Timeline do processo em formato JSONB. Estrutura: {"timeline": [...], "metadata": {"totalDocumentos": 0, "totalMovimentos": 0, "totalDocumentosBaixados": 0, "capturadoEm": "ISO8601", "schemaVersion": 1}}';

-- Criar índice GIN para queries eficientes no JSONB
CREATE INDEX idx_acervo_timeline_jsonb ON acervo USING GIN (timeline_jsonb);

-- Comentário do índice
COMMENT ON INDEX idx_acervo_timeline_jsonb IS 'Índice GIN para queries eficientes em timeline_jsonb (busca por campos internos do JSON)';

-- Adicionar constraint de validação estrutural do JSONB
ALTER TABLE acervo ADD CONSTRAINT acervo_timeline_jsonb_struct_chk CHECK (
  timeline_jsonb IS NULL
  OR (
    jsonb_typeof(timeline_jsonb) = 'object'
    AND jsonb_typeof(timeline_jsonb->'timeline') = 'array'
    AND jsonb_typeof(timeline_jsonb->'metadata') = 'object'
    AND jsonb_typeof(timeline_jsonb->'metadata'->'totalDocumentos') = 'number'
    AND jsonb_typeof(timeline_jsonb->'metadata'->'totalMovimentos') = 'number'
    AND jsonb_typeof(timeline_jsonb->'metadata'->'totalDocumentosBaixados') = 'number'
    AND jsonb_typeof(timeline_jsonb->'metadata'->'capturadoEm') = 'string'
    AND jsonb_typeof(timeline_jsonb->'metadata'->'schemaVersion') = 'number'
  )
);

-- Comentário do constraint
COMMENT ON CONSTRAINT acervo_timeline_jsonb_struct_chk ON acervo IS 'Valida estrutura mínima do timeline_jsonb: objeto com timeline (array) e metadata (objeto com campos obrigatórios)';
