-- Migration: Add unique constraints on CPF/CNPJ for entity tables
-- This migration adds partial unique constraints to ensure uniqueness of CPF/CNPJ values
-- while allowing multiple NULL values (which is standard for unique constraints in PostgreSQL)

-- Pre-migration validation: Check for existing duplicates
-- If duplicates are found, the migration will fail with details for manual analysis

DO $$
DECLARE
    duplicate_count INTEGER;
    duplicate_details TEXT;
BEGIN
    RAISE NOTICE 'Starting pre-migration validation for CPF/CNPJ uniqueness...';

    -- Check clientes.cpf
    SELECT COUNT(*), STRING_AGG('ID: ' || id || ', CPF: ' || cpf, '; ') INTO duplicate_count, duplicate_details
    FROM (
        SELECT id, cpf, COUNT(*) OVER (PARTITION BY cpf) as cnt
        FROM clientes
        WHERE cpf IS NOT NULL
    ) AS sub
    WHERE cnt > 1;

    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Duplicates found in clientes.cpf. Count: %, Details: %', duplicate_count, duplicate_details;
    END IF;

    -- Check clientes.cnpj
    SELECT COUNT(*), STRING_AGG('ID: ' || id || ', CNPJ: ' || cnpj, '; ') INTO duplicate_count, duplicate_details
    FROM (
        SELECT id, cnpj, COUNT(*) OVER (PARTITION BY cnpj) as cnt
        FROM clientes
        WHERE cnpj IS NOT NULL
    ) AS sub
    WHERE cnt > 1;

    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Duplicates found in clientes.cnpj. Count: %, Details: %', duplicate_count, duplicate_details;
    END IF;

    -- Check partes_contrarias.cpf
    SELECT COUNT(*), STRING_AGG('ID: ' || id || ', CPF: ' || cpf, '; ') INTO duplicate_count, duplicate_details
    FROM (
        SELECT id, cpf, COUNT(*) OVER (PARTITION BY cpf) as cnt
        FROM partes_contrarias
        WHERE cpf IS NOT NULL
    ) AS sub
    WHERE cnt > 1;

    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Duplicates found in partes_contrarias.cpf. Count: %, Details: %', duplicate_count, duplicate_details;
    END IF;

    -- Check partes_contrarias.cnpj
    SELECT COUNT(*), STRING_AGG('ID: ' || id || ', CNPJ: ' || cnpj, '; ') INTO duplicate_count, duplicate_details
    FROM (
        SELECT id, cnpj, COUNT(*) OVER (PARTITION BY cnpj) as cnt
        FROM partes_contrarias
        WHERE cnpj IS NOT NULL
    ) AS sub
    WHERE cnt > 1;

    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Duplicates found in partes_contrarias.cnpj. Count: %, Details: %', duplicate_count, duplicate_details;
    END IF;

    -- Check terceiros.cpf
    SELECT COUNT(*), STRING_AGG('ID: ' || id || ', CPF: ' || cpf, '; ') INTO duplicate_count, duplicate_details
    FROM (
        SELECT id, cpf, COUNT(*) OVER (PARTITION BY cpf) as cnt
        FROM terceiros
        WHERE cpf IS NOT NULL
    ) AS sub
    WHERE cnt > 1;

    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Duplicates found in terceiros.cpf. Count: %, Details: %', duplicate_count, duplicate_details;
    END IF;

    -- Check terceiros.cnpj
    SELECT COUNT(*), STRING_AGG('ID: ' || id || ', CNPJ: ' || cnpj, '; ') INTO duplicate_count, duplicate_details
    FROM (
        SELECT id, cnpj, COUNT(*) OVER (PARTITION BY cnpj) as cnt
        FROM terceiros
        WHERE cnpj IS NOT NULL
    ) AS sub
    WHERE cnt > 1;

    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Duplicates found in terceiros.cnpj. Count: %, Details: %', duplicate_count, duplicate_details;
    END IF;

    -- Check representantes.cpf
    SELECT COUNT(*), STRING_AGG('ID: ' || id || ', CPF: ' || cpf, '; ') INTO duplicate_count, duplicate_details
    FROM (
        SELECT id, cpf, COUNT(*) OVER (PARTITION BY cpf) as cnt
        FROM representantes
        WHERE cpf IS NOT NULL
    ) AS sub
    WHERE cnt > 1;

    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Duplicates found in representantes.cpf. Count: %, Details: %', duplicate_count, duplicate_details;
    END IF;

    RAISE NOTICE 'Pre-migration validation passed: No duplicates found.';
END $$;

-- Add unique constraints for clientes
-- Note: These constraints may already exist from schema creation, but we add them explicitly with WHERE clause for clarity
ALTER TABLE clientes ADD CONSTRAINT clientes_cpf_unique UNIQUE (cpf) WHERE (cpf IS NOT NULL);
ALTER TABLE clientes ADD CONSTRAINT clientes_cnpj_unique UNIQUE (cnpj) WHERE (cnpj IS NOT NULL);

-- Add unique constraints for partes_contrarias
ALTER TABLE partes_contrarias ADD CONSTRAINT partes_contrarias_cpf_unique UNIQUE (cpf) WHERE (cpf IS NOT NULL);
ALTER TABLE partes_contrarias ADD CONSTRAINT partes_contrarias_cnpj_unique UNIQUE (cnpj) WHERE (cnpj IS NOT NULL);

-- Add unique constraints for terceiros
ALTER TABLE terceiros ADD CONSTRAINT terceiros_cpf_unique UNIQUE (cpf) WHERE (cpf IS NOT NULL);
ALTER TABLE terceiros ADD CONSTRAINT terceiros_cnpj_unique UNIQUE (cnpj) WHERE (cnpj IS NOT NULL);

-- Add unique constraint for representantes
-- Note: representantes.cpf should already be NOT NULL UNIQUE from the table recreation migration
ALTER TABLE representantes ADD CONSTRAINT representantes_cpf_unique UNIQUE (cpf) WHERE (cpf IS NOT NULL);

-- Comments
COMMENT ON CONSTRAINT clientes_cpf_unique ON clientes IS 'Garante unicidade de CPF para clientes (valores não-nulos)';
COMMENT ON CONSTRAINT clientes_cnpj_unique ON clientes IS 'Garante unicidade de CNPJ para clientes (valores não-nulos)';
COMMENT ON CONSTRAINT partes_contrarias_cpf_unique ON partes_contrarias IS 'Garante unicidade de CPF para partes contrárias (valores não-nulos)';
COMMENT ON CONSTRAINT partes_contrarias_cnpj_unique ON partes_contrarias IS 'Garante unicidade de CNPJ para partes contrárias (valores não-nulos)';
COMMENT ON CONSTRAINT terceiros_cpf_unique ON terceiros IS 'Garante unicidade de CPF para terceiros (valores não-nulos)';
COMMENT ON CONSTRAINT terceiros_cnpj_unique ON terceiros IS 'Garante unicidade de CNPJ para terceiros (valores não-nulos)';
COMMENT ON CONSTRAINT representantes_cpf_unique ON representantes IS 'Garante unicidade de CPF para representantes (valores não-nulos)';