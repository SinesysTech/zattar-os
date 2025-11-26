-- ============================================================================
-- Tabela: cargos
-- Cargos para organização interna de usuários
-- ============================================================================

create table if not exists public.cargos (
  id bigint generated always as identity primary key,
  nome text not null unique,
  descricao text,
  ativo boolean default true,
  created_by bigint references public.usuarios(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.cargos is 'Cargos para organização interna de usuários (ex: Advogado Sênior, Estagiário)';
comment on column public.cargos.id is 'ID sequencial do cargo';
comment on column public.cargos.nome is 'Nome do cargo (único, obrigatório)';
comment on column public.cargos.descricao is 'Descrição opcional do cargo';
comment on column public.cargos.ativo is 'Indica se o cargo está ativo (default: true)';
comment on column public.cargos.created_by is 'ID do usuário que criou o cargo';
comment on column public.cargos.created_at is 'Data e hora de criação';
comment on column public.cargos.updated_at is 'Data e hora da última atualização';

-- Índices
create index if not exists idx_cargos_ativo on public.cargos(ativo);

-- RLS
alter table public.cargos enable row level security;

create policy "Service role tem acesso total a cargos"
on public.cargos for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler cargos"
on public.cargos for select
to authenticated
using (true);


-- ============================================================================
-- Tabela: permissoes
-- Permissões granulares por usuário
-- ============================================================================

create table if not exists public.permissoes (
  id bigint generated always as identity primary key,
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  recurso text not null,
  operacao text not null,
  permitido boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  unique (usuario_id, recurso, operacao)
);

comment on table public.permissoes is 'Permissões granulares por usuário. RLS: Service role tem acesso total. Usuários podem ler suas próprias permissões. Backend verifica is_super_admin.';
comment on column public.permissoes.id is 'ID sequencial da permissão';
comment on column public.permissoes.usuario_id is 'ID do usuário que possui a permissão';
comment on column public.permissoes.recurso is 'Recurso (ex: advogados, contratos, acervo)';
comment on column public.permissoes.operacao is 'Operação (ex: listar, criar, editar, deletar, atribuir_responsavel)';
comment on column public.permissoes.permitido is 'Indica se a permissão está permitida (default: true)';
comment on column public.permissoes.created_at is 'Data e hora de criação';
comment on column public.permissoes.updated_at is 'Data e hora da última atualização';

-- Índices
create index if not exists idx_permissoes_usuario on public.permissoes(usuario_id);
create index if not exists idx_permissoes_recurso on public.permissoes(recurso);
create index if not exists idx_permissoes_recurso_operacao on public.permissoes(recurso, operacao);

-- RLS
alter table public.permissoes enable row level security;

create policy "Service role tem acesso total a permissoes"
on public.permissoes for all
to service_role
using (true)
with check (true);

create policy "Usuários podem ler suas próprias permissões"
on public.permissoes for select
to authenticated
using ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id));
