-- Tabela de órgãos julgadores
-- Armazena informações dos órgãos julgadores que aparecem nas audiências

create table public.orgao_julgador (
  id bigint generated always as identity primary key,
  id_pje bigint not null,
  trt public.codigo_tribunal not null,
  grau public.grau_tribunal not null,
  descricao text not null,
  cejusc boolean not null default false,
  ativo boolean not null default true,
  posto_avancado boolean not null default false,
  novo_orgao_julgador boolean not null default false,
  codigo_serventia_cnj integer not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  -- Garantir unicidade por ID do PJE, TRT e grau
  unique (id_pje, trt, grau)
);
comment on table public.orgao_julgador is 'Órgãos julgadores dos processos capturados do PJE';
comment on column public.orgao_julgador.id_pje is 'ID do órgão julgador no sistema PJE';
comment on column public.orgao_julgador.trt is 'Código do TRT onde o órgão julgador está localizado';
comment on column public.orgao_julgador.grau is 'Grau do processo (primeiro_grau ou segundo_grau)';
comment on column public.orgao_julgador.descricao is 'Descrição completa do órgão julgador (ex: 72ª Vara do Trabalho do Rio de Janeiro)';
comment on column public.orgao_julgador.cejusc is 'Indica se é um CEJUSC (Centro Judiciário de Solução de Conflitos)';
comment on column public.orgao_julgador.ativo is 'Indica se o órgão julgador está ativo';
comment on column public.orgao_julgador.posto_avancado is 'Indica se é um posto avançado';
comment on column public.orgao_julgador.novo_orgao_julgador is 'Indica se é um novo órgão julgador';
comment on column public.orgao_julgador.codigo_serventia_cnj is 'Código da serventia no CNJ';

-- Índices para melhor performance
create index idx_orgao_julgador_id_pje on public.orgao_julgador using btree (id_pje);
create index idx_orgao_julgador_trt on public.orgao_julgador using btree (trt);
create index idx_orgao_julgador_grau on public.orgao_julgador using btree (grau);
create index idx_orgao_julgador_trt_grau on public.orgao_julgador using btree (trt, grau);
create index idx_orgao_julgador_descricao on public.orgao_julgador using btree (descricao);

-- Trigger para atualizar updated_at automaticamente
create trigger update_orgao_julgador_updated_at
before update on public.orgao_julgador
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.orgao_julgador enable row level security;

