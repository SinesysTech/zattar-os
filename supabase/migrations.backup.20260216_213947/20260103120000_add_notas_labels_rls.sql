-- ============================================================================
-- migration: add_notas_labels_rls
-- created_at (utc): 2026-01-03
--
-- objetivo:
-- - criar policies rls para as novas tabelas do app de notas:
--   - public.nota_etiquetas
--   - public.nota_etiqueta_vinculos
--
-- observação:
-- - rls policies são um caveat do fluxo declarativo (diff não rastreia policies),
--   então estas statements vivem em migrations versionadas.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- public.nota_etiquetas
-- ----------------------------------------------------------------------------

create policy "nota_etiquetas_select_own"
on public.nota_etiquetas
for select
to authenticated
using (
  (select auth.uid()) = (select public.usuarios.auth_user_id from public.usuarios where public.usuarios.id = usuario_id)
);

create policy "nota_etiquetas_insert_own"
on public.nota_etiquetas
for insert
to authenticated
with check (
  (select auth.uid()) = (select public.usuarios.auth_user_id from public.usuarios where public.usuarios.id = usuario_id)
);

create policy "nota_etiquetas_update_own"
on public.nota_etiquetas
for update
to authenticated
using (
  (select auth.uid()) = (select public.usuarios.auth_user_id from public.usuarios where public.usuarios.id = usuario_id)
)
with check (
  (select auth.uid()) = (select public.usuarios.auth_user_id from public.usuarios where public.usuarios.id = usuario_id)
);

create policy "nota_etiquetas_delete_own"
on public.nota_etiquetas
for delete
to authenticated
using (
  (select auth.uid()) = (select public.usuarios.auth_user_id from public.usuarios where public.usuarios.id = usuario_id)
);

-- ----------------------------------------------------------------------------
-- public.nota_etiqueta_vinculos
-- ----------------------------------------------------------------------------

create policy "nota_etiqueta_vinculos_select_own"
on public.nota_etiqueta_vinculos
for select
to authenticated
using (
  exists (
    select 1
    from public.notas
    where public.notas.id = nota_id
    and (select auth.uid()) = (select public.usuarios.auth_user_id from public.usuarios where public.usuarios.id = public.notas.usuario_id)
  )
);

create policy "nota_etiqueta_vinculos_insert_own"
on public.nota_etiqueta_vinculos
for insert
to authenticated
with check (
  exists (
    select 1
    from public.notas
    where public.notas.id = nota_id
    and (select auth.uid()) = (select public.usuarios.auth_user_id from public.usuarios where public.usuarios.id = public.notas.usuario_id)
  )
  and exists (
    select 1
    from public.nota_etiquetas
    where public.nota_etiquetas.id = etiqueta_id
    and (select auth.uid()) = (select public.usuarios.auth_user_id from public.usuarios where public.usuarios.id = public.nota_etiquetas.usuario_id)
  )
);

create policy "nota_etiqueta_vinculos_delete_own"
on public.nota_etiqueta_vinculos
for delete
to authenticated
using (
  exists (
    select 1
    from public.notas
    where public.notas.id = nota_id
    and (select auth.uid()) = (select public.usuarios.auth_user_id from public.usuarios where public.usuarios.id = public.notas.usuario_id)
  )
);


