-- Migration: Garantir que coluna classe_judicial existe em acervo
-- Data: 2025-11-22
-- Propósito: Fix para erro "Could not find the 'classe_judicial' column"

-- Adicionar coluna classe_judicial se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'acervo'
    AND column_name = 'classe_judicial'
  ) THEN
    ALTER TABLE public.acervo ADD COLUMN classe_judicial text NOT NULL DEFAULT 'Não informada';
    COMMENT ON COLUMN public.acervo.classe_judicial IS 'Classe judicial do processo (ex: ATOrd, ATSum)';

    RAISE NOTICE 'Coluna classe_judicial adicionada à tabela acervo';
  ELSE
    RAISE NOTICE 'Coluna classe_judicial já existe na tabela acervo';
  END IF;
END $$;

-- Remover constraint DEFAULT se foi adicionada
ALTER TABLE public.acervo ALTER COLUMN classe_judicial DROP DEFAULT;

-- Recarregar schema cache do PostgREST
NOTIFY pgrst, 'reload schema';
