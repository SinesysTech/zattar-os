-- Migration: Migrar dados de clientes para cadastros_pje
-- Esta migration move os mapeamentos de id_pessoa_pje dos clientes para a nova tabela cadastros_pje
-- A coluna id_pessoa_pje será removida posteriormente, após validação completa

-- Verificar se a coluna id_pessoa_pje existe na tabela clientes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes' AND column_name = 'id_pessoa_pje'
    ) THEN
        RAISE NOTICE 'Coluna id_pessoa_pje não existe na tabela clientes. Pulando migração.';
        RETURN;
    END IF;

    -- Lógica de inferência de tribunal:
    -- 1. Para cada cliente com id_pessoa_pje não nulo, tentar encontrar o tribunal via processo_partes
    -- 2. JOIN com processos para obter o campo 'trt' (tribunal)
    -- 3. Usar DISTINCT ON para pegar apenas o primeiro processo vinculado (ordenado por created_at)
    -- 4. Se não houver processo vinculado, usar 'UNKNOWN' como tribunal
    -- 5. Inserir em cadastros_pje com tipo_entidade='cliente', sistema='pje_trt', grau=NULL
    
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
        'cliente' as tipo_entidade,
        c.id as entidade_id,
        c.id_pessoa_pje,
        'pje_trt' as sistema,
        COALESCE(p.trt, 'UNKNOWN') as tribunal,
        NULL as grau,  -- Clientes não são específicos por grau
        '{}' as dados_cadastro_pje  -- Dados extras podem ser populados posteriormente se necessário
    FROM clientes c
    LEFT JOIN (
        -- Subquery para obter o primeiro processo vinculado a cada cliente
        SELECT DISTINCT ON (pp.cliente_id) 
            pp.cliente_id,
            pr.trt
        FROM processo_partes pp
        JOIN processos pr ON pr.id = pp.processo_id
        WHERE pp.cliente_id IS NOT NULL
        ORDER BY pp.cliente_id, pr.created_at ASC  -- Primeiro processo por data de criação
    ) p ON p.cliente_id = c.id
    WHERE c.id_pessoa_pje IS NOT NULL
    ON CONFLICT (tipo_entidade, id_pessoa_pje, sistema, tribunal, grau) DO NOTHING;

    -- Validação pós-migração: contar registros migrados
    RAISE NOTICE 'Migração concluída. Registros migrados: %', (
        SELECT COUNT(*) FROM cadastros_pje WHERE tipo_entidade = 'cliente'
    );

END $$;