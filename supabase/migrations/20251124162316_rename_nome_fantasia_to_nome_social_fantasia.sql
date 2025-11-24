-- Migration: Renomear coluna nome_fantasia para nome_social_fantasia
-- Data: 2025-11-24
-- Descrição: A coluna armazenará nome social (PF) ou nome fantasia (PJ) na mesma coluna

-- ============================================================================
-- Tabela: clientes
-- ============================================================================

-- Renomear coluna nome_fantasia para nome_social_fantasia
alter table public.clientes
  rename column nome_fantasia to nome_social_fantasia;

-- Atualizar comentário da coluna para refletir o novo propósito
comment on column public.clientes.nome_social_fantasia is
  'Nome social (para PF) ou nome fantasia (para PJ). Coluna única que serve para ambos os tipos de pessoa.';

-- ============================================================================
-- Tabela: partes_contrarias
-- ============================================================================

-- Renomear coluna nome_fantasia para nome_social_fantasia
alter table public.partes_contrarias
  rename column nome_fantasia to nome_social_fantasia;

-- Atualizar comentário da coluna para refletir o novo propósito
comment on column public.partes_contrarias.nome_social_fantasia is
  'Nome social (para PF) ou nome fantasia (para PJ). Coluna única que serve para ambos os tipos de pessoa.';
