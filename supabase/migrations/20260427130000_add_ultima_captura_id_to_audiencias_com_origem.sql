-- Migration: Adicionar ultima_captura_id à view audiencias_com_origem
--
-- Contexto: a coluna ultima_captura_id existe na tabela audiencias mas não
-- estava na view audiencias_com_origem. Isso causava erro 42703 ao listar
-- audiências via findAllAudiencias, que faz SELECT a partir da view.

drop view if exists public.audiencias_com_origem cascade;

create view public.audiencias_com_origem as
with dados_primeiro_grau as (
  select distinct on (acervo.numero_processo)
    acervo.numero_processo,
    acervo.trt as trt_origem,
    acervo.nome_parte_autora as nome_parte_autora_origem,
    acervo.nome_parte_re as nome_parte_re_origem,
    acervo.descricao_orgao_julgador as orgao_julgador_origem
  from public.acervo
  order by
    acervo.numero_processo,
    case
      when (acervo.grau = 'primeiro_grau'::grau_tribunal) then 0
      else 1
    end,
    acervo.data_autuacao
)
select
  a.id,
  a.id_pje,
  a.advogado_id,
  a.processo_id,
  a.orgao_julgador_id,
  a.trt,
  a.grau,
  a.numero_processo,
  a.data_inicio,
  a.data_fim,
  a.sala_audiencia_nome,
  a.sala_audiencia_id,
  a.status,
  a.status_descricao,
  a.designada,
  a.em_andamento,
  a.documento_ativo,
  a.polo_ativo_nome,
  a.polo_passivo_nome,
  a.url_audiencia_virtual,
  a.created_at,
  a.updated_at,
  a.dados_anteriores,
  a.responsavel_id,
  a.observacoes,
  a.classe_judicial_id,
  a.tipo_audiencia_id,
  a.segredo_justica,
  a.juizo_digital,
  a.polo_ativo_representa_varios,
  a.polo_passivo_representa_varios,
  a.endereco_presencial,
  a.ata_audiencia_id,
  a.hora_inicio,
  a.hora_fim,
  a.modalidade,
  a.url_ata_audiencia,
  a.presenca_hibrida,
  a.modalidade_editada_manualmente,
  a.url_editada_manualmente,
  a.endereco_editado_manualmente,
  a.ultima_captura_id,
  -- Campos de origem (fonte da verdade do 1º grau)
  coalesce(dpg.trt_origem::text, a.trt::text) as trt_origem,
  coalesce(dpg.nome_parte_autora_origem, a.polo_ativo_nome) as polo_ativo_origem,
  coalesce(dpg.nome_parte_re_origem, a.polo_passivo_nome) as polo_passivo_origem,
  dpg.orgao_julgador_origem,
  ta.descricao as tipo_descricao
from public.audiencias a
left join dados_primeiro_grau dpg on a.numero_processo = dpg.numero_processo
left join public.tipo_audiencia ta on a.tipo_audiencia_id = ta.id;

comment on view public.audiencias_com_origem is
'View que enriquece as audiências com dados de origem do 1º grau.
Quando uma audiência é de 2º grau, esta view busca no acervo o processo de 1º grau
correspondente (pelo numero_processo) e traz as informações originais das partes.
Isso garante que a "fonte da verdade" para autor/réu seja sempre o 1º grau.
Inclui as flags *_editada_manualmente para sinalizar override manual de campos
que normalmente seriam sincronizados do PJe.
Inclui ultima_captura_id para permitir filtro por sessão de captura.';

grant select on public.audiencias_com_origem to authenticated;
grant select on public.audiencias_com_origem to service_role;
