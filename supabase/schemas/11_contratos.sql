-- Tabela de contratos do sistema
-- Contratos jurídicos do escritório de advocacia

create table public.contratos (
  id bigint generated always as identity primary key,

  -- Dados do contrato
  segmento_id bigint references public.segmentos(id),
  tipo_contrato public.tipo_contrato not null,
  tipo_cobranca public.tipo_cobranca not null,
  
  -- Partes do contrato
  cliente_id bigint not null references public.clientes(id) on delete restrict,
  papel_cliente_no_contrato public.papel_contratual not null,
  
  -- Status e datas
  status public.status_contrato not null default 'em_contratacao',
  cadastrado_em timestamptz default now() not null,
  
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
comment on column public.contratos.segmento_id is 'ID do segmento (área de atuação) do contrato';
comment on column public.contratos.tipo_contrato is 'Tipo de contrato jurídico';
comment on column public.contratos.tipo_cobranca is 'Tipo de cobrança (pró-exito ou pró-labore)';
comment on column public.contratos.cliente_id is 'ID do cliente principal do contrato';
comment on column public.contratos.papel_cliente_no_contrato is 'Papel contratual que o cliente principal ocupa (autora ou ré)';
comment on column public.contratos.status is 'Status do contrato no sistema';
comment on column public.contratos.cadastrado_em is 'Data/hora de cadastro do contrato (antigo data_contratacao)';
comment on column public.contratos.responsavel_id is 'ID do usuário responsável pelo contrato';
comment on column public.contratos.created_by is 'ID do usuário que criou o registro';
comment on column public.contratos.observacoes is 'Observações gerais sobre o contrato';
comment on column public.contratos.dados_anteriores is 'Armazena o estado anterior do registro antes da última atualização. Null quando o registro foi inserido ou quando não houve mudanças.';

-- Índices para melhor performance
create index idx_contratos_segmento_id on public.contratos using btree (segmento_id);
create index idx_contratos_tipo_contrato on public.contratos using btree (tipo_contrato);
create index idx_contratos_status on public.contratos using btree (status);
create index idx_contratos_cliente_id on public.contratos using btree (cliente_id);
create index idx_contratos_responsavel_id on public.contratos using btree (responsavel_id);
create index idx_contratos_created_by on public.contratos using btree (created_by);

-- Trigger para atualizar updated_at automaticamente
create trigger update_contratos_updated_at
before update on public.contratos
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.contratos enable row level security;

