-- Migration: Adicionar campos de permissões e cargos na tabela usuarios (SQL simples)
-- Adiciona cargo_id (FK para cargos) e is_super_admin (bypass de permissões)

-- Adicionar coluna cargo_id (SE NÃO EXISTIR)
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS cargo_id BIGINT REFERENCES public.cargos(id) ON DELETE SET NULL;

-- Adicionar coluna is_super_admin (SE NÃO EXISTIR)
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- Comentários nas colunas
COMMENT ON COLUMN public.usuarios.cargo_id IS 'ID do cargo do usuário (opcional, para organização interna)';
COMMENT ON COLUMN public.usuarios.is_super_admin IS 'Indica se o usuário é super admin (bypassa todas as permissões)';

-- Criar índices (SE NÃO EXISTIREM)
CREATE INDEX IF NOT EXISTS idx_usuarios_cargo_id ON public.usuarios USING btree (cargo_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_is_super_admin ON public.usuarios USING btree (is_super_admin);
