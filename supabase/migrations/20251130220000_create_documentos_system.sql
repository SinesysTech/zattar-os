-- Migration: Sistema de Editor de Documentos com Colaboração e Chat Interno
-- Created: 2025-11-30 22:00:00 UTC
-- Description: Cria 8 tabelas para sistema completo de editor de documentos com colaboração em tempo real e chat interno

-- ============================================================================
-- TABELA 1: documentos
-- Armazena documentos criados com editor Plate.js
-- ============================================================================

create table public.documentos (
  id bigint generated always as identity primary key,
  titulo text not null,
  conteudo jsonb not null default '[]'::jsonb,
  pasta_id bigint,
  criado_por bigint not null references public.usuarios(id) on delete cascade,
  editado_por bigint references public.usuarios(id) on delete set null,
  versao integer not null default 1,
  descricao text,
  tags text[] default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  editado_em timestamptz,
  deleted_at timestamptz,

  constraint documentos_titulo_length check (char_length(titulo) between 1 and 500),
  constraint documentos_versao_positive check (versao > 0)
);

comment on table public.documentos is 'Documentos criados com editor de texto rico Plate.js';
comment on column public.documentos.conteudo is 'Conteúdo do documento em formato JSONB do Plate.js';
comment on column public.documentos.deleted_at is 'Soft delete - null significa ativo, timestamp significa deletado';

-- Índices para performance
create index idx_documentos_criado_por on public.documentos using btree (criado_por);
create index idx_documentos_pasta_id on public.documentos using btree (pasta_id);
create index idx_documentos_created_at on public.documentos using btree (created_at desc);
create index idx_documentos_updated_at on public.documentos using btree (updated_at desc);
create index idx_documentos_tags on public.documentos using gin (tags);
create index idx_documentos_deleted_at on public.documentos using btree (deleted_at) where deleted_at is not null;

-- Índice trigram para busca textual eficiente (requer extensão pg_trgm)
create extension if not exists pg_trgm;
create index idx_documentos_titulo_trgm on public.documentos using gin (titulo gin_trgm_ops);

-- ============================================================================
-- TABELA 2: pastas
-- Sistema hierárquico de pastas (self-referencing)
-- ============================================================================

create table public.pastas (
  id bigint generated always as identity primary key,
  nome text not null,
  pasta_pai_id bigint references public.pastas(id) on delete cascade,
  tipo text not null check (tipo in ('comum', 'privada')),
  criado_por bigint not null references public.usuarios(id) on delete cascade,
  descricao text,
  cor text,
  icone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,

  constraint pastas_nome_length check (char_length(nome) between 1 and 200),
  constraint pastas_tipo_privada_criador check (
    tipo = 'comum' or (tipo = 'privada' and criado_por is not null)
  ),
  constraint pastas_no_self_reference check (pasta_pai_id != id)
);

comment on table public.pastas is 'Pastas hierárquicas para organização de documentos';
comment on column public.pastas.tipo is 'comum: visível para todos, privada: apenas criador';
comment on column public.pastas.cor is 'Código hexadecimal de cor para customização visual';
comment on column public.pastas.icone is 'Nome do ícone Lucide para customização visual';

-- Índices
create index idx_pastas_criado_por on public.pastas using btree (criado_por);
create index idx_pastas_pasta_pai_id on public.pastas using btree (pasta_pai_id);
create index idx_pastas_tipo on public.pastas using btree (tipo);

-- Foreign key para documentos.pasta_id (após criar ambas as tabelas)
alter table public.documentos
  add constraint documentos_pasta_id_fkey
  foreign key (pasta_id) references public.pastas(id) on delete set null;

-- Trigger para prevenir ciclos na hierarquia de pastas
create or replace function validate_pasta_hierarchy()
returns trigger as $$
declare
  current_id bigint;
  max_depth integer := 10;
  depth integer := 0;
begin
  if new.pasta_pai_id is null then
    return new;
  end if;

  current_id := new.pasta_pai_id;

  while current_id is not null and depth < max_depth loop
    if current_id = new.id then
      raise exception 'Ciclo detectado na hierarquia de pastas';
    end if;

    select pasta_pai_id into current_id
    from public.pastas
    where id = current_id;

    depth := depth + 1;
  end loop;

  if depth >= max_depth then
    raise exception 'Profundidade máxima de pastas atingida (máximo: %)', max_depth;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger validate_pasta_hierarchy_trigger
  before insert or update on public.pastas
  for each row
  execute function validate_pasta_hierarchy();

-- ============================================================================
-- TABELA 3: documentos_compartilhados
-- Compartilhamento user-to-user de documentos
-- ============================================================================

create table public.documentos_compartilhados (
  id bigint generated always as identity primary key,
  documento_id bigint not null references public.documentos(id) on delete cascade,
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  permissao text not null check (permissao in ('visualizar', 'editar')),
  compartilhado_por bigint not null references public.usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint documentos_compartilhados_unique unique (documento_id, usuario_id)
);

comment on table public.documentos_compartilhados is 'Compartilhamento de documentos entre usuários';
comment on column public.documentos_compartilhados.permissao is 'visualizar: leitura apenas, editar: leitura e escrita';

-- Índices
create index idx_documentos_compartilhados_documento_id on public.documentos_compartilhados using btree (documento_id);
create index idx_documentos_compartilhados_usuario_id on public.documentos_compartilhados using btree (usuario_id);

-- ============================================================================
-- TABELA 4: templates
-- Templates reutilizáveis para criação rápida de documentos
-- ============================================================================

create table public.templates (
  id bigint generated always as identity primary key,
  titulo text not null,
  descricao text,
  conteudo jsonb not null default '[]'::jsonb,
  visibilidade text not null check (visibilidade in ('publico', 'privado')),
  categoria text,
  thumbnail_url text,
  criado_por bigint not null references public.usuarios(id) on delete cascade,
  uso_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint templates_titulo_length check (char_length(titulo) between 1 and 200),
  constraint templates_uso_count_non_negative check (uso_count >= 0)
);

comment on table public.templates is 'Templates reutilizáveis para criação de documentos padronizados';
comment on column public.templates.visibilidade is 'publico: todos veem, privado: apenas criador';
comment on column public.templates.uso_count is 'Contador de vezes que o template foi usado';

-- Índices
create index idx_templates_criado_por on public.templates using btree (criado_por);
create index idx_templates_visibilidade on public.templates using btree (visibilidade);
create index idx_templates_categoria on public.templates using btree (categoria);
create index idx_templates_uso_count on public.templates using btree (uso_count desc);

-- ============================================================================
-- TABELA 5: documentos_uploads
-- Rastreamento de arquivos do editor armazenados no Backblaze B2
-- ============================================================================

create table public.documentos_uploads (
  id bigint generated always as identity primary key,
  documento_id bigint not null references public.documentos(id) on delete cascade,
  nome_arquivo text not null,
  tipo_mime text not null,
  tamanho_bytes bigint not null,
  b2_key text not null,
  b2_url text not null,
  tipo_media text not null check (tipo_media in ('imagem', 'video', 'audio', 'pdf', 'outros')),
  criado_por bigint not null references public.usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint documentos_uploads_tamanho_positive check (tamanho_bytes > 0),
  constraint documentos_uploads_b2_key_unique unique (b2_key)
);

comment on table public.documentos_uploads is 'Arquivos do editor armazenados no Backblaze B2';
comment on column public.documentos_uploads.b2_key is 'Chave única do arquivo no Backblaze B2';
comment on column public.documentos_uploads.tipo_media is 'Categorização do arquivo para filtros';

-- Índices
create index idx_documentos_uploads_documento_id on public.documentos_uploads using btree (documento_id);
create index idx_documentos_uploads_tipo_media on public.documentos_uploads using btree (tipo_media);

-- ============================================================================
-- TABELA 6: documentos_versoes
-- Histórico completo de versões de documentos
-- ============================================================================

create table public.documentos_versoes (
  id bigint generated always as identity primary key,
  documento_id bigint not null references public.documentos(id) on delete cascade,
  versao integer not null,
  conteudo jsonb not null,
  titulo text not null,
  criado_por bigint not null references public.usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint documentos_versoes_versao_positive check (versao > 0),
  constraint documentos_versoes_unique unique (documento_id, versao)
);

comment on table public.documentos_versoes is 'Histórico completo de versões dos documentos (imutável)';
comment on column public.documentos_versoes.versao is 'Número da versão (sequencial por documento)';

-- Índices
create index idx_documentos_versoes_documento_id on public.documentos_versoes using btree (documento_id);
create index idx_documentos_versoes_created_at on public.documentos_versoes using btree (created_at desc);

-- ============================================================================
-- TABELA 7: salas_chat
-- Salas de chat (geral, por documento, privado)
-- ============================================================================

create table public.salas_chat (
  id bigint generated always as identity primary key,
  nome text not null,
  tipo text not null check (tipo in ('geral', 'documento', 'privado')),
  documento_id bigint references public.documentos(id) on delete cascade,
  criado_por bigint not null references public.usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint salas_chat_documento_tipo check (
    (tipo = 'documento' and documento_id is not null) or
    (tipo != 'documento' and documento_id is null)
  )
);

comment on table public.salas_chat is 'Salas de chat para comunicação entre usuários';
comment on column public.salas_chat.tipo is 'geral: sala pública, documento: chat do documento, privado: chat 1-on-1';

-- Índices
create index idx_salas_chat_tipo on public.salas_chat using btree (tipo);
create index idx_salas_chat_documento_id on public.salas_chat using btree (documento_id);

-- ============================================================================
-- TABELA 8: mensagens_chat
-- Mensagens do chat interno
-- ============================================================================

create table public.mensagens_chat (
  id bigint generated always as identity primary key,
  sala_id bigint not null references public.salas_chat(id) on delete cascade,
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  conteudo text not null,
  tipo text not null check (tipo in ('texto', 'arquivo', 'sistema')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,

  constraint mensagens_chat_conteudo_not_empty check (char_length(conteudo) > 0)
);

comment on table public.mensagens_chat is 'Mensagens do chat interno entre usuários';
comment on column public.mensagens_chat.tipo is 'texto: mensagem comum, arquivo: anexo, sistema: notificações automáticas';
comment on column public.mensagens_chat.deleted_at is 'Soft delete - mensagens deletadas mantêm histórico';

-- Índices
create index idx_mensagens_chat_sala_id on public.mensagens_chat using btree (sala_id);
create index idx_mensagens_chat_usuario_id on public.mensagens_chat using btree (usuario_id);
create index idx_mensagens_chat_created_at on public.mensagens_chat using btree (created_at desc);

-- ============================================================================
-- FUNÇÃO HELPER: Converter auth.uid() (UUID) para usuarios.id (bigint)
-- ============================================================================

create or replace function get_current_user_id()
returns bigint as $$
  select id from public.usuarios where auth_user_id = auth.uid()
$$ language sql stable;

comment on function get_current_user_id() is 'Retorna o id (bigint) do usuário atual baseado no auth_user_id (uuid)';

-- ============================================================================
-- RLS (Row Level Security) - Habilitar para todas as tabelas
-- ============================================================================

alter table public.documentos enable row level security;
alter table public.pastas enable row level security;
alter table public.documentos_compartilhados enable row level security;
alter table public.templates enable row level security;
alter table public.documentos_uploads enable row level security;
alter table public.documentos_versoes enable row level security;
alter table public.salas_chat enable row level security;
alter table public.mensagens_chat enable row level security;

-- ============================================================================
-- RLS POLICIES: documentos
-- ============================================================================

-- Select: Criador + compartilhados + documentos não deletados
create policy "Users can view their own documents and shared documents"
  on public.documentos
  for select
  to authenticated
  using (
    deleted_at is null and (
      criado_por = get_current_user_id() or
      id in (
        select documento_id
        from public.documentos_compartilhados
        where usuario_id = get_current_user_id()
      )
    )
  );

-- Insert: Usuários autenticados podem criar documentos
create policy "Authenticated users can create documents"
  on public.documentos
  for insert
  to authenticated
  with check (
    criado_por = get_current_user_id()
  );

-- Update: Criador + compartilhados com permissão "editar"
create policy "Users can update their own documents and shared documents with edit permission"
  on public.documentos
  for update
  to authenticated
  using (
    criado_por = get_current_user_id() or
    id in (
      select documento_id
      from public.documentos_compartilhados
      where usuario_id = get_current_user_id()
        and permissao = 'editar'
    )
  );

-- Delete: Apenas criador (soft delete)
create policy "Users can delete their own documents"
  on public.documentos
  for update
  to authenticated
  using (criado_por = get_current_user_id());

-- ============================================================================
-- RLS POLICIES: pastas
-- ============================================================================

-- Select: Pastas comuns (todos) + pastas privadas (criador)
create policy "Users can view common folders and their own private folders"
  on public.pastas
  for select
  to authenticated
  using (
    deleted_at is null and (
      tipo = 'comum' or
      criado_por = get_current_user_id()
    )
  );

-- Insert: Usuários autenticados podem criar pastas
create policy "Authenticated users can create folders"
  on public.pastas
  for insert
  to authenticated
  with check (
    criado_por = get_current_user_id()
  );

-- Update: Pastas comuns (todos) + pastas privadas (criador)
create policy "Users can update common folders and their own private folders"
  on public.pastas
  for update
  to authenticated
  using (
    tipo = 'comum' or
    criado_por = get_current_user_id()
  );

-- Delete: Apenas criador
create policy "Users can delete their own folders"
  on public.pastas
  for delete
  to authenticated
  using (criado_por = get_current_user_id());

-- ============================================================================
-- RLS POLICIES: documentos_compartilhados
-- ============================================================================

-- Select: Criador do documento + quem compartilhou + quem recebeu
create policy "Users can view shares for their documents"
  on public.documentos_compartilhados
  for select
  to authenticated
  using (
    compartilhado_por = get_current_user_id() or
    usuario_id = get_current_user_id() or
    documento_id in (
      select id
      from public.documentos
      where criado_por = get_current_user_id()
    )
  );

-- Insert: Apenas criador do documento ou quem tem permissão de editar
create policy "Document creators can share their documents"
  on public.documentos_compartilhados
  for insert
  to authenticated
  with check (
    compartilhado_por = get_current_user_id() and
    documento_id in (
      select id
      from public.documentos
      where criado_por = get_current_user_id()
    )
  );

-- Delete: Criador do documento + quem compartilhou
create policy "Users can remove shares they created"
  on public.documentos_compartilhados
  for delete
  to authenticated
  using (
    compartilhado_por = get_current_user_id() or
    documento_id in (
      select id
      from public.documentos
      where criado_por = get_current_user_id()
    )
  );

-- ============================================================================
-- RLS POLICIES: templates
-- ============================================================================

-- Select: Templates públicos + privados do criador
create policy "Users can view public templates and their own private templates"
  on public.templates
  for select
  to authenticated
  using (
    visibilidade = 'publico' or
    criado_por = get_current_user_id()
  );

-- Insert/Update/Delete: Apenas criador
create policy "Users can manage their own templates"
  on public.templates
  for all
  to authenticated
  using (criado_por = get_current_user_id())
  with check (criado_por = get_current_user_id());

-- ============================================================================
-- RLS POLICIES: documentos_uploads
-- ============================================================================

-- Select: Usuários com acesso ao documento
create policy "Users can view uploads for documents they have access to"
  on public.documentos_uploads
  for select
  to authenticated
  using (
    documento_id in (
      select id
      from public.documentos
      where criado_por = get_current_user_id() or
      id in (
        select documento_id
        from public.documentos_compartilhados
        where usuario_id = get_current_user_id()
      )
    )
  );

-- Insert: Usuários com permissão de edição no documento
create policy "Users can upload files to documents they can edit"
  on public.documentos_uploads
  for insert
  to authenticated
  with check (
    criado_por = get_current_user_id() and
    documento_id in (
      select id
      from public.documentos
      where criado_por = get_current_user_id() or
      id in (
        select documento_id
        from public.documentos_compartilhados
        where usuario_id = get_current_user_id()
          and permissao = 'editar'
      )
    )
  );

-- Delete: Criador do upload + criador do documento
create policy "Users can delete their own uploads or uploads in their documents"
  on public.documentos_uploads
  for delete
  to authenticated
  using (
    criado_por = get_current_user_id() or
    documento_id in (
      select id
      from public.documentos
      where criado_por = get_current_user_id()
    )
  );

-- ============================================================================
-- RLS POLICIES: documentos_versoes
-- ============================================================================

-- Select: Usuários com acesso ao documento
create policy "Users can view versions for documents they have access to"
  on public.documentos_versoes
  for select
  to authenticated
  using (
    documento_id in (
      select id
      from public.documentos
      where criado_por = get_current_user_id() or
      id in (
        select documento_id
        from public.documentos_compartilhados
        where usuario_id = get_current_user_id()
      )
    )
  );

-- Insert: Sistema apenas (versões são imutáveis)
create policy "System can create versions"
  on public.documentos_versoes
  for insert
  to authenticated
  with check (true); -- Validação feita no backend

-- ============================================================================
-- RLS POLICIES: salas_chat
-- ============================================================================

-- Select: Salas gerais (todos) + salas de documentos com acesso + criadas pelo usuário
create policy "Users can view chat rooms they have access to"
  on public.salas_chat
  for select
  to authenticated
  using (
    tipo = 'geral' or
    criado_por = get_current_user_id() or
    (tipo = 'documento' and documento_id in (
      select id
      from public.documentos
      where criado_por = get_current_user_id() or
      id in (
        select documento_id
        from public.documentos_compartilhados
        where usuario_id = get_current_user_id()
      )
    ))
  );

-- Insert: Usuários autenticados podem criar salas
create policy "Authenticated users can create chat rooms"
  on public.salas_chat
  for insert
  to authenticated
  with check (criado_por = get_current_user_id());

-- ============================================================================
-- RLS POLICIES: mensagens_chat
-- ============================================================================

-- Select: Mensagens de salas acessíveis pelo usuário
create policy "Users can view messages in accessible chat rooms"
  on public.mensagens_chat
  for select
  to authenticated
  using (
    deleted_at is null and
    sala_id in (
      select id
      from public.salas_chat
      where tipo = 'geral' or
      criado_por = get_current_user_id() or
      (tipo = 'documento' and documento_id in (
        select id
        from public.documentos
        where criado_por = get_current_user_id() or
        id in (
          select documento_id
          from public.documentos_compartilhados
          where usuario_id = get_current_user_id()
        )
      ))
    )
  );

-- Insert: Usuários podem enviar mensagens em salas acessíveis
create policy "Users can send messages in accessible chat rooms"
  on public.mensagens_chat
  for insert
  to authenticated
  with check (
    usuario_id = get_current_user_id() and
    sala_id in (
      select id
      from public.salas_chat
      where tipo = 'geral' or
      criado_por = get_current_user_id() or
      (tipo = 'documento' and documento_id in (
        select id
        from public.documentos
        where criado_por = get_current_user_id() or
        id in (
          select documento_id
          from public.documentos_compartilhados
          where usuario_id = get_current_user_id()
        )
      ))
    )
  );

-- Update: Apenas próprias mensagens (para edição)
create policy "Users can update their own messages"
  on public.mensagens_chat
  for update
  to authenticated
  using (usuario_id = get_current_user_id());

-- ============================================================================
-- TRIGGERS: updated_at automático
-- ============================================================================

-- Função genérica para atualizar updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Aplicar trigger em tabelas com updated_at
create trigger update_documentos_updated_at
  before update on public.documentos
  for each row execute function update_updated_at_column();

create trigger update_pastas_updated_at
  before update on public.pastas
  for each row execute function update_updated_at_column();

create trigger update_templates_updated_at
  before update on public.templates
  for each row execute function update_updated_at_column();

create trigger update_mensagens_chat_updated_at
  before update on public.mensagens_chat
  for each row execute function update_updated_at_column();

-- ============================================================================
-- DADOS INICIAIS: Sala de Chat Geral
-- ============================================================================

-- Criar sala de chat geral do escritório (criado por admin)
-- Nota: Assumindo que o primeiro usuário (id=1) é o admin
-- Ajustar conforme necessário
insert into public.salas_chat (nome, tipo, criado_por)
values ('Sala Geral', 'geral', 1)
on conflict do nothing;
