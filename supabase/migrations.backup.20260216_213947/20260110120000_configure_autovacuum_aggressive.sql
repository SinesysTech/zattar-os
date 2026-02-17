-- ============================================================================
-- Migration: Configuração Agressiva de Autovacuum
-- Created: 2026-01-10
-- Description: Configura autovacuum mais agressivo em tabelas críticas
--              para reduzir bloat e melhorar performance de Disk I/O
-- Related: Disk IO Budget optimization (Phase 7 - VACUUM Maintenance)
-- ============================================================================

-- Tabela: notificacoes (alta frequência de updates - marcação como lida)
alter table public.notificacoes set (
  autovacuum_vacuum_scale_factor = 0.1,  -- Default: 0.2 (vacuum quando 10% dead tuples)
  autovacuum_analyze_scale_factor = 0.05 -- Default: 0.1 (analyze quando 5% mudanças)
);

comment on table public.notificacoes is 
  'Autovacuum agressivo: vacuum a cada 10% dead tuples (alta frequência de updates)';

-- Tabela: mensagens_chat (alta frequência de inserts)
alter table public.mensagens_chat set (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

comment on table public.mensagens_chat is 
  'Autovacuum agressivo: vacuum a cada 10% dead tuples (alta frequência de inserts)';

-- Tabela: embeddings_conhecimento (alta frequência de updates durante reindexação)
alter table public.embeddings_conhecimento set (
  autovacuum_vacuum_scale_factor = 0.15, -- Menos agressivo (reindexação é batch)
  autovacuum_analyze_scale_factor = 0.1
);

comment on table public.embeddings_conhecimento is 
  'Autovacuum moderado: vacuum a cada 15% dead tuples (reindexação em batches)';

-- Tabela: embeddings (similar a embeddings_conhecimento)
alter table public.embeddings set (
  autovacuum_vacuum_scale_factor = 0.15,
  autovacuum_analyze_scale_factor = 0.1
);

comment on table public.embeddings is 
  'Autovacuum moderado: vacuum a cada 15% dead tuples (reindexação em batches)';

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Para verificar configurações de autovacuum:
-- select relname, reloptions
-- from pg_class
-- where relname in ('notificacoes', 'mensagens_chat', 'embeddings_conhecimento', 'embeddings')
--   and relkind = 'r';
