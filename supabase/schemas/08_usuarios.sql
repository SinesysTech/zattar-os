-- Tabela de usuários do sistema
-- Usuários são funcionários/colaboradores do escritório de advocacia

create table public.usuarios (
  id bigint generated always as identity primary key,
  
  -- Dados básicos
  nome_completo text not null,
  nome_exibicao text not null,
  cpf text not null unique,
  rg text,
  data_nascimento date,
  genero public.genero_usuario,
  
  -- Dados profissionais
  oab text,
  uf_oab text,
  
  -- Dados de contato
  email_pessoal text,
  email_corporativo text not null unique,
  telefone text,
  ramal text,
  
  -- Endereço (JSONB)
  endereco jsonb,
  
  -- Controle
  auth_user_id uuid references auth.users(id) on delete cascade,
  ativo boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.usuarios is 'Cadastro de usuários do sistema (funcionários e colaboradores do escritório de advocacia)';

-- Comentários dos campos
comment on column public.usuarios.nome_completo is 'Nome completo do usuário';
comment on column public.usuarios.nome_exibicao is 'Nome para exibição no sistema';
comment on column public.usuarios.cpf is 'CPF do usuário (único, sem formatação)';
comment on column public.usuarios.rg is 'RG do usuário';
comment on column public.usuarios.data_nascimento is 'Data de nascimento do usuário';
comment on column public.usuarios.genero is 'Gênero do usuário';
comment on column public.usuarios.oab is 'Número da OAB (se o usuário for advogado)';
comment on column public.usuarios.uf_oab is 'UF onde a OAB foi emitida';
comment on column public.usuarios.email_pessoal is 'E-mail pessoal do usuário';
comment on column public.usuarios.email_corporativo is 'E-mail corporativo do usuário (único)';
comment on column public.usuarios.telefone is 'Telefone do usuário';
comment on column public.usuarios.ramal is 'Ramal do telefone';
comment on column public.usuarios.endereco is 'Endereço completo do usuário em formato JSONB com campos: logradouro, numero, complemento, bairro, cidade, estado, pais, cep';
comment on column public.usuarios.auth_user_id is 'Referência ao usuário no Supabase Auth (opcional, pode ser criado depois)';
comment on column public.usuarios.ativo is 'Indica se o usuário está ativo no sistema';

-- Índices para melhor performance
create index idx_usuarios_auth_user_id on public.usuarios using btree (auth_user_id);
create index idx_usuarios_cpf on public.usuarios using btree (cpf);
create index idx_usuarios_email_corporativo on public.usuarios using btree (email_corporativo);
create index idx_usuarios_ativo on public.usuarios using btree (ativo);
create index idx_usuarios_nome_completo on public.usuarios using btree (nome_completo);
create index idx_usuarios_oab on public.usuarios using btree (oab, uf_oab) where oab is not null;

-- Índice GIN para busca em endereço JSONB
create index idx_usuarios_endereco on public.usuarios using gin (endereco);

-- Trigger para atualizar updated_at automaticamente
create trigger update_usuarios_updated_at
before update on public.usuarios
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.usuarios enable row level security;

-- Políticas RLS para usuarios
-- Permite que o service_role tenha acesso total (bypass RLS por padrão, mas explicitado aqui)
create policy "Service role tem acesso total"
  on public.usuarios
  for all
  to service_role
  using (true)
  with check (true);

-- Permite que usuários autenticados leiam seus próprios dados
create policy "Usuários podem ler seus próprios dados"
  on public.usuarios
  for select
  to authenticated
  using (auth.uid() = auth_user_id);

-- Permite que usuários autenticados leiam dados de outros usuários
-- (necessário para colaboração, atribuição de responsáveis, etc.)
create policy "Usuários autenticados podem ler outros usuários"
  on public.usuarios
  for select
  to authenticated
  using (true);

-- Permite que usuários atualizem apenas seus próprios dados
create policy "Usuários podem atualizar seus próprios dados"
  on public.usuarios
  for update
  to authenticated
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

