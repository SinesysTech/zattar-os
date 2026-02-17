-- ============================================================================
-- Migration: Fix security advisors for peças/contratos
-- - Function Search Path Mutable (lint 0011)
-- - Permissive RLS policies (lint 0024)
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1) Fix functions with role-mutable search_path
-- --------------------------------------------------------------------------

create or replace function public.update_pecas_modelos_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.increment_pecas_modelo_uso()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.gerado_de_modelo_id is not null then
    update public.pecas_modelos
    set uso_count = uso_count + 1
    where id = new.gerado_de_modelo_id;
  end if;

  return new;
end;
$$;

create or replace function public.notify_user_broadcast()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.broadcast_changes(
    'user:' || coalesce(new.usuario_id, old.usuario_id)::text || ':notifications',
    tg_op,
    tg_op,
    tg_table_name,
    tg_table_schema,
    new,
    old
  );

  return coalesce(new, old);
end;
$$;

-- --------------------------------------------------------------------------
-- 2) Ensure created_by / criado_por are set consistently
-- --------------------------------------------------------------------------

alter table public.pecas_modelos
  alter column criado_por set default ((auth.uid())::text)::bigint;

alter table public.contrato_documentos
  alter column created_by set default ((auth.uid())::text)::bigint;

-- --------------------------------------------------------------------------
-- 3) Tighten permissive RLS policies
-- --------------------------------------------------------------------------

-- contrato_documentos: restrict write operations to row owner (created_by)

drop policy if exists "Usuários autenticados podem inserir contrato_documentos" on public.contrato_documentos;
drop policy if exists "Usuários autenticados podem atualizar contrato_documentos" on public.contrato_documentos;
drop policy if exists "Usuários autenticados podem deletar contrato_documentos" on public.contrato_documentos;

create policy "Usuários autenticados podem inserir contrato_documentos"
on public.contrato_documentos for insert
to authenticated
with check (created_by = ((auth.uid())::text)::bigint);

create policy "Usuários autenticados podem atualizar contrato_documentos"
on public.contrato_documentos for update
to authenticated
using (created_by = ((auth.uid())::text)::bigint)
with check (created_by = ((auth.uid())::text)::bigint);

create policy "Usuários autenticados podem deletar contrato_documentos"
on public.contrato_documentos for delete
to authenticated
using (created_by = ((auth.uid())::text)::bigint);

-- pecas_modelos: restrict write operations to row owner (criado_por)

drop policy if exists "Usuários autenticados podem ler pecas_modelos públicos ou próprios" on public.pecas_modelos;
drop policy if exists "Usuários autenticados podem inserir pecas_modelos" on public.pecas_modelos;
drop policy if exists "Usuários autenticados podem atualizar pecas_modelos próprios" on public.pecas_modelos;

create policy "Usuários autenticados podem ler pecas_modelos públicos ou próprios"
on public.pecas_modelos for select
to authenticated
using (
  (criado_por = ((auth.uid())::text)::bigint)
  or (visibilidade = 'publico' and ativo = true)
);

create policy "Usuários autenticados podem inserir pecas_modelos"
on public.pecas_modelos for insert
to authenticated
with check (criado_por = ((auth.uid())::text)::bigint);

create policy "Usuários autenticados podem atualizar pecas_modelos próprios"
on public.pecas_modelos for update
to authenticated
using (criado_por = ((auth.uid())::text)::bigint)
with check (criado_por = ((auth.uid())::text)::bigint);
