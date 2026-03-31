-- Migration: Drop unused indexes and reclaim storage
-- Date: 2026-03-31
-- Context: Supabase advisor audit found ~270 MB in unused indexes (0 scans in 25+ days)
--
-- SAFE to drop: regular indexes with 0 index scans since stats reset
-- NOT dropped: primary keys, unique constraints, vector indexes (future semantic search)
--
-- After applying, run VACUUM ANALYZE manually on large tables (can't run inside transaction):
--   VACUUM ANALYZE public.acervo;
--   VACUUM ANALYZE public.acervo_unificado;
--   VACUUM ANALYZE public.processo_partes;

-- ═══════════════════════════════════════════════════════════════════════
-- ACERVO indexes (largest table: 475 MB, 38k rows)
-- ═══════════════════════════════════════════════════════════════════════

-- 228 MB GIN index on timeline_jsonb - never queried via GIN operators
DROP INDEX IF EXISTS public.idx_acervo_timeline_jsonb;

-- 2.1 MB - data_arquivamento never filtered by index
DROP INDEX IF EXISTS public.idx_acervo_data_arquivamento;

-- 1.1 MB - advogado_id has another used index (idx_acervo_advogado_trt_grau)
DROP INDEX IF EXISTS public.idx_acervo_advogado_id;

-- 1.0 MB - classe_judicial_id never queried
DROP INDEX IF EXISTS public.idx_acervo_classe_judicial_id;

-- ═══════════════════════════════════════════════════════════════════════
-- ACERVO_UNIFICADO indexes (materialized view layer)
-- ═══════════════════════════════════════════════════════════════════════

-- 2.7 MB - composite index never used
DROP INDEX IF EXISTS public.idx_acervo_unificado_numero_processo_advogado;

-- 2.1 MB - redundant with idx_acervo_unificado_unique
DROP INDEX IF EXISTS public.idx_acervo_unificado_numero_processo;

-- 1.0 MB - data_autuacao never filtered
DROP INDEX IF EXISTS public.idx_acervo_unificado_data_autuacao;

-- 600 KB - responsavel_id never queried here
DROP INDEX IF EXISTS public.idx_acervo_unificado_responsavel_id;

-- 592 KB - composite never used
DROP INDEX IF EXISTS public.idx_acervo_unificado_advogado_trt_origem;

-- 584 KB - composite never used
DROP INDEX IF EXISTS public.idx_acervo_unificado_advogado_trt;

-- ═══════════════════════════════════════════════════════════════════════
-- PROCESSO_PARTES indexes (87 MB table)
-- ═══════════════════════════════════════════════════════════════════════

-- 2.2 MB - id_pje never queried
DROP INDEX IF EXISTS public.idx_processo_partes_id_pje;

-- 952 KB - tipo_parte never filtered alone
DROP INDEX IF EXISTS public.idx_processo_partes_tipo_parte;

-- 944 KB - trt_grau never filtered alone
DROP INDEX IF EXISTS public.idx_processo_partes_trt_grau;

-- 920 KB - polo never filtered alone
DROP INDEX IF EXISTS public.idx_processo_partes_polo;

-- ═══════════════════════════════════════════════════════════════════════
-- ENDERECOS indexes
-- ═══════════════════════════════════════════════════════════════════════

-- 6.7 MB - composite dados_pje_completo never used
DROP INDEX IF EXISTS public.idx_enderecos_dados_pje_completo;

-- 576 KB - id_pje has the unique constraint index covering this
DROP INDEX IF EXISTS public.idx_enderecos_id_pje;

-- ═══════════════════════════════════════════════════════════════════════
-- CAPTURA_LOGS_BRUTOS indexes
-- ═══════════════════════════════════════════════════════════════════════

-- 2.2 MB - tipo_captura + criado_em never filtered
DROP INDEX IF EXISTS public.idx_captura_logs_brutos_tipo_captura_criado_em;

-- 2.1 MB - trt + grau + status + criado_em never filtered
DROP INDEX IF EXISTS public.idx_captura_logs_brutos_trt_grau_status_criado_em;

-- ═══════════════════════════════════════════════════════════════════════
-- NOTIFICACOES indexes
-- ═══════════════════════════════════════════════════════════════════════

-- 2.7 MB - entidade columns never filtered
DROP INDEX IF EXISTS public.idx_notificacoes_entidade;

-- ═══════════════════════════════════════════════════════════════════════
-- MV_DADOS_PRIMEIRO_GRAU (materialized view)
-- ═══════════════════════════════════════════════════════════════════════

-- 1.0 MB - numero index never used
DROP INDEX IF EXISTS public.idx_mv_dados_primeiro_grau_numero;

-- ═══════════════════════════════════════════════════════════════════════
-- TRIBUNALORGO legacy indexes (Prisma naming, table: orgaos_tribunais)
-- Note: keeping PK and unique constraint, dropping only regular indexes
-- ═══════════════════════════════════════════════════════════════════════

-- 1.3 MB - orgaoIdCNJ alone never queried (unique covers it)
DROP INDEX IF EXISTS public."TribunalOrgao_orgaoIdCNJ_idx";

-- ═══════════════════════════════════════════════════════════════════════
-- ANALYZE tables with stale statistics
-- ═══════════════════════════════════════════════════════════════════════

ANALYZE public.acervo;
ANALYZE public.acervo_unificado;
ANALYZE public.processo_partes;
ANALYZE public.enderecos;
ANALYZE public.comunica_cnj;
ANALYZE public.contratos;
ANALYZE public.notificacoes;
