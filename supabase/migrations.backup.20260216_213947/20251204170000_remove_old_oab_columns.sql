-- Migration: Remover colunas antigas de OAB
--
-- PROPÓSITO:
-- Remove as colunas individuais de OAB que foram substituídas pela coluna JSONB 'oabs'
--
-- COLUNAS REMOVIDAS:
-- - numero_oab
-- - uf_oab
-- - situacao_oab

alter table representantes drop column if exists numero_oab;
alter table representantes drop column if exists uf_oab;
alter table representantes drop column if exists situacao_oab;
