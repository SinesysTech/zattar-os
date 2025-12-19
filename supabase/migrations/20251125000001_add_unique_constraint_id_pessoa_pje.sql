-- Migration: Add UNIQUE constraint to id_pessoa_pje in partes tables
-- Data: 2025-11-25
-- Descrição: Adiciona constraint UNIQUE ao campo id_pessoa_pje que já existe nas tabelas.
--            Safe migration: verifica se a constraint já existe antes de criar.
--            Inclui índices parciais para performance.

-- ============================================================================
-- Safety checks: Verify no duplicates exist before adding constraint
-- ============================================================================

-- Check for duplicates in clientes
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT id_pessoa_pje, COUNT(*) as count
    FROM clientes
    WHERE id_pessoa_pje IS NOT NULL
    GROUP BY id_pessoa_pje
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Found % duplicate id_pessoa_pje values in clientes table. Clean up duplicates before running this migration.', duplicate_count;
  END IF;
END $$;

-- Check for duplicates in partes_contrarias
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT id_pessoa_pje, COUNT(*) as count
    FROM partes_contrarias
    WHERE id_pessoa_pje IS NOT NULL
    GROUP BY id_pessoa_pje
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Found % duplicate id_pessoa_pje values in partes_contrarias table. Clean up duplicates before running this migration.', duplicate_count;
  END IF;
END $$;

-- Check for duplicates in terceiros
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT id_pessoa_pje, COUNT(*) as count
    FROM terceiros
    WHERE id_pessoa_pje IS NOT NULL
    GROUP BY id_pessoa_pje
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Found % duplicate id_pessoa_pje values in terceiros table. Clean up duplicates before running this migration.', duplicate_count;
  END IF;
END $$;

-- ============================================================================
-- 1. Add UNIQUE constraint to clientes.id_pessoa_pje (if not exists)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'clientes_id_pessoa_pje_key'
    AND table_name = 'clientes'
  ) THEN
    ALTER TABLE clientes
    ADD CONSTRAINT clientes_id_pessoa_pje_key UNIQUE (id_pessoa_pje);

    RAISE NOTICE 'Added UNIQUE constraint to clientes.id_pessoa_pje';
  ELSE
    RAISE NOTICE 'UNIQUE constraint already exists on clientes.id_pessoa_pje';
  END IF;
END $$;

-- ============================================================================
-- 2. Add UNIQUE constraint to partes_contrarias.id_pessoa_pje (if not exists)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'partes_contrarias_id_pessoa_pje_key'
    AND table_name = 'partes_contrarias'
  ) THEN
    ALTER TABLE partes_contrarias
    ADD CONSTRAINT partes_contrarias_id_pessoa_pje_key UNIQUE (id_pessoa_pje);

    RAISE NOTICE 'Added UNIQUE constraint to partes_contrarias.id_pessoa_pje';
  ELSE
    RAISE NOTICE 'UNIQUE constraint already exists on partes_contrarias.id_pessoa_pje';
  END IF;
END $$;

-- ============================================================================
-- 3. Add UNIQUE constraint to terceiros.id_pessoa_pje (if not exists)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'terceiros_id_pessoa_pje_key'
    AND table_name = 'terceiros'
  ) THEN
    ALTER TABLE terceiros
    ADD CONSTRAINT terceiros_id_pessoa_pje_key UNIQUE (id_pessoa_pje);

    RAISE NOTICE 'Added UNIQUE constraint to terceiros.id_pessoa_pje';
  ELSE
    RAISE NOTICE 'UNIQUE constraint already exists on terceiros.id_pessoa_pje';
  END IF;
END $$;

-- ============================================================================
-- 4. Create partial indexes for performance (if not exists)
-- ============================================================================

-- Index for clientes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'idx_clientes_id_pessoa_pje'
  ) THEN
    CREATE INDEX idx_clientes_id_pessoa_pje ON clientes(id_pessoa_pje) WHERE id_pessoa_pje IS NOT NULL;
    RAISE NOTICE 'Created index idx_clientes_id_pessoa_pje';
  ELSE
    RAISE NOTICE 'Index idx_clientes_id_pessoa_pje already exists';
  END IF;
END $$;

-- Index for partes_contrarias
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'idx_partes_contrarias_id_pessoa_pje'
  ) THEN
    CREATE INDEX idx_partes_contrarias_id_pessoa_pje ON partes_contrarias(id_pessoa_pje) WHERE id_pessoa_pje IS NOT NULL;
    RAISE NOTICE 'Created index idx_partes_contrarias_id_pessoa_pje';
  ELSE
    RAISE NOTICE 'Index idx_partes_contrarias_id_pessoa_pje already exists';
  END IF;
END $$;

-- Index for terceiros
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'idx_terceiros_id_pessoa_pje'
  ) THEN
    CREATE INDEX idx_terceiros_id_pessoa_pje ON terceiros(id_pessoa_pje) WHERE id_pessoa_pje IS NOT NULL;
    RAISE NOTICE 'Created index idx_terceiros_id_pessoa_pje';
  ELSE
    RAISE NOTICE 'Index idx_terceiros_id_pessoa_pje already exists';
  END IF;
END $$;

-- ============================================================================
-- Verification: Show constraint and index status
-- ============================================================================

DO $$
DECLARE
  constraint_count INTEGER;
  index_count INTEGER;
BEGIN
  -- Count constraints
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints
  WHERE constraint_name IN (
    'clientes_id_pessoa_pje_key',
    'partes_contrarias_id_pessoa_pje_key',
    'terceiros_id_pessoa_pje_key'
  );

  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE indexname IN (
    'idx_clientes_id_pessoa_pje',
    'idx_partes_contrarias_id_pessoa_pje',
    'idx_terceiros_id_pessoa_pje'
  );

  RAISE NOTICE 'Migration complete: % UNIQUE constraints and % indexes created/verified', constraint_count, index_count;
END $$;
