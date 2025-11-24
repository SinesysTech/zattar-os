-- Migration: Adicionar endereco_id FK nas tabelas de partes
-- Data: 2025-11-24
-- Descrição: Remove dependência de endereço em JSONB (dados_anteriores) e
--            adiciona FK para tabela enderecos normalizada

-- ============================================================================
-- 1. Adicionar coluna endereco_id em clientes
-- ============================================================================

ALTER TABLE clientes
ADD COLUMN endereco_id BIGINT REFERENCES enderecos(id) ON DELETE SET NULL;

COMMENT ON COLUMN clientes.endereco_id IS 'FK para endereços.id - Endereço principal do cliente';

-- ============================================================================
-- 2. Adicionar coluna endereco_id em partes_contrarias
-- ============================================================================

ALTER TABLE partes_contrarias
ADD COLUMN endereco_id BIGINT REFERENCES enderecos(id) ON DELETE SET NULL;

COMMENT ON COLUMN partes_contrarias.endereco_id IS 'FK para endereços.id - Endereço principal da parte contrária';

-- ============================================================================
-- 3. Adicionar coluna endereco_id em terceiros
-- ============================================================================

ALTER TABLE terceiros
ADD COLUMN endereco_id BIGINT REFERENCES enderecos(id) ON DELETE SET NULL;

COMMENT ON COLUMN terceiros.endereco_id IS 'FK para endereços.id - Endereço principal do terceiro';

-- Obs: Mantemos a coluna endereco_desconhecido (boolean) que já existe

-- ============================================================================
-- 4. Adicionar coluna endereco_id em representantes
-- ============================================================================

ALTER TABLE representantes
ADD COLUMN endereco_id BIGINT REFERENCES enderecos(id) ON DELETE SET NULL;

COMMENT ON COLUMN representantes.endereco_id IS 'FK para endereços.id - Endereço principal do representante';

-- Obs: Mantemos a coluna endereco_desconhecido (boolean) que já existe

-- ============================================================================
-- 5. Criar índices para performance
-- ============================================================================

CREATE INDEX idx_clientes_endereco_id ON clientes(endereco_id) WHERE endereco_id IS NOT NULL;
CREATE INDEX idx_partes_contrarias_endereco_id ON partes_contrarias(endereco_id) WHERE endereco_id IS NOT NULL;
CREATE INDEX idx_terceiros_endereco_id ON terceiros(endereco_id) WHERE endereco_id IS NOT NULL;
CREATE INDEX idx_representantes_endereco_id ON representantes(endereco_id) WHERE endereco_id IS NOT NULL;

-- ============================================================================
-- Notas:
-- ============================================================================
-- 1. ON DELETE SET NULL: Se um endereço for deletado, a FK vira NULL (não bloqueia)
-- 2. Índices parciais (WHERE ... IS NOT NULL): Economizam espaço, indexam apenas registros com endereço
-- 3. endereco_desconhecido: Flag mantida em terceiros/representantes (info do PJE)
-- 4. dados_anteriores: Mantido para auditoria/histórico, mas endereço estruturado vai para tabela separada
-- 5. Tabelas vazias: Sem necessidade de migração de dados
