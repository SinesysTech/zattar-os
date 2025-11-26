-- ============================================================================
-- Tabela: terceiros
-- Terceiros em processos (peritos, MP, assistentes, etc)
-- ============================================================================

create table if not exists public.terceiros (
  id bigint generated always as identity primary key,
  id_pje bigint not null,
  id_pessoa_pje bigint unique,
  id_tipo_parte bigint,

  -- Contexto do processo
  trt text,
  grau text check (grau in ('primeiro_grau', 'segundo_grau')),
  numero_processo text,
  processo_id bigint,

  -- Tipo e polo
  tipo_parte text not null,
  polo text not null,

  -- Identificação
  tipo_pessoa public.tipo_pessoa not null,
  nome text not null,
  nome_fantasia text,
  cpf text,
  cnpj text,
  tipo_documento text check (tipo_documento in ('CPF', 'CNPJ')),

  -- Flags
  principal boolean default false,
  autoridade boolean default false,
  endereco_desconhecido boolean default false,

  -- Status PJE
  status_pje text,
  situacao_pje text,
  login_pje text,
  ordem integer,

  -- Contato
  emails jsonb,
  ddd_celular text,
  numero_celular text,
  ddd_residencial text,
  numero_residencial text,
  ddd_comercial text,
  numero_comercial text,

  -- Dados PF
  sexo text,
  rg text,
  data_nascimento date,
  genero public.genero_usuario,
  estado_civil public.estado_civil,
  nome_genitora text,
  nacionalidade text,
  uf_nascimento_id_pje integer,
  uf_nascimento_sigla text,
  uf_nascimento_descricao text,
  naturalidade_id_pje integer,
  naturalidade_municipio text,
  naturalidade_estado_id_pje integer,
  naturalidade_estado_sigla text,
  pais_nascimento_id_pje integer,
  pais_nascimento_codigo text,
  pais_nascimento_descricao text,
  escolaridade_codigo integer,
  situacao_cpf_receita_id integer,
  situacao_cpf_receita_descricao text,
  pode_usar_celular_mensagem boolean default false,

  -- Dados PJ
  data_abertura date,
  data_fim_atividade date,
  orgao_publico boolean default false,
  tipo_pessoa_codigo_pje text,
  tipo_pessoa_label_pje text,
  tipo_pessoa_validacao_receita text,
  ds_tipo_pessoa text,
  situacao_cnpj_receita_id integer,
  situacao_cnpj_receita_descricao text,
  ramo_atividade text,
  cpf_responsavel text,
  oficial boolean default false,
  ds_prazo_expediente_automatico text,
  porte_codigo integer,
  porte_descricao text,
  inscricao_estadual text,

  -- Observações e endereço
  observacoes text,
  endereco_id bigint references public.enderecos(id),

  -- Controle
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.terceiros is 'Terceiros em processos - Peritos, Ministério Público, Assistentes, etc';
comment on column public.terceiros.id_pje is 'ID da parte no sistema PJE';
comment on column public.terceiros.id_pessoa_pje is 'ID da pessoa no sistema PJE';
comment on column public.terceiros.tipo_parte is 'Tipo da parte: PERITO, MINISTERIO_PUBLICO, ASSISTENTE, etc';
comment on column public.terceiros.polo is 'Polo processual: ativo, passivo, outros';

-- Índices
create index if not exists idx_terceiros_processo on public.terceiros(numero_processo, trt, grau);
create index if not exists idx_terceiros_id_pessoa_pje on public.terceiros(id_pessoa_pje);
create index if not exists idx_terceiros_tipo_parte on public.terceiros(tipo_parte);

-- RLS
alter table public.terceiros enable row level security;

create policy "Service role tem acesso total aos terceiros"
on public.terceiros for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler terceiros"
on public.terceiros for select
to authenticated
using (true);
