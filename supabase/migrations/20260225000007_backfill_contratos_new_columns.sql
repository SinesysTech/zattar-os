-- Backfill: popular tipo_contrato_id, tipo_cobranca_id e estagio_id
-- nos contratos existentes baseado nos valores enum/status atuais

-- 1. Backfill tipo_contrato_id
update public.contratos c
set tipo_contrato_id = ct.id
from public.contrato_tipos ct
where ct.slug = c.tipo_contrato::text
  and c.tipo_contrato_id is null;

-- 2. Backfill tipo_cobranca_id
update public.contratos c
set tipo_cobranca_id = ctc.id
from public.contrato_tipos_cobranca ctc
where ctc.slug = c.tipo_cobranca::text
  and c.tipo_cobranca_id is null;

-- 3. Backfill estagio_id (mapeia status → estágio com mesmo slug no pipeline do segmento)
update public.contratos c
set estagio_id = cpe.id
from public.contrato_pipeline_estagios cpe
inner join public.contrato_pipelines cp on cp.id = cpe.pipeline_id
where cp.segmento_id = c.segmento_id
  and cpe.slug = c.status::text
  and c.estagio_id is null;
