-- VIEW unificada para listar todos os expedientes (PJE + Manuais)
-- Combina expedientes e expedientes_manuais em uma única interface

create or replace view public.expedientes_unificados as
select
  'pje'::text as origem,
  pm.id,
  pm.processo_id,
  pm.trt,
  pm.grau,
  pm.numero_processo,
  pm.tipo_expediente_id,
  pm.descricao_arquivos as descricao,
  pm.data_prazo_legal_parte as data_prazo_legal,
  pm.prazo_vencido,
  pm.responsavel_id,
  pm.baixado_em,
  pm.protocolo_id,
  pm.justificativa_baixa,
  pm.id_pje,
  null::bigint as criado_por,
  pm.classe_judicial,
  pm.codigo_status_processo,
  pm.descricao_orgao_julgador,
  pm.nome_parte_autora,
  pm.nome_parte_re,
  pm.data_autuacao,
  pm.segredo_justica,
  pm.juizo_digital,
  pm.created_at,
  pm.updated_at
from public.expedientes pm

union all

select
  'manual'::text as origem,
  em.id,
  em.processo_id,
  em.trt,
  em.grau,
  em.numero_processo,
  em.tipo_expediente_id,
  em.descricao,
  em.data_prazo_legal,
  em.prazo_vencido,
  em.responsavel_id,
  em.baixado_em,
  em.protocolo_id,
  em.justificativa_baixa,
  null::bigint as id_pje,
  em.criado_por,
  -- Campos específicos do PJE preenchidos com NULL
  null::text as classe_judicial,
  null::text as codigo_status_processo,
  null::text as descricao_orgao_julgador,
  null::text as nome_parte_autora,
  null::text as nome_parte_re,
  null::timestamptz as data_autuacao,
  false as segredo_justica,
  false as juizo_digital,
  em.created_at,
  em.updated_at
from public.expedientes_manuais em;

comment on view public.expedientes_unificados is 'VIEW unificada de expedientes do PJE e expedientes manuais. Campo "origem" indica a fonte (pje | manual)';
