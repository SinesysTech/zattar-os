-- Alterações na tabela de credenciais de acesso aos tribunais
-- Remove criptografia e campo created_by

-- 1. Adicionar coluna senha se não existir
alter table public.credenciais add column if not exists senha text;

-- 2. Atualizar senha para registros existentes (se senha_encrypted existir)
-- Nota: Se você já tem dados criptografados, precisará atualizar manualmente
update public.credenciais
set senha = '12345678A@'
where senha is null;

-- 3. Tornar senha NOT NULL
alter table public.credenciais alter column senha set not null;

-- 4. Remover coluna senha_encrypted se existir
alter table public.credenciais drop column if exists senha_encrypted;

-- 5. Remover coluna created_by se existir (advogado não é usuário do sistema)
alter table public.credenciais drop column if exists created_by;

-- 6. Atualizar comentários
comment on table public.credenciais is 'Credenciais de acesso aos tribunais';
comment on column public.credenciais.advogado_id is 'Referência ao advogado dono da credencial';
comment on column public.credenciais.senha is 'Senha para acesso ao tribunal (armazenada em texto plano)';
comment on column public.credenciais.tribunal is 'Código do tribunal (TRT1 a TRT24)';
comment on column public.credenciais.grau is 'Grau do processo (primeiro_grau ou segundo_grau)';
comment on column public.credenciais.active is 'Indica se a credencial está ativa';

-- 7. Criar índices se não existirem
create index if not exists idx_credenciais_advogado_id on public.credenciais using btree (advogado_id);
create index if not exists idx_credenciais_tribunal on public.credenciais using btree (tribunal);
create index if not exists idx_credenciais_grau on public.credenciais using btree (grau);
create index if not exists idx_credenciais_active on public.credenciais using btree (active);
create index if not exists idx_credenciais_advogado_tribunal_grau on public.credenciais using btree (advogado_id, tribunal, grau);

-- 8. Remover trigger se existir e recriar
drop trigger if exists update_credenciais_updated_at on public.credenciais;

create trigger update_credenciais_updated_at
before update on public.credenciais
for each row
execute function public.update_updated_at_column();

-- 9. Habilitar RLS
alter table public.credenciais enable row level security;

