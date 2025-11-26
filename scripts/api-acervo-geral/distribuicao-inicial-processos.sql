-- ============================================================================
-- SCRIPT DE DISTRIBUIÇÃO INICIAL DE PROCESSOS POR REGIÃO
-- ============================================================================
-- Data: 2025-01-24
-- Objetivo: Distribuir processos do acervo geral entre 4 usuários por região
--
-- DISTRIBUIÇÃO:
-- - SUDESTE (1.747 processos): Guido (21) e Tamiris (22) - ~873 cada
-- - OUTRAS REGIÕES (2.064 processos): Ister (24) e Tiago (20) - ~1.032 cada
--
-- IMPORTANTE: Este script deve ser executado MANUALMENTE via psql ou Supabase SQL Editor
-- ============================================================================

-- Verificar contagem atual antes da distribuição
SELECT
  'ANTES DA DISTRIBUIÇÃO' as status,
  COUNT(*) as total_processos,
  COUNT(DISTINCT numero_processo) as processos_unicos,
  COUNT(CASE WHEN responsavel_id IS NOT NULL THEN 1 END) as ja_atribuidos
FROM acervo
WHERE origem = 'acervo_geral';

-- ============================================================================
-- ETAPA 1: DISTRIBUIÇÃO DO SUDESTE
-- TRTs: TRT1 (RJ), TRT2 (SP), TRT3 (MG), TRT15 (Campinas), TRT17 (ES)
-- ============================================================================

-- Guido (ID 21) - 50% do Sudeste (processos com ID ímpar)
UPDATE acervo
SET
  responsavel_id = 21,
  updated_at = NOW()
WHERE origem = 'acervo_geral'
  AND trt IN ('TRT1', 'TRT2', 'TRT3', 'TRT15', 'TRT17')
  AND MOD(id, 2) = 1;

-- Tamiris (ID 22) - 50% do Sudeste (processos com ID par)
UPDATE acervo
SET
  responsavel_id = 22,
  updated_at = NOW()
WHERE origem = 'acervo_geral'
  AND trt IN ('TRT1', 'TRT2', 'TRT3', 'TRT15', 'TRT17')
  AND MOD(id, 2) = 0;

-- ============================================================================
-- ETAPA 2: DISTRIBUIÇÃO DAS OUTRAS REGIÕES
-- Nordeste: TRT5, TRT6, TRT7, TRT13, TRT16, TRT19, TRT20, TRT21, TRT22
-- Sul: TRT4, TRT9, TRT12
-- Norte: TRT8, TRT11, TRT14
-- Centro-Oeste: TRT10, TRT18, TRT23, TRT24
-- ============================================================================

-- Ister (ID 24) - 50% das outras regiões (processos com ID ímpar)
UPDATE acervo
SET
  responsavel_id = 24,
  updated_at = NOW()
WHERE origem = 'acervo_geral'
  AND trt IN (
    -- Nordeste
    'TRT5', 'TRT6', 'TRT7', 'TRT13', 'TRT16', 'TRT19', 'TRT20', 'TRT21', 'TRT22',
    -- Sul
    'TRT4', 'TRT9', 'TRT12',
    -- Norte
    'TRT8', 'TRT11', 'TRT14',
    -- Centro-Oeste
    'TRT10', 'TRT18', 'TRT23', 'TRT24'
  )
  AND MOD(id, 2) = 1;

-- Tiago (ID 20) - 50% das outras regiões (processos com ID par)
UPDATE acervo
SET
  responsavel_id = 20,
  updated_at = NOW()
WHERE origem = 'acervo_geral'
  AND trt IN (
    -- Nordeste
    'TRT5', 'TRT6', 'TRT7', 'TRT13', 'TRT16', 'TRT19', 'TRT20', 'TRT21', 'TRT22',
    -- Sul
    'TRT4', 'TRT9', 'TRT12',
    -- Norte
    'TRT8', 'TRT11', 'TRT14',
    -- Centro-Oeste
    'TRT10', 'TRT18', 'TRT23', 'TRT24'
  )
  AND MOD(id, 2) = 0;

-- ============================================================================
-- VERIFICAÇÕES PÓS-DISTRIBUIÇÃO
-- ============================================================================

-- 1. Contagem geral após distribuição
SELECT
  'APÓS DISTRIBUIÇÃO - RESUMO GERAL' as status,
  COUNT(*) as total_processos,
  COUNT(DISTINCT numero_processo) as processos_unicos,
  COUNT(CASE WHEN responsavel_id IS NOT NULL THEN 1 END) as processos_atribuidos,
  COUNT(CASE WHEN responsavel_id IS NULL THEN 1 END) as processos_sem_responsavel
FROM acervo
WHERE origem = 'acervo_geral';

-- 2. Distribuição por responsável
SELECT
  'DISTRIBUIÇÃO POR RESPONSÁVEL' as status,
  u.id as usuario_id,
  u.nome_exibicao,
  COUNT(DISTINCT a.numero_processo) as processos_unicos,
  COUNT(a.id) as total_registros,
  ROUND(COUNT(DISTINCT a.numero_processo) * 100.0 / SUM(COUNT(DISTINCT a.numero_processo)) OVER (), 1) as percentual
FROM acervo a
INNER JOIN usuarios u ON u.id = a.responsavel_id
WHERE a.origem = 'acervo_geral'
  AND a.responsavel_id IN (21, 22, 24, 20)
GROUP BY u.id, u.nome_exibicao
ORDER BY processos_unicos DESC;

-- 3. Distribuição por região e responsável
SELECT
  'DISTRIBUIÇÃO POR REGIÃO E RESPONSÁVEL' as status,
  CASE
    WHEN a.trt IN ('TRT1', 'TRT2', 'TRT3', 'TRT15', 'TRT17') THEN 'Sudeste'
    WHEN a.trt IN ('TRT4', 'TRT9', 'TRT12') THEN 'Sul'
    WHEN a.trt IN ('TRT5', 'TRT6', 'TRT7', 'TRT13', 'TRT16', 'TRT19', 'TRT20', 'TRT21', 'TRT22') THEN 'Nordeste'
    WHEN a.trt IN ('TRT8', 'TRT11', 'TRT14') THEN 'Norte'
    WHEN a.trt IN ('TRT10', 'TRT18', 'TRT23', 'TRT24') THEN 'Centro-Oeste'
  END as regiao,
  u.nome_exibicao,
  COUNT(DISTINCT a.numero_processo) as processos_unicos
FROM acervo a
INNER JOIN usuarios u ON u.id = a.responsavel_id
WHERE a.origem = 'acervo_geral'
  AND a.responsavel_id IN (21, 22, 24, 20)
GROUP BY regiao, u.nome_exibicao
ORDER BY regiao, processos_unicos DESC;

-- 4. Detalhamento por TRT e responsável
SELECT
  'DETALHAMENTO POR TRT' as status,
  a.trt,
  u.nome_exibicao,
  COUNT(DISTINCT a.numero_processo) as processos_unicos,
  COUNT(a.id) as total_registros
FROM acervo a
INNER JOIN usuarios u ON u.id = a.responsavel_id
WHERE a.origem = 'acervo_geral'
  AND a.responsavel_id IN (21, 22, 24, 20)
GROUP BY a.trt, u.nome_exibicao
ORDER BY a.trt, processos_unicos DESC;

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. A distribuição usa MOD(id, 2) para garantir divisão equilibrada
-- 2. Processos com ID ímpar vão para uma pessoa, ID par para outra
-- 3. Processos do mesmo numero_processo em graus diferentes podem ficar
--    com responsáveis diferentes (cada instância é tratada separadamente)
-- 4. Os expedientes (pendentes_manifestacao) devem ser atribuídos separadamente
-- 5. As audiências devem ser atribuídas separadamente
-- ============================================================================
