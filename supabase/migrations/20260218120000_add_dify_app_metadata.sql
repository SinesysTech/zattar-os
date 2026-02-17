ALTER TABLE public.dify_apps
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS metadata_updated_at timestamptz;
