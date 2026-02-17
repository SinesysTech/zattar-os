-- ============================================================================
-- Migration: Deduplicate tipo_audiencia table
-- Description: Transform tipo_audiencia from one row per TRT/grau to one row
--              per unique descricao, storing TRT metadata in JSONB
-- ============================================================================

-- 1. Create new table with deduplicated structure
CREATE TABLE IF NOT EXISTS public.tipo_audiencia_new (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  descricao text NOT NULL,
  is_virtual boolean DEFAULT false NOT NULL,
  trts_metadata jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add unique constraint on descricao
ALTER TABLE public.tipo_audiencia_new
  ADD CONSTRAINT tipo_audiencia_new_descricao_key UNIQUE (descricao);

-- 2. Migrate data: group by descricao, aggregate TRT metadata
INSERT INTO public.tipo_audiencia_new (descricao, is_virtual, trts_metadata, created_at, updated_at)
SELECT
  descricao,
  bool_or(is_virtual) as is_virtual,
  jsonb_agg(
    jsonb_build_object(
      'trt', trt,
      'grau', grau,
      'id_pje', id_pje,
      'codigo', codigo,
      'old_id', id
    ) ORDER BY trt, grau
  ) as trts_metadata,
  MIN(created_at) as created_at,
  MAX(updated_at) as updated_at
FROM public.tipo_audiencia
GROUP BY descricao
ON CONFLICT (descricao) DO NOTHING;

-- 3. Create temporary mapping table (old_id -> new_id)
CREATE TABLE IF NOT EXISTS public.tipo_audiencia_id_mapping (
  old_id bigint PRIMARY KEY,
  new_id bigint NOT NULL
);

INSERT INTO public.tipo_audiencia_id_mapping (old_id, new_id)
SELECT
  t_old.id as old_id,
  t_new.id as new_id
FROM public.tipo_audiencia t_old
JOIN public.tipo_audiencia_new t_new ON t_old.descricao = t_new.descricao
ON CONFLICT (old_id) DO NOTHING;

-- 4. Update FK references in audiencias table
UPDATE public.audiencias a
SET tipo_audiencia_id = m.new_id
FROM public.tipo_audiencia_id_mapping m
WHERE a.tipo_audiencia_id = m.old_id
  AND a.tipo_audiencia_id IS NOT NULL;

-- 5. Drop old FK constraint
ALTER TABLE public.audiencias
  DROP CONSTRAINT IF EXISTS audiencias_tipo_audiencia_id_fkey;

-- 6. Rename tables
ALTER TABLE public.tipo_audiencia RENAME TO tipo_audiencia_old;
ALTER TABLE public.tipo_audiencia_new RENAME TO tipo_audiencia;

-- 7. Recreate FK constraint pointing to new table
ALTER TABLE public.audiencias
  ADD CONSTRAINT audiencias_tipo_audiencia_id_fkey
  FOREIGN KEY (tipo_audiencia_id)
  REFERENCES public.tipo_audiencia(id)
  ON DELETE SET NULL;

-- 8. Create indexes
CREATE INDEX IF NOT EXISTS idx_tipo_audiencia_descricao
  ON public.tipo_audiencia(descricao);
CREATE INDEX IF NOT EXISTS idx_tipo_audiencia_is_virtual
  ON public.tipo_audiencia(is_virtual);
CREATE INDEX IF NOT EXISTS idx_tipo_audiencia_trts_metadata
  ON public.tipo_audiencia USING gin(trts_metadata);

-- 9. Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_tipo_audiencia_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tipo_audiencia_updated_at ON public.tipo_audiencia;
CREATE TRIGGER trigger_update_tipo_audiencia_updated_at
  BEFORE UPDATE ON public.tipo_audiencia
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tipo_audiencia_updated_at();

-- 10. Enable RLS and recreate policies
ALTER TABLE public.tipo_audiencia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role tem acesso total a tipo_audiencia" ON public.tipo_audiencia;
CREATE POLICY "Service role tem acesso total a tipo_audiencia"
ON public.tipo_audiencia FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados podem ler tipo_audiencia" ON public.tipo_audiencia;
CREATE POLICY "Usuários autenticados podem ler tipo_audiencia"
ON public.tipo_audiencia FOR SELECT
TO authenticated
USING (true);

-- 11. Cleanup mapping table (keeping old table for safety)
DROP TABLE IF EXISTS public.tipo_audiencia_id_mapping;

-- 12. Add comments
COMMENT ON TABLE public.tipo_audiencia IS 'Tipos de audiência do PJE (deduplicados por descrição)';
COMMENT ON COLUMN public.tipo_audiencia.descricao IS 'Descrição única do tipo de audiência';
COMMENT ON COLUMN public.tipo_audiencia.is_virtual IS 'Indica se é audiência virtual';
COMMENT ON COLUMN public.tipo_audiencia.trts_metadata IS 'Array de TRTs que usam este tipo: [{trt, grau, id_pje, codigo, old_id}]';

-- Note: tipo_audiencia_old is kept for safety.
-- Run "DROP TABLE public.tipo_audiencia_old;" after verifying the migration.
