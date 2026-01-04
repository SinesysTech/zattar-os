-- ============================================================================
-- Tabela: notificacoes
-- Notificações para usuários sobre eventos importantes
-- ============================================================================

create table if not exists public.notificacoes (
  id bigint generated always as identity primary key,
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  tipo public.tipo_notificacao_usuario not null,
  titulo text not null,
  descricao text not null,
  entidade_tipo text not null check (entidade_tipo in ('processo', 'audiencia', 'expediente', 'pericia')),
  entidade_id bigint not null,
  lida boolean not null default false,
  lida_em timestamp with time zone,
  dados_adicionais jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

comment on table public.notificacoes is 'Notificações para usuários sobre eventos importantes relacionados a processos, audiências, expedientes e outras entidades atribuídas a eles.';
comment on column public.notificacoes.usuario_id is 'ID do usuário destinatário da notificação';
comment on column public.notificacoes.tipo is 'Tipo da notificação (processo_atribuido, audiencia_atribuida, etc)';
comment on column public.notificacoes.titulo is 'Título da notificação';
comment on column public.notificacoes.descricao is 'Descrição detalhada da notificação';
comment on column public.notificacoes.entidade_tipo is 'Tipo da entidade relacionada (processo, audiencia, expediente, pericia)';
comment on column public.notificacoes.entidade_id is 'ID da entidade relacionada na tabela correspondente';
comment on column public.notificacoes.lida is 'Indica se a notificação foi lida pelo usuário';
comment on column public.notificacoes.lida_em is 'Timestamp de quando a notificação foi marcada como lida';
comment on column public.notificacoes.dados_adicionais is 'Dados adicionais em formato JSONB (ex: link para a entidade, metadados)';

-- Índices para performance
create index if not exists idx_notificacoes_usuario on public.notificacoes(usuario_id);
create index if not exists idx_notificacoes_lida on public.notificacoes(usuario_id, lida) where lida = false;
create index if not exists idx_notificacoes_created_at on public.notificacoes(usuario_id, created_at desc);
create index if not exists idx_notificacoes_entidade on public.notificacoes(entidade_tipo, entidade_id);

-- RLS
alter table public.notificacoes enable row level security;

create policy "Service role tem acesso total a notificacoes"
on public.notificacoes for all
to service_role
using (true)
with check (true);

create policy "Usuários podem ler suas próprias notificações"
on public.notificacoes for select
to authenticated
using (
  (select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id)
);

create policy "Usuários podem atualizar suas próprias notificações"
on public.notificacoes for update
to authenticated
using (
  (select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id)
)
with check (
  (select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id)
);

-- Trigger para atualizar updated_at
create trigger update_notificacoes_updated_at
before update on public.notificacoes
for each row
execute function public.update_updated_at_column();

