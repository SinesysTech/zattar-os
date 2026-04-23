-- Fase 2: Corrige 8 advisors de seguranca WARN
-- Ver detalhes de cada item nos comentarios inline.

-- 1) rls_policy_always_true: blog_posts_authenticated_all
DROP POLICY IF EXISTS "blog_posts_authenticated_all" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_authenticated_read" ON public.blog_posts;

CREATE POLICY "blog_posts_authenticated_read"
ON public.blog_posts
FOR SELECT
TO authenticated
USING (true);

-- 2) rls_policy_always_true: comunica_cnj_resumos
DROP POLICY IF EXISTS "Usuarios autenticados podem atualizar resumos" ON public.comunica_cnj_resumos;
DROP POLICY IF EXISTS "Usuarios autenticados podem criar resumos" ON public.comunica_cnj_resumos;
DROP POLICY IF EXISTS "Usuarios autenticados podem ver resumos" ON public.comunica_cnj_resumos;
DROP POLICY IF EXISTS "comunica_cnj_resumos_authenticated_select" ON public.comunica_cnj_resumos;
DROP POLICY IF EXISTS "comunica_cnj_resumos_authenticated_insert" ON public.comunica_cnj_resumos;
DROP POLICY IF EXISTS "comunica_cnj_resumos_authenticated_update" ON public.comunica_cnj_resumos;

CREATE POLICY "comunica_cnj_resumos_authenticated_select"
ON public.comunica_cnj_resumos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "comunica_cnj_resumos_authenticated_insert"
ON public.comunica_cnj_resumos
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "comunica_cnj_resumos_authenticated_update"
ON public.comunica_cnj_resumos
FOR UPDATE
TO authenticated
USING ((SELECT auth.role()) = 'authenticated')
WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- 3) materialized_view_in_api: mv_dados_primeiro_grau
-- Nao consumido pelo app; revoga SELECT de anon/authenticated.
-- public.acervo_unificado NAO foi revogado porque e consumido em 11 arquivos
-- do modulo acervo/processos. Manter warning ate refatoracao para RPC/schema privado.
REVOKE SELECT ON public.mv_dados_primeiro_grau FROM anon, authenticated;

-- 4) function_search_path_mutable
ALTER FUNCTION public.update_blog_posts_updated_at() SET search_path = public, pg_temp;

-- 5) public_bucket_allows_listing: bucket chat-files e public=true,
-- URLs publicas funcionam sem policy SELECT; a policy permitia LIST sem necessidade.
DROP POLICY IF EXISTS "Everyone can view chat files" ON storage.objects;
