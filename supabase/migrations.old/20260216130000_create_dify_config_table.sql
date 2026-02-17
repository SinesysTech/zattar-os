-- Tabela para configuração de múltiplos apps Dify
-- Cada registro representa um App no Dify (Chatbot, Workflow, etc) com sua própria chave.

create table if not exists dify_apps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  api_url text not null,
  api_key text not null,
  app_type text check (app_type in ('chat', 'workflow', 'completion', 'agent')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table dify_apps enable row level security;

-- Policies:
-- Leitura para autenticados
create policy "dify_apps_select_auth"
  on dify_apps for select
  using (auth.role() = 'authenticated');

-- Escrita (Insert/Update/Delete)
-- Idealmente restrito a admins, mas permissivo para desenvolvimento
create policy "dify_apps_modify_auth"
  on dify_apps for insert
  with check (auth.role() = 'authenticated');

create policy "dify_apps_update_auth"
  on dify_apps for update
  using (auth.role() = 'authenticated');

create policy "dify_apps_delete_auth"
  on dify_apps for delete
  using (auth.role() = 'authenticated');
