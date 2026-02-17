-- Migration: Criar tabelas do novo fluxo de assinatura digital (upload de PDF com múltiplos assinantes)
-- Data: 2026-01-05 16:00:00
-- Descrição: Implementa tabelas para fluxo de upload de PDF pronto com múltiplos assinantes e links públicos únicos

-- ============================================================================
-- TABELA: assinatura_digital_documentos
-- Documentos de assinatura criados via upload de PDF pronto
-- ============================================================================

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
  processo_id bigint references public.acervo(id) on delete set null,
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
create index if not exists idx_assinatura_digital_documentos_processo_id on public.assinatura_digital_documentos(processo_id);

-- ============================================================================
-- TABELA: assinatura_digital_documento_assinantes
-- Assinantes de um documento (1..N), incluindo convidados
-- ============================================================================

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

-- ============================================================================
-- TABELA: assinatura_digital_documento_ancoras
-- Âncoras (assinatura/rubrica) no PDF por assinante
-- ============================================================================

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

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

alter table public.assinatura_digital_documentos enable row level security;
alter table public.assinatura_digital_documento_assinantes enable row level security;
alter table public.assinatura_digital_documento_ancoras enable row level security;

-- service_role full access
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

-- authenticated: permitir leitura básica para telas administrativas
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

-- ============================================================================
-- TRIGGERS: updated_at automático
-- ============================================================================

-- Função genérica já existe em outras migrations
-- create or replace function update_updated_at_column() ...

create trigger update_assinatura_digital_documentos_updated_at
  before update on public.assinatura_digital_documentos
  for each row execute function update_updated_at_column();

create trigger update_assinatura_digital_documento_assinantes_updated_at
  before update on public.assinatura_digital_documento_assinantes
  for each row execute function update_updated_at_column();

-- ============================================================================
-- GRANTS: Permissões para authenticated
-- ============================================================================

grant select, insert, update, delete on public.assinatura_digital_documentos to authenticated;
grant select, insert, update, delete on public.assinatura_digital_documento_assinantes to authenticated;
grant select, insert, update, delete on public.assinatura_digital_documento_ancoras to authenticated;

grant usage on sequence public.assinatura_digital_documentos_id_seq to authenticated;
grant usage on sequence public.assinatura_digital_documento_assinantes_id_seq to authenticated;
grant usage on sequence public.assinatura_digital_documento_ancoras_id_seq to authenticated;
