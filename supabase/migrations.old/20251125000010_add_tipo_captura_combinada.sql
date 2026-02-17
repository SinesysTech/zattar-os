-- Migration: Adicionar tipo de captura 'combinada'
-- Description: Adiciona a opção 'combinada' ao enum tipo_captura para suportar
--              captura combinada (audiências + expedientes + timeline + partes)
-- Date: 2025-12-09

-- Adicionar novo valor ao enum tipo_captura
alter type public.tipo_captura add value if not exists 'combinada';

-- Atualizar comentário do tipo
comment on type public.tipo_captura is 'Tipo de captura: acervo_geral, arquivados, audiencias, pendentes, partes, combinada (audiências + expedientes + dados complementares em uma única sessão)';
