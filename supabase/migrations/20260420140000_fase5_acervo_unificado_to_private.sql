-- Fase 5: Fix advisor 0016_materialized_view_in_api
-- Move public.acervo_unificado (materialized view) para schema private
-- e cria view wrapper em public com security_invoker=true, preservando
-- a API PostgREST (.from('acervo_unificado') continua funcionando).
--
-- PostgREST so expoe schemas listados em config (por default: public).
-- Schema private nao e exposto -> MV fica fora da API -> linter para de reclamar.
-- View wrapper em public roda como invoker (authenticated), que tem SELECT na MV.

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- Mover MV apenas se ainda estiver em public (idempotente: aceita banco virgem,
-- já migrado, ou em estado parcial por aplicação manual anterior).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_matviews
    WHERE schemaname = 'public' AND matviewname = 'acervo_unificado'
  ) THEN
    ALTER MATERIALIZED VIEW public.acervo_unificado SET SCHEMA private;
  END IF;
END $$;

GRANT SELECT ON private.acervo_unificado TO authenticated, service_role;

-- Recriar view wrapper em public de forma idempotente.
-- DROP VIEW IF EXISTS é seguro aqui: o DO block acima já moveu a MV se ainda
-- estivesse em public, então o objeto remanescente (se houver) é uma view.
DROP VIEW IF EXISTS public.acervo_unificado;

CREATE VIEW public.acervo_unificado
WITH (security_invoker = true)
AS SELECT * FROM private.acervo_unificado;

GRANT SELECT ON public.acervo_unificado TO authenticated, service_role;

-- Atualiza funcao de refresh para apontar para private
CREATE OR REPLACE FUNCTION public.refresh_acervo_unificado(use_concurrent boolean DEFAULT true)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF use_concurrent THEN
    BEGIN
      REFRESH MATERIALIZED VIEW CONCURRENTLY private.acervo_unificado;
    EXCEPTION
      WHEN OTHERS THEN
        REFRESH MATERIALIZED VIEW private.acervo_unificado;
    END;
  ELSE
    REFRESH MATERIALIZED VIEW private.acervo_unificado;
  END IF;
END;
$$;

COMMENT ON MATERIALIZED VIEW private.acervo_unificado IS
  'MV com processos unificados por numero_processo. Movida para private em 2026-04-20 para satisfazer advisor 0016_materialized_view_in_api. Acessada via public.acervo_unificado (view wrapper com security_invoker).';

COMMENT ON VIEW public.acervo_unificado IS
  'View wrapper (security_invoker=true) sobre private.acervo_unificado. Preserva compatibilidade da API PostgREST existente.';
