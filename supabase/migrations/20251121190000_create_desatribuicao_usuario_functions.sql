-- Migration: Funções RPC para desatribuição em lote de usuário
-- Descrição: Cria funções para desatribuir um usuário de todos os processos, audiências, pendentes e expedientes
-- Usado quando um usuário é desativado

-- ============================================================================
-- Função: desatribuir_todos_processos_usuario
-- Descrição: Desatribui todos os processos de um usuário
-- ============================================================================
create or replace function public.desatribuir_todos_processos_usuario(
  p_usuario_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Atualizar todos os processos atribuídos ao usuário
  update public.acervo
  set responsavel_id = null
  where responsavel_id = p_usuario_id;
end;
$$;

comment on function public.desatribuir_todos_processos_usuario(bigint) is
  'Desatribui todos os processos (acervo) de um usuário. Usado na desativação de usuário.';

-- ============================================================================
-- Função: desatribuir_todas_audiencias_usuario
-- Descrição: Desatribui todas as audiências de um usuário
-- ============================================================================
create or replace function public.desatribuir_todas_audiencias_usuario(
  p_usuario_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Atualizar todas as audiências atribuídas ao usuário
  update public.audiencias
  set responsavel_id = null
  where responsavel_id = p_usuario_id;
end;
$$;

comment on function public.desatribuir_todas_audiencias_usuario(bigint) is
  'Desatribui todas as audiências de um usuário. Usado na desativação de usuário.';

-- ============================================================================
-- Função: desatribuir_todos_pendentes_usuario
-- Descrição: Desatribui todos os processos pendentes de manifestação de um usuário
-- ============================================================================
create or replace function public.desatribuir_todos_pendentes_usuario(
  p_usuario_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Atualizar todos os pendentes atribuídos ao usuário
  update public.pendentes_manifestacao
  set responsavel_id = null
  where responsavel_id = p_usuario_id;
end;
$$;

comment on function public.desatribuir_todos_pendentes_usuario(bigint) is
  'Desatribui todos os processos pendentes de manifestação de um usuário. Usado na desativação de usuário.';

-- ============================================================================
-- Função: desatribuir_todos_expedientes_usuario
-- Descrição: Desatribui todos os expedientes manuais de um usuário
-- ============================================================================
create or replace function public.desatribuir_todos_expedientes_usuario(
  p_usuario_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Atualizar todos os expedientes manuais atribuídos ao usuário
  update public.expedientes_manuais
  set responsavel_id = null
  where responsavel_id = p_usuario_id;
end;
$$;

comment on function public.desatribuir_todos_expedientes_usuario(bigint) is
  'Desatribui todos os expedientes manuais de um usuário. Usado na desativação de usuário.';

-- ============================================================================
-- Função: desatribuir_todos_contratos_usuario
-- Descrição: Desatribui todos os contratos de um usuário
-- ============================================================================
create or replace function public.desatribuir_todos_contratos_usuario(
  p_usuario_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Atualizar todos os contratos atribuídos ao usuário
  update public.contratos
  set responsavel_id = null
  where responsavel_id = p_usuario_id;
end;
$$;

comment on function public.desatribuir_todos_contratos_usuario(bigint) is
  'Desatribui todos os contratos de um usuário. Usado na desativação de usuário.';
