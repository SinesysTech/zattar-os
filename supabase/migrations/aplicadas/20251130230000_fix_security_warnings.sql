-- Migration: Corrigir warnings de segurança do Supabase
-- Data: 2025-11-30 23:00:00 UTC
--
-- Esta migration corrige os warnings de segurança:
-- 1. Adiciona search_path às funções (previne search path hijacking)
-- 2. Move extensão pg_trgm do schema public para extensions

-- ============================================================================
-- FIX 1: Adicionar search_path às funções
-- ============================================================================

-- Função: get_current_user_id
-- Corrige warning: function_search_path_mutable
create or replace function public.get_current_user_id()
returns bigint
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id from public.usuarios where auth_user_id = auth.uid()
$$;

-- Função: update_updated_at_column
-- Corrige warning: function_search_path_mutable
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Função: validate_pasta_hierarchy
-- Corrige warning: function_search_path_mutable
create or replace function public.validate_pasta_hierarchy()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_id bigint;
  max_depth integer := 10;
  depth integer := 0;
begin
  if new.pasta_pai_id is null then
    return new;
  end if;

  current_id := new.pasta_pai_id;

  while current_id is not null and depth < max_depth loop
    if current_id = new.id then
      raise exception 'Ciclo detectado na hierarquia de pastas';
    end if;

    select pasta_pai_id into current_id
    from public.pastas
    where id = current_id;

    depth := depth + 1;
  end loop;

  if depth >= max_depth then
    raise exception 'Profundidade máxima de pastas atingida (máximo: %)', max_depth;
  end if;

  return new;
end;
$$;

-- ============================================================================
-- FIX 2: Mover extensão pg_trgm para schema extensions
-- ============================================================================

-- Criar schema extensions se não existir
create schema if not exists extensions;

-- Mover extensão pg_trgm para schema extensions
drop extension if exists pg_trgm cascade;
create extension if not exists pg_trgm with schema extensions;

-- Recriar índices trigram que foram perdidos
create index if not exists idx_documentos_titulo_trgm
  on public.documentos using gin (titulo extensions.gin_trgm_ops);

create index if not exists idx_documentos_descricao_trgm
  on public.documentos using gin (descricao extensions.gin_trgm_ops);

create index if not exists idx_pastas_nome_trgm
  on public.pastas using gin (nome extensions.gin_trgm_ops);

create index if not exists idx_templates_titulo_trgm
  on public.templates using gin (titulo extensions.gin_trgm_ops);

create index if not exists idx_mensagens_chat_conteudo_trgm
  on public.mensagens_chat using gin (conteudo extensions.gin_trgm_ops);

-- ============================================================================
-- ADICIONAL: Habilitar Realtime para tabelas necessárias
-- ============================================================================

-- Habilitar Realtime para documentos (colaboração)
alter publication supabase_realtime add table public.documentos;

-- Habilitar Realtime para salas de chat
alter publication supabase_realtime add table public.salas_chat;

-- Habilitar Realtime para mensagens de chat
alter publication supabase_realtime add table public.mensagens_chat;

-- Comentários
comment on function public.get_current_user_id() is
  'Retorna o ID do usuário atual. Security definer com search_path fixo para prevenir hijacking.';

comment on function public.update_updated_at_column() is
  'Atualiza automaticamente updated_at. Security definer com search_path fixo.';

comment on function public.validate_pasta_hierarchy() is
  'Valida hierarquia de pastas (sem ciclos). Security definer com search_path fixo.';
