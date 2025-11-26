-- ============================================================================
-- Tabela: representantes
-- Representantes legais (advogados) que atuam em nome de partes em processos
-- NOTA: Representantes são sempre pessoas físicas (advogados) na API do PJE.
-- Os campos disponíveis são limitados comparados às partes.
-- ============================================================================

create table if not exists public.representantes (
  id integer generated always as identity primary key,
  id_pje integer,
  id_pessoa_pje integer not null,

  -- Contexto (link to parte and processo)
  parte_tipo varchar(20) not null check (parte_tipo in ('cliente', 'parte_contraria', 'terceiro')),
  parte_id integer not null,
  polo varchar(20),
  trt varchar(10),
  grau varchar(2),
  numero_processo varchar(25),

  -- Dados básicos
  nome varchar(255) not null,
  cpf varchar(14),
  sexo varchar(20),
  situacao varchar(50),
  status varchar(50),
  principal boolean,
  endereco_desconhecido boolean,

  -- Dados OAB (advogado)
  tipo varchar(50),
  id_tipo_parte integer,
  numero_oab varchar(20),
  situacao_oab varchar(50),

  -- Contato
  emails text[],
  email varchar(255),
  ddd_celular varchar(5),
  numero_celular varchar(15),
  ddd_residencial varchar(5),
  numero_residencial varchar(15),
  ddd_comercial varchar(5),
  numero_comercial varchar(15),

  -- Metadados
  dados_anteriores jsonb,
  ordem integer,
  data_habilitacao timestamp with time zone,
  endereco_id bigint references public.enderecos(id),

  -- Timestamps
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  -- Constraint única: um representante por parte por processo
  constraint uq_representantes_por_processo
    unique (id_pessoa_pje, parte_id, parte_tipo, trt, grau, numero_processo)
);

comment on table public.representantes is 'Representantes legais (advogados) das partes em processos. Campos limitados comparados às partes (PF/PJ).';
comment on column public.representantes.id_pje is 'ID do representante no PJE';
comment on column public.representantes.id_pessoa_pje is 'ID da pessoa (advogado) no PJE';
comment on column public.representantes.parte_tipo is 'Tipo da parte representada: cliente, parte_contraria, terceiro';
comment on column public.representantes.parte_id is 'ID da parte na respectiva tabela';
comment on column public.representantes.polo is 'Polo processual da parte representada';
comment on column public.representantes.trt is 'Código do TRT (ex: trt1, trt2, etc)';
comment on column public.representantes.grau is 'Grau do processo: 1 (primeiro grau) ou 2 (segundo grau)';
comment on column public.representantes.numero_processo is 'Número do processo no formato CNJ';
comment on column public.representantes.nome is 'Nome do advogado';
comment on column public.representantes.cpf is 'CPF do advogado';
comment on column public.representantes.numero_oab is 'Número da OAB';
comment on column public.representantes.situacao_oab is 'Situação da OAB: REGULAR, SUSPENSO, etc';
comment on column public.representantes.tipo is 'Tipo: ADVOGADO, PROCURADOR, DEFENSOR_PUBLICO, etc';
comment on column public.representantes.dados_anteriores is 'Estado anterior do registro antes da última atualização';
comment on column public.representantes.data_habilitacao is 'Data de habilitação no processo';

-- Índices
create index if not exists idx_representantes_parte on public.representantes(parte_tipo, parte_id);
create index if not exists idx_representantes_processo on public.representantes(numero_processo, trt, grau);
create index if not exists idx_representantes_id_pessoa_pje on public.representantes(id_pessoa_pje);
create index if not exists idx_representantes_oab on public.representantes(numero_oab);

-- RLS
alter table public.representantes enable row level security;

create policy "Service role tem acesso total aos representantes"
on public.representantes for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler representantes"
on public.representantes for select
to authenticated
using (true);
