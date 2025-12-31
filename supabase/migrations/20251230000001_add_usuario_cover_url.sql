-- Migration: Adicionar campo cover_url para imagem de capa/banner do usuário
-- Created: 2025-12-30

-- Adicionar coluna cover_url na tabela usuarios
ALTER TABLE usuarios
ADD COLUMN cover_url TEXT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN usuarios.cover_url IS 'URL da imagem de capa/banner do perfil do usuário armazenada no Supabase Storage (bucket: covers)';
