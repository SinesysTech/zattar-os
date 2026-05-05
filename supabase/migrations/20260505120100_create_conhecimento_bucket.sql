-- Bucket privado para arquivos de bases de conhecimento
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'conhecimento',
  'conhecimento',
  false,
  52428800,  -- 50 MB
  array[
    'text/plain',
    'text/markdown',
    'text/html',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Policies: apenas service_role lê/escreve. UI gera signed URLs via Server Action.
create policy "service_role full - conhecimento bucket"
  on storage.objects for all
  to service_role
  using (bucket_id = 'conhecimento')
  with check (bucket_id = 'conhecimento');
