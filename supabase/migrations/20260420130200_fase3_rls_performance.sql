-- Fase 3: Corrige auth_rls_initplan (7) + multiple_permissive_policies (4)
-- Troca auth.role()/auth.uid() por (SELECT auth.role()/auth.uid()) para avaliacao
-- uma-unica-vez por query em vez de por linha.

-- agenda_eventos (3 policies)
DROP POLICY IF EXISTS "Usuários autenticados podem ler agenda_eventos" ON public.agenda_eventos;
CREATE POLICY "Usuários autenticados podem ler agenda_eventos"
ON public.agenda_eventos
FOR SELECT
TO authenticated
USING ((SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem criar agenda_eventos" ON public.agenda_eventos;
CREATE POLICY "Usuários autenticados podem criar agenda_eventos"
ON public.agenda_eventos
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar agenda_eventos" ON public.agenda_eventos;
CREATE POLICY "Usuários autenticados podem atualizar agenda_eventos"
ON public.agenda_eventos
FOR UPDATE
TO authenticated
USING ((SELECT auth.role()) = 'authenticated');

-- assinatura_digital_pacotes
DROP POLICY IF EXISTS "pacotes_service_admin" ON public.assinatura_digital_pacotes;
CREATE POLICY "pacotes_service_admin"
ON public.assinatura_digital_pacotes
FOR ALL
TO public
USING ((SELECT auth.role()) = 'service_role');

-- assinatura_digital_pacote_documentos
DROP POLICY IF EXISTS "pacote_documentos_service_admin" ON public.assinatura_digital_pacote_documentos;
CREATE POLICY "pacote_documentos_service_admin"
ON public.assinatura_digital_pacote_documentos
FOR ALL
TO public
USING ((SELECT auth.role()) = 'service_role');

-- organizations (INSERT policy)
DROP POLICY IF EXISTS "Authenticated users can create organization" ON public.organizations;
CREATE POLICY "Authenticated users can create organization"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.role()) = 'authenticated'
  AND (owner_id = (SELECT auth.uid()) OR is_super_admin())
);

-- multiple_permissive_policies em credenciais_email
-- service_role ja bypassa RLS pelo Supabase; policy era redundante e causava overlap
-- com as 4 policies granulares de "Users can ... own email credentials".
DROP POLICY IF EXISTS "Service role full access to email credentials" ON public.credenciais_email;
