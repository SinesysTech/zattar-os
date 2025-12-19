-- ============================================================================
-- Adiciona colunas tipo_template, segmento_id e pdf_url na tabela assinatura_digital_templates
-- ============================================================================

-- Adicionar coluna tipo_template para distinguir templates PDF de Markdown
alter table public.assinatura_digital_templates
  add column if not exists tipo_template text default 'pdf'
  check (tipo_template in ('pdf', 'markdown'));

comment on column public.assinatura_digital_templates.tipo_template is 'Tipo do template: pdf (arquivo PDF) ou markdown (conteúdo gerado)';

-- Adicionar coluna segmento_id para vincular templates a segmentos
alter table public.assinatura_digital_templates
  add column if not exists segmento_id bigint references public.assinatura_digital_segmentos(id);

comment on column public.assinatura_digital_templates.segmento_id is 'ID do segmento associado ao template (null = template global)';

-- Adicionar coluna pdf_url para armazenar URL do PDF no storage
alter table public.assinatura_digital_templates
  add column if not exists pdf_url text;

comment on column public.assinatura_digital_templates.pdf_url is 'URL do arquivo PDF no storage (para templates tipo pdf)';

-- Criar índice para consultas por segmento_id
create index if not exists idx_assinatura_digital_templates_segmento
  on public.assinatura_digital_templates(segmento_id);

-- Criar índice para consultas por tipo_template
create index if not exists idx_assinatura_digital_templates_tipo
  on public.assinatura_digital_templates(tipo_template);

-- Popula segmento_id baseado em formulários associados (via template_ids)
-- Templates que estão vinculados a formulários herdam o segmento_id do primeiro formulário
update public.assinatura_digital_templates t
set segmento_id = (
  select f.segmento_id
  from public.assinatura_digital_formularios f
  where t.template_uuid::text = any(f.template_ids)
  limit 1
)
where t.segmento_id is null;
