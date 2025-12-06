-- Migration: Sistema de Assistentes de IA
-- Created: 2025-12-02 00:00:00 UTC
-- Description: Cria tabela assistentes para gerenciamento de assistentes de IA via iframe

-- ============================================================================
-- TABELA: assistentes
-- Armazena assistentes de IA gerenciados por super administradores
-- ============================================================================

create table public.assistentes (
  id bigint generated always as identity primary key,
  nome text not null,
  descricao text,
  iframe_code text not null,
  ativo boolean not null default true,
  criado_por bigint not null references public.usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint assistentes_nome_length check (char_length(nome) between 1 and 200),
  constraint assistentes_iframe_not_empty check (char_length(iframe_code) > 0)
);

comment on table public.assistentes is 'Assistentes de IA gerenciados por super administradores via iframe';
comment on column public.assistentes.nome is 'Nome do assistente de IA';
comment on column public.assistentes.descricao is 'Descrição opcional do assistente';
comment on column public.assistentes.iframe_code is 'Código HTML do iframe para embed do assistente';
comment on column public.assistentes.ativo is 'Status do assistente (ativo/inativo)';
comment on column public.assistentes.criado_por is 'ID do super admin que criou o assistente';

-- Índices para performance
create index idx_assistentes_criado_por on public.assistentes using btree (criado_por);
create index idx_assistentes_ativo on public.assistentes using btree (ativo);
create index idx_assistentes_created_at on public.assistentes using btree (created_at desc);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

alter table public.assistentes enable row level security;

-- Policy SELECT: Apenas super admins podem visualizar
create policy "Super admins can view assistentes"
  on public.assistentes
  for select
  to authenticated
  using (
    exists (
      select 1 from public.usuarios
      where id = get_current_user_id()
        and isSuperAdmin = true
    )
  );

-- Policy INSERT: Apenas super admins podem criar
create policy "Super admins can create assistentes"
  on public.assistentes
  for insert
  to authenticated
  with check (
    criado_por = get_current_user_id() and
    exists (
      select 1 from public.usuarios
      where id = get_current_user_id()
        and isSuperAdmin = true
    )
  );

-- Policy UPDATE: Apenas super admins podem atualizar
create policy "Super admins can update assistentes"
  on public.assistentes
  for update
  to authenticated
  using (
    exists (
      select 1 from public.usuarios
      where id = get_current_user_id()
        and isSuperAdmin = true
    )
  );

-- Policy DELETE: Apenas super admins podem deletar
create policy "Super admins can delete assistentes"
  on public.assistentes
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.usuarios
      where id = get_current_user_id()
        and isSuperAdmin = true
    )
  );

-- ============================================================================
-- TRIGGER: updated_at automático
-- ============================================================================

create trigger update_assistentes_updated_at
  before update on public.assistentes
  for each row execute function update_updated_at_column();