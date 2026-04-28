-- Corrige chave de unicidade da tabela expedientes
--
-- PROBLEMA:
--   A constraint antiga (id_pje, trt, grau, numero_processo) permitia apenas
--   1 linha por processo, sobrescrevendo documentos com prazo por documentos
--   sem prazo quando o PJE retornava múltiplos expedientes para o mesmo processo.
--
-- SOLUÇÃO:
--   Nova constraint (id_pje, id_documento, trt, grau, data_criacao_expediente)
--   garante 1 linha por (expediente, documento, data de criação), permitindo que
--   um mesmo processo tenha múltiplos expedientes simultâneos com documentos distintos.
--   A data de criação é incluída para tratar reutilização de IDs pelo PJE.

-- 1. Remove a constraint antiga
ALTER TABLE "public"."expedientes"
  DROP CONSTRAINT IF EXISTS "expedientes_id_pje_trt_grau_numero_processo_key";

-- 2. Adiciona a nova constraint
--    NULLS NOT DISTINCT: dois NULLs no mesmo campo são tratados como iguais,
--    garantindo unicidade mesmo quando id_documento ou data_criacao_expediente
--    são NULL (expedientes manuais ou capturas sem documento associado).
ALTER TABLE "public"."expedientes"
  ADD CONSTRAINT "expedientes_id_pje_id_documento_trt_grau_data_criacao_key"
  UNIQUE NULLS NOT DISTINCT ("id_pje", "id_documento", "trt", "grau", "data_criacao_expediente");
