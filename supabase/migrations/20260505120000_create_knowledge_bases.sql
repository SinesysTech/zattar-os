-- ============================================================================
-- Tabelas: knowledge_bases / knowledge_documents / knowledge_chunks
-- Loja vetorial de bases de conhecimento (jurisprudências, doutrina, modelos)
-- Subsistema independente do schema 38_embeddings.sql
-- ============================================================================

-- pgvector já habilitado pelo schema 38
create extension if not exists vector;

-- Coleções de conhecimento
create table if not exists public.knowledge_bases (
  id bigint generated always as identity primary key,
  nome text not null,
  slug text not null unique,
  descricao text,
  cor text,
  icone text,
  total_documentos int not null default 0,
  total_chunks int not null default 0,
  created_by bigint references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Documentos (1 arquivo = 1 documento)
create table if not exists public.knowledge_documents (
  id bigint generated always as identity primary key,
  base_id bigint not null references public.knowledge_bases(id) on delete cascade,
  nome text not null,
  arquivo_path text not null,
  arquivo_tipo text not null check (arquivo_tipo in ('txt','md','html','pdf','docx')),
  arquivo_tamanho_bytes bigint not null,
  texto_extraido text,
  total_chunks int not null default 0,
  status text not null default 'pending'
    check (status in ('pending','processing','indexed','failed')),
  ultimo_erro text,
  tentativas int not null default 0,
  metadata jsonb default '{}'::jsonb,
  created_by bigint references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  indexed_at timestamptz
);

-- Chunks vetorizados
create table if not exists public.knowledge_chunks (
  id bigint generated always as identity primary key,
  document_id bigint not null references public.knowledge_documents(id) on delete cascade,
  base_id bigint not null references public.knowledge_bases(id) on delete cascade,
  posicao int not null,
  conteudo text not null,
  embedding vector(1536),
  tokens int,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Índices
create index if not exists idx_knowledge_chunks_vector
  on public.knowledge_chunks using hnsw (embedding vector_cosine_ops);
create index if not exists idx_knowledge_chunks_base
  on public.knowledge_chunks (base_id);
create index if not exists idx_knowledge_chunks_doc
  on public.knowledge_chunks (document_id);
create index if not exists idx_knowledge_documents_status
  on public.knowledge_documents (status)
  where status in ('pending','failed');
create index if not exists idx_knowledge_documents_base
  on public.knowledge_documents (base_id);

-- Trigger: atualizar contadores denormalizados em knowledge_bases
create or replace function public.tg_atualizar_contadores_base() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_base_id bigint;
begin
  v_base_id := coalesce(NEW.base_id, OLD.base_id);
  update public.knowledge_bases b set
    total_documentos = (
      select count(*) from public.knowledge_documents
      where base_id = b.id and status = 'indexed'
    ),
    total_chunks = (
      select count(*) from public.knowledge_chunks
      where base_id = b.id
    ),
    updated_at = now()
  where b.id = v_base_id;
  return coalesce(NEW, OLD);
end; $$;

drop trigger if exists tg_documents_contadores on public.knowledge_documents;
create trigger tg_documents_contadores
  after insert or update or delete on public.knowledge_documents
  for each row execute function public.tg_atualizar_contadores_base();

drop trigger if exists tg_chunks_contadores on public.knowledge_chunks;
create trigger tg_chunks_contadores
  after insert or delete on public.knowledge_chunks
  for each row execute function public.tg_atualizar_contadores_base();

-- RLS
alter table public.knowledge_bases enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;

-- service_role: full
create policy "service_role full - knowledge_bases" on public.knowledge_bases
  for all to service_role using (true) with check (true);
create policy "service_role full - knowledge_documents" on public.knowledge_documents
  for all to service_role using (true) with check (true);
create policy "service_role full - knowledge_chunks" on public.knowledge_chunks
  for all to service_role using (true) with check (true);

-- authenticated read em bases e documents
create policy "authenticated read - knowledge_bases" on public.knowledge_bases
  for select to authenticated using (true);
create policy "authenticated read - knowledge_documents" on public.knowledge_documents
  for select to authenticated using (true);

-- super_admin write em bases e documents
create policy "super_admin write - knowledge_bases" on public.knowledge_bases
  for all to authenticated
  using ((select is_super_admin from public.usuarios where id = (select auth.uid())::bigint))
  with check ((select is_super_admin from public.usuarios where id = (select auth.uid())::bigint));
create policy "super_admin write - knowledge_documents" on public.knowledge_documents
  for all to authenticated
  using ((select is_super_admin from public.usuarios where id = (select auth.uid())::bigint))
  with check ((select is_super_admin from public.usuarios where id = (select auth.uid())::bigint));

-- knowledge_chunks: SEM policy de SELECT direto. Acesso só via RPC match_knowledge (security definer).

-- RPC de busca semântica
create or replace function public.match_knowledge (
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 10,
  filter_base_ids bigint[] default null
) returns table (
  chunk_id bigint,
  conteudo text,
  similarity float,
  document_id bigint,
  document_nome text,
  base_id bigint,
  base_nome text,
  posicao int,
  metadata jsonb
)
language plpgsql security definer set search_path = '' as $$
begin
  return query
  select
    c.id as chunk_id,
    c.conteudo,
    1 - (c.embedding <=> query_embedding) as similarity,
    c.document_id,
    d.nome as document_nome,
    c.base_id,
    b.nome as base_nome,
    c.posicao,
    c.metadata
  from public.knowledge_chunks c
  join public.knowledge_documents d on d.id = c.document_id
  join public.knowledge_bases b on b.id = c.base_id
  where
    1 - (c.embedding <=> query_embedding) > match_threshold
    and (filter_base_ids is null or c.base_id = any(filter_base_ids))
    and d.status = 'indexed'
  order by c.embedding <=> query_embedding
  limit match_count;
end; $$;

grant execute on function public.match_knowledge to authenticated;
grant execute on function public.match_knowledge to service_role;

comment on table public.knowledge_bases is 'Coleções de conhecimento curadas (jurisprudência, doutrina, modelos)';
comment on table public.knowledge_documents is 'Arquivos uploadados em bases de conhecimento';
comment on table public.knowledge_chunks is 'Chunks vetorizados de documentos de conhecimento';
comment on function public.match_knowledge is 'Busca semântica nas bases de conhecimento via similaridade de cosseno';
