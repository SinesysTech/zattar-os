-- Conceder permissões ao service_role para bypassar RLS
-- Este arquivo deve ser executado primeiro (00_) para garantir que o service_role tenha acesso

-- 1. Conceder USAGE no schema public ao service_role
grant usage on schema public to service_role;

-- 2. Conceder permissões em todas as tabelas existentes ao service_role
grant select, insert, update, delete on all tables in schema public to service_role;

-- 3. Conceder permissões em tabelas futuras (default privileges)
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;

-- 4. Conceder permissões em sequences (para identity columns)
grant usage, select on all sequences in schema public to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;

-- 5. Conceder permissões em funções
grant execute on all functions in schema public to service_role;
alter default privileges in schema public grant execute on functions to service_role;

