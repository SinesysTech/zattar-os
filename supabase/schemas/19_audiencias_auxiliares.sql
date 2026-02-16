-- ============================================================================
-- Tabela: classe_judicial
-- Classes judiciais do PJE por TRT e grau
-- ============================================================================

create table if not exists public.classe_judicial (
  id bigint generated always as identity primary key,
  id_pje bigint not null,
  trt public.codigo_tribunal not null,
  grau public.grau_tribunal not null,
  codigo text not null,
  descricao text not null,
  sigla text,
  requer_processo_referencia_codigo text,
  controla_valor_causa boolean default false,
  pode_incluir_autoridade boolean default false,
  piso_valor_causa numeric,
  teto_valor_causa numeric,
  ativo boolean default true,
  id_classe_judicial_pai bigint,
  possui_filhos boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  unique (id_pje, trt, grau)
);

comment on table public.classe_judicial is 'Classes judiciais do PJE por TRT e grau (ex: ATOrd, ATSum, RO)';
comment on column public.classe_judicial.id_pje is 'ID da classe judicial no sistema PJE';
comment on column public.classe_judicial.trt is 'Código do TRT';
comment on column public.classe_judicial.grau is 'Grau (primeiro_grau ou segundo_grau)';
comment on column public.classe_judicial.codigo is 'Código numérico da classe judicial no PJE';
comment on column public.classe_judicial.descricao is 'Descrição completa da classe judicial';
comment on column public.classe_judicial.sigla is 'Sigla da classe judicial';
comment on column public.classe_judicial.controla_valor_causa is 'Indica se controla valor da causa';
comment on column public.classe_judicial.pode_incluir_autoridade is 'Indica se pode incluir autoridade';
comment on column public.classe_judicial.piso_valor_causa is 'Valor mínimo da causa para esta classe';
comment on column public.classe_judicial.teto_valor_causa is 'Valor máximo da causa para esta classe';
comment on column public.classe_judicial.id_classe_judicial_pai is 'ID da classe judicial pai (para classes hierárquicas)';
comment on column public.classe_judicial.possui_filhos is 'Indica se possui classes judiciais filhas';

-- Índices
create index if not exists idx_classe_judicial_trt_grau on public.classe_judicial(trt, grau);
create index if not exists idx_classe_judicial_sigla on public.classe_judicial(sigla);

-- RLS
alter table public.classe_judicial enable row level security;

create policy "Service role tem acesso total a classe_judicial"
on public.classe_judicial for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler classe_judicial"
on public.classe_judicial for select
to authenticated
using (true);


-- ============================================================================
-- Tabela: tipo_audiencia
-- Tipos de audiência do PJE (deduplicados por descrição)
-- ============================================================================

create table if not exists public.tipo_audiencia (
  id bigint generated always as identity primary key,
  descricao text not null unique,
  is_virtual boolean default false not null,
  trts_metadata jsonb default '[]'::jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

comment on table public.tipo_audiencia is 'Tipos de audiência do PJE (deduplicados por descrição)';
comment on column public.tipo_audiencia.descricao is 'Descrição única do tipo de audiência';
comment on column public.tipo_audiencia.is_virtual is 'Indica se é audiência virtual';
comment on column public.tipo_audiencia.trts_metadata is 'Array de TRTs que usam este tipo: [{trt, grau, id_pje, codigo, old_id}]';

-- Índices
create index if not exists idx_tipo_audiencia_descricao on public.tipo_audiencia(descricao);
create index if not exists idx_tipo_audiencia_is_virtual on public.tipo_audiencia(is_virtual);
create index if not exists idx_tipo_audiencia_trts_metadata on public.tipo_audiencia using gin(trts_metadata);

-- RLS
alter table public.tipo_audiencia enable row level security;

create policy "Service role tem acesso total a tipo_audiencia"
on public.tipo_audiencia for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler tipo_audiencia"
on public.tipo_audiencia for select
to authenticated
using (true);


-- ============================================================================
-- Tabela: sala_audiencia
-- Salas de audiência do PJE por TRT, grau e órgão julgador
-- ============================================================================

create table if not exists public.sala_audiencia (
  id bigint generated always as identity primary key,
  id_pje bigint,
  trt public.codigo_tribunal not null,
  grau public.grau_tribunal not null,
  orgao_julgador_id bigint not null references public.orgao_julgador(id),
  nome text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  unique (id_pje, trt, grau, orgao_julgador_id),
  unique (nome, trt, grau, orgao_julgador_id)
);

comment on table public.sala_audiencia is 'Salas de audiência do PJE por TRT, grau e órgão julgador';
comment on column public.sala_audiencia.id_pje is 'ID da sala no sistema PJE';
comment on column public.sala_audiencia.trt is 'Código do TRT';
comment on column public.sala_audiencia.grau is 'Grau (primeiro_grau ou segundo_grau)';
comment on column public.sala_audiencia.orgao_julgador_id is 'Referência ao órgão julgador';
comment on column public.sala_audiencia.nome is 'Nome da sala de audiência';

-- Índices
create index if not exists idx_sala_audiencia_orgao on public.sala_audiencia(orgao_julgador_id);
create index if not exists idx_sala_audiencia_trt_grau on public.sala_audiencia(trt, grau);

-- RLS
alter table public.sala_audiencia enable row level security;

create policy "Service role tem acesso total a sala_audiencia"
on public.sala_audiencia for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler sala_audiencia"
on public.sala_audiencia for select
to authenticated
using (true);
