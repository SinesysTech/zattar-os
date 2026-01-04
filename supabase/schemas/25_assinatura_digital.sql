-- ============================================================================
-- Assinatura Digital: tabelas de assinatura eletrônica
-- ============================================================================

-- NOTA: Segmentos são gerenciados pela tabela global 'segmentos' (ver 10_segmentos.sql)
-- As tabelas de assinatura digital referenciam 'segmentos' em vez de ter tabela própria

-- Templates de PDF
create table if not exists public.assinatura_digital_templates (
  id bigint generated always as identity primary key,
  template_uuid uuid not null default gen_random_uuid() unique,
  nome text not null,
  descricao text,
  tipo_template text default 'pdf' check (tipo_template in ('pdf', 'markdown')),
  segmento_id bigint references public.segmentos(id),
  pdf_url text,
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

comment on table public.assinatura_digital_templates is 'Templates de PDF usados na geração de documentos assinados';
comment on column public.assinatura_digital_templates.template_uuid is 'UUID público do template';
comment on column public.assinatura_digital_templates.tipo_template is 'Tipo do template: pdf (arquivo PDF) ou markdown (conteúdo gerado)';
comment on column public.assinatura_digital_templates.segmento_id is 'ID do segmento associado ao template (null = template global)';
comment on column public.assinatura_digital_templates.pdf_url is 'URL do arquivo PDF no storage (para templates tipo pdf)';
comment on column public.assinatura_digital_templates.campos is 'Definição de campos do template em JSON serializado';

create index if not exists idx_assinatura_digital_templates_ativo on public.assinatura_digital_templates(ativo);
create index if not exists idx_assinatura_digital_templates_nome on public.assinatura_digital_templates(nome);
create index if not exists idx_assinatura_digital_templates_segmento on public.assinatura_digital_templates(segmento_id);
create index if not exists idx_assinatura_digital_templates_tipo on public.assinatura_digital_templates(tipo_template);

-- Formulários
create table if not exists public.assinatura_digital_formularios (
  id bigint generated always as identity primary key,
  formulario_uuid uuid not null default gen_random_uuid() unique,
  nome text not null,
  slug text not null unique,
  descricao text,
  segmento_id bigint not null references public.segmentos(id) on delete restrict,
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

comment on table public.assinatura_digital_formularios is 'Formulários de assinatura digital vinculados a segmentos e templates';
comment on column public.assinatura_digital_formularios.slug is 'Slug único do formulário';
comment on column public.assinatura_digital_formularios.form_schema is 'Schema JSON do formulário (estrutura dos campos)';
comment on column public.assinatura_digital_formularios.template_ids is 'Lista de UUIDs de templates associados';

create index if not exists idx_assinatura_digital_formularios_segmento on public.assinatura_digital_formularios(segmento_id);
create index if not exists idx_assinatura_digital_formularios_ativo on public.assinatura_digital_formularios(ativo);
create index if not exists idx_assinatura_digital_formularios_ordem_nome on public.assinatura_digital_formularios(ordem nulls first, nome);

-- Sessões de assinatura (para métricas/estado)
create table if not exists public.assinatura_digital_sessoes_assinatura (
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

comment on table public.assinatura_digital_sessoes_assinatura is 'Sessões de assinatura digital (estado da jornada do signatário)';

create index if not exists idx_assinatura_digital_sessoes_status on public.assinatura_digital_sessoes_assinatura(status);
create index if not exists idx_assinatura_digital_sessoes_expires_at on public.assinatura_digital_sessoes_assinatura(expires_at);
create index if not exists idx_assinatura_digital_sessoes_created_at on public.assinatura_digital_sessoes_assinatura(created_at);

-- Assinaturas finalizadas
create table if not exists public.assinatura_digital_assinaturas (
  id bigint generated always as identity primary key,
  cliente_id bigint not null,
  acao_id bigint not null,
  template_uuid text not null,
  segmento_id bigint not null references public.segmentos(id) on delete restrict,
  formulario_id bigint not null references public.assinatura_digital_formularios(id) on delete restrict,
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
  hash_original_sha256 text not null,
  hash_final_sha256 text,
  termos_aceite_versao text not null,
  termos_aceite_data timestamp with time zone not null,
  dispositivo_fingerprint_raw jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.assinatura_digital_assinaturas is 'Assinaturas concluídas, com metadados e URLs de artefatos';
comment on column public.assinatura_digital_assinaturas.hash_original_sha256 is 'Hash SHA-256 PDF original (integridade conteúdo)';
comment on column public.assinatura_digital_assinaturas.hash_final_sha256 is 'Hash SHA-256 PDF final (com manifesto)';
comment on column public.assinatura_digital_assinaturas.termos_aceite_versao is 'Versão termos (v1.0-MP2200-2)';
comment on column public.assinatura_digital_assinaturas.termos_aceite_data is 'Timestamp aceite termos';
comment on column public.assinatura_digital_assinaturas.dispositivo_fingerprint_raw is 'Fingerprint dispositivo (JSONB: tela, bateria, etc.)';

create index if not exists idx_assinatura_digital_assinaturas_cliente on public.assinatura_digital_assinaturas(cliente_id);
create index if not exists idx_assinatura_digital_assinaturas_acao on public.assinatura_digital_assinaturas(acao_id);
create index if not exists idx_assinatura_digital_assinaturas_segmento on public.assinatura_digital_assinaturas(segmento_id);
create index if not exists idx_assinatura_digital_assinaturas_formulario on public.assinatura_digital_assinaturas(formulario_id);
create index if not exists idx_assinatura_digital_assinaturas_status on public.assinatura_digital_assinaturas(status);
create index if not exists idx_assinatura_digital_assinaturas_data on public.assinatura_digital_assinaturas(data_assinatura);
create index if not exists idx_assinatura_digital_assinaturas_hash_original on public.assinatura_digital_assinaturas(hash_original_sha256);

-- RLS
alter table public.assinatura_digital_templates enable row level security;
alter table public.assinatura_digital_formularios enable row level security;
alter table public.assinatura_digital_sessoes_assinatura enable row level security;
alter table public.assinatura_digital_assinaturas enable row level security;

-- service_role full access
create policy "service role full access - assinatura_digital_templates"
  on public.assinatura_digital_templates for all
  to service_role
  using (true) with check (true);

create policy "service role full access - assinatura_digital_formularios"
  on public.assinatura_digital_formularios for all
  to service_role
  using (true) with check (true);

create policy "service role full access - assinatura_digital_sessoes_assinatura"
  on public.assinatura_digital_sessoes_assinatura for all
  to service_role
  using (true) with check (true);

create policy "service role full access - assinatura_digital_assinaturas"
  on public.assinatura_digital_assinaturas for all
  to service_role
  using (true) with check (true);

-- authenticated: leitura básica (listar catálogos)
create policy "authenticated select - assinatura_digital_templates"
  on public.assinatura_digital_templates for select
  to authenticated
  using (true);

create policy "authenticated select - assinatura_digital_formularios"
  on public.assinatura_digital_formularios for select
  to authenticated
  using (true);

create policy "authenticated select - assinatura_digital_sessoes_assinatura"
  on public.assinatura_digital_sessoes_assinatura for select
  to authenticated
  using (true);

create policy "authenticated insert - assinatura_digital_sessoes_assinatura"
  on public.assinatura_digital_sessoes_assinatura for insert
  to authenticated
  with check (true);

create policy "authenticated update - assinatura_digital_sessoes_assinatura"
  on public.assinatura_digital_sessoes_assinatura for update
  to authenticated
  using (true);

create policy "authenticated insert - assinatura_digital_assinaturas"
  on public.assinatura_digital_assinaturas for insert
  to authenticated
  with check (true);

create policy "authenticated select - assinatura_digital_assinaturas"
  on public.assinatura_digital_assinaturas for select
  to authenticated
  using (true);

-- ============================================================================
-- NOVO FLUXO: Documento via upload de PDF + múltiplos assinantes (links públicos)
-- ============================================================================

-- Documento de assinatura (PDF pronto uploadado)
create table if not exists public.assinatura_digital_documentos (
  id bigint generated always as identity primary key,
  documento_uuid uuid not null default gen_random_uuid() unique,
  titulo text,
  status text not null default 'rascunho' check (status in ('rascunho', 'pronto', 'concluido', 'cancelado')),
  selfie_habilitada boolean not null default false,
  pdf_original_url text not null,
  pdf_final_url text,
  hash_original_sha256 text,
  hash_final_sha256 text,
  created_by bigint references public.usuarios(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.assinatura_digital_documentos is 'Documentos de assinatura criados via upload de PDF pronto, com múltiplos assinantes e links públicos.';
comment on column public.assinatura_digital_documentos.documento_uuid is 'UUID público do documento de assinatura.';
comment on column public.assinatura_digital_documentos.selfie_habilitada is 'Se true, o fluxo público exige selfie antes de assinar.';
comment on column public.assinatura_digital_documentos.pdf_original_url is 'URL do PDF original uploadado no storage (Backblaze B2).';
comment on column public.assinatura_digital_documentos.pdf_final_url is 'URL do PDF final com assinaturas/rubricas aplicadas.';

create index if not exists idx_assinatura_digital_documentos_status on public.assinatura_digital_documentos(status);
create index if not exists idx_assinatura_digital_documentos_created_at on public.assinatura_digital_documentos(created_at);

-- Assinantes do documento (1..N), incluindo convidados (sem criar entidade)
create table if not exists public.assinatura_digital_documento_assinantes (
  id bigint generated always as identity primary key,
  documento_id bigint not null references public.assinatura_digital_documentos(id) on delete cascade,
  assinante_tipo text not null check (assinante_tipo in ('cliente', 'parte_contraria', 'representante', 'terceiro', 'usuario', 'convidado')),
  assinante_entidade_id bigint,
  dados_snapshot jsonb not null default '{}'::jsonb,
  dados_confirmados boolean not null default false,
  token text not null unique,
  status text not null default 'pendente' check (status in ('pendente', 'concluido')),
  selfie_url text,
  assinatura_url text,
  rubrica_url text,
  ip_address text,
  user_agent text,
  geolocation jsonb,
  termos_aceite_versao text,
  termos_aceite_data timestamp with time zone,
  dispositivo_fingerprint_raw jsonb,
  concluido_em timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.assinatura_digital_documento_assinantes is 'Assinantes de um documento de assinatura. Suporta entidades do sistema ou convidados (dados no jsonb).';
comment on column public.assinatura_digital_documento_assinantes.dados_snapshot is 'Snapshot de identificação do assinante (nome, cpf, email, telefone). Não cria entidade para convidado.';
comment on column public.assinatura_digital_documento_assinantes.token is 'Token opaco e não enumerável para acesso público (sem expiração e sem reuso após conclusão).';

create index if not exists idx_assinatura_digital_doc_assinantes_documento on public.assinatura_digital_documento_assinantes(documento_id);
create index if not exists idx_assinatura_digital_doc_assinantes_status on public.assinatura_digital_documento_assinantes(status);
create index if not exists idx_assinatura_digital_doc_assinantes_tipo_entidade on public.assinatura_digital_documento_assinantes(assinante_tipo, assinante_entidade_id);

-- Âncoras (assinatura/rubrica) no PDF por assinante
create table if not exists public.assinatura_digital_documento_ancoras (
  id bigint generated always as identity primary key,
  documento_id bigint not null references public.assinatura_digital_documentos(id) on delete cascade,
  documento_assinante_id bigint not null references public.assinatura_digital_documento_assinantes(id) on delete cascade,
  tipo text not null check (tipo in ('assinatura', 'rubrica')),
  pagina integer not null check (pagina >= 1),
  x_norm double precision not null check (x_norm >= 0 and x_norm <= 1),
  y_norm double precision not null check (y_norm >= 0 and y_norm <= 1),
  w_norm double precision not null check (w_norm > 0 and w_norm <= 1),
  h_norm double precision not null check (h_norm > 0 and h_norm <= 1),
  created_at timestamp with time zone default now()
);

comment on table public.assinatura_digital_documento_ancoras is 'Âncoras visuais no PDF (coordenadas normalizadas) associadas a um assinante e a um tipo (assinatura/rubrica).';
comment on column public.assinatura_digital_documento_ancoras.x_norm is 'Coordenada X normalizada (0..1) relativa à largura da página.';
comment on column public.assinatura_digital_documento_ancoras.y_norm is 'Coordenada Y normalizada (0..1) relativa à altura da página (referência no topo no front; converter ao aplicar no PDF).';

create index if not exists idx_assinatura_digital_doc_ancoras_documento on public.assinatura_digital_documento_ancoras(documento_id);
create index if not exists idx_assinatura_digital_doc_ancoras_assinante on public.assinatura_digital_documento_ancoras(documento_assinante_id);
create index if not exists idx_assinatura_digital_doc_ancoras_tipo on public.assinatura_digital_documento_ancoras(tipo);

-- RLS (novo fluxo)
alter table public.assinatura_digital_documentos enable row level security;
alter table public.assinatura_digital_documento_assinantes enable row level security;
alter table public.assinatura_digital_documento_ancoras enable row level security;

-- service_role full access (novo fluxo)
create policy "service role full access - assinatura_digital_documentos"
  on public.assinatura_digital_documentos for all
  to service_role
  using (true) with check (true);

create policy "service role full access - assinatura_digital_documento_assinantes"
  on public.assinatura_digital_documento_assinantes for all
  to service_role
  using (true) with check (true);

create policy "service role full access - assinatura_digital_documento_ancoras"
  on public.assinatura_digital_documento_ancoras for all
  to service_role
  using (true) with check (true);

-- authenticated: permitir leitura básica para telas administrativas (acesso efetivo controlado via API)
create policy "authenticated select - assinatura_digital_documentos"
  on public.assinatura_digital_documentos for select
  to authenticated
  using (true);

create policy "authenticated select - assinatura_digital_documento_assinantes"
  on public.assinatura_digital_documento_assinantes for select
  to authenticated
  using (true);

create policy "authenticated select - assinatura_digital_documento_ancoras"
  on public.assinatura_digital_documento_ancoras for select
  to authenticated
  using (true);