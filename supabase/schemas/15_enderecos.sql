-- ============================================================================
-- Tabela: enderecos
-- Endereços de clientes, partes contrárias e terceiros
-- ============================================================================

create table if not exists public.enderecos (
  id bigint generated always as identity primary key,
  id_pje bigint,
  entidade_tipo text not null check (entidade_tipo in ('cliente', 'parte_contraria', 'terceiro')),
  entidade_id bigint not null,

  -- Contexto do processo
  trt text,
  grau text check (grau in ('primeiro_grau', 'segundo_grau')),
  numero_processo text,

  -- Endereço
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cep text,

  -- Município
  id_municipio_pje integer,
  municipio text,
  municipio_ibge text,

  -- Estado
  estado_id_pje integer,
  estado_sigla text,
  estado_descricao text,
  estado text,

  -- País
  pais_id_pje integer,
  pais_codigo text,
  pais_descricao text,
  pais text,

  -- Metadados PJE
  classificacoes_endereco jsonb,
  correspondencia boolean default false,
  situacao text,
  id_usuario_cadastrador_pje bigint,
  data_alteracao_pje timestamp with time zone,
  dados_pje_completo jsonb,

  -- Controle
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.enderecos is 'Endereços de clientes, partes contrárias e terceiros. Estrutura idêntica ao PJE.';
comment on column public.enderecos.id_pje is 'ID do endereço no sistema PJE';
comment on column public.enderecos.entidade_tipo is 'Tipo da entidade dona do endereço: cliente, parte_contraria, terceiro';
comment on column public.enderecos.entidade_id is 'ID da entidade na respectiva tabela';
comment on column public.enderecos.trt is 'Tribunal Regional do Trabalho (contexto do processo)';
comment on column public.enderecos.grau is 'Grau do processo (primeiro_grau, segundo_grau)';
comment on column public.enderecos.numero_processo is 'Número do processo (contexto do processo)';
comment on column public.enderecos.classificacoes_endereco is 'Array de classificações do PJE: R=Residencial, C=Comercial, A=Atual';
comment on column public.enderecos.correspondencia is 'Indica se é endereço de correspondência';
comment on column public.enderecos.situacao is 'Situação do endereço no PJE: P=Principal, V=Vigente';
comment on column public.enderecos.estado is 'Nome completo do estado';
comment on column public.enderecos.pais is 'Nome completo do país';
comment on column public.enderecos.dados_pje_completo is 'JSON completo do endereço capturado do PJE (auditoria)';

-- Índices
create index if not exists idx_enderecos_entidade on public.enderecos(entidade_tipo, entidade_id);
create index if not exists idx_enderecos_processo on public.enderecos(numero_processo, trt, grau);
create index if not exists idx_enderecos_id_pje on public.enderecos(id_pje);

-- RLS
alter table public.enderecos enable row level security;

create policy "Service role tem acesso total aos enderecos"
on public.enderecos for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler enderecos"
on public.enderecos for select
to authenticated
using (true);
