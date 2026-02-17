-- Description: Ensure mensagens_chat is compatible with Supabase Realtime delivery
--
-- This migration is a safety net for environments where Realtime publication
-- or replica identity settings were not applied.
--
-- 1) REPLICA IDENTITY FULL helps Realtime emit full row data for UPDATE/DELETE.
-- 2) Ensure the table is included in supabase_realtime publication.

-- 1) Replica identity
ALTER TABLE public.mensagens_chat REPLICA IDENTITY FULL;

-- 2) Publication membership (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'mensagens_chat'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens_chat;
    RAISE NOTICE 'Tabela mensagens_chat adicionada à publicação supabase_realtime';
  ELSE
    RAISE NOTICE 'Tabela mensagens_chat já está na publicação supabase_realtime';
  END IF;
END $$;

COMMENT ON TABLE public.mensagens_chat IS 'Mensagens de chat. REPLICA IDENTITY FULL habilitado para compatibilidade com Supabase Realtime.';
