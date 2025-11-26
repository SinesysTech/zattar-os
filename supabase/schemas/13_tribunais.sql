-- ============================================================================
-- Tabela: tribunais
-- Cadastro de tribunais do sistema
-- ============================================================================

create table if not exists public.tribunais (
  id text primary key,
  codigo text not null,
  nome text not null,
  regiao text,
  uf text,
  "cidadeSede" text,
  ativo boolean default true,
  "createdAt" timestamp without time zone default current_timestamp,
  "updatedAt" timestamp without time zone
);

comment on table public.tribunais is 'Cadastro de tribunais do sistema (TRTs, TJs, TRFs, etc)';
comment on column public.tribunais.id is 'Identificador único do tribunal';
comment on column public.tribunais.codigo is 'Código do tribunal (ex: TRT1, TJSP)';
comment on column public.tribunais.nome is 'Nome completo do tribunal';
comment on column public.tribunais.regiao is 'Região do tribunal';
comment on column public.tribunais.uf is 'UF do tribunal';
comment on column public.tribunais."cidadeSede" is 'Cidade sede do tribunal';
comment on column public.tribunais.ativo is 'Indica se o tribunal está ativo';

-- Índices
create index if not exists idx_tribunais_codigo on public.tribunais(codigo);
create index if not exists idx_tribunais_ativo on public.tribunais(ativo);


-- ============================================================================
-- Tabela: tribunais_config
-- Configurações de acesso aos tribunais para captura
-- ============================================================================

create table if not exists public.tribunais_config (
  id text primary key,
  tribunal_id text not null references public.tribunais(id),
  sistema text default 'PJE',
  tipo_acesso public.tipo_acesso_tribunal not null,
  url_base text not null,
  url_login_seam text not null,
  url_api text,
  custom_timeouts jsonb,
  created_at timestamp without time zone default current_timestamp,
  updated_at timestamp without time zone
);

comment on table public.tribunais_config is 'Configurações de acesso aos tribunais para captura do PJE-TRT, TJs, TRFs e Tribunais Superiores';
comment on column public.tribunais_config.id is 'Identificador único da configuração';
comment on column public.tribunais_config.tribunal_id is 'Referência ao tribunal na tabela tribunais (FK)';
comment on column public.tribunais_config.sistema is 'Sistema de processo judicial (PJE, PROJUDI, ESAJ, etc)';
comment on column public.tribunais_config.tipo_acesso is 'Tipo de acesso: primeiro_grau, segundo_grau, unificado, unico';
comment on column public.tribunais_config.url_base is 'URL base do tribunal';
comment on column public.tribunais_config.url_login_seam is 'URL completa da página de login SSO';
comment on column public.tribunais_config.url_api is 'URL da API REST do sistema';
comment on column public.tribunais_config.custom_timeouts is 'Timeouts customizados em JSONB (login, redirect, networkIdle, api)';

-- Índices
create index if not exists idx_tribunais_config_tribunal_id on public.tribunais_config(tribunal_id);
create index if not exists idx_tribunais_config_tipo_acesso on public.tribunais_config(tipo_acesso);


-- ============================================================================
-- Tabela: orgaos_tribunais
-- Órgãos dos tribunais (varas, turmas, etc)
-- ============================================================================

create table if not exists public.orgaos_tribunais (
  id text primary key,
  "tribunalId" text not null references public.tribunais(id),
  "orgaoIdCNJ" integer not null,
  nome text not null,
  tipo text,
  ativo boolean default true,
  metadados jsonb,
  "createdAt" timestamp without time zone default current_timestamp,
  "updatedAt" timestamp without time zone default current_timestamp
);

comment on table public.orgaos_tribunais is 'Órgãos dos tribunais (varas, turmas, câmaras, etc)';
comment on column public.orgaos_tribunais.id is 'Identificador único do órgão';
comment on column public.orgaos_tribunais."tribunalId" is 'Referência ao tribunal';
comment on column public.orgaos_tribunais."orgaoIdCNJ" is 'ID do órgão no CNJ';
comment on column public.orgaos_tribunais.nome is 'Nome do órgão';
comment on column public.orgaos_tribunais.tipo is 'Tipo do órgão (vara, turma, etc)';
comment on column public.orgaos_tribunais.ativo is 'Indica se o órgão está ativo';
comment on column public.orgaos_tribunais.metadados is 'Metadados adicionais em JSONB';

-- Índices
create index if not exists idx_orgaos_tribunais_tribunal_id on public.orgaos_tribunais("tribunalId");
create index if not exists idx_orgaos_tribunais_orgao_cnj on public.orgaos_tribunais("orgaoIdCNJ");
