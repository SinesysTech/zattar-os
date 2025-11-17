-- Tabela de contratos do sistema
-- Contratos jurídicos do escritório de advocacia

create table public.contratos (
  id bigint generated always as identity primary key,
  
  -- Dados do contrato
  area_direito public.area_direito not null,
  tipo_contrato public.tipo_contrato not null,
  tipo_cobranca public.tipo_cobranca not null,
  
  -- Partes do contrato
  cliente_id bigint not null references public.clientes(id) on delete restrict,
  polo_cliente public.polo_processual not null,
  parte_contraria_id bigint references public.partes_contrarias(id) on delete set null,
  
  -- Partes processuais (JSONB para múltiplas partes)
  parte_autora jsonb, -- Array: [{ tipo: 'cliente' | 'parte_contraria', id: number, nome: string }]
  parte_re jsonb, -- Array: [{ tipo: 'cliente' | 'parte_contraria', id: number, nome: string }]
  qtde_parte_autora integer not null default 1,
  qtde_parte_re integer not null default 1,
  
  -- Status e datas
  status public.status_contrato not null default 'em_contratacao',
  data_contratacao timestamptz default now() not null,
  data_assinatura date,
  data_distribuicao date,
  data_desistencia date,
  
  -- Controle
  responsavel_id bigint references public.usuarios(id) on delete set null,
  created_by bigint references public.usuarios(id) on delete set null,
  observacoes text,
  dados_anteriores jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.contratos is 'Contratos jurídicos do escritório de advocacia';

-- Comentários dos campos
comment on column public.contratos.area_direito is 'Área de direito do contrato';
comment on column public.contratos.tipo_contrato is 'Tipo de contrato jurídico';
comment on column public.contratos.tipo_cobranca is 'Tipo de cobrança (pró-exito ou pró-labore)';
comment on column public.contratos.cliente_id is 'ID do cliente principal do contrato';
comment on column public.contratos.polo_cliente is 'Polo processual que o cliente principal ocupa (autor ou ré)';
comment on column public.contratos.parte_contraria_id is 'ID da parte contrária principal (opcional)';
comment on column public.contratos.parte_autora is 'Array de partes autoras em formato JSONB: [{ tipo: "cliente" | "parte_contraria", id: number, nome: string }]';
comment on column public.contratos.parte_re is 'Array de partes rés em formato JSONB: [{ tipo: "cliente" | "parte_contraria", id: number, nome: string }]';
comment on column public.contratos.qtde_parte_autora is 'Quantidade de partes autoras';
comment on column public.contratos.qtde_parte_re is 'Quantidade de partes rés';
comment on column public.contratos.status is 'Status do contrato no sistema';
comment on column public.contratos.data_contratacao is 'Data de contratação (início do processo de contratação)';
comment on column public.contratos.data_assinatura is 'Data de assinatura do contrato';
comment on column public.contratos.data_distribuicao is 'Data de distribuição do processo';
comment on column public.contratos.data_desistencia is 'Data de desistência do contrato';
comment on column public.contratos.responsavel_id is 'ID do usuário responsável pelo contrato';
comment on column public.contratos.created_by is 'ID do usuário que criou o registro';
comment on column public.contratos.observacoes is 'Observações gerais sobre o contrato';
comment on column public.contratos.dados_anteriores is 'Armazena o estado anterior do registro antes da última atualização. Null quando o registro foi inserido ou quando não houve mudanças.';

-- Índices para melhor performance
create index idx_contratos_area_direito on public.contratos using btree (area_direito);
create index idx_contratos_tipo_contrato on public.contratos using btree (tipo_contrato);
create index idx_contratos_status on public.contratos using btree (status);
create index idx_contratos_cliente_id on public.contratos using btree (cliente_id);
create index idx_contratos_parte_contraria_id on public.contratos using btree (parte_contraria_id);
create index idx_contratos_responsavel_id on public.contratos using btree (responsavel_id);
create index idx_contratos_created_by on public.contratos using btree (created_by);
create index idx_contratos_data_assinatura on public.contratos using btree (data_assinatura) where data_assinatura is not null;
create index idx_contratos_data_distribuicao on public.contratos using btree (data_distribuicao) where data_distribuicao is not null;

-- Índices GIN para busca em JSONB
create index idx_contratos_parte_autora on public.contratos using gin (parte_autora);
create index idx_contratos_parte_re on public.contratos using gin (parte_re);

-- Trigger para atualizar updated_at automaticamente
create trigger update_contratos_updated_at
before update on public.contratos
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.contratos enable row level security;

