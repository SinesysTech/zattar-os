-- ============================================================================
-- Tabela: logs_alteracao
-- Logs de auditoria de alterações no sistema
-- ============================================================================

create table if not exists public.logs_alteracao (
  id bigint generated always as identity primary key,
  tipo_entidade text not null check (tipo_entidade in ('acervo', 'audiencias', 'expedientes', 'usuarios', 'advogados', 'clientes', 'partes_contrarias', 'contratos')),
  entidade_id bigint not null,
  tipo_evento text not null,
  usuario_que_executou_id bigint not null references public.usuarios(id),
  responsavel_anterior_id bigint references public.usuarios(id),
  responsavel_novo_id bigint references public.usuarios(id),
  dados_evento jsonb,
  created_at timestamp with time zone default now()
);

comment on table public.logs_alteracao is 'Logs de auditoria de alterações. RLS: Service role tem acesso total. Usuários autenticados podem ler.';
comment on column public.logs_alteracao.tipo_entidade is 'Tipo da entidade alterada (acervo, audiencias, expedientes, etc)';
comment on column public.logs_alteracao.entidade_id is 'ID do registro da entidade alterada';
comment on column public.logs_alteracao.tipo_evento is 'Tipo do evento/alteração (atribuicao_responsavel, transferencia_responsavel, etc)';
comment on column public.logs_alteracao.usuario_que_executou_id is 'Usuário que executou a ação';
comment on column public.logs_alteracao.responsavel_anterior_id is 'Responsável anterior (para eventos de atribuição/transferência)';
comment on column public.logs_alteracao.responsavel_novo_id is 'Novo responsável (para eventos de atribuição/transferência)';
comment on column public.logs_alteracao.dados_evento is 'Dados adicionais específicos do evento em JSONB';
comment on column public.logs_alteracao.created_at is 'Data e hora do log';

-- Índices
create index if not exists idx_logs_alteracao_tipo_entidade on public.logs_alteracao(tipo_entidade);
create index if not exists idx_logs_alteracao_entidade_id on public.logs_alteracao(entidade_id);
create index if not exists idx_logs_alteracao_tipo_evento on public.logs_alteracao(tipo_evento);
create index if not exists idx_logs_alteracao_created_at on public.logs_alteracao(created_at);

-- RLS
alter table public.logs_alteracao enable row level security;

create policy "Service role tem acesso total aos logs"
on public.logs_alteracao for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler logs"
on public.logs_alteracao for select
to authenticated
using (true);


-- ============================================================================
-- Tabela: locks
-- Locks distribuídos para operações críticas
-- ============================================================================

create table if not exists public.locks (
  id bigint generated always as identity primary key,
  lock_key text not null unique,
  locked_at timestamp with time zone default now(),
  locked_by text,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

comment on table public.locks is 'Locks distribuídos para operações críticas';
comment on column public.locks.lock_key is 'Chave única do lock';
comment on column public.locks.locked_at is 'Data/hora em que o lock foi adquirido';
comment on column public.locks.locked_by is 'Identificador de quem adquiriu o lock';
comment on column public.locks.expires_at is 'Data/hora de expiração do lock';

-- Índices
create index if not exists idx_locks_expires_at on public.locks(expires_at);
