-- Migration: Criar tabela de distributed locks
-- Propósito: Prevenir capturas concorrentes do mesmo processo
-- Data: 2025-11-25

-- Criar tabela locks
CREATE TABLE IF NOT EXISTS locks (
  key TEXT PRIMARY KEY,
  lock_id UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Índice para limpeza de locks expirados
CREATE INDEX IF NOT EXISTS idx_locks_expires_at ON locks(expires_at);

-- Índice para busca por padrão de chave
CREATE INDEX IF NOT EXISTS idx_locks_key_pattern ON locks(key text_pattern_ops);

-- Função para limpar locks expirados automaticamente
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM locks WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger para limpar locks expirados periodicamente (via pg_cron ou job externo)
-- Nota: pg_cron precisa ser habilitado no Supabase
-- SELECT cron.schedule('cleanup-locks', '*/5 * * * *', 'SELECT cleanup_expired_locks()');

-- Comentários
COMMENT ON TABLE locks IS 'Distributed locks para prevenir operações concorrentes';
COMMENT ON COLUMN locks.key IS 'Chave única do lock (ex: captura:processo:123)';
COMMENT ON COLUMN locks.lock_id IS 'UUID único do lock para validação';
COMMENT ON COLUMN locks.expires_at IS 'Timestamp de expiração do lock (TTL)';
COMMENT ON COLUMN locks.created_at IS 'Timestamp de criação do lock';
COMMENT ON COLUMN locks.metadata IS 'Metadados adicionais (ex: processo_id, advogado_id)';

-- RLS (Row Level Security)
-- Nota: Locks são gerenciados apenas pelo service role, não por usuários
ALTER TABLE locks ENABLE ROW LEVEL SECURITY;

-- Policy: Service role pode fazer tudo
CREATE POLICY "Service role can manage locks"
  ON locks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Inserir lock de exemplo (remover em produção)
-- INSERT INTO locks (key, lock_id, expires_at, metadata)
-- VALUES (
--   'captura:processo:example',
--   gen_random_uuid(),
--   NOW() + INTERVAL '5 minutes',
--   '{"processo_id": 123, "advogado_id": 1}'
-- );

-- Rollback (se necessário):
-- Remover policies
-- DROP POLICY IF EXISTS "Service role can manage locks" ON locks;
-- 
-- Remover função
-- DROP FUNCTION IF EXISTS cleanup_expired_locks();
-- 
-- Remover índices
-- DROP INDEX IF EXISTS idx_locks_expires_at;
-- DROP INDEX IF EXISTS idx_locks_key_pattern;
-- 
-- Remover tabela
-- DROP TABLE IF EXISTS locks;