-- Migration: Adicionar campos de permissões e cargos na tabela usuarios
-- Adiciona cargo_id (FK para cargos) e is_super_admin (bypass de permissões)

-- Adicionar coluna cargo_id (FK opcional para cargos)
ALTER TABLE public.usuarios
  ADD COLUMN cargo_id BIGINT REFERENCES public.cargos(id) ON DELETE SET NULL;

-- Adicionar coluna is_super_admin (default false)
ALTER TABLE public.usuarios
  ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE;

-- Comentários nas novas colunas
COMMENT ON COLUMN public.usuarios.cargo_id IS 'ID do cargo do usuário (opcional, para organização interna)';
COMMENT ON COLUMN public.usuarios.is_super_admin IS 'Indica se o usuário é super admin (bypassa todas as permissões)';

-- Índices para performance
CREATE INDEX idx_usuarios_cargo_id ON public.usuarios USING btree (cargo_id);
CREATE INDEX idx_usuarios_is_super_admin ON public.usuarios USING btree (is_super_admin);
