-- Criação do bucket para arquivos do chat
-- Data: 2025-12-05
-- Descrição: Bucket para armazenar arquivos enviados no chat (documentos, imagens, áudios, vídeos)

-- Inserir o bucket se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files',
  'chat-files',
  true, -- bucket público para acesso direto aos arquivos
  52428800, -- 50MB limite por arquivo
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'video/mp4',
    'video/webm',
    'video/ogg'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas RLS para o bucket chat-files

-- Permitir upload para usuários autenticados
CREATE POLICY "Authenticated users can upload chat files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chat-files');

-- Permitir leitura para todos (anon e authenticated)
CREATE POLICY "Everyone can view chat files"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'chat-files');

-- Permitir que o criador do arquivo possa deletar
CREATE POLICY "Users can delete their own chat files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Função para gerar nomes únicos de arquivos
CREATE OR REPLACE FUNCTION generate_unique_chat_filename(original_name text)
RETURNS text AS $$
DECLARE
  extension text;
  timestamp bigint;
  random_id text;
  new_filename text;
BEGIN
  -- Extrair extensão
  extension := split_part(original_name, '.', -1);
  
  -- Gerar timestamp e ID aleatório
  timestamp := extract(epoch from now())::bigint * 1000;
  random_id := encode(gen_random_bytes(8), 'hex');
  
  -- Construir novo nome
  new_filename := timestamp || '-' || random_id || '.' || extension;
  
  RETURN new_filename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;