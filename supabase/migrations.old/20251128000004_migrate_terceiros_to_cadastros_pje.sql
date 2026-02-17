-- ============================================================================
-- Migration: 20251128000004_migrate_terceiros_to_cadastros_pje
-- Migrar dados de terceiros para cadastros_pje
-- ============================================================================

-- Verificar se a tabela cadastros_pje existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cadastros_pje') THEN
        RAISE EXCEPTION 'Tabela cadastros_pje não existe. Execute a migration 20251128000001_create_cadastros_pje.sql primeiro.';
    END IF;
END $$;

-- Migrar dados de terceiros para cadastros_pje
-- Apenas terceiros com id_pessoa_pje não nulo
INSERT INTO cadastros_pje (
    tipo_entidade,
    entidade_id,
    id_pessoa_pje,
    sistema,
    tribunal,
    grau,
    dados_cadastro_pje
)
SELECT
    'terceiro' as tipo_entidade,
    t.id as entidade_id,
    t.id_pessoa_pje,
    'pje_trt' as sistema,
    t.trt as tribunal,
    t.grau,  -- Já está no formato correto ('primeiro_grau', 'segundo_grau')
    '{}'::jsonb as dados_cadastro_pje  -- Dados extras podem ser populados posteriormente se necessário
FROM terceiros t
WHERE t.id_pessoa_pje IS NOT NULL
    AND t.trt IS NOT NULL  -- Garantir que tribunal está preenchido
ON CONFLICT (tipo_entidade, id_pessoa_pje, sistema, tribunal, grau) DO NOTHING;

-- Validação pós-migração
DO $$
DECLARE
    total_terceiros_com_id INTEGER;
    total_migrados INTEGER;
BEGIN
    -- Contar terceiros com id_pessoa_pje não nulo
    SELECT COUNT(*) INTO total_terceiros_com_id
    FROM terceiros
    WHERE id_pessoa_pje IS NOT NULL;

    -- Contar registros migrados em cadastros_pje para terceiros
    SELECT COUNT(*) INTO total_migrados
    FROM cadastros_pje
    WHERE tipo_entidade = 'terceiro';

    RAISE NOTICE 'Validação da migração de terceiros:';
    RAISE NOTICE '  - Terceiros com id_pessoa_pje: %', total_terceiros_com_id;
    RAISE NOTICE '  - Registros migrados para cadastros_pje: %', total_migrados;

    IF total_migrados >= total_terceiros_com_id THEN
        RAISE NOTICE '  ✓ Migração bem-sucedida: todos os terceiros foram migrados.';
    ELSE
        RAISE WARNING '  ⚠ Possível problema: % terceiros não foram migrados.', total_terceiros_com_id - total_migrados;
    END IF;
END $$;