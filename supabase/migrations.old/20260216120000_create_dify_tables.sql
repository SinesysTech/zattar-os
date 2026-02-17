-- Tabela para persistir execuções de workflow Dify (auditoria)
create table if not exists dify_execucoes (
  id uuid primary key default gen_random_uuid(),
  workflow_run_id text not null,
  workflow_id text,
  task_id text,
  status text not null default 'running',
  inputs jsonb default '{}',
  outputs jsonb default '{}',
  error text,
  total_tokens integer default 0,
  elapsed_time numeric default 0,
  total_steps integer default 0,
  usuario_id integer references usuarios(id),
  created_at timestamptz default now(),
  finished_at timestamptz
);

-- Tabela para mapear conversas Dify ↔ usuários
create table if not exists dify_conversas (
  id uuid primary key default gen_random_uuid(),
  conversation_id text not null unique,
  app_key text not null,
  nome text,
  usuario_id integer references usuarios(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índices
create index if not exists idx_dify_execucoes_usuario_id on dify_execucoes(usuario_id);
create index if not exists idx_dify_execucoes_workflow_run_id on dify_execucoes(workflow_run_id);
create index if not exists idx_dify_execucoes_status on dify_execucoes(status);
create index if not exists idx_dify_conversas_usuario_id on dify_conversas(usuario_id);
create index if not exists idx_dify_conversas_conversation_id on dify_conversas(conversation_id);

-- RLS
alter table dify_execucoes enable row level security;
alter table dify_conversas enable row level security;

-- Policies: usuários autenticados veem apenas seus próprios registros
create policy "dify_execucoes_select_own"
  on dify_execucoes for select
  using (usuario_id = (select id from usuarios where auth_user_id = auth.uid() limit 1));

create policy "dify_execucoes_insert_own"
  on dify_execucoes for insert
  with check (usuario_id = (select id from usuarios where auth_user_id = auth.uid() limit 1));

create policy "dify_execucoes_update_own"
  on dify_execucoes for update
  using (usuario_id = (select id from usuarios where auth_user_id = auth.uid() limit 1));

create policy "dify_conversas_select_own"
  on dify_conversas for select
  using (usuario_id = (select id from usuarios where auth_user_id = auth.uid() limit 1));

create policy "dify_conversas_insert_own"
  on dify_conversas for insert
  with check (usuario_id = (select id from usuarios where auth_user_id = auth.uid() limit 1));

create policy "dify_conversas_update_own"
  on dify_conversas for update
  using (usuario_id = (select id from usuarios where auth_user_id = auth.uid() limit 1));

-- Service role bypass (para MCP tools e server actions)
create policy "dify_execucoes_service_all"
  on dify_execucoes for all
  using (auth.role() = 'service_role');

create policy "dify_conversas_service_all"
  on dify_conversas for all
  using (auth.role() = 'service_role');
