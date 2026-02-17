-- Migration: Adicionar campos de permissões e cargos na tabela usuarios (versão segura)
-- Adiciona cargo_id (FK para cargos) e is_super_admin (bypass de permissões)
-- Verifica se colunas já existem antes de adicionar

-- Adicionar coluna cargo_id (FK opcional para cargos) - SE NÃO EXISTIR
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'usuarios'
      AND column_name = 'cargo_id'
  ) THEN
    ALTER TABLE public.usuarios
      ADD COLUMN cargo_id BIGINT REFERENCES public.cargos(id) ON DELETE SET NULL;

    COMMENT ON COLUMN public.usuarios.cargo_id IS 'ID do cargo do usuário (opcional, para organização interna)';

    CREATE INDEX idx_usuarios_cargo_id ON public.usuarios USING btree (cargo_id);
  ELSE
    RAISE NOTICE 'Coluna cargo_id já existe em usuarios';
  END IF;
END $$;

-- Adicionar coluna is_super_admin (default false) - SE NÃO EXISTIR
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'usuarios'
      AND column_name = 'is_super_admin'
  ) THEN
    ALTER TABLE public.usuarios
      ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE;

    COMMENT ON COLUMN public.usuarios.is_super_admin IS 'Indica se o usuário é super admin (bypassa todas as permissões)';

    CREATE INDEX idx_usuarios_is_super_admin ON public.usuarios USING btree (is_super_admin);
  ELSE
    RAISE NOTICE 'Coluna is_super_admin já existe em usuarios';
  END IF;
END $$;

-- Verificar resultado
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'usuarios'
  AND column_name IN ('cargo_id', 'is_super_admin')
ORDER BY column_name;
