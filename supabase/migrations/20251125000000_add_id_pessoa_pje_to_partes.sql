-- Migration: Adicionar id_pessoa_pje às tabelas de partes
-- Data: 2025-11-25
-- Descrição: Adiciona campo id_pessoa_pje para deduplicação de dados capturados do PJE.
--            Campo nullable para permitir registros criados manualmente (sem origem PJE).
--            Constraint UNIQUE evita duplicatas. Índices parciais para performance.

-- ============================================================================
-- 1. Adicionar coluna id_pessoa_pje em clientes
-- ============================================================================

ALTER TABLE clientes
ADD COLUMN id_pessoa_pje INTEGER UNIQUE;

COMMENT ON COLUMN clientes.id_pessoa_pje IS 'ID da pessoa no sistema PJE. Usado para deduplicação em capturas. UNIQUE constraint garante que não há duplicatas. Null para clientes criados manualmente.';

-- ============================================================================
-- 2. Adicionar coluna id_pessoa_pje em partes_contrarias
-- ============================================================================

ALTER TABLE partes_contrarias
ADD COLUMN id_pessoa_pje INTEGER UNIQUE;

COMMENT ON COLUMN partes_contrarias.id_pessoa_pje IS 'ID da pessoa no sistema PJE. Usado para deduplicação em capturas. UNIQUE constraint garante que não há duplicatas. Null para partes contrárias criadas manualmente.';

-- ============================================================================
-- 3. Adicionar coluna id_pessoa_pje em terceiros
-- ============================================================================

ALTER TABLE terceiros
ADD COLUMN id_pessoa_pje INTEGER UNIQUE;

COMMENT ON COLUMN terceiros.id_pessoa_pje IS 'ID da pessoa no sistema PJE. Usado para deduplicação em capturas. UNIQUE constraint garante que não há duplicatas. Null para terceiros criados manualmente.';

-- ============================================================================
-- 4. Criar índices para performance
-- ============================================================================

CREATE INDEX idx_clientes_id_pessoa_pje ON clientes(id_pessoa_pje) WHERE id_pessoa_pje IS NOT NULL;
CREATE INDEX idx_partes_contrarias_id_pessoa_pje ON partes_contrarias(id_pessoa_pje) WHERE id_pessoa_pje IS NOT NULL;
CREATE INDEX idx_terceiros_id_pessoa_pje ON terceiros(id_pessoa_pje) WHERE id_pessoa_pje IS NOT NULL;

-- ============================================================================
-- Notas:
-- ============================================================================
-- 1. Campo nullable: Permite registros sem origem PJE (criados manualmente).
-- 2. UNIQUE constraint: Garante deduplicação automática no banco.
-- 3. Índices parciais: Economizam espaço, indexam apenas registros com id_pessoa_pje preenchido.
-- 4. Tabelas vazias: Sem necessidade de migração de dados existentes.