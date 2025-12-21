-- Migration: Create arquivos table for generic file uploads
-- This table stores references to files uploaded to Backblaze B2

CREATE TABLE IF NOT EXISTS public.arquivos (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  tipo_mime VARCHAR(100) NOT NULL,
  tamanho_bytes BIGINT NOT NULL,
  pasta_id BIGINT REFERENCES public.pastas(id) ON DELETE SET NULL,
  b2_key TEXT NOT NULL,
  b2_url TEXT NOT NULL,
  tipo_media VARCHAR(20) NOT NULL CHECK (tipo_media IN ('imagem', 'video', 'audio', 'pdf', 'documento', 'outros')),
  criado_por BIGINT NOT NULL REFERENCES public.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for common query patterns
CREATE INDEX idx_arquivos_pasta_id ON public.arquivos(pasta_id);
CREATE INDEX idx_arquivos_criado_por ON public.arquivos(criado_por);
CREATE INDEX idx_arquivos_deleted_at ON public.arquivos(deleted_at);
CREATE INDEX idx_arquivos_tipo_media ON public.arquivos(tipo_media);

-- Comments for documentation
COMMENT ON TABLE public.arquivos IS 'Generic file uploads (PDFs, images, documents, etc.) stored in Backblaze B2';
COMMENT ON COLUMN public.arquivos.b2_key IS 'Object key in Backblaze B2 storage';
COMMENT ON COLUMN public.arquivos.b2_url IS 'Public URL for the file in B2';
COMMENT ON COLUMN public.arquivos.tipo_media IS 'Media type category for filtering';

-- RLS Policies
ALTER TABLE public.arquivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus próprios arquivos"
  ON public.arquivos FOR SELECT
  USING (criado_por = auth.uid()::bigint);

CREATE POLICY "Usuários podem criar arquivos"
  ON public.arquivos FOR INSERT
  WITH CHECK (criado_por = auth.uid()::bigint);

CREATE POLICY "Usuários podem atualizar seus próprios arquivos"
  ON public.arquivos FOR UPDATE
  USING (criado_por = auth.uid()::bigint);

CREATE POLICY "Usuários podem deletar seus próprios arquivos"
  ON public.arquivos FOR DELETE
  USING (criado_por = auth.uid()::bigint);
