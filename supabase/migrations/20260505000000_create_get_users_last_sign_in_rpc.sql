-- RPC batch para leitura de last_sign_in_at de múltiplos usuários auth.users
-- Permite alimentar listagens (cards/tabela de usuários) com 1 round-trip,
-- evitando N chamadas a get_user_auth_sessions().

create or replace function public.get_users_last_sign_in(
  p_auth_user_ids uuid[]
)
returns table (
  user_id uuid,
  last_sign_in_at timestamptz
)
language sql
security definer
set search_path = public, auth
as $$
  select u.id as user_id, u.last_sign_in_at
  from auth.users u
  where u.id = any(p_auth_user_ids);
$$;

comment on function public.get_users_last_sign_in(uuid[])
  is 'Retorna last_sign_in_at de auth.users para um conjunto de IDs (batch). Usado pelas listagens de usuários para popular indicador de presença/último acesso.';

revoke all on function public.get_users_last_sign_in(uuid[]) from public;
grant execute on function public.get_users_last_sign_in(uuid[]) to authenticated;
grant execute on function public.get_users_last_sign_in(uuid[]) to service_role;
