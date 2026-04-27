-- Adiciona rastreamento de captura nos expedientes
-- Permite identificar quais expedientes foram criados/atualizados em cada execução de captura

ALTER TABLE public.expedientes
  ADD COLUMN IF NOT EXISTS ultima_captura_id bigint
  REFERENCES public.capturas_log(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expedientes_ultima_captura_id
  ON public.expedientes(ultima_captura_id)
  WHERE ultima_captura_id IS NOT NULL;

COMMENT ON COLUMN public.expedientes.ultima_captura_id
  IS 'ID do registro em capturas_log que criou ou atualizou este expediente pela última vez';
