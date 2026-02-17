-- ============================================================================
-- Migration: Preencher campo nivel em plano_contas
-- ============================================================================
-- Preenche automaticamente o campo nivel com base na hierarquia:
-- - Contas que possuem filhas (conta_pai_id aponta para elas) = 'sintetica'
-- - Contas que não possuem filhas = 'analitica'
-- ============================================================================

-- Primeiro, atualizar contas sintéticas (que têm filhas)
UPDATE public.plano_contas
SET nivel = 'sintetica'
WHERE nivel IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.plano_contas filhas
    WHERE filhas.conta_pai_id = plano_contas.id
  );

-- Depois, atualizar contas analíticas (que não têm filhas)
UPDATE public.plano_contas
SET nivel = 'analitica'
WHERE nivel IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.plano_contas filhas
    WHERE filhas.conta_pai_id = plano_contas.id
  );

-- Atualizar o campo aceita_lancamento de acordo com o nivel
-- (apenas contas analíticas podem aceitar lançamentos)
UPDATE public.plano_contas
SET aceita_lancamento = (nivel = 'analitica')
WHERE aceita_lancamento != (nivel = 'analitica');

-- Verificar se ainda existem registros com nivel NULL (não deveria ter)
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.plano_contas
  WHERE nivel IS NULL;

  IF v_count > 0 THEN
    RAISE WARNING 'Ainda existem % registros com nivel NULL no plano_contas', v_count;
  ELSE
    RAISE NOTICE 'Todos os registros foram atualizados com sucesso!';
  END IF;
END $$;
