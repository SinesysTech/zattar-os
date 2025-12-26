-- ============================================================================
-- Tabela: mcp_audit_log
-- Registro de auditoria de todas as chamadas ao servidor MCP
-- ============================================================================

create table if not exists public.mcp_audit_log (
  id bigserial primary key,
  tool_name varchar(255) not null,
  usuario_id bigint references public.usuarios(id),
  arguments jsonb,
  result jsonb,
  success boolean not null default true,
  error_message text,
  duration_ms integer,
  ip_address varchar(45),
  user_agent text,
  created_at timestamptz not null default now()
);

comment on table public.mcp_audit_log is 'Registro de auditoria de todas as chamadas ao servidor MCP';
comment on column public.mcp_audit_log.tool_name is 'Nome da ferramenta MCP chamada';
comment on column public.mcp_audit_log.arguments is 'Argumentos passados para a ferramenta';
comment on column public.mcp_audit_log.result is 'Resultado retornado pela ferramenta';
comment on column public.mcp_audit_log.success is 'Indica se a chamada foi bem sucedida';
comment on column public.mcp_audit_log.duration_ms is 'Duração da execução em milissegundos';

-- Índices
create index if not exists idx_mcp_audit_tool_name on public.mcp_audit_log(tool_name);
create index if not exists idx_mcp_audit_usuario on public.mcp_audit_log(usuario_id);
create index if not exists idx_mcp_audit_created_at on public.mcp_audit_log(created_at);
create index if not exists idx_mcp_audit_tool_created on public.mcp_audit_log(tool_name, created_at desc);
create index if not exists idx_mcp_audit_success on public.mcp_audit_log(success) where not success;

-- ============================================================================
-- Tabela: mcp_quotas
-- Quotas e limites de uso do MCP por usuário
-- ============================================================================

create table if not exists public.mcp_quotas (
  id bigserial primary key,
  usuario_id bigint references public.usuarios(id),
  tier varchar(50) not null default 'authenticated',
  calls_today integer not null default 0,
  calls_month integer not null default 0,
  last_call_at timestamptz,
  quota_reset_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(usuario_id)
);

comment on table public.mcp_quotas is 'Quotas e limites de uso do MCP por usuário';
comment on column public.mcp_quotas.tier is 'Tier do usuário: anonymous, authenticated, service';
comment on column public.mcp_quotas.calls_today is 'Número de chamadas realizadas hoje';
comment on column public.mcp_quotas.calls_month is 'Número de chamadas realizadas no mês';

-- Índices
create index if not exists idx_mcp_quotas_tier on public.mcp_quotas(tier);

-- ============================================================================
-- Funções auxiliares
-- ============================================================================

-- Função para atualizar updated_at automaticamente
create or replace function public.update_mcp_quotas_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger para atualizar updated_at
drop trigger if exists trigger_update_mcp_quotas_updated_at on public.mcp_quotas;
create trigger trigger_update_mcp_quotas_updated_at
  before update on public.mcp_quotas
  for each row
  execute function public.update_mcp_quotas_updated_at();

-- Função para limpar registros antigos de auditoria (manter últimos 90 dias)
create or replace function public.cleanup_old_mcp_audit_logs()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  delete from public.mcp_audit_log
  where created_at < now() - interval '90 days';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

-- Habilitar RLS
alter table public.mcp_audit_log enable row level security;
alter table public.mcp_quotas enable row level security;

-- Políticas para mcp_audit_log (apenas super admin pode ver)
create policy "mcp_audit_log_admin_select" on public.mcp_audit_log
  for select
  to authenticated
  using (
    exists (
      select 1 from public.usuarios u
      where u.auth_user_id = (select auth.uid())
      and u.is_super_admin = true
    )
  );

-- Políticas para mcp_quotas (usuário vê próprias quotas, super admin vê todas)
create policy "mcp_quotas_user_select" on public.mcp_quotas
  for select
  to authenticated
  using (
    usuario_id in (
      select id from public.usuarios where auth_user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.usuarios u
      where u.auth_user_id = (select auth.uid())
      and u.is_super_admin = true
    )
  );

-- Service role pode fazer tudo (para operações internas)
-- Nota: Service role não precisa de RLS, mas mantemos para consistência
create policy "mcp_audit_log_service_all" on public.mcp_audit_log
  for all
  to service_role
  using (true)
  with check (true);

create policy "mcp_quotas_service_all" on public.mcp_quotas
  for all
  to service_role
  using (true)
  with check (true);

