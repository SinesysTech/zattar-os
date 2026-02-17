-- Criar tabela unificada de segmentos
CREATE TABLE IF NOT EXISTS public.segmentos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  descricao text,
  escopo text NOT NULL DEFAULT 'global',
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT segmentos_escopo_check CHECK (escopo IN ('global', 'contratos', 'assinatura'))
);

-- Migrar dados de area_direito para segmentos
INSERT INTO public.segmentos (nome, slug, escopo, ativo)
VALUES 
  ('Trabalhista', 'trabalhista', 'global', true),
  ('Civil', 'civil', 'global', true),
  ('Previdenciário', 'previdenciario', 'global', true),
  ('Criminal', 'criminal', 'global', true),
  ('Empresarial', 'empresarial', 'global', true),
  ('Administrativo', 'administrativo', 'global', true)
ON CONFLICT (slug) DO NOTHING;

-- Migrar dados de assinatura_digital_segmentos
INSERT INTO public.segmentos (nome, slug, descricao, escopo, ativo, created_at, updated_at)
SELECT nome, slug, descricao, 'assinatura', ativo, created_at, updated_at
FROM public.assinatura_digital_segmentos
ON CONFLICT (slug) DO NOTHING;

-- Adicionar coluna segmento_id em contratos (mantém area_direito temporariamente)
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS segmento_id bigint REFERENCES public.segmentos(id);

-- Atualizar contratos com segmento_id baseado em area_direito
UPDATE public.contratos c
SET segmento_id = s.id
FROM public.segmentos s
WHERE c.area_direito::text = s.slug;

-- Atualizar formulários para referenciar nova tabela
ALTER TABLE public.assinatura_digital_formularios 
  DROP CONSTRAINT IF EXISTS assinatura_digital_formularios_segmento_id_fkey,
  ADD CONSTRAINT assinatura_digital_formularios_segmento_id_fkey 
    FOREIGN KEY (segmento_id) REFERENCES public.segmentos(id) ON DELETE RESTRICT;

-- Atualizar assinaturas para referenciar nova tabela
ALTER TABLE public.assinatura_digital_assinaturas
  DROP CONSTRAINT IF EXISTS assinatura_digital_assinaturas_segmento_id_fkey,
  ADD CONSTRAINT assinatura_digital_assinaturas_segmento_id_fkey
    FOREIGN KEY (segmento_id) REFERENCES public.segmentos(id) ON DELETE RESTRICT;

-- Índices
CREATE INDEX IF NOT EXISTS idx_segmentos_escopo ON public.segmentos(escopo);
CREATE INDEX IF NOT EXISTS idx_segmentos_ativo ON public.segmentos(ativo);
CREATE INDEX IF NOT EXISTS idx_segmentos_slug ON public.segmentos(slug);

-- RLS
ALTER TABLE public.segmentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_segmentos"
  ON public.segmentos FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_select_segmentos"
  ON public.segmentos FOR SELECT
  TO authenticated
  USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_segmentos_updated_at
  BEFORE UPDATE ON public.segmentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();