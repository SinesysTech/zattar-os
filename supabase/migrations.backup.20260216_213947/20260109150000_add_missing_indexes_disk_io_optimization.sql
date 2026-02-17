-- ============================================================================
-- Migration: Otimização de Disk I/O - Índices Faltantes
-- Created: 2026-01-09
-- Description: Adiciona índices em colunas frequentemente filtradas para
--              reduzir sequential scans e melhorar performance de queries
-- Related: Disk IO Budget optimization (Phase 5)
-- ============================================================================

-- ============================================================================
-- ÍNDICES PARA TABELA acervo
-- ============================================================================

-- Índice para filtro por data_proxima_audiencia
-- Usado em: src/features/acervo/repository.ts (linhas 141-153, 288-300)
-- Query pattern: .gte('data_proxima_audiencia', ...) / .lte(...)
create index concurrently if not exists idx_acervo_data_proxima_audiencia
  on public.acervo(data_proxima_audiencia)
  where data_proxima_audiencia is not null;

comment on index idx_acervo_data_proxima_audiencia is 
  'Otimiza filtros por data de próxima audiência (partial index - apenas registros com audiência agendada)';

-- Índice para filtro por codigo_status_processo
-- Usado em: src/features/acervo/repository.ts (linhas 109, 255, 511)
-- Query pattern: .eq('codigo_status_processo', ...)
create index concurrently if not exists idx_acervo_codigo_status
  on public.acervo(codigo_status_processo);

comment on index idx_acervo_codigo_status is 
  'Otimiza filtros por status do processo (ex: ativo, arquivado, suspenso)';

-- Índice para filtro por data_autuacao
-- Usado em: src/features/acervo/repository.ts (linhas 125-131, 272-278, 528-534)
-- Query pattern: .gte('data_autuacao', ...) / .lte(...)
create index concurrently if not exists idx_acervo_data_autuacao
  on public.acervo(data_autuacao);

comment on index idx_acervo_data_autuacao is 
  'Otimiza filtros e ordenação por data de autuação do processo';

-- ============================================================================
-- ÍNDICES PARA TABELA audiencias
-- ============================================================================

-- Índice para filtro e ordenação por data_audiencia
-- Query pattern: .gte('data_audiencia', ...) / .lte(...) / .order('data_audiencia', ...)
create index concurrently if not exists idx_audiencias_data_audiencia
  on public.audiencias(data_audiencia);

comment on index idx_audiencias_data_audiencia is 
  'Otimiza filtros e ordenação por data da audiência';

-- Índice para filtro por tipo_audiencia
-- Query pattern: .eq('tipo_audiencia', ...)
create index concurrently if not exists idx_audiencias_tipo
  on public.audiencias(tipo_audiencia);

comment on index idx_audiencias_tipo is 
  'Otimiza filtros por tipo de audiência (ex: inicial, instrução, conciliação)';

-- ============================================================================
-- ÍNDICE COMPOSTO PARA TABELA mensagens_chat
-- ============================================================================

-- Índice composto para queries de mensagens por sala ordenadas por data
-- Usado em: src/features/chat/repositories/messages-repository.ts (linhas 60-68, 115-118)
-- Query pattern: .eq('sala_id', ...).order('created_at', ...)
-- NOTA: Substitui o índice simples idx_mensagens_chat_created_at para melhor performance
create index concurrently if not exists idx_mensagens_chat_sala_created
  on public.mensagens_chat(sala_id, created_at desc);

comment on index idx_mensagens_chat_sala_created is 
  'Otimiza queries de mensagens por sala com ordenação cronológica (substitui idx_mensagens_chat_created_at)';

-- ============================================================================
-- ÍNDICES ADICIONAIS REQUERIDOS PELO USUÁRIO
-- ============================================================================

-- Índice parcial para filtro por responsavel_id
-- Query pattern: .eq('responsavel_id', ...) / not null
create index concurrently if not exists idx_acervo_responsavel_id
  on public.acervo(responsavel_id)
  where responsavel_id is not null;

comment on index idx_acervo_responsavel_id is 
  'Otimiza buscas por responsável em acervo (partial index - apenas registros com responsável)';

-- Índice composto parcial para notificacoes por usuário com lida = false
-- Query pattern: .eq('usuario_id', ...).eq('lida', false)
create index concurrently if not exists idx_notificacoes_usuario_lida
  on public.notificacoes(usuario_id, lida)
  where lida = false;

comment on index idx_notificacoes_usuario_lida is 
  'Otimiza notificações não lidas por usuário (partial index em lida = false)';

-- Índice composto para embeddings por entidade
-- Query pattern: .eq('entity_type', ...).eq('entity_id', ...)
create index concurrently if not exists idx_embeddings_entity
  on public.embeddings(entity_type, entity_id);

comment on index idx_embeddings_entity is 
  'Otimiza consultas de embeddings por entidade (tipo + id)';

-- ============================================================================
-- LIMPEZA (OPCIONAL)
-- ============================================================================

-- Remover índice simples created_at se o composto for criado com sucesso
-- IMPORTANTE: Executar apenas após verificar que o índice composto foi criado
-- drop index concurrently if exists idx_mensagens_chat_created_at;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Para verificar os índices criados, execute:
-- select schemaname, tablename, indexname, indexdef
-- from pg_indexes
-- where tablename in ('acervo', 'audiencias', 'mensagens_chat', 'notificacoes', 'embeddings')
--   and indexname like 'idx_%'
-- order by tablename, indexname;
