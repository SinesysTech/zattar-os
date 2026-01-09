-- Tabela de fila para indexação assíncrona
create table if not exists public.documentos_pendentes_indexacao (
  id bigserial primary key,
  tipo text not null check (tipo in ('processo', 'audiencia', 'documento', 'contrato', 'outro')),
  entity_id bigint not null,
  texto text not null,
  metadata jsonb default '{}'::jsonb,
  tentativas int default 0,
  ultimo_erro text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índices para performance
create index if not exists idx_documentos_pendentes_created on public.documentos_pendentes_indexacao(created_at);
create index if not exists idx_documentos_pendentes_tipo on public.documentos_pendentes_indexacao(tipo);

-- RLS (apenas service role pode acessar)
alter table public.documentos_pendentes_indexacao enable row level security;

create policy if not exists "Service role only"
  on public.documentos_pendentes_indexacao
  for all
  using (auth.role() = 'service_role');

comment on table public.documentos_pendentes_indexacao is 'Fila de documentos aguardando indexação AI/RAG';
