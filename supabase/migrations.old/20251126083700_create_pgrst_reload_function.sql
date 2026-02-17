-- Create helper function to reload PostgREST schema cache
-- Allows calling via Supabase RPC from backend when PGRST204 occurs

CREATE OR REPLACE FUNCTION public.pgrst_reload_schema()
RETURNS void
LANGUAGE sql
AS $$
  SELECT pg_notify('pgrst', 'reload schema');
$$;

COMMENT ON FUNCTION public.pgrst_reload_schema IS 'Triggers PostgREST to reload its schema cache via NOTIFY';

