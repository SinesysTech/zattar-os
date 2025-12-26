-- Migration: Create MCP Audit Log Table
-- Created: 2025-12-26
-- Description: Tabela para auditoria de chamadas MCP

-- =============================================================================
-- TABELA DE AUDITORIA MCP
-- =============================================================================

CREATE TABLE IF NOT EXISTS mcp_audit_log (
  id BIGSERIAL PRIMARY KEY,
  tool_name VARCHAR(255) NOT NULL,
  usuario_id BIGINT REFERENCES usuarios(id),
  arguments JSONB,
  result JSONB,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  duration_ms INTEGER,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ÍNDICES
-- =============================================================================

-- Índice para busca por ferramenta
CREATE INDEX idx_mcp_audit_tool_name ON mcp_audit_log(tool_name);

-- Índice para busca por usuário
CREATE INDEX idx_mcp_audit_usuario ON mcp_audit_log(usuario_id);

-- Índice para busca por data (importante para limpeza e relatórios)
CREATE INDEX idx_mcp_audit_created_at ON mcp_audit_log(created_at);

-- Índice composto para queries comuns
CREATE INDEX idx_mcp_audit_tool_created ON mcp_audit_log(tool_name, created_at DESC);

-- Índice para filtrar por sucesso/falha
CREATE INDEX idx_mcp_audit_success ON mcp_audit_log(success) WHERE NOT success;

-- =============================================================================
-- TABELA DE QUOTAS MCP (para rate limiting avançado)
-- =============================================================================

CREATE TABLE IF NOT EXISTS mcp_quotas (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT REFERENCES usuarios(id),
  tier VARCHAR(50) NOT NULL DEFAULT 'authenticated',
  calls_today INTEGER NOT NULL DEFAULT 0,
  calls_month INTEGER NOT NULL DEFAULT 0,
  last_call_at TIMESTAMPTZ,
  quota_reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(usuario_id)
);

-- Índice para busca por tier
CREATE INDEX idx_mcp_quotas_tier ON mcp_quotas(tier);

-- =============================================================================
-- FUNÇÕES AUXILIARES
-- =============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_mcp_quotas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_mcp_quotas_updated_at ON mcp_quotas;
CREATE TRIGGER trigger_update_mcp_quotas_updated_at
  BEFORE UPDATE ON mcp_quotas
  FOR EACH ROW
  EXECUTE FUNCTION update_mcp_quotas_updated_at();

-- Função para limpar registros antigos de auditoria (manter últimos 90 dias)
CREATE OR REPLACE FUNCTION cleanup_old_mcp_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM mcp_audit_log
  WHERE created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- RLS (Row Level Security)
-- =============================================================================

-- Habilitar RLS
ALTER TABLE mcp_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_quotas ENABLE ROW LEVEL SECURITY;

-- Políticas para mcp_audit_log (apenas admin pode ver)
CREATE POLICY mcp_audit_log_admin_select ON mcp_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.auth_user_id = auth.uid()
      AND u.role IN ('admin', 'superadmin')
    )
  );

-- Políticas para mcp_quotas (usuário vê próprias quotas, admin vê todas)
CREATE POLICY mcp_quotas_user_select ON mcp_quotas
  FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM usuarios WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.auth_user_id = auth.uid()
      AND u.role IN ('admin', 'superadmin')
    )
  );

-- Service role pode fazer tudo (para operações internas)
CREATE POLICY mcp_audit_log_service_all ON mcp_audit_log
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY mcp_quotas_service_all ON mcp_quotas
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- COMENTÁRIOS
-- =============================================================================

COMMENT ON TABLE mcp_audit_log IS 'Registro de auditoria de todas as chamadas ao servidor MCP';
COMMENT ON TABLE mcp_quotas IS 'Quotas e limites de uso do MCP por usuário';

COMMENT ON COLUMN mcp_audit_log.tool_name IS 'Nome da ferramenta MCP chamada';
COMMENT ON COLUMN mcp_audit_log.arguments IS 'Argumentos passados para a ferramenta';
COMMENT ON COLUMN mcp_audit_log.result IS 'Resultado retornado pela ferramenta';
COMMENT ON COLUMN mcp_audit_log.success IS 'Indica se a chamada foi bem sucedida';
COMMENT ON COLUMN mcp_audit_log.duration_ms IS 'Duração da execução em milissegundos';

COMMENT ON COLUMN mcp_quotas.tier IS 'Tier do usuário: anonymous, authenticated, service';
COMMENT ON COLUMN mcp_quotas.calls_today IS 'Número de chamadas realizadas hoje';
COMMENT ON COLUMN mcp_quotas.calls_month IS 'Número de chamadas realizadas no mês';
