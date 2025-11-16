-- Tabela de advogados

create table public.advogados (
  id bigint generated always as identity primary key,
  nome_completo text not null,
  cpf text not null unique,
  oab text not null,
  uf_oab text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
comment on table public.advogados is 'Cadastro de advogados do sistema';
comment on column public.advogados.nome_completo is 'Nome completo do advogado';
comment on column public.advogados.cpf is 'CPF do advogado (único)';
comment on column public.advogados.oab is 'Número da OAB do advogado';
comment on column public.advogados.uf_oab is 'UF onde a OAB foi emitida';

-- Índice para busca por CPF
create index idx_advogados_cpf on public.advogados using btree (cpf);

-- Índice para busca por OAB e UF OAB
create index idx_advogados_oab on public.advogados using btree (oab, uf_oab);

-- Trigger para atualizar updated_at automaticamente
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger update_advogados_updated_at
before update on public.advogados
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.advogados enable row level security;

