-- Migration: Sistema de Embeddings para RAG
-- Data: 2025-12-16
-- Descrição: Habilita pgvector e cria infraestrutura para busca semântica

-- Habilitar extensão pgvector
create extension if not exists vector;

-- Tabela unificada de embeddings
create table if not exists public.embeddings (
  id bigint generated always as identity primary key,

  -- Conteúdo e vetor
  content text not null,
  embedding vector(1536),  -- OpenAI text-embedding-3-small

  -- Contexto da entidade
  entity_type text not null check (entity_type in (
    'documento', 'processo_peca', 'processo_andamento',
    'contrato', 'expediente', 'assinatura_digital'
  )),
  entity_id bigint not null,
  parent_id bigint,  -- Ex: processo_id para peças

  -- Metadados flexíveis
  metadata jsonb default '{}'::jsonb,

  -- Auditoria
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  indexed_by bigint references public.usuarios(id) on delete set null
);

-- Índice HNSW para busca vetorial ultra-rápida
create index idx_embeddings_vector_cosine
  on public.embeddings
  using hnsw (embedding vector_cosine_ops);

-- Índices para filtragem pré-busca (pre-filtering)
create index idx_embeddings_entity_type_id
  on public.embeddings (entity_type, entity_id);
create index idx_embeddings_parent_id
  on public.embeddings (parent_id);
create index idx_embeddings_metadata_gin
  on public.embeddings using gin (metadata);
create index idx_embeddings_created_at
  on public.embeddings (created_at);

-- RLS
alter table public.embeddings enable row level security;

create policy "service role full access - embeddings"
  on public.embeddings for all
  to service_role
  using (true) with check (true);

-- Função RPC de busca semântica
create or replace function match_embeddings (
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5,
  filter_entity_type text default null,
  filter_parent_id bigint default null,
  filter_metadata jsonb default null
)
returns table (
  id bigint,
  content text,
  entity_type text,
  entity_id bigint,
  parent_id bigint,
  metadata jsonb,
  similarity float
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select
    e.id,
    e.content,
    e.entity_type,
    e.entity_id,
    e.parent_id,
    e.metadata,
    1 - (e.embedding <=> query_embedding) as similarity
  from public.embeddings e
  where
    1 - (e.embedding <=> query_embedding) > match_threshold
    and (filter_entity_type is null or e.entity_type = filter_entity_type)
    and (filter_parent_id is null or e.parent_id = filter_parent_id)
    and (filter_metadata is null or e.metadata @> filter_metadata)
  order by e.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Comentários para documentação
comment on table public.embeddings is 'Armazena embeddings vetoriais para busca semântica RAG';
comment on column public.embeddings.embedding is 'Vetor de 1536 dimensões gerado pelo OpenAI text-embedding-3-small';
comment on column public.embeddings.entity_type is 'Tipo da entidade origem: documento, processo_peca, etc';
comment on column public.embeddings.parent_id is 'ID do pai (ex: processo_id para peças de processo)';
comment on function match_embeddings is 'Busca semântica usando similaridade de cosseno com filtros opcionais';
