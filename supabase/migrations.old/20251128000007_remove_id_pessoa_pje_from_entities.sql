-- ============================================================================
-- Migration: Remove id_pessoa_pje from entities tables
-- ============================================================================
-- This migration removes the id_pessoa_pje column from the entities tables
-- (clientes, partes_contrarias, terceiros) since it has been moved to the
-- new cadastros_pje table for proper handling of non-unique IDs per tribunal/grau.
--
-- EXECUTE ONLY AFTER VALIDATION OF PREVIOUS MIGRATIONS:
-- - cadastros_pje table must be created and populated
-- - Unique constraints on CPF/CNPJ must be added
-- - Representatives must be deduplicated
-- ============================================================================

-- Verificar se cadastros_pje está populada corretamente
-- Contar registros por tipo_entidade para validação
DO $$
DECLARE
    clientes_count INTEGER;
    partes_count INTEGER;
    terceiros_count INTEGER;
    representantes_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO clientes_count FROM cadastros_pje WHERE tipo_entidade = 'cliente';
    SELECT COUNT(*) INTO partes_count FROM cadastros_pje WHERE tipo_entidade = 'parte_contraria';
    SELECT COUNT(*) INTO terceiros_count FROM cadastros_pje WHERE tipo_entidade = 'terceiro';
    SELECT COUNT(*) INTO representantes_count FROM cadastros_pje WHERE tipo_entidade = 'representante';

    RAISE NOTICE 'cadastros_pje validation:';
    RAISE NOTICE '  clientes: % registros', clientes_count;
    RAISE NOTICE '  partes_contrarias: % registros', partes_count;
    RAISE NOTICE '  terceiros: % registros', terceiros_count;
    RAISE NOTICE '  representantes: % registros', representantes_count;

    -- Validação básica: deve haver pelo menos alguns registros
    IF clientes_count = 0 AND partes_count = 0 AND terceiros_count = 0 AND representantes_count = 0 THEN
        RAISE EXCEPTION 'cadastros_pje parece vazia. Execute as migrations anteriores primeiro.';
    END IF;
END $$;

-- Remover coluna id_pessoa_pje da tabela clientes
-- Esta coluna agora é mapeada via cadastros_pje
ALTER TABLE clientes DROP COLUMN IF EXISTS id_pessoa_pje;

-- Remover coluna id_pessoa_pje da tabela partes_contrarias
-- Esta coluna agora é mapeada via cadastros_pje
ALTER TABLE partes_contrarias DROP COLUMN IF EXISTS id_pessoa_pje;

-- Remover coluna id_pessoa_pje da tabela terceiros
-- Esta coluna agora é mapeada via cadastros_pje
ALTER TABLE terceiros DROP COLUMN id_pessoa_pje;

-- Remover índice obsoleto da tabela terceiros
DROP INDEX IF EXISTS idx_terceiros_id_pessoa_pje;

-- ============================================================================
-- Validação pós-migração
-- ============================================================================
-- Verificar que as colunas foram removidas
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name IN ('clientes', 'partes_contrarias', 'terceiros')
        AND column_name = 'id_pessoa_pje'
    ) THEN
        RAISE EXCEPTION 'Falha: coluna id_pessoa_pje ainda existe em algumas tabelas';
    END IF;

    RAISE NOTICE 'Sucesso: coluna id_pessoa_pje removida de todas as tabelas de entidades';
    RAISE NOTICE 'id_pessoa_pje agora é mapeado via tabela cadastros_pje';
END $$;