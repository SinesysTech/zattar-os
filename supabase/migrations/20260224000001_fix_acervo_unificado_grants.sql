-- Migration: Restaurar GRANTs na materialized view acervo_unificado
--
-- PROBLEMA:
-- A migration 20251223000001_fix_acervo_unificado_fonte_verdade.sql fez DROP + CREATE
-- da materialized view acervo_unificado, mas não restaurou os GRANTs.
-- No PostgreSQL, DROP remove todas as permissões do objeto.
-- Resultado: "permission denied for materialized view acervo_unificado"
--
-- SOLUÇÃO:
-- Restaurar SELECT para service_role, authenticated e anon.
-- Restaurar permissão na função refresh_acervo_unificado.

-- Permissões na materialized view
GRANT SELECT ON TABLE "public"."acervo_unificado" TO "service_role";
GRANT SELECT ON TABLE "public"."acervo_unificado" TO "authenticated";
GRANT SELECT ON TABLE "public"."acervo_unificado" TO "anon";

-- Permissão na função de refresh (service_role precisa para atualizar a view)
GRANT ALL ON FUNCTION "public"."refresh_acervo_unificado"("use_concurrent" boolean) TO "service_role";
