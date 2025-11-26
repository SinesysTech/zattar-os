-- Migration: 20251128000003_migrate_partes_contrarias_to_cadastros_pje.sql
-- Descrição: Migra dados de partes_contrarias para a nova tabela cadastros_pje
-- Esta migration é parte da refatoração para usar CPF/CNPJ como chave única ao invés de id_pessoa_pje
-- Pré-requisitos: Tabela cadastros_pje deve existir (criada em 20251128000001_create_cadastros_pje.sql)

-- Verificar se a coluna id_pessoa_pje existe na tabela partes_contrarias
-- Se não existir, pular a migração (pode ter sido removida em migration anterior)
DO $$
DECLARE
    column_exists BOOLEAN;
    total_partes_contrarias_com_id BIGINT;
    total_migrados BIGINT;
    total_cadastros_pje BIGINT;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'partes_contrarias' 
        AND column_name = 'id_pessoa_pje'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Coluna id_pessoa_pje não existe na tabela partes_contrarias. Pulando migração.';
        RETURN;
    END IF;
    
    -- Migrar dados de partes_contrarias para cadastros_pje
    -- Inferir tribunal e grau via JOIN com processo_partes e processos
    -- Usar DISTINCT para evitar duplicatas se uma parte contrária estiver em múltiplos processos
    -- ON CONFLICT DO NOTHING garante que não há duplicatas na constraint UNIQUE
    INSERT INTO cadastros_pje (
        tipo_entidade, 
        entidade_id, 
        id_pessoa_pje, 
        sistema, 
        tribunal, 
        grau, 
        dados_cadastro_pje
    )
    SELECT DISTINCT ON (pc.id, pc.id_pessoa_pje, p.trt, p.grau)
        'parte_contraria'::text,
        pc.id,
        pc.id_pessoa_pje,
        'pje_trt'::text,
        COALESCE(p.trt, 'UNKNOWN'::text),  -- Usar 'UNKNOWN' se não conseguir inferir tribunal
        CASE 
            WHEN p.grau = '1' THEN 'primeiro_grau'::text
            WHEN p.grau = '2' THEN 'segundo_grau'::text
            ELSE NULL
        END,
        '{}'::jsonb  -- Dados extras podem ser populados posteriormente se necessário
    FROM partes_contrarias pc
    -- JOIN com processo_partes para encontrar processos relacionados
    LEFT JOIN processo_partes pp ON pp.parte_id = pc.id AND pp.parte_tipo = 'parte_contraria'
    -- JOIN com processos para obter tribunal e grau
    LEFT JOIN processos p ON p.id = pp.processo_id
    WHERE pc.id_pessoa_pje IS NOT NULL
    -- Ordenar para garantir consistência no DISTINCT (mais recente primeiro)
    ORDER BY pc.id, pc.id_pessoa_pje, p.trt, p.grau, pc.updated_at DESC
    ON CONFLICT (tipo_entidade, id_pessoa_pje, sistema, tribunal, grau) DO NOTHING;
    
    -- Validação pós-migração
    RAISE NOTICE 'Migração concluída. Verificando integridade...';

    SELECT COUNT(*) INTO total_partes_contrarias_com_id
    FROM partes_contrarias 
    WHERE id_pessoa_pje IS NOT NULL;
    
    SELECT COUNT(*) INTO total_migrados
    FROM cadastros_pje 
    WHERE tipo_entidade = 'parte_contraria';
    
    SELECT COUNT(*) INTO total_cadastros_pje
    FROM cadastros_pje;
    
    RAISE NOTICE 'Total de partes_contrarias com id_pessoa_pje: %', total_partes_contrarias_com_id;
    RAISE NOTICE 'Total de registros migrados para cadastros_pje (parte_contraria): %', total_migrados;
    RAISE NOTICE 'Total de registros em cadastros_pje: %', total_cadastros_pje;
    
    IF total_migrados > 0 THEN
        RAISE NOTICE 'Migração bem-sucedida. Registros migrados: %', total_migrados;
    ELSE
        RAISE WARNING 'Nenhum registro foi migrado. Verificar se há dados em partes_contrarias.';
    END IF;
    
    RAISE NOTICE 'Migration 20251128000003_migrate_partes_contrarias_to_cadastros_pje.sql concluída com sucesso.';
END $$;
