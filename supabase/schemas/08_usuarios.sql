-- ============================================================================
-- Tabela: usuarios
-- Cadastro de usuários do sistema (funcionários e colaboradores do escritório)
-- ============================================================================

create table if not exists public.usuarios (
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

  -- Mídia
  avatar_url text,
  cover_url text,

  -- Controle
  auth_user_id uuid references auth.users(id),
  cargo_id bigint references public.cargos(id),
  is_super_admin boolean default false,
  ativo boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

comment on table public.usuarios is 'Cadastro de usuários do sistema (funcionários e colaboradores do escritório de advocacia)';
comment on column public.usuarios.id is 'ID sequencial do usuário';
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
comment on column public.usuarios.endereco is 'Endereço completo em JSONB (logradouro, numero, complemento, bairro, cidade, estado, pais, cep)';
comment on column public.usuarios.avatar_url is 'URL da imagem de avatar do usuário armazenada no Supabase Storage (bucket: avatars)';
comment on column public.usuarios.cover_url is 'URL da imagem de capa/banner do perfil do usuário armazenada no Supabase Storage (bucket: covers)';
comment on column public.usuarios.auth_user_id is 'Referência ao usuário no Supabase Auth (opcional)';
comment on column public.usuarios.cargo_id is 'ID do cargo do usuário (opcional, para organização interna)';
comment on column public.usuarios.is_super_admin is 'Indica se o usuário é super admin (bypassa todas as permissões)';
comment on column public.usuarios.ativo is 'Indica se o usuário está ativo no sistema';

-- Índices
create unique index if not exists idx_usuarios_cpf on public.usuarios(cpf);
create unique index if not exists idx_usuarios_email_corporativo on public.usuarios(email_corporativo);
create index if not exists idx_usuarios_auth_user_id on public.usuarios(auth_user_id);
create index if not exists idx_usuarios_cargo_id on public.usuarios(cargo_id);
create index if not exists idx_usuarios_ativo on public.usuarios(ativo);
create index if not exists idx_usuarios_nome_completo on public.usuarios(nome_completo);
create index if not exists idx_usuarios_oab on public.usuarios(oab, uf_oab) where oab is not null;
create index if not exists idx_usuarios_endereco on public.usuarios using gin (endereco);

-- Trigger para atualizar updated_at automaticamente
create trigger update_usuarios_updated_at
before update on public.usuarios
for each row
execute function public.update_updated_at_column();

-- RLS
alter table public.usuarios enable row level security;

create policy "Service role tem acesso total a usuarios"
on public.usuarios for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler usuarios"
on public.usuarios for select
to authenticated
using (true);

create policy "Usuários podem atualizar seu próprio perfil"
on public.usuarios for update
to authenticated
using ((select auth.uid()) = auth_user_id)
with check ((select auth.uid()) = auth_user_id);
