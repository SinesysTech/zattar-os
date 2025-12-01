-- ============================================================================
-- Formsign: tabelas de assinatura digital
-- ============================================================================

-- Segmentos de negócio
create table if not exists public.formsign_segmentos (
  id bigint generated always as identity primary key,
  nome text not null unique,
  slug text not null unique,
  descricao text,
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.formsign_segmentos is 'Segmentos de negócio para formulários e templates do Formsign';
comment on column public.formsign_segmentos.slug is 'Slug único do segmento';

create index if not exists idx_formsign_segmentos_ativo on public.formsign_segmentos(ativo);

-- Templates de PDF
create table if not exists public.formsign_templates (
  id bigint generated always as identity primary key,
  template_uuid uuid not null default gen_random_uuid() unique,
  nome text not null,
  descricao text,
  arquivo_original text not null,
  arquivo_nome text not null,
  arquivo_tamanho integer not null,
  status text default 'ativo',
  versao integer default 1,
  ativo boolean default true,
  campos text default '[]',
  conteudo_markdown text,
  criado_por text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.formsign_templates is 'Templates de PDF usados na geração de documentos assinados';
comment on column public.formsign_templates.template_uuid is 'UUID público do template';
comment on column public.formsign_templates.campos is 'Definição de campos do template em JSON serializado';

create index if not exists idx_formsign_templates_ativo on public.formsign_templates(ativo);
create index if not exists idx_formsign_templates_nome on public.formsign_templates(nome);

-- Formulários
create table if not exists public.formsign_formularios (
  id bigint generated always as identity primary key,
  formulario_uuid uuid not null default gen_random_uuid() unique,
  nome text not null,
  slug text not null unique,
  descricao text,
  segmento_id bigint not null references public.formsign_segmentos(id) on delete restrict,
  form_schema jsonb,
  schema_version text default '1.0.0',
  template_ids text[] default '{}',
  ativo boolean default true,
  ordem integer default 0,
  foto_necessaria boolean default true,
  geolocation_necessaria boolean default false,
  metadados_seguranca text default '["ip","user_agent"]',
  criado_por text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.formsign_formularios is 'Formulários de assinatura digital vinculados a segmentos e templates';
comment on column public.formsign_formularios.slug is 'Slug único do formulário';
comment on column public.formsign_formularios.form_schema is 'Schema JSON do formulário (estrutura dos campos)';
comment on column public.formsign_formularios.template_ids is 'Lista de UUIDs de templates associados';

create index if not exists idx_formsign_formularios_segmento on public.formsign_formularios(segmento_id);
create index if not exists idx_formsign_formularios_ativo on public.formsign_formularios(ativo);
create index if not exists idx_formsign_formularios_ordem_nome on public.formsign_formularios(ordem nulls first, nome);

-- Sessões de assinatura (para métricas/estado)
create table if not exists public.formsign_sessoes_assinatura (
  id bigint generated always as identity primary key,
  acao_id bigint unique,
  sessao_uuid uuid not null default gen_random_uuid() unique,
  status text default 'pendente',
  ip_address text,
  user_agent text,
  device_info jsonb,
  geolocation jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  expires_at timestamp with time zone
);

comment on table public.formsign_sessoes_assinatura is 'Sessões de assinatura do Formsign (estado da jornada do signatário)';

create index if not exists idx_formsign_sessoes_status on public.formsign_sessoes_assinatura(status);
create index if not exists idx_formsign_sessoes_expires_at on public.formsign_sessoes_assinatura(expires_at);
create index if not exists idx_formsign_sessoes_created_at on public.formsign_sessoes_assinatura(created_at);

-- Assinaturas finalizadas
create table if not exists public.formsign_assinaturas (
  id bigint generated always as identity primary key,
  cliente_id bigint not null,
  acao_id bigint not null,
  template_uuid text not null,
  segmento_id bigint not null references public.formsign_segmentos(id) on delete restrict,
  formulario_id bigint not null references public.formsign_formularios(id) on delete restrict,
  sessao_uuid uuid not null,
  assinatura_url text not null,
  foto_url text,
  pdf_url text not null,
  protocolo text not null unique,
  ip_address text,
  user_agent text,
  latitude double precision,
  longitude double precision,
  geolocation_accuracy double precision,
  geolocation_timestamp text,
  data_assinatura timestamp with time zone not null,
  status text default 'concluida',
  enviado_sistema_externo boolean default false,
  data_envio_externo timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.formsign_assinaturas is 'Assinaturas concluídas, com metadados e URLs de artefatos';

create index if not exists idx_formsign_assinaturas_cliente on public.formsign_assinaturas(cliente_id);
create index if not exists idx_formsign_assinaturas_acao on public.formsign_assinaturas(acao_id);
create index if not exists idx_formsign_assinaturas_segmento on public.formsign_assinaturas(segmento_id);
create index if not exists idx_formsign_assinaturas_formulario on public.formsign_assinaturas(formulario_id);
create index if not exists idx_formsign_assinaturas_status on public.formsign_assinaturas(status);
create index if not exists idx_formsign_assinaturas_data on public.formsign_assinaturas(data_assinatura);

-- RLS
alter table public.formsign_segmentos enable row level security;
alter table public.formsign_templates enable row level security;
alter table public.formsign_formularios enable row level security;
alter table public.formsign_sessoes_assinatura enable row level security;
alter table public.formsign_assinaturas enable row level security;

-- service_role full access
do $$
begin
  perform 1;
exception when others then null;
end $$;

create policy if not exists "service role full access - formsign_segmentos"
  on public.formsign_segmentos for all
  to service_role
  using (true) with check (true);

create policy if not exists "service role full access - formsign_templates"
  on public.formsign_templates for all
  to service_role
  using (true) with check (true);

create policy if not exists "service role full access - formsign_formularios"
  on public.formsign_formularios for all
  to service_role
  using (true) with check (true);

create policy if not exists "service role full access - formsign_sessoes_assinatura"
  on public.formsign_sessoes_assinatura for all
  to service_role
  using (true) with check (true);

create policy if not exists "service role full access - formsign_assinaturas"
  on public.formsign_assinaturas for all
  to service_role
  using (true) with check (true);

-- authenticated: leitura básica (listar catálogos)
create policy if not exists "authenticated select - formsign_segmentos"
  on public.formsign_segmentos for select
  to authenticated
  using (true);

create policy if not exists "authenticated select - formsign_templates"
  on public.formsign_templates for select
  to authenticated
  using (true);

create policy if not exists "authenticated select - formsign_formularios"
  on public.formsign_formularios for select
  to authenticated
  using (true);
