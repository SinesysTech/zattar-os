-- ============================================================================
-- kanban (template)
-- ============================================================================
--
-- objetivo:
-- - persistir o template de kanban (colunas + cards) no banco
-- - alinhar 1:1 ao modelo do template (ids string, prioridade low/medium/high, progress 0..100, users como jsonb)
--
-- segurança:
-- - rls habilitado em todas as tabelas
-- - policies permissive para service_role (acesso total)
-- - policies para authenticated (somente linhas do próprio usuário via public.usuarios.auth_user_id)
--

-- ----------------------------------------------------------------------------
-- sequence: kanban_columns_seq (para ids COL-0001)
-- ----------------------------------------------------------------------------
create sequence if not exists public.kanban_columns_seq;

-- ----------------------------------------------------------------------------
-- table: kanban_columns
-- ----------------------------------------------------------------------------
create table if not exists public.kanban_columns (
  id text primary key default (
    'COL-' || lpad(nextval('public.kanban_columns_seq')::text, 4, '0')
  ),
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

comment on table public.kanban_columns is 'Colunas do quadro Kanban do usuário (template).';
comment on column public.kanban_columns.id is 'Identificador da coluna no formato COL-0001.';
comment on column public.kanban_columns.usuario_id is 'ID do usuário dono da coluna.';
comment on column public.kanban_columns.title is 'Título da coluna (ex: Backlog).';
comment on column public.kanban_columns.position is 'Ordenação da coluna no quadro (0..n).';

create index if not exists idx_kanban_columns_usuario on public.kanban_columns(usuario_id);
create index if not exists idx_kanban_columns_usuario_position on public.kanban_columns(usuario_id, position);

alter table public.kanban_columns enable row level security;

create policy "Service role full access kanban_columns"
on public.kanban_columns
for all
to service_role
using (true)
with check (true);

create policy "Authenticated manage own kanban_columns"
on public.kanban_columns
for all
to authenticated
using ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id))
with check ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id));

-- ----------------------------------------------------------------------------
-- sequence: kanban_tasks_seq (para ids KBT-0001)
-- ----------------------------------------------------------------------------
create sequence if not exists public.kanban_tasks_seq;

-- ----------------------------------------------------------------------------
-- table: kanban_tasks
-- ----------------------------------------------------------------------------
create table if not exists public.kanban_tasks (
  id text primary key default (
    'KBT-' || lpad(nextval('public.kanban_tasks_seq')::text, 4, '0')
  ),
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  column_id text not null references public.kanban_columns(id) on delete cascade,
  title text not null,
  description text,
  priority text not null default 'medium',
  assignee text,
  due_date date,
  progress integer not null default 0,
  attachments integer not null default 0,
  comments integer not null default 0,
  users jsonb not null default '[]'::jsonb,
  position integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint kanban_tasks_priority_check check (priority in ('low', 'medium', 'high')),
  constraint kanban_tasks_progress_check check (progress >= 0 and progress <= 100),
  constraint kanban_tasks_attachments_check check (attachments >= 0),
  constraint kanban_tasks_comments_check check (comments >= 0)
);

comment on table public.kanban_tasks is 'Cards/tarefas do quadro Kanban do usuário (template).';
comment on column public.kanban_tasks.id is 'Identificador do card no formato KBT-0001.';
comment on column public.kanban_tasks.usuario_id is 'ID do usuário dono do card.';
comment on column public.kanban_tasks.column_id is 'ID da coluna (public.kanban_columns.id).';
comment on column public.kanban_tasks.title is 'Título do card.';
comment on column public.kanban_tasks.description is 'Descrição do card (opcional).';
comment on column public.kanban_tasks.priority is 'Prioridade: low, medium, high.';
comment on column public.kanban_tasks.assignee is 'Nome do responsável (opcional).';
comment on column public.kanban_tasks.due_date is 'Data prevista (opcional).';
comment on column public.kanban_tasks.progress is 'Progresso (0..100).';
comment on column public.kanban_tasks.attachments is 'Quantidade de anexos (contador).';
comment on column public.kanban_tasks.comments is 'Quantidade de comentários (contador).';
comment on column public.kanban_tasks.users is 'Lista de usuários do card (array jsonb com name/src/alt/fallback).';
comment on column public.kanban_tasks.position is 'Ordenação do card dentro da coluna (0..n).';

create index if not exists idx_kanban_tasks_usuario on public.kanban_tasks(usuario_id);
create index if not exists idx_kanban_tasks_usuario_column on public.kanban_tasks(usuario_id, column_id);
create index if not exists idx_kanban_tasks_usuario_column_position on public.kanban_tasks(usuario_id, column_id, position);

alter table public.kanban_tasks enable row level security;

create policy "Service role full access kanban_tasks"
on public.kanban_tasks
for all
to service_role
using (true)
with check (true);

create policy "Authenticated manage own kanban_tasks"
on public.kanban_tasks
for all
to authenticated
using ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id))
with check ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id));


