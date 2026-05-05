-- ============================================================
-- RECONCILIAÇÃO DE CONTRATOS NÃO DISTRIBUÍDOS
-- Data: 2026-05-05
--
-- Objetivo: Contratos importados de PDFs históricos sem processo
-- vinculado. Para cada contrato candidato, busca processos onde:
--   1. O cliente do contrato é parte no processo (processo_partes)
--   2. A parte contrária do contrato bate com a do processo via:
--      Camada A — CPF/CNPJ exato (score 1.0, prioridade)
--      Camada B — Similaridade de nome pg_trgm (threshold >= 0.6)
--
-- Múltiplos matches por contrato → vincular todos
-- (um contrato pode ter gerado N processos)
--
-- COMO USAR:
--   PASSO 1 — Execute a SEÇÃO 1 (SELECT) e revise os resultados
--   PASSO 2 — Após revisão, execute a SEÇÃO 2 (BEGIN/COMMIT)
--
-- Execute via: Supabase Dashboard > SQL Editor
-- ou: MCP execute_sql
-- ============================================================

-- pg_trgm é necessário para a função similarity()
-- Já está habilitada no projeto (20260422140000 usa gin_trgm_ops)
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- ============================================================
-- SEÇÃO 1 — DRY RUN (somente leitura, zero alterações)
-- Execute primeiro para revisar todos os matches antes de aplicar
-- ============================================================

WITH
  -- Threshold configurável: aumente para ser mais conservador
  config AS (
    SELECT 0.6::float AS threshold
  ),

  -- Contratos candidatos: status != distribuido, sem processo vinculado,
  -- com pelo menos uma parte contrária cadastrada
  candidatos AS (
    SELECT
      c.id                            AS contrato_id,
      c.cliente_id,
      c.status                        AS status_atual,
      c.papel_cliente_no_contrato
    FROM contratos c
    WHERE c.status != 'distribuido'
      AND NOT EXISTS (
        SELECT 1
        FROM contrato_processos cp
        WHERE cp.contrato_id = c.id
      )
      AND EXISTS (
        SELECT 1
        FROM contrato_partes cparte
        WHERE cparte.contrato_id = c.id
          AND cparte.tipo_entidade IN ('parte_contraria', 'parte_contraria_transitoria')
      )
  ),

  -- Nome e CPF/CNPJ da parte contrária de cada contrato candidato.
  -- Usa nome_snapshot quando disponível (preservado no momento da importação),
  -- senão faz join nas tabelas de entidade.
  -- partes_contrarias_transitorias usa campo único cpf_ou_cnpj.
  parte_contrato AS (
    SELECT
      cp.contrato_id,
      COALESCE(
        cp.nome_snapshot,
        CASE cp.tipo_entidade
          WHEN 'parte_contraria'            THEN pc.nome
          WHEN 'parte_contraria_transitoria' THEN pct.nome
        END
      )                                                  AS nome,
      CASE WHEN cp.tipo_entidade = 'parte_contraria' THEN pc.cpf  ELSE NULL END AS cpf,
      CASE WHEN cp.tipo_entidade = 'parte_contraria' THEN pc.cnpj ELSE NULL END AS cnpj,
      -- Para transitórias, cpf_ou_cnpj é campo unificado
      CASE WHEN cp.tipo_entidade = 'parte_contraria_transitoria' THEN pct.cpf_ou_cnpj ELSE NULL END AS cpf_cnpj_transitoria
    FROM contrato_partes cp
    LEFT JOIN partes_contrarias pc
      ON  pc.id = cp.entidade_id
      AND cp.tipo_entidade = 'parte_contraria'
    LEFT JOIN partes_contrarias_transitorias pct
      ON  pct.id = cp.entidade_id
      AND cp.tipo_entidade = 'parte_contraria_transitoria'
    WHERE cp.contrato_id IN (SELECT contrato_id FROM candidatos)
      AND cp.tipo_entidade IN ('parte_contraria', 'parte_contraria_transitoria')
  ),

  -- Processos onde o cliente do contrato aparece como parte vinculada
  processos_do_cliente AS (
    SELECT DISTINCT
      pp.processo_id,
      pp.entidade_id AS cliente_id
    FROM processo_partes pp
    WHERE pp.tipo_entidade = 'cliente'
      AND pp.entidade_id IN (SELECT cliente_id FROM candidatos)
  ),

  -- Partes contrárias linkadas a esses processos via processo_partes
  parte_processo_vinculada AS (
    SELECT
      pp.processo_id,
      pc.nome,
      pc.cpf,
      pc.cnpj
    FROM processo_partes pp
    JOIN partes_contrarias pc ON pc.id = pp.entidade_id
    WHERE pp.tipo_entidade = 'parte_contraria'
      AND pp.processo_id IN (SELECT processo_id FROM processos_do_cliente)
  ),

  -- Dados do processo: número, data_autuacao e nomes livres do PJE
  -- (nome_parte_re / nome_parte_autora são texto cru importado do scraper)
  acervo_info AS (
    SELECT
      a.id             AS processo_id,
      a.numero_processo,
      a.data_autuacao,
      a.nome_parte_re,
      a.nome_parte_autora
    FROM acervo a
    WHERE a.id IN (SELECT processo_id FROM processos_do_cliente)
  ),

  -- ──────────────────────────────────────────────
  -- CAMADA A: Match por CPF/CNPJ exato (score 1.0)
  -- ──────────────────────────────────────────────
  match_cpf_cnpj AS (
    SELECT
      cand.contrato_id,
      pdc.processo_id,
      ai.numero_processo,
      ai.data_autuacao,
      pct.nome           AS nome_contrato,
      ppv.nome           AS nome_processo,
      1.0::float         AS sim_score,
      'cpf_cnpj'         AS metodo,
      cand.status_atual
    FROM candidatos cand
    JOIN parte_contrato pct         ON pct.contrato_id  = cand.contrato_id
    JOIN processos_do_cliente pdc   ON pdc.cliente_id   = cand.cliente_id
    JOIN parte_processo_vinculada ppv ON ppv.processo_id = pdc.processo_id
    JOIN acervo_info ai             ON ai.processo_id   = pdc.processo_id
    WHERE
      -- CPF bate (parte_contraria definitiva)
      (pct.cpf IS NOT NULL AND pct.cpf != '' AND pct.cpf = ppv.cpf)
      OR
      -- CNPJ bate (parte_contraria definitiva)
      (pct.cnpj IS NOT NULL AND pct.cnpj != '' AND pct.cnpj = ppv.cnpj)
      OR
      -- CPF/CNPJ unificado da transitória bate com cpf do processo
      (pct.cpf_cnpj_transitoria IS NOT NULL AND pct.cpf_cnpj_transitoria != ''
        AND pct.cpf_cnpj_transitoria = ppv.cpf)
      OR
      -- CPF/CNPJ unificado da transitória bate com cnpj do processo
      (pct.cpf_cnpj_transitoria IS NOT NULL AND pct.cpf_cnpj_transitoria != ''
        AND pct.cpf_cnpj_transitoria = ppv.cnpj)
  ),

  -- ──────────────────────────────────────────────────────────────
  -- CAMADA B: Match por similaridade de nome (fallback, >= 0.6)
  -- Compara nome_snapshot do contrato com:
  --   - acervo.nome_parte_re ou nome_parte_autora (texto livre PJE)
  --   - partes_contrarias.nome vinculado via processo_partes
  -- Lógica do polo: se cliente é 'autora', parte contrária está no re
  -- ──────────────────────────────────────────────────────────────
  match_nome AS (
    SELECT
      cand.contrato_id,
      pdc.processo_id,
      ai.numero_processo,
      ai.data_autuacao,
      pct.nome            AS nome_contrato,
      CASE cand.papel_cliente_no_contrato
        WHEN 'autora' THEN ai.nome_parte_re
        ELSE               ai.nome_parte_autora
      END                 AS nome_processo,
      GREATEST(
        COALESCE(similarity(pct.nome, ai.nome_parte_re),   0),
        COALESCE(similarity(pct.nome, ai.nome_parte_autora), 0),
        COALESCE(similarity(pct.nome, ppv.nome),            0)
      )                   AS sim_score,
      'nome_similarity'   AS metodo,
      cand.status_atual
    FROM candidatos cand
    CROSS JOIN config
    JOIN parte_contrato pct           ON pct.contrato_id  = cand.contrato_id
    JOIN processos_do_cliente pdc     ON pdc.cliente_id   = cand.cliente_id
    JOIN acervo_info ai               ON ai.processo_id   = pdc.processo_id
    LEFT JOIN parte_processo_vinculada ppv ON ppv.processo_id = pdc.processo_id
    WHERE
      pct.nome IS NOT NULL
      -- Excluir pares que já bateram por CPF/CNPJ (evitar duplicata)
      AND NOT EXISTS (
        SELECT 1
        FROM match_cpf_cnpj m
        WHERE m.contrato_id = cand.contrato_id
          AND m.processo_id = pdc.processo_id
      )
      -- Aplicar threshold de similaridade
      AND GREATEST(
        COALESCE(similarity(pct.nome, ai.nome_parte_re),   0),
        COALESCE(similarity(pct.nome, ai.nome_parte_autora), 0),
        COALESCE(similarity(pct.nome, ppv.nome),            0)
      ) >= config.threshold
  ),

  todos_matches AS (
    SELECT * FROM match_cpf_cnpj
    UNION ALL
    SELECT * FROM match_nome
  )

-- ──── RESULTADO DO DRY RUN ────
-- Colunas: contrato_id, processo_id, numero_processo, data_autuacao,
--          nome_contrato, nome_processo, sim_score, metodo, status_atual
--
-- Revise especialmente:
--   - Linhas com sim_score entre 0.60 e 0.70 (edge cases)
--   - Contratos com muitos matches (cliente com muitos processos)
SELECT
  contrato_id,
  processo_id,
  numero_processo,
  data_autuacao,
  nome_contrato,
  nome_processo,
  round(sim_score::numeric, 3) AS sim_score,
  metodo,
  status_atual
FROM todos_matches
ORDER BY contrato_id, sim_score DESC;


-- ============================================================
-- SEÇÃO 2 — EXECUTE (aplica as mudanças em transação atômica)
-- Execute SOMENTE após revisar o dry-run acima.
-- Se algo parecer errado, ajuste o threshold no topo da SEÇÃO 1
-- antes de executar este bloco.
-- ============================================================

/*
BEGIN;

-- Tabela temporária com todos os matches válidos desta execução
CREATE TEMP TABLE _reconciliacao_matches AS
WITH
  config AS (SELECT 0.6::float AS threshold),

  candidatos AS (
    SELECT
      c.id                            AS contrato_id,
      c.cliente_id,
      c.status                        AS status_atual,
      c.papel_cliente_no_contrato
    FROM contratos c
    WHERE c.status != 'distribuido'
      AND NOT EXISTS (
        SELECT 1 FROM contrato_processos cp WHERE cp.contrato_id = c.id
      )
      AND EXISTS (
        SELECT 1 FROM contrato_partes cparte
        WHERE cparte.contrato_id = c.id
          AND cparte.tipo_entidade IN ('parte_contraria', 'parte_contraria_transitoria')
      )
  ),

  parte_contrato AS (
    SELECT
      cp.contrato_id,
      COALESCE(
        cp.nome_snapshot,
        CASE cp.tipo_entidade
          WHEN 'parte_contraria'            THEN pc.nome
          WHEN 'parte_contraria_transitoria' THEN pct.nome
        END
      )                                                  AS nome,
      CASE WHEN cp.tipo_entidade = 'parte_contraria' THEN pc.cpf  ELSE NULL END AS cpf,
      CASE WHEN cp.tipo_entidade = 'parte_contraria' THEN pc.cnpj ELSE NULL END AS cnpj,
      CASE WHEN cp.tipo_entidade = 'parte_contraria_transitoria' THEN pct.cpf_ou_cnpj ELSE NULL END AS cpf_cnpj_transitoria
    FROM contrato_partes cp
    LEFT JOIN partes_contrarias pc
      ON  pc.id = cp.entidade_id AND cp.tipo_entidade = 'parte_contraria'
    LEFT JOIN partes_contrarias_transitorias pct
      ON  pct.id = cp.entidade_id AND cp.tipo_entidade = 'parte_contraria_transitoria'
    WHERE cp.contrato_id IN (SELECT contrato_id FROM candidatos)
      AND cp.tipo_entidade IN ('parte_contraria', 'parte_contraria_transitoria')
  ),

  processos_do_cliente AS (
    SELECT DISTINCT pp.processo_id, pp.entidade_id AS cliente_id
    FROM processo_partes pp
    WHERE pp.tipo_entidade = 'cliente'
      AND pp.entidade_id IN (SELECT cliente_id FROM candidatos)
  ),

  parte_processo_vinculada AS (
    SELECT pp.processo_id, pc.nome, pc.cpf, pc.cnpj
    FROM processo_partes pp
    JOIN partes_contrarias pc ON pc.id = pp.entidade_id
    WHERE pp.tipo_entidade = 'parte_contraria'
      AND pp.processo_id IN (SELECT processo_id FROM processos_do_cliente)
  ),

  acervo_info AS (
    SELECT a.id AS processo_id, a.numero_processo, a.data_autuacao,
           a.nome_parte_re, a.nome_parte_autora
    FROM acervo a
    WHERE a.id IN (SELECT processo_id FROM processos_do_cliente)
  ),

  match_cpf_cnpj AS (
    SELECT
      cand.contrato_id, pdc.processo_id, ai.numero_processo, ai.data_autuacao,
      pct.nome AS nome_contrato, ppv.nome AS nome_processo,
      1.0::float AS sim_score, 'cpf_cnpj' AS metodo, cand.status_atual
    FROM candidatos cand
    JOIN parte_contrato pct           ON pct.contrato_id  = cand.contrato_id
    JOIN processos_do_cliente pdc     ON pdc.cliente_id   = cand.cliente_id
    JOIN parte_processo_vinculada ppv ON ppv.processo_id  = pdc.processo_id
    JOIN acervo_info ai               ON ai.processo_id   = pdc.processo_id
    WHERE
      (pct.cpf IS NOT NULL AND pct.cpf != '' AND pct.cpf = ppv.cpf)
      OR (pct.cnpj IS NOT NULL AND pct.cnpj != '' AND pct.cnpj = ppv.cnpj)
      OR (pct.cpf_cnpj_transitoria IS NOT NULL AND pct.cpf_cnpj_transitoria != ''
          AND pct.cpf_cnpj_transitoria = ppv.cpf)
      OR (pct.cpf_cnpj_transitoria IS NOT NULL AND pct.cpf_cnpj_transitoria != ''
          AND pct.cpf_cnpj_transitoria = ppv.cnpj)
  ),

  match_nome AS (
    SELECT
      cand.contrato_id, pdc.processo_id, ai.numero_processo, ai.data_autuacao,
      pct.nome AS nome_contrato,
      CASE cand.papel_cliente_no_contrato
        WHEN 'autora' THEN ai.nome_parte_re ELSE ai.nome_parte_autora
      END AS nome_processo,
      GREATEST(
        COALESCE(similarity(pct.nome, ai.nome_parte_re),   0),
        COALESCE(similarity(pct.nome, ai.nome_parte_autora), 0),
        COALESCE(similarity(pct.nome, ppv.nome),            0)
      ) AS sim_score,
      'nome_similarity' AS metodo,
      cand.status_atual
    FROM candidatos cand
    CROSS JOIN config
    JOIN parte_contrato pct           ON pct.contrato_id  = cand.contrato_id
    JOIN processos_do_cliente pdc     ON pdc.cliente_id   = cand.cliente_id
    JOIN acervo_info ai               ON ai.processo_id   = pdc.processo_id
    LEFT JOIN parte_processo_vinculada ppv ON ppv.processo_id = pdc.processo_id
    WHERE pct.nome IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM match_cpf_cnpj m
        WHERE m.contrato_id = cand.contrato_id AND m.processo_id = pdc.processo_id
      )
      AND GREATEST(
        COALESCE(similarity(pct.nome, ai.nome_parte_re),   0),
        COALESCE(similarity(pct.nome, ai.nome_parte_autora), 0),
        COALESCE(similarity(pct.nome, ppv.nome),            0)
      ) >= config.threshold
  )

SELECT DISTINCT ON (contrato_id, processo_id)
  contrato_id, processo_id, numero_processo, data_autuacao,
  nome_contrato, nome_processo, sim_score, metodo, status_atual
FROM (SELECT * FROM match_cpf_cnpj UNION ALL SELECT * FROM match_nome) t
ORDER BY contrato_id, processo_id, sim_score DESC;

-- Resumo antes de aplicar — confira os números
SELECT
  count(*)                                             AS total_vinculos,
  count(DISTINCT contrato_id)                          AS contratos_afetados,
  count(DISTINCT processo_id)                          AS processos_vinculados,
  count(*) FILTER (WHERE metodo = 'cpf_cnpj')          AS por_cpf_cnpj,
  count(*) FILTER (WHERE metodo = 'nome_similarity')   AS por_nome_similarity,
  round(avg(sim_score)::numeric, 3)                    AS sim_score_medio,
  round(min(sim_score)::numeric, 3)                    AS sim_score_minimo
FROM _reconciliacao_matches;

-- 1. Vincular processos aos contratos
INSERT INTO contrato_processos (contrato_id, processo_id)
SELECT DISTINCT contrato_id, processo_id
FROM _reconciliacao_matches
ON CONFLICT (contrato_id, processo_id) DO NOTHING;

-- 2. Atualizar status dos contratos para 'distribuido'
UPDATE contratos
SET
  status     = 'distribuido',
  updated_at = now()
WHERE id IN (SELECT DISTINCT contrato_id FROM _reconciliacao_matches)
  AND status != 'distribuido';

-- 3. Registrar uma entrada no histórico de status por contrato
-- (usa DISTINCT ON para pegar o match de maior score como motivo)
INSERT INTO contrato_status_historico
  (contrato_id, from_status, to_status, reason)
SELECT DISTINCT ON (contrato_id)
  contrato_id,
  status_atual::status_contrato                        AS from_status,
  'distribuido'::status_contrato                       AS to_status,
  'reconciliacao_automatica_v1 | metodo: ' || metodo
    || ' | score: ' || round(sim_score::numeric, 2)
    || ' | processo: ' || numero_processo              AS reason
FROM _reconciliacao_matches
ORDER BY contrato_id, sim_score DESC;

-- Verificação final — compare com a contagem antes de executar
SELECT
  count(*) FILTER (WHERE status = 'distribuido')       AS total_distribuidos_apos,
  count(*) FILTER (WHERE status != 'distribuido')      AS ainda_nao_distribuidos
FROM contratos;

DROP TABLE _reconciliacao_matches;

COMMIT;
*/
