-- Tabela de tipos de expedientes
-- Armazena os tipos de expedientes cadastrados pelos usuários

create table if not exists public.tipos_expedientes (
  id bigint generated always as identity primary key,
  tipo_expediente text not null unique,
  created_by bigint not null references public.usuarios(id) on delete cascade,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.tipos_expedientes is 'Tipos de expedientes cadastrados pelos usuários para classificação de expedientes manuais e do PJE';
comment on column public.tipos_expedientes.tipo_expediente is 'Nome do tipo de expediente (ex: Contestação, Recurso, Impugnação)';
comment on column public.tipos_expedientes.created_by is 'Usuário que criou o tipo de expediente';

-- Índice para busca por nome
create index if not exists idx_tipos_expedientes_tipo on public.tipos_expedientes using btree (tipo_expediente);
create index if not exists idx_tipos_expedientes_created_by on public.tipos_expedientes using btree (created_by);

-- Trigger para atualizar updated_at automaticamente
create trigger update_tipos_expedientes_updated_at
before update on public.tipos_expedientes
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.tipos_expedientes enable row level security;
