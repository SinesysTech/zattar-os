-- Adiciona coluna usuario na tabela credenciais
-- O usuario é o login do PJE (pode ser diferente do CPF do advogado em alguns tribunais)

-- 1. Adicionar coluna usuario (nullable, pois CPF pode ser usado como fallback)
alter table public.credenciais add column if not exists usuario text;

-- 2. Comentário explicativo
comment on column public.credenciais.usuario is 'Usuário de login no PJE (se diferente do CPF do advogado). Quando NULL, usar CPF do advogado como login.';

-- 3. Criar índice para buscas por usuario
create index if not exists idx_credenciais_usuario on public.credenciais using btree (usuario) where usuario is not null;
