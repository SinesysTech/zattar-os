-- Migration: Criar view expedientes_com_origem
-- Esta view enriquece os expedientes com dados de origem do 1º grau
-- para garantir que as partes corretas sejam exibidas independente do grau do expediente

-- ============================================================================
-- View: expedientes_com_origem
-- ============================================================================
-- Esta view existe no full_schema_dump.sql mas não tinha uma migration dedicada.
-- Isso pode causar erro 500 em produção se a view não existir.

DROP VIEW IF EXISTS public.expedientes_com_origem CASCADE;

CREATE VIEW public.expedientes_com_origem AS
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
  e.id,
  e.id_pje,
  e.advogado_id,
  e.processo_id,
  e.trt,
  e.grau,
  e.numero_processo,
  e.descricao_orgao_julgador,
  e.classe_judicial,
  e.numero,
  e.segredo_justica,
  e.codigo_status_processo,
  e.prioridade_processual,
  e.nome_parte_autora,
  e.qtde_parte_autora,
  e.nome_parte_re,
  e.qtde_parte_re,
  e.data_autuacao,
  e.juizo_digital,
  e.data_arquivamento,
  e.id_documento,
  e.data_ciencia_parte,
  e.data_prazo_legal_parte,
  e.data_criacao_expediente,
  e.prazo_vencido,
  e.sigla_orgao_julgador,
  e.created_at,
  e.updated_at,
  e.dados_anteriores,
  e.responsavel_id,
  e.baixado_em,
  e.protocolo_id,
  e.justificativa_baixa,
  e.tipo_expediente_id,
  e.descricao_arquivos,
  e.arquivo_nome,
  e.arquivo_url,
  e.arquivo_bucket,
  e.arquivo_key,
  e.observacoes,
  e.origem,
  -- Campos de origem (fonte da verdade do 1º grau)
  COALESCE(dpg.trt_origem::text, e.trt::text) AS trt_origem,
  COALESCE(dpg.nome_parte_autora_origem, e.nome_parte_autora) AS nome_parte_autora_origem,
  COALESCE(dpg.nome_parte_re_origem, e.nome_parte_re) AS nome_parte_re_origem,
  dpg.orgao_julgador_origem
FROM public.expedientes e
LEFT JOIN dados_primeiro_grau dpg ON e.numero_processo = dpg.numero_processo;

-- Comment explicativo
COMMENT ON VIEW public.expedientes_com_origem IS
'View que enriquece os expedientes com dados de origem do 1º grau.
Quando um expediente é de 2º grau, esta view busca no acervo o processo de 1º grau
correspondente (pelo numero_processo) e traz as informações originais das partes.
Isso garante que a "fonte da verdade" para autor/réu seja sempre o 1º grau.';

-- Grant de acesso para usuários autenticados
GRANT SELECT ON public.expedientes_com_origem TO authenticated;
GRANT SELECT ON public.expedientes_com_origem TO service_role;
