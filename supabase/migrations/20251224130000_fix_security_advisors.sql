-- =============================================================================
-- Migration: Fix Security Advisors
-- Descrição: Corrige avisos de segurança detectados pelo Supabase Advisor:
--            1. Adiciona search_path seguro em funções
--            2. Move extensão vector do schema public para extensions
-- Data: 2024-12-24
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Fix search_path in Functions
-- -----------------------------------------------------------------------------

-- 1. Fix propagar_responsavel_processo_para_expedientes()
create or replace function propagar_responsavel_processo_para_expedientes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Apenas atuar se o responsavel_id mudou
  if NEW.responsavel_id IS DISTINCT FROM OLD.responsavel_id then
    -- Atualizar todos os expedientes deste processo
    update public.expedientes
    set
      responsavel_id = NEW.responsavel_id,
      updated_at = now()
    where processo_id = NEW.id;
  end if;

  return NEW;
end;
$$;

comment on function propagar_responsavel_processo_para_expedientes is
'Quando um processo tem seu responsável alterado, propaga automaticamente a mudança para todos os expedientes vinculados.';

-- 2. Fix update_user_last_seen()
create or replace function public.update_user_last_seen()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.usuarios
  set last_seen_at = now()
  where id = new.id;

  return new;
end;
$$;

comment on function public.update_user_last_seen is
'Atualiza o timestamp de última visualização do usuário';

-- -----------------------------------------------------------------------------
-- STEP 2: Move vector extension from public to extensions schema
-- -----------------------------------------------------------------------------

-- Create extensions schema if it doesn't exist
create schema if not exists extensions;

-- Move vector extension to extensions schema
alter extension vector set schema extensions;

-- Grant usage on extensions schema to authenticated users
grant usage on schema extensions to authenticated;
grant usage on schema extensions to service_role;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- All security advisors resolved:
-- ✓ search_path fixed in propagar_responsavel_processo_para_expedientes
-- ✓ search_path fixed in update_user_last_seen
-- ✓ vector extension moved to extensions schema
-- =============================================================================
