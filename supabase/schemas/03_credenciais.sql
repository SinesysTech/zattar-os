-- Tabela de credenciais de acesso aos tribunais

create table public.credenciais (
  id bigint generated always as identity primary key,
  advogado_id bigint not null references public.advogados(id) on delete cascade,
  senha_encrypted text not null,
  tribunal public.codigo_tribunal not null,
  grau public.grau_tribunal not null,
  active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id) not null,
  -- Garantir que não haja credenciais duplicadas para o mesmo advogado, tribunal e grau
  unique (advogado_id, tribunal, grau)
);
comment on table public.credenciais is 'Credenciais criptografadas para acesso aos tribunais';
comment on column public.credenciais.advogado_id is 'Referência ao advogado dono da credencial';
comment on column public.credenciais.senha_encrypted is 'Senha criptografada para acesso ao tribunal';
comment on column public.credenciais.tribunal is 'Código do tribunal (TRT1 a TRT24)';
comment on column public.credenciais.grau is 'Grau do processo (primeiro_grau ou segundo_grau)';
comment on column public.credenciais.active is 'Indica se a credencial está ativa';
comment on column public.credenciais.created_by is 'Usuário do sistema que cadastrou a credencial (o advogado não precisa ser usuário do sistema)';

-- Índices para melhor performance
create index idx_credenciais_advogado_id on public.credenciais using btree (advogado_id);
create index idx_credenciais_tribunal on public.credenciais using btree (tribunal);
create index idx_credenciais_grau on public.credenciais using btree (grau);
create index idx_credenciais_active on public.credenciais using btree (active);
create index idx_credenciais_advogado_tribunal_grau on public.credenciais using btree (advogado_id, tribunal, grau);

-- Trigger para atualizar updated_at automaticamente
create trigger update_credenciais_updated_at
before update on public.credenciais
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.credenciais enable row level security;

