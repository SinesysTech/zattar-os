-- ============================================================================
-- SCRIPT DE ATRIBUIÇÃO DE AUDIÊNCIAS BASEADO NOS PROCESSOS
-- ============================================================================
-- Data: 2025-01-24
-- Objetivo: Atribuir audiências aos mesmos responsáveis dos processos correspondentes
--
-- REGRA: Quando um processo é atribuído a um usuário, todas as audiências
--        desse processo devem ser automaticamente atribuídas ao mesmo usuário
--
-- IMPORTANTE: Execute este script APÓS distribuicao-inicial-processos.sql
-- ============================================================================

-- Verificar contagem atual antes da atribuição
SELECT
  'ANTES DA ATRIBUIÇÃO DE AUDIÊNCIAS' as status,
  COUNT(*) as total_audiencias,
  COUNT(CASE WHEN responsavel_id IS NOT NULL THEN 1 END) as ja_atribuidas,
  COUNT(CASE WHEN responsavel_id IS NULL THEN 1 END) as sem_responsavel
FROM audiencias;

-- ============================================================================
-- ATRIBUIÇÃO DE AUDIÊNCIAS BASEADA NO PROCESSO
-- ============================================================================

-- Atualizar responsavel_id das audiências com base no processo_id
UPDATE audiencias aud
SET
  responsavel_id = a.responsavel_id,
  updated_at = NOW()
FROM acervo a
WHERE aud.processo_id = a.id
  AND a.origem = 'acervo_geral'
  AND a.responsavel_id IS NOT NULL
  AND a.responsavel_id IN (21, 22, 24, 20);

-- ============================================================================
-- VERIFICAÇÕES PÓS-ATRIBUIÇÃO
-- ============================================================================

-- 1. Contagem geral após atribuição
SELECT
  'APÓS ATRIBUIÇÃO - RESUMO GERAL' as status,
  COUNT(*) as total_audiencias,
  COUNT(CASE WHEN responsavel_id IS NOT NULL THEN 1 END) as audiencias_atribuidas,
  COUNT(CASE WHEN responsavel_id IS NULL THEN 1 END) as audiencias_sem_responsavel
FROM audiencias;

-- 2. Distribuição de audiências por responsável
SELECT
  'DISTRIBUIÇÃO DE AUDIÊNCIAS POR RESPONSÁVEL' as status,
  u.id as usuario_id,
  u.nome_exibicao,
  COUNT(aud.id) as total_audiencias,
  COUNT(CASE WHEN aud.status = 'M' THEN 1 END) as audiencias_designadas,
  COUNT(CASE WHEN aud.status = 'F' THEN 1 END) as audiencias_realizadas,
  COUNT(CASE WHEN aud.status = 'C' THEN 1 END) as audiencias_canceladas,
  ROUND(COUNT(aud.id) * 100.0 / SUM(COUNT(aud.id)) OVER (), 1) as percentual
FROM audiencias aud
INNER JOIN usuarios u ON u.id = aud.responsavel_id
WHERE aud.responsavel_id IN (21, 22, 24, 20)
GROUP BY u.id, u.nome_exibicao
ORDER BY total_audiencias DESC;

-- 3. Audiências por região e responsável
SELECT
  'AUDIÊNCIAS POR REGIÃO E RESPONSÁVEL' as status,
  CASE
    WHEN aud.trt IN ('TRT1', 'TRT2', 'TRT3', 'TRT15', 'TRT17') THEN 'Sudeste'
    WHEN aud.trt IN ('TRT4', 'TRT9', 'TRT12') THEN 'Sul'
    WHEN aud.trt IN ('TRT5', 'TRT6', 'TRT7', 'TRT13', 'TRT16', 'TRT19', 'TRT20', 'TRT21', 'TRT22') THEN 'Nordeste'
    WHEN aud.trt IN ('TRT8', 'TRT11', 'TRT14') THEN 'Norte'
    WHEN aud.trt IN ('TRT10', 'TRT18', 'TRT23', 'TRT24') THEN 'Centro-Oeste'
  END as regiao,
  u.nome_exibicao,
  COUNT(aud.id) as total_audiencias
FROM audiencias aud
INNER JOIN usuarios u ON u.id = aud.responsavel_id
WHERE aud.responsavel_id IN (21, 22, 24, 20)
GROUP BY regiao, u.nome_exibicao
ORDER BY regiao, total_audiencias DESC;

-- 4. Audiências futuras (próximas 30 dias) por responsável
SELECT
  'AUDIÊNCIAS FUTURAS (PRÓXIMOS 30 DIAS)' as status,
  u.nome_exibicao,
  COUNT(aud.id) as total_audiencias_proximas,
  MIN(aud.data_inicio) as proxima_audiencia,
  MAX(aud.data_inicio) as ultima_audiencia_periodo
FROM audiencias aud
INNER JOIN usuarios u ON u.id = aud.responsavel_id
WHERE aud.responsavel_id IN (21, 22, 24, 20)
  AND aud.data_inicio >= NOW()
  AND aud.data_inicio <= NOW() + INTERVAL '30 days'
  AND aud.status = 'M' -- Apenas designadas
GROUP BY u.nome_exibicao
ORDER BY total_audiencias_proximas DESC;

-- 5. Verificar audiências com processo mas sem responsável
SELECT
  'AUDIÊNCIAS COM PROCESSO MAS SEM RESPONSÁVEL' as status,
  COUNT(*) as total
FROM audiencias aud
INNER JOIN acervo a ON a.id = aud.processo_id
WHERE aud.responsavel_id IS NULL
  AND a.responsavel_id IS NOT NULL;

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Este script atribui audiências apenas se houver processo_id válido
-- 2. Novas audiências criadas no futuro devem usar trigger para atribuição automática
-- 3. Status das audiências: M=Designada, F=Realizada, C=Cancelada
-- ============================================================================
