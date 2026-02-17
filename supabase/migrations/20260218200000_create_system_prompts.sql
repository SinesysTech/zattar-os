-- Migration: Create system_prompts table for AI prompt management
-- Allows editing and creating system prompts from the settings page

CREATE TABLE IF NOT EXISTS public.system_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL CHECK (categoria IN ('plate_ai', 'copilotkit', 'copilot', 'custom')),
  conteudo TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by_auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_system_prompts_slug ON public.system_prompts(slug);
CREATE INDEX IF NOT EXISTS idx_system_prompts_categoria ON public.system_prompts(categoria);
CREATE INDEX IF NOT EXISTS idx_system_prompts_ativo ON public.system_prompts(ativo);
CREATE INDEX IF NOT EXISTS idx_system_prompts_categoria_ativo ON public.system_prompts(categoria, ativo);

-- Comments
COMMENT ON TABLE public.system_prompts IS 'System prompts for AI features (Plate editor, CopilotKit, Copilot)';
COMMENT ON COLUMN public.system_prompts.slug IS 'Unique identifier slug (e.g., plate_generate, copilotkit_pedrinho)';
COMMENT ON COLUMN public.system_prompts.categoria IS 'Category: plate_ai, copilotkit, copilot, custom';
COMMENT ON COLUMN public.system_prompts.conteudo IS 'The actual prompt text content';
COMMENT ON COLUMN public.system_prompts.metadata IS 'Extra config: model overrides, temperature, etc.';

-- updated_at trigger (reuse existing function from integracoes migration)
CREATE TRIGGER set_system_prompts_updated_at
  BEFORE UPDATE ON public.system_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();

-- RLS (same pattern as integracoes)
ALTER TABLE public.system_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read system_prompts"
  ON public.system_prompts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert system_prompts"
  ON public.system_prompts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update system_prompts"
  ON public.system_prompts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete system_prompts"
  ON public.system_prompts FOR DELETE TO authenticated USING (true);
