-- Migration: add_notificacoes_replica_identity_full
-- Description: Define REPLICA IDENTITY FULL na tabela notificacoes para compatibilidade com Realtime
--
-- O Supabase Realtime requer REPLICA IDENTITY FULL para emitir dados completos da linha
-- em eventos de INSERT, UPDATE e DELETE. Sem isso, apenas a chave primária é enviada
-- em alguns eventos.
--
-- @see https://supabase.com/docs/guides/realtime/postgres-changes#replica-identity

-- Definir REPLICA IDENTITY FULL para a tabela notificacoes
ALTER TABLE public.notificacoes REPLICA IDENTITY FULL;

-- Verificar que a tabela está na publicação supabase_realtime
-- (A publicação é gerenciada automaticamente pelo Supabase, mas garantimos a inclusão)
DO $$
BEGIN
  -- Verificar se a tabela já está na publicação
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'notificacoes'
  ) THEN
    -- Adicionar tabela à publicação se não existir
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;
    RAISE NOTICE 'Tabela notificacoes adicionada à publicação supabase_realtime';
  ELSE
    RAISE NOTICE 'Tabela notificacoes já está na publicação supabase_realtime';
  END IF;
END $$;

-- Comentário explicativo
COMMENT ON TABLE public.notificacoes IS 'Tabela de notificações do usuário. REPLICA IDENTITY FULL habilitado para Realtime.';
