-- Migration: Criar view audiencias_com_origem
-- Esta view enriquece as audiências com dados de origem do 1º grau
-- para garantir que as partes corretas sejam exibidas independente do grau da audiência

-- ============================================================================
-- View: audiencias_com_origem
-- ============================================================================
-- Esta view existe no full_schema_dump.sql mas não tinha uma migration dedicada.
-- Isso pode causar erros em produção se a view não existir.

DROP VIEW IF EXISTS public.audiencias_com_origem CASCADE;

CREATE VIEW public.audiencias_com_origem AS
WITH dados_primeiro_grau AS (
  SELECT DISTINCT ON (acervo.numero_processo)
    acervo.numero_processo,
    acervo.trt AS trt_origem,
    acervo.nome_parte_autora AS nome_parte_autora_origem,
    acervo.nome_parte_re AS nome_parte_re_origem,
    acervo.descricao_orgao_julgador AS orgao_julgador_origem
  FROM public.acervo
  ORDER BY
    acervo.numero_processo,
    CASE
      WHEN (acervo.grau = 'primeiro_grau'::grau_tribunal) THEN 0
      ELSE 1
    END,
    acervo.data_autuacao
)
SELECT
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
  -- Campos de origem (fonte da verdade do 1º grau)
  COALESCE(dpg.trt_origem::text, a.trt::text) AS trt_origem,
  COALESCE(dpg.nome_parte_autora_origem, a.polo_ativo_nome) AS polo_ativo_origem,
  COALESCE(dpg.nome_parte_re_origem, a.polo_passivo_nome) AS polo_passivo_origem,
  dpg.orgao_julgador_origem,
  ta.descricao AS tipo_descricao
FROM public.audiencias a
LEFT JOIN dados_primeiro_grau dpg ON a.numero_processo = dpg.numero_processo
LEFT JOIN public.tipo_audiencia ta ON a.tipo_audiencia_id = ta.id;

-- Comment explicativo
COMMENT ON VIEW public.audiencias_com_origem IS
'View que enriquece as audiências com dados de origem do 1º grau.
Quando uma audiência é de 2º grau, esta view busca no acervo o processo de 1º grau
correspondente (pelo numero_processo) e traz as informações originais das partes.
Isso garante que a "fonte da verdade" para autor/réu seja sempre o 1º grau.';

-- Grant de acesso para usuários autenticados
GRANT SELECT ON public.audiencias_com_origem TO authenticated;
GRANT SELECT ON public.audiencias_com_origem TO service_role;
