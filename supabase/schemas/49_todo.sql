-- ============================================================================
-- todo (template)
-- ============================================================================
--
-- objetivo:
-- - persistir o template "todo-list-app" (to-dos, subtarefas, comentários, anexos e atribuições)
-- - alinhar o comportamento do front-end com dados do banco (sem json local)
--
-- segurança:
-- - rls habilitado em todas as tabelas
-- - policies permissive para service_role (acesso total)
-- - policies para authenticated (somente linhas do próprio usuário via public.usuarios.auth_user_id)
--

-- ----------------------------------------------------------------------------
-- sequence: todo_items_seq (para ids TD-0001)
-- ----------------------------------------------------------------------------
create sequence if not exists public.todo_items_seq;

-- ----------------------------------------------------------------------------
-- table: todo_items
-- ----------------------------------------------------------------------------
create table if not exists public.todo_items (
  id text primary key default (
    'TD-' || lpad(nextval('public.todo_items_seq')::text, 4, '0')
  ),
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending',
  priority text not null default 'medium',
  due_date date,
  reminder_at timestamp with time zone,
  starred boolean not null default false,
  position integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint todo_items_status_check check (status in ('pending', 'in-progress', 'completed')),
  constraint todo_items_priority_check check (priority in ('low', 'medium', 'high')),
  constraint todo_items_position_check check (position >= 0)
);

comment on table public.todo_items is 'Itens de to-do do usuário (template todo-list-app).';
comment on column public.todo_items.id is 'Identificador do to-do no formato TD-0001.';
comment on column public.todo_items.usuario_id is 'ID do usuário dono do to-do.';
comment on column public.todo_items.title is 'Título do to-do.';
comment on column public.todo_items.description is 'Descrição (opcional).';
comment on column public.todo_items.status is 'Status: pending, in-progress, completed.';
comment on column public.todo_items.priority is 'Prioridade: low, medium, high.';
comment on column public.todo_items.due_date is 'Data prevista (opcional).';
comment on column public.todo_items.reminder_at is 'Data/hora de lembrete (opcional).';
comment on column public.todo_items.starred is 'Indica se o item está marcado como favorito.';
comment on column public.todo_items.position is 'Ordenação do item na lista (0..n).';

create index if not exists idx_todo_items_usuario on public.todo_items(usuario_id);
create index if not exists idx_todo_items_usuario_position on public.todo_items(usuario_id, position);
create index if not exists idx_todo_items_usuario_status on public.todo_items(usuario_id, status);
create index if not exists idx_todo_items_usuario_priority on public.todo_items(usuario_id, priority);
create index if not exists idx_todo_items_usuario_starred on public.todo_items(usuario_id, starred);

alter table public.todo_items enable row level security;

create policy "Service role full access todo_items"
on public.todo_items
for all
to service_role
using (true)
with check (true);

create policy "Authenticated manage own todo_items"
on public.todo_items
for all
to authenticated
using ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id))
with check ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id));

-- ----------------------------------------------------------------------------
-- sequence: todo_subtasks_seq (para ids TDS-0001)
-- ----------------------------------------------------------------------------
create sequence if not exists public.todo_subtasks_seq;

-- ----------------------------------------------------------------------------
-- table: todo_subtasks
-- ----------------------------------------------------------------------------
create table if not exists public.todo_subtasks (
  id text primary key default (
    'TDS-' || lpad(nextval('public.todo_subtasks_seq')::text, 4, '0')
  ),
  todo_id text not null references public.todo_items(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  position integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint todo_subtasks_position_check check (position >= 0)
);

comment on table public.todo_subtasks is 'Subtarefas vinculadas a um item de to-do.';
comment on column public.todo_subtasks.todo_id is 'ID do item de to-do (public.todo_items.id).';

create index if not exists idx_todo_subtasks_todo on public.todo_subtasks(todo_id);
create index if not exists idx_todo_subtasks_todo_position on public.todo_subtasks(todo_id, position);

alter table public.todo_subtasks enable row level security;

create policy "Service role full access todo_subtasks"
on public.todo_subtasks
for all
to service_role
using (true)
with check (true);

create policy "Authenticated manage own todo_subtasks"
on public.todo_subtasks
for all
to authenticated
using (
  exists (
    select 1
    from public.todo_items
    join public.usuarios on public.usuarios.id = public.todo_items.usuario_id
    where public.todo_items.id = todo_id
    and public.usuarios.auth_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.todo_items
    join public.usuarios on public.usuarios.id = public.todo_items.usuario_id
    where public.todo_items.id = todo_id
    and public.usuarios.auth_user_id = (select auth.uid())
  )
);

-- ----------------------------------------------------------------------------
-- sequence: todo_comments_seq (para ids TDC-0001)
-- ----------------------------------------------------------------------------
create sequence if not exists public.todo_comments_seq;

-- ----------------------------------------------------------------------------
-- table: todo_comments
-- ----------------------------------------------------------------------------
create table if not exists public.todo_comments (
  id text primary key default (
    'TDC-' || lpad(nextval('public.todo_comments_seq')::text, 4, '0')
  ),
  todo_id text not null references public.todo_items(id) on delete cascade,
  body text not null,
  created_at timestamp with time zone not null default now()
);

comment on table public.todo_comments is 'Comentários vinculados a um item de to-do.';
comment on column public.todo_comments.todo_id is 'ID do item de to-do (public.todo_items.id).';
comment on column public.todo_comments.body is 'Conteúdo do comentário.';

create index if not exists idx_todo_comments_todo on public.todo_comments(todo_id);
create index if not exists idx_todo_comments_todo_created_at on public.todo_comments(todo_id, created_at);

alter table public.todo_comments enable row level security;

create policy "Service role full access todo_comments"
on public.todo_comments
for all
to service_role
using (true)
with check (true);

create policy "Authenticated manage own todo_comments"
on public.todo_comments
for all
to authenticated
using (
  exists (
    select 1
    from public.todo_items
    join public.usuarios on public.usuarios.id = public.todo_items.usuario_id
    where public.todo_items.id = todo_id
    and public.usuarios.auth_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.todo_items
    join public.usuarios on public.usuarios.id = public.todo_items.usuario_id
    where public.todo_items.id = todo_id
    and public.usuarios.auth_user_id = (select auth.uid())
  )
);

-- ----------------------------------------------------------------------------
-- sequence: todo_files_seq (para ids TDF-0001)
-- ----------------------------------------------------------------------------
create sequence if not exists public.todo_files_seq;

-- ----------------------------------------------------------------------------
-- table: todo_files
-- ----------------------------------------------------------------------------
create table if not exists public.todo_files (
  id text primary key default (
    'TDF-' || lpad(nextval('public.todo_files_seq')::text, 4, '0')
  ),
  todo_id text not null references public.todo_items(id) on delete cascade,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  url text not null,
  created_at timestamp with time zone not null default now()
);

comment on table public.todo_files is 'Anexos (metadados + url) vinculados a um item de to-do.';
comment on column public.todo_files.todo_id is 'ID do item de to-do (public.todo_items.id).';
comment on column public.todo_files.url is 'URL do anexo (no v1 pode ser data-url/base64; futuramente storage path).';

create index if not exists idx_todo_files_todo on public.todo_files(todo_id);

alter table public.todo_files enable row level security;

create policy "Service role full access todo_files"
on public.todo_files
for all
to service_role
using (true)
with check (true);

create policy "Authenticated manage own todo_files"
on public.todo_files
for all
to authenticated
using (
  exists (
    select 1
    from public.todo_items
    join public.usuarios on public.usuarios.id = public.todo_items.usuario_id
    where public.todo_items.id = todo_id
    and public.usuarios.auth_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.todo_items
    join public.usuarios on public.usuarios.id = public.todo_items.usuario_id
    where public.todo_items.id = todo_id
    and public.usuarios.auth_user_id = (select auth.uid())
  )
);

-- ----------------------------------------------------------------------------
-- table: todo_assignees (integração com public.usuarios)
-- ----------------------------------------------------------------------------
create table if not exists public.todo_assignees (
  todo_id text not null references public.todo_items(id) on delete cascade,
  usuario_id bigint not null references public.usuarios(id) on delete restrict,
  created_at timestamp with time zone not null default now(),
  constraint todo_assignees_pkey primary key (todo_id, usuario_id)
);

comment on table public.todo_assignees is 'Tabela de junção (N:N) entre todo_items e usuarios (atribuídos).';
comment on column public.todo_assignees.todo_id is 'ID do item de to-do.';
comment on column public.todo_assignees.usuario_id is 'ID do usuário atribuído ao to-do.';

create index if not exists idx_todo_assignees_todo on public.todo_assignees(todo_id);
create index if not exists idx_todo_assignees_usuario on public.todo_assignees(usuario_id);

alter table public.todo_assignees enable row level security;

create policy "Service role full access todo_assignees"
on public.todo_assignees
for all
to service_role
using (true)
with check (true);

create policy "Authenticated manage own todo_assignees"
on public.todo_assignees
for all
to authenticated
using (
  exists (
    select 1
    from public.todo_items
    join public.usuarios on public.usuarios.id = public.todo_items.usuario_id
    where public.todo_items.id = todo_id
    and public.usuarios.auth_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.todo_items
    join public.usuarios on public.usuarios.id = public.todo_items.usuario_id
    where public.todo_items.id = todo_id
    and public.usuarios.auth_user_id = (select auth.uid())
  )
);


