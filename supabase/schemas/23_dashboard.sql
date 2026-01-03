-- ============================================================================
-- Tabela: layouts_painel
-- Configurações de layout do painel do usuário
-- ============================================================================

create table if not exists public.layouts_painel (
  id bigint generated always as identity primary key,
  usuario_id bigint not null references public.usuarios(id) on delete cascade unique,
  widgets jsonb not null default '[]',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.layouts_painel is 'Configurações de layout do painel do usuário';
comment on column public.layouts_painel.usuario_id is 'ID do usuário dono do layout';
comment on column public.layouts_painel.widgets is 'Configuração dos widgets em JSONB (posição, tamanho, tipo, etc)';

-- RLS
alter table public.layouts_painel enable row level security;

create policy "Service role tem acesso total a layouts_painel"
on public.layouts_painel for all
to service_role
using (true)
with check (true);

create policy "Usuários podem gerenciar seu próprio layout"
on public.layouts_painel for all
to authenticated
using ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id))
with check ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id));


-- ============================================================================
-- Tabela: links_personalizados
-- Links personalizados do usuário
-- ============================================================================

create table if not exists public.links_personalizados (
  id bigint generated always as identity primary key,
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  titulo text not null,
  url text not null,
  icone text,
  ordem integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.links_personalizados is 'Links personalizados do usuário';
comment on column public.links_personalizados.usuario_id is 'ID do usuário dono do link';
comment on column public.links_personalizados.titulo is 'Título do link';
comment on column public.links_personalizados.url is 'URL do link';
comment on column public.links_personalizados.icone is 'Ícone do link (nome ou URL)';
comment on column public.links_personalizados.ordem is 'Ordem de exibição';

-- Índices
create index if not exists idx_links_personalizados_usuario on public.links_personalizados(usuario_id);

-- RLS
alter table public.links_personalizados enable row level security;

create policy "Service role tem acesso total a links_personalizados"
on public.links_personalizados for all
to service_role
using (true)
with check (true);

create policy "Usuários podem gerenciar seus próprios links"
on public.links_personalizados for all
to authenticated
using ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id))
with check ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id));


-- ============================================================================
-- Tabela: tarefas
-- Tarefas do usuário
-- ============================================================================

-- ----------------------------------------------------------------------------
-- IMPORTANTE
-- ----------------------------------------------------------------------------
-- Este módulo é alinhado 1:1 ao template de Tasks (TanStack Table).
-- Não existe retrocompatibilidade com o modelo antigo (titulo/descricao/prioridade numérica/data_prevista).
--
-- Campos usados pela UI (contrato do template):
-- - id (text): ex: TASK-0001
-- - title (text)
-- - status (text): backlog | todo | in progress | done | canceled
-- - label (text): bug | feature | documentation
-- - priority (text): low | medium | high
--
-- O id é gerado via sequence para manter o formato TASK-xxxx.

create sequence if not exists public.tarefas_seq;

create table if not exists public.tarefas (
  id text primary key default (
    'TASK-' || lpad(nextval('public.tarefas_seq')::text, 4, '0')
  ),
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  title text not null,
  status text not null default 'todo',
  label text not null default 'feature',
  priority text not null default 'medium',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint tarefas_status_check check (status in ('backlog', 'todo', 'in progress', 'done', 'canceled')),
  constraint tarefas_label_check check (label in ('bug', 'feature', 'documentation')),
  constraint tarefas_priority_check check (priority in ('low', 'medium', 'high'))
);

comment on table public.tarefas is 'Tarefas do usuário';
comment on column public.tarefas.usuario_id is 'ID do usuário dono da tarefa';
comment on column public.tarefas.id is 'Identificador da tarefa no formato TASK-0001';
comment on column public.tarefas.title is 'Título da tarefa';
comment on column public.tarefas.status is 'Status: backlog, todo, in progress, done, canceled';
comment on column public.tarefas.label is 'Label: bug, feature, documentation';
comment on column public.tarefas.priority is 'Prioridade: low, medium, high';

-- Índices
create index if not exists idx_tarefas_usuario on public.tarefas(usuario_id);
create index if not exists idx_tarefas_status on public.tarefas(status);
create index if not exists idx_tarefas_label on public.tarefas(label);
create index if not exists idx_tarefas_priority on public.tarefas(priority);

-- RLS
alter table public.tarefas enable row level security;

create policy "Service role tem acesso total a tarefas"
on public.tarefas for all
to service_role
using (true)
with check (true);

create policy "Usuários podem gerenciar suas próprias tarefas"
on public.tarefas for all
to authenticated
using ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id))
with check ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id));


-- ============================================================================
-- Tabela: notas
-- Notas do usuário
-- ============================================================================

create table if not exists public.notas (
  id bigint generated always as identity primary key,
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  titulo text,
  conteudo text not null,
  cor text default '#ffffff',
  fixada boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.notas is 'Notas do usuário';
comment on column public.notas.usuario_id is 'ID do usuário dono da nota';
comment on column public.notas.titulo is 'Título da nota (opcional)';
comment on column public.notas.conteudo is 'Conteúdo da nota';
comment on column public.notas.cor is 'Cor de fundo da nota (hex)';
comment on column public.notas.fixada is 'Indica se a nota está fixada';

-- Índices
create index if not exists idx_notas_usuario on public.notas(usuario_id);
create index if not exists idx_notas_fixada on public.notas(fixada);

-- RLS
alter table public.notas enable row level security;

create policy "Service role tem acesso total a notas"
on public.notas for all
to service_role
using (true)
with check (true);

create policy "Usuários podem gerenciar suas próprias notas"
on public.notas for all
to authenticated
using ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id))
with check ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id));


-- ============================================================================
-- Funções: Contagem de processos únicos
-- Conta processos únicos por numero_processo diretamente no banco
-- ============================================================================

create or replace function public.count_processos_unicos(
  p_origem text default null,
  p_responsavel_id bigint default null,
  p_data_inicio timestamptz default null,
  p_data_fim timestamptz default null
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count bigint;
begin
  select count(distinct numero_processo)
  into v_count
  from public.acervo
  where numero_processo is not null
    and numero_processo != ''
    and (p_origem is null or origem = p_origem)
    and (p_responsavel_id is null or responsavel_id = p_responsavel_id)
    and (p_data_inicio is null or created_at >= p_data_inicio)
    and (p_data_fim is null or created_at < p_data_fim);
  
  return v_count;
end;
$$;

comment on function public.count_processos_unicos is 'Conta processos únicos por numero_processo. Parâmetros opcionais: origem (acervo_geral/arquivado), responsavel_id, data_inicio, data_fim';
