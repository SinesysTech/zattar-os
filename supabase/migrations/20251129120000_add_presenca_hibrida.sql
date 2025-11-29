-- Migration: Adicionar coluna presenca_hibrida na tabela audiencias
-- Data: 2025-11-29
-- Descrição: Para audiências híbridas, indica quem comparece presencialmente (advogado ou cliente)

-- 1. Adicionar coluna presenca_hibrida
alter table public.audiencias
add column if not exists presenca_hibrida text;

-- 2. Adicionar constraint check para valores válidos
alter table public.audiencias
add constraint check_presenca_hibrida_valida
check (presenca_hibrida is null or presenca_hibrida in ('advogado', 'cliente'));

-- 3. Adicionar comentário descritivo
comment on column public.audiencias.presenca_hibrida is 
  'Para audiências híbridas: indica quem comparece presencialmente (advogado ou cliente). Null para modalidades não-híbridas.';

-- 4. Criar índice para consultas filtradas
create index if not exists idx_audiencias_presenca_hibrida 
on public.audiencias(presenca_hibrida) 
where presenca_hibrida is not null;

