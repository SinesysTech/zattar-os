-- Migration: Adicionar campo endereco_presencial à tabela audiencias
-- Data: 2025-11-20
-- Descrição: Adiciona campo JSONB para armazenar endereço físico de audiências presenciais
--            Audiências virtuais: url_audiencia_virtual + sala
--            Audiências presenciais: endereco_presencial + sala

-- Adicionar coluna endereco_presencial (JSONB estruturado)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'audiencias'
    AND column_name = 'endereco_presencial'
  ) THEN
    ALTER TABLE public.audiencias ADD COLUMN endereco_presencial jsonb;

    COMMENT ON COLUMN public.audiencias.endereco_presencial IS 'Endereço completo da audiência presencial em formato JSONB com campos: logradouro, numero, complemento, bairro, cidade, estado, pais, cep. Usado apenas quando tipo_is_virtual = false';

    -- Criar índice GIN para busca em endereco_presencial JSONB
    CREATE INDEX idx_audiencias_endereco_presencial ON public.audiencias USING gin (endereco_presencial);
  END IF;
END $$;
