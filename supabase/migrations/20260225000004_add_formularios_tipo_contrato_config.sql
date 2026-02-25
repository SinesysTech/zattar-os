-- Adicionar tipo_formulario e contrato_config em assinatura_digital_formularios

alter table public.assinatura_digital_formularios
  add column if not exists tipo_formulario text
    check (tipo_formulario in ('contrato', 'documento', 'cadastro')),
  add column if not exists contrato_config jsonb;

comment on column public.assinatura_digital_formularios.tipo_formulario is 'Tipo do formulário: contrato, documento ou cadastro';
comment on column public.assinatura_digital_formularios.contrato_config is 'Configuração de contrato (JSONB): tipo_contrato_id, tipo_cobranca_id, papel_cliente, pipeline_id. Usado apenas quando tipo_formulario = contrato';

create index if not exists idx_formularios_tipo_formulario on public.assinatura_digital_formularios(tipo_formulario);
