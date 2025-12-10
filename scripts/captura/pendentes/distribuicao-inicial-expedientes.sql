-- ============================================================================
-- SCRIPT DE ATRIBUIÇÃO DE EXPEDIENTES BASEADO NOS PROCESSOS
-- ============================================================================
-- Data: 2025-01-24
-- Objetivo: Atribuir expedientes (tabela: expedientes) aos mesmos responsáveis
--           dos processos correspondentes
--
-- REGRA: Quando um processo é atribuído a um usuário, todos os expedientes
--        desse processo devem ser automaticamente atribuídos ao mesmo usuário
--
-- IMPORTANTE: Execute este script APÓS distribuicao-inicial-processos.sql
-- ============================================================================

-- Verificar contagem atual antes da atribuição
SELECT
  'ANTES DA ATRIBUIÇÃO DE EXPEDIENTES' as status,
  COUNT(*) as total_expedientes,
  COUNT(CASE WHEN responsavel_id IS NOT NULL THEN 1 END) as ja_atribuidos,
  COUNT(CASE WHEN responsavel_id IS NULL THEN 1 END) as sem_responsavel
FROM expedientes;

-- ============================================================================
-- ATRIBUIÇÃO DE EXPEDIENTES BASEADA NO PROCESSO
-- ============================================================================

-- Atualizar responsavel_id dos expedientes com base no processo_id
UPDATE expedientes pm
SET
  responsavel_id = a.responsavel_id,
  updated_at = NOW()
FROM acervo a
WHERE pm.processo_id = a.id
  AND a.origem = 'acervo_geral'
  AND a.responsavel_id IS NOT NULL
  AND a.responsavel_id IN (21, 22, 24, 20);

-- ============================================================================
-- VERIFICAÇÕES PÓS-ATRIBUIÇÃO
-- ============================================================================

-- 1. Contagem geral após atribuição
SELECT
  'APÓS ATRIBUIÇÃO - RESUMO GERAL' as status,
  COUNT(*) as total_expedientes,
  COUNT(CASE WHEN responsavel_id IS NOT NULL THEN 1 END) as expedientes_atribuidos,
  COUNT(CASE WHEN responsavel_id IS NULL THEN 1 END) as expedientes_sem_responsavel
FROM expedientes;

-- 2. Distribuição de expedientes por responsável
SELECT
  'DISTRIBUIÇÃO DE EXPEDIENTES POR RESPONSÁVEL' as status,
  u.id as usuario_id,
  u.nome_exibicao,
  COUNT(pm.id) as total_expedientes,
  COUNT(CASE WHEN pm.baixado_em IS NULL THEN 1 END) as expedientes_pendentes,
  COUNT(CASE WHEN pm.baixado_em IS NOT NULL THEN 1 END) as expedientes_baixados,
  ROUND(COUNT(pm.id) * 100.0 / SUM(COUNT(pm.id)) OVER (), 1) as percentual
FROM expedientes pm
INNER JOIN usuarios u ON u.id = pm.responsavel_id
WHERE pm.responsavel_id IN (21, 22, 24, 20)
GROUP BY u.id, u.nome_exibicao
ORDER BY total_expedientes DESC;

-- 3. Expedientes por região e responsável
SELECT
  'EXPEDIENTES POR REGIÃO E RESPONSÁVEL' as status,
  CASE
    WHEN pm.trt IN ('TRT1', 'TRT2', 'TRT3', 'TRT15', 'TRT17') THEN 'Sudeste'
    WHEN pm.trt IN ('TRT4', 'TRT9', 'TRT12') THEN 'Sul'
    WHEN pm.trt IN ('TRT5', 'TRT6', 'TRT7', 'TRT13', 'TRT16', 'TRT19', 'TRT20', 'TRT21', 'TRT22') THEN 'Nordeste'
    WHEN pm.trt IN ('TRT8', 'TRT11', 'TRT14') THEN 'Norte'
    WHEN pm.trt IN ('TRT10', 'TRT18', 'TRT23', 'TRT24') THEN 'Centro-Oeste'
  END as regiao,
  u.nome_exibicao,
  COUNT(pm.id) as total_expedientes
FROM expedientes pm
INNER JOIN usuarios u ON u.id = pm.responsavel_id
WHERE pm.responsavel_id IN (21, 22, 24, 20)
GROUP BY regiao, u.nome_exibicao
ORDER BY regiao, total_expedientes DESC;

-- 4. Verificar expedientes que não têm processo vinculado
SELECT
  'EXPEDIENTES SEM PROCESSO VINCULADO' as status,
  COUNT(*) as total
FROM expedientes
WHERE processo_id IS NULL;

-- 5. Verificar expedientes com processo mas sem responsável
SELECT
  'EXPEDIENTES COM PROCESSO MAS SEM RESPONSÁVEL' as status,
  COUNT(*) as total
FROM expedientes pm
INNER JOIN acervo a ON a.id = pm.processo_id
WHERE pm.responsavel_id IS NULL
  AND a.responsavel_id IS NOT NULL;

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Este script atribui expedientes apenas se houver processo_id válido
-- 2. Expedientes sem processo_id vinculado ficam sem responsável
-- 3. Novos expedientes criados no futuro devem usar trigger para atribuição automática
-- 4. Audiências devem ser tratadas em script separado
-- ============================================================================
