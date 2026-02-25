-- RPC para leitura segura de sessões de autenticação do usuário
-- Evita dependência de exposição direta do schema auth no PostgREST

create or replace function public.get_user_auth_sessions(
  p_user_id uuid,
  p_limit integer default 50
)
returns table (
  created_at timestamptz,
  event_type text,
  ip_address text,
  user_agent text
)
language sql
security definer
set search_path = public, auth
as $$
  select
    s.created_at,
    'user_signedin'::text as event_type,
    nullif(split_part(s.ip::text, '/', 1), '') as ip_address,
    s.user_agent
  from auth.sessions s
  where s.user_id = p_user_id
  order by s.created_at desc
  limit greatest(coalesce(p_limit, 50), 1);
$$;

comment on function public.get_user_auth_sessions(uuid, integer)
  is 'Retorna histórico de sessões (logins) de um usuário a partir de auth.sessions';

revoke all on function public.get_user_auth_sessions(uuid, integer) from public;
grant execute on function public.get_user_auth_sessions(uuid, integer) to authenticated;
grant execute on function public.get_user_auth_sessions(uuid, integer) to service_role;