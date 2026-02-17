-- ============================================================================
-- Migration: 20251128000005_migrate_representantes_deduplication.sql
-- Deduplicação e migração da tabela representantes
--
-- Esta migration é crítica e BREAKING CHANGE.
-- Transforma representantes de "um por processo" para "um por CPF".
--
-- Fases:
-- 1. Análise e Preparação
-- 2. Criar Nova Estrutura
-- 3. Deduplicação
-- 4. Migrar para cadastros_pje
-- 5. Atualizar processo_partes
-- 6. Validação
-- 7. Substituição
--
-- IMPORTANTE: Fazer backup completo antes de executar!
-- ============================================================================

BEGIN;

-- ============================================================================
-- FASE 1: ANÁLISE E PREPARAÇÃO
-- ============================================================================

-- Criar tabela temporária com estatísticas de duplicação por CPF
CREATE TEMP TABLE representantes_analise AS
SELECT
  cpf,
  COUNT(*) as total_registros,
  COUNT(DISTINCT nome) as nomes_diferentes,
  COUNT(DISTINCT numero_oab) as oabs_diferentes,
  COUNT(DISTINCT id_pessoa_pje) as ids_pessoa_diferentes,
  MAX(updated_at) as ultimo_updated,
  ARRAY_AGG(DISTINCT trt) as tribunais,
  ARRAY_AGG(DISTINCT grau) as graus
FROM representantes
WHERE cpf IS NOT NULL AND cpf != ''
GROUP BY cpf
ORDER BY total_registros DESC;

-- Exibir análise para revisão manual (conflitos onde mesmo CPF tem dados diferentes)
-- Conflitos identificados: nomes_diferentes > 1 OU oabs_diferentes > 1
SELECT
  cpf,
  total_registros,
  nomes_diferentes,
  oabs_diferentes,
  ids_pessoa_diferentes,
  ultimo_updated,
  tribunais,
  graus
FROM representantes_analise
WHERE nomes_diferentes > 1 OR oabs_diferentes > 1
ORDER BY total_registros DESC;

-- Criar tabela de mapeamento old_id -> new_id
-- Será populada na Fase 3
CREATE TEMP TABLE representantes_old_to_new_id (
  old_id INTEGER PRIMARY KEY,
  new_id BIGINT,
  cpf TEXT NOT NULL
);

-- ============================================================================
-- FASE 2: CRIAR NOVA ESTRUTURA
-- ============================================================================

-- Criar nova tabela representantes com estrutura correta
-- Um registro por CPF, sem campos de contexto de processo
CREATE TABLE representantes_new (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cpf TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  sexo TEXT,
  
  -- Dados OAB
  numero_oab TEXT,
  uf_oab TEXT,  -- Será extraído de numero_oab se possível (ex: "12345/SP")
  situacao_oab TEXT,
  tipo TEXT,
  
  -- Contato
  emails JSONB,  -- Array de strings convertido de text[]
  ddd_celular TEXT,
  numero_celular TEXT,
  ddd_residencial TEXT,
  numero_residencial TEXT,
  ddd_comercial TEXT,
  numero_comercial TEXT,
  
  -- Endereço
  endereco_id BIGINT REFERENCES public.enderecos(id),
  
  -- Metadados
  dados_anteriores JSONB,  -- Armazenar dados antigos para auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar trigger para updated_at
CREATE TRIGGER representantes_new_updated_at
  BEFORE UPDATE ON representantes_new
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Comentários na nova tabela
COMMENT ON TABLE representantes_new IS 'Representantes legais únicos por CPF. Vínculo com processos via processo_partes.';
COMMENT ON COLUMN representantes_new.cpf IS 'CPF único do representante (chave primária de negócio)';
COMMENT ON COLUMN representantes_new.dados_anteriores IS 'Dados da estrutura antiga para auditoria e possível rollback';

-- ============================================================================
-- FASE 3: DEDUPLICAÇÃO
-- ============================================================================

-- Inserir representantes únicos usando DISTINCT ON (cpf) ordenado por updated_at DESC
-- Estratégia: usar registro mais recente como fonte da verdade
INSERT INTO representantes_new (
  cpf,
  nome,
  sexo,
  numero_oab,
  uf_oab,
  situacao_oab,
  tipo,
  emails,
  ddd_celular,
  numero_celular,
  ddd_residencial,
  numero_residencial,
  ddd_comercial,
  numero_comercial,
  endereco_id,
  dados_anteriores,
  created_at,
  updated_at
)
SELECT DISTINCT ON (r.cpf)
  r.cpf,
  r.nome,
  r.sexo,
  r.numero_oab,
  -- Extrair UF de numero_oab se formato "XXXXX/UF"
  CASE 
    WHEN r.numero_oab ~ '^\d+/[A-Z]{2}$' THEN UPPER(SPLIT_PART(r.numero_oab, '/', 2))
    ELSE NULL
  END as uf_oab,
  r.situacao_oab,
  r.tipo,
  -- Converter emails text[] para jsonb array
  CASE 
    WHEN r.emails IS NOT NULL THEN array_to_json(r.emails)::jsonb
    WHEN r.email IS NOT NULL THEN jsonb_build_array(r.email)
    ELSE NULL
  END as emails,
  r.ddd_celular,
  r.numero_celular,
  r.ddd_residencial,
  r.numero_residencial,
  r.ddd_comercial,
  r.numero_comercial,
  r.endereco_id,
  -- Armazenar dados antigos para auditoria
  jsonb_build_object(
    'old_id', r.id,
    'id_pje', r.id_pje,
    'id_pessoa_pje', r.id_pessoa_pje,
    'parte_tipo', r.parte_tipo,
    'parte_id', r.parte_id,
    'polo', r.polo,
    'trt', r.trt,
    'grau', r.grau,
    'numero_processo', r.numero_processo,
    'situacao', r.situacao,
    'status', r.status,
    'principal', r.principal,
    'endereco_desconhecido', r.endereco_desconhecido,
    'id_tipo_parte', r.id_tipo_parte,
    'ordem', r.ordem,
    'data_habilitacao', r.data_habilitacao,
    'email', r.email  -- campo separado
  ),
  r.created_at,
  r.updated_at
FROM representantes r
WHERE r.cpf IS NOT NULL AND r.cpf != ''
ORDER BY r.cpf, r.updated_at DESC;

-- Popular tabela de mapeamento
INSERT INTO representantes_old_to_new_id (old_id, new_id, cpf)
SELECT 
  r.id as old_id,
  rn.id as new_id,
  r.cpf
FROM representantes r
JOIN representantes_new rn ON r.cpf = rn.cpf
WHERE r.cpf IS NOT NULL AND r.cpf != '';

-- Validação: todos os registros antigos devem ter mapeamento
DO $$
DECLARE
  sem_mapeamento INTEGER;
BEGIN
  SELECT COUNT(*) INTO sem_mapeamento
  FROM representantes r
  LEFT JOIN representantes_old_to_new_id m ON r.id = m.old_id
  WHERE r.cpf IS NOT NULL AND r.cpf != '' AND m.new_id IS NULL;
  
  IF sem_mapeamento > 0 THEN
    RAISE EXCEPTION 'Erro: % registros sem mapeamento old->new', sem_mapeamento;
  END IF;
END $$;

-- ============================================================================
-- FASE 4: MIGRAR PARA CADASTROS_PJE
-- ============================================================================

-- Para cada registro antigo, inserir em cadastros_pje
-- Usar entidade_id do representante único correspondente
INSERT INTO cadastros_pje (
  tipo_entidade,
  entidade_id,
  id_pessoa_pje,
  sistema,
  tribunal,
  grau,
  dados_cadastro_pje,
  created_at,
  updated_at
)
SELECT
  'representante' as tipo_entidade,
  m.new_id as entidade_id,
  r.id_pessoa_pje,
  'pje_trt' as sistema,
  COALESCE(r.trt, 'UNKNOWN') as tribunal,
  CASE r.grau
    WHEN '1' THEN 'primeiro_grau'
    WHEN '2' THEN 'segundo_grau'
    ELSE NULL
  END as grau,
  -- Dados extras do cadastro PJE (se houver)
  jsonb_build_object(
    'old_representante_id', r.id,
    'numero_processo', r.numero_processo,
    'parte_tipo', r.parte_tipo,
    'parte_id', r.parte_id,
    'polo', r.polo,
    'principal', r.principal,
    'ordem', r.ordem,
    'data_habilitacao', r.data_habilitacao
  ) as dados_cadastro_pje,
  r.created_at,
  r.updated_at
FROM representantes r
JOIN representantes_old_to_new_id m ON r.id = m.old_id
WHERE r.id_pessoa_pje IS NOT NULL
ON CONFLICT (tipo_entidade, id_pessoa_pje, sistema, tribunal, grau) DO NOTHING;

-- ============================================================================
-- FASE 5: ATUALIZAR PROCESSO_PARTES
-- ============================================================================

-- Atualizar referências em processo_partes para apontar para os novos IDs
-- Assumindo que processo_partes tem coluna representante_id apontando para representantes.id
UPDATE processo_partes
SET representante_id = m.new_id
FROM representantes_old_to_new_id m
WHERE processo_partes.representante_id = m.old_id;

-- Validação: verificar se todas as referências foram atualizadas
DO $$
DECLARE
  referencias_antigas INTEGER;
BEGIN
  SELECT COUNT(*) INTO referencias_antigas
  FROM processo_partes pp
  JOIN representantes_old_to_new_id m ON pp.representante_id = m.old_id;
  
  RAISE NOTICE 'Referências atualizadas em processo_partes: %', referencias_antigas;
END $$;

-- ============================================================================
-- FASE 6: VALIDAÇÃO
-- ============================================================================

-- Validação 1: Contar registros em cadastros_pje para representantes
DO $$
DECLARE
  cadastros_count INTEGER;
  representantes_unicos INTEGER;
  ids_pessoa_unicos INTEGER;
BEGIN
  SELECT COUNT(*) INTO cadastros_count
  FROM cadastros_pje
  WHERE tipo_entidade = 'representante';
  
  SELECT COUNT(*) INTO representantes_unicos
  FROM representantes_new;
  
  SELECT COUNT(DISTINCT id_pessoa_pje) INTO ids_pessoa_unicos
  FROM representantes
  WHERE id_pessoa_pje IS NOT NULL;
  
  RAISE NOTICE 'Cadastros PJE representantes: %', cadastros_count;
  RAISE NOTICE 'Representantes únicos: %', representantes_unicos;
  RAISE NOTICE 'IDs pessoa únicos antigos: %', ids_pessoa_unicos;
  
  IF cadastros_count < ids_pessoa_unicos THEN
    RAISE EXCEPTION 'Erro: cadastros_pje (%) < ids_pessoa únicos (%)', cadastros_count, ids_pessoa_unicos;
  END IF;
END $$;

-- Validação 2: Verificar integridade referencial
DO $$
DECLARE
  referencias_invalidas INTEGER;
BEGIN
  SELECT COUNT(*) INTO referencias_invalidas
  FROM processo_partes pp
  LEFT JOIN representantes_new rn ON pp.representante_id = rn.id
  WHERE pp.representante_id IS NOT NULL AND rn.id IS NULL;
  
  IF referencias_invalidas > 0 THEN
    RAISE EXCEPTION 'Erro: % referências inválidas em processo_partes', referencias_invalidas;
  END IF;
END $$;

-- Validação 3: Verificar unicidade por CPF
DO $$
DECLARE
  cpfs_duplicados INTEGER;
BEGIN
  SELECT COUNT(*) INTO cpfs_duplicados
  FROM (
    SELECT cpf, COUNT(*) as cnt
    FROM representantes_new
    GROUP BY cpf
    HAVING COUNT(*) > 1
  ) d;
  
  IF cpfs_duplicados > 0 THEN
    RAISE EXCEPTION 'Erro: % CPFs duplicados na nova tabela', cpfs_duplicados;
  END IF;
END $$;

-- ============================================================================
-- FASE 7: SUBSTITUIÇÃO
-- ============================================================================

-- Renomear tabelas
ALTER TABLE representantes RENAME TO representantes_old;
ALTER TABLE representantes_new RENAME TO representantes;

-- Recriar índices na nova tabela representantes
CREATE INDEX IF NOT EXISTS idx_representantes_cpf ON representantes(cpf);
CREATE INDEX IF NOT EXISTS idx_representantes_oab ON representantes(numero_oab);
CREATE INDEX IF NOT EXISTS idx_representantes_endereco ON representantes(endereco_id);

-- Recriar trigger para updated_at (já criado, mas garantir)
-- Já foi criado na Fase 2

-- Recriar políticas RLS
ALTER TABLE representantes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role tem acesso total aos representantes" ON representantes;
CREATE POLICY "Service role tem acesso total aos representantes"
ON representantes FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados podem ler representantes" ON representantes;
CREATE POLICY "Usuários autenticados podem ler representantes"
ON representantes FOR SELECT
TO authenticated
USING (true);

-- Atualizar comentários
COMMENT ON TABLE representantes IS 'Representantes legais únicos por CPF. Vínculo com processos via processo_partes.';
COMMENT ON COLUMN representantes.cpf IS 'CPF único do representante (constraint UNIQUE)';

-- Log final
DO $$
BEGIN
  RAISE NOTICE 'Migração de representantes concluída com sucesso!';
  RAISE NOTICE 'Tabela antiga renomeada para representantes_old';
  RAISE NOTICE 'Nova tabela: representantes (% registros únicos)', (SELECT COUNT(*) FROM representantes);
  RAISE NOTICE 'Cadastros PJE criados: %', (SELECT COUNT(*) FROM cadastros_pje WHERE tipo_entidade = 'representante');
END $$;

COMMIT;

-- ============================================================================
-- NOTAS FINAIS
-- ============================================================================
-- 1. Manter representantes_old por 30 dias para possível rollback
-- 2. Após período de observação, executar:
--    DROP TABLE representantes_old;
--    DROP TABLE representantes_old_to_new_id; -- se ainda existir
-- 3. Verificar se há foreign keys em outras tabelas que precisam ser atualizadas
-- 4. Testar queries de busca por CPF e por OAB
-- ============================================================================