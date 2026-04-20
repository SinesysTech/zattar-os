-- Fase 1: Fix advisor 0010_security_definer_view
-- Converte 4 views para SECURITY INVOKER (default em PG 15+).
-- Nas views vw_queries_*, adicionalmente revogamos acesso de anon/authenticated
-- porque pg_stat_statements exige pg_read_all_stats (role privilegiado).

ALTER VIEW public.vw_queries_mais_frequentes SET (security_invoker = true);
ALTER VIEW public.vw_queries_mais_lentas SET (security_invoker = true);
ALTER VIEW public.vw_queries_outliers SET (security_invoker = true);
ALTER VIEW public.expedientes_com_origem SET (security_invoker = true);

REVOKE SELECT ON public.vw_queries_mais_frequentes FROM anon, authenticated;
REVOKE SELECT ON public.vw_queries_mais_lentas FROM anon, authenticated;
REVOKE SELECT ON public.vw_queries_outliers FROM anon, authenticated;
