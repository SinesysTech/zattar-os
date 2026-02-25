-- Adicionar colunas FK nas tabelas contratos para as novas tabelas configuráveis
-- Colunas nullable durante transição (coexistem com enum originais)

alter table public.contratos
  add column if not exists tipo_contrato_id bigint references public.contrato_tipos(id) on delete restrict,
  add column if not exists tipo_cobranca_id bigint references public.contrato_tipos_cobranca(id) on delete restrict,
  add column if not exists estagio_id bigint references public.contrato_pipeline_estagios(id) on delete restrict;

comment on column public.contratos.tipo_contrato_id is 'FK para tipo de contrato configurável (substitui coluna enum tipo_contrato)';
comment on column public.contratos.tipo_cobranca_id is 'FK para tipo de cobrança configurável (substitui coluna enum tipo_cobranca)';
comment on column public.contratos.estagio_id is 'FK para estágio do pipeline (substitui coluna enum status)';

create index if not exists idx_contratos_tipo_contrato_id on public.contratos(tipo_contrato_id);
create index if not exists idx_contratos_tipo_cobranca_id on public.contratos(tipo_cobranca_id);
create index if not exists idx_contratos_estagio_id on public.contratos(estagio_id);
