-- ============================================================================
-- Documentos e Sistema de Chat
-- ============================================================================

-- Pastas de documentos
create table if not exists public.pastas (
  id bigint generated always as identity primary key,
  nome text not null,
  tipo text not null check (tipo in ('documentos', 'templates')),
  parent_id bigint references public.pastas(id) on delete cascade,
  criado_por bigint references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.pastas is 'Pastas para organização hierárquica de documentos e templates';
comment on column public.pastas.tipo is 'Tipo da pasta: documentos (arquivos gerais) ou templates (modelos)';

create index if not exists idx_pastas_criado_por on public.pastas(criado_por);
create index if not exists idx_pastas_parent_id on public.pastas(parent_id);
create index if not exists idx_pastas_tipo on public.pastas(tipo);
create index if not exists idx_pastas_nome_trgm on public.pastas using gin(nome gin_trgm_ops);

-- Documentos
create table if not exists public.documentos (
  id bigint generated always as identity primary key,
  titulo text not null,
  conteudo jsonb not null default '[]'::jsonb,
  pasta_id bigint references public.pastas(id) on delete set null,
  criado_por bigint not null references public.usuarios(id) on delete restrict,
  editado_por bigint references public.usuarios(id) on delete set null,
  versao integer not null default 1,
  descricao text,
  tags text[] default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  editado_em timestamptz,
  deleted_at timestamptz
);

comment on table public.documentos is 'Documentos editáveis com controle de versão e soft delete';
comment on column public.documentos.conteudo is 'Conteúdo do documento em formato JSON (ex: Editor.js blocks)';
comment on column public.documentos.versao is 'Número da versão atual do documento';
comment on column public.documentos.deleted_at is 'Timestamp de remoção lógica (soft delete)';

create index if not exists idx_documentos_criado_por on public.documentos(criado_por);
create index if not exists idx_documentos_editado_por on public.documentos(editado_por);
create index if not exists idx_documentos_pasta_id on public.documentos(pasta_id);
create index if not exists idx_documentos_created_at on public.documentos(created_at);
create index if not exists idx_documentos_updated_at on public.documentos(updated_at);
create index if not exists idx_documentos_deleted_at on public.documentos(deleted_at);
create index if not exists idx_documentos_tags on public.documentos using gin(tags);
create index if not exists idx_documentos_titulo_trgm on public.documentos using gin(titulo gin_trgm_ops);
create index if not exists idx_documentos_descricao_trgm on public.documentos using gin(descricao gin_trgm_ops);

-- Versões de documentos (histórico)
create table if not exists public.documentos_versoes (
  id bigint generated always as identity primary key,
  documento_id bigint not null references public.documentos(id) on delete cascade,
  versao integer not null,
  conteudo jsonb not null,
  criado_por bigint references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(documento_id, versao)
);

comment on table public.documentos_versoes is 'Histórico de versões dos documentos';

create index if not exists idx_documentos_versoes_documento_id on public.documentos_versoes(documento_id);
create index if not exists idx_documentos_versoes_criado_por on public.documentos_versoes(criado_por);
create index if not exists idx_documentos_versoes_created_at on public.documentos_versoes(created_at);

-- Uploads anexados a documentos
create table if not exists public.documentos_uploads (
  id bigint generated always as identity primary key,
  documento_id bigint not null references public.documentos(id) on delete cascade,
  arquivo_nome text not null,
  arquivo_url text not null,
  arquivo_tamanho integer,
  tipo_media text,
  criado_por bigint references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.documentos_uploads is 'Uploads (imagens, PDFs, etc.) anexados a documentos';

create index if not exists idx_documentos_uploads_documento_id on public.documentos_uploads(documento_id);
create index if not exists idx_documentos_uploads_criado_por on public.documentos_uploads(criado_por);
create index if not exists idx_documentos_uploads_tipo_media on public.documentos_uploads(tipo_media);

-- Compartilhamento de documentos
create table if not exists public.documentos_compartilhados (
  id bigint generated always as identity primary key,
  documento_id bigint not null references public.documentos(id) on delete cascade,
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  compartilhado_por bigint references public.usuarios(id) on delete set null,
  pode_editar boolean not null default false,
  pode_comentar boolean not null default true,
  pode_deletar boolean not null default false,
  created_at timestamptz not null default now(),
  unique(documento_id, usuario_id)
);

comment on table public.documentos_compartilhados is 'Compartilhamento de documentos com controle de permissões';
comment on column public.documentos_compartilhados.pode_editar is 'Usuário pode editar o documento';
comment on column public.documentos_compartilhados.pode_comentar is 'Usuário pode adicionar comentários';
comment on column public.documentos_compartilhados.pode_deletar is 'Usuário pode deletar o documento';

create index if not exists idx_documentos_compartilhados_documento_id on public.documentos_compartilhados(documento_id);
create index if not exists idx_documentos_compartilhados_usuario_id on public.documentos_compartilhados(usuario_id);
create index if not exists idx_documentos_compartilhados_compartilhado_por on public.documentos_compartilhados(compartilhado_por);
create index if not exists idx_documentos_compartilhados_pode_deletar on public.documentos_compartilhados(pode_deletar);

-- Templates de documentos
create table if not exists public.templates (
  id bigint generated always as identity primary key,
  titulo text not null,
  conteudo jsonb not null,
  categoria text,
  criado_por bigint references public.usuarios(id) on delete set null,
  visibilidade text not null default 'privado' check (visibilidade in ('privado', 'publico')),
  uso_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.templates is 'Templates reutilizáveis de documentos';
comment on column public.templates.visibilidade is 'privado (só criador) ou publico (todos usuários)';
comment on column public.templates.uso_count is 'Contador de quantas vezes o template foi usado';

create index if not exists idx_templates_criado_por on public.templates(criado_por);
create index if not exists idx_templates_visibilidade on public.templates(visibilidade);
create index if not exists idx_templates_categoria on public.templates(categoria);
create index if not exists idx_templates_uso_count on public.templates(uso_count);
create index if not exists idx_templates_titulo_trgm on public.templates using gin(titulo gin_trgm_ops);

-- Salas de chat
create table if not exists public.salas_chat (
  id bigint generated always as identity primary key,
  nome text not null,
  tipo text not null check (tipo in ('geral', 'documento', 'privado', 'grupo')),
  documento_id bigint references public.documentos(id) on delete cascade,
  criado_por bigint not null references public.usuarios(id) on delete restrict,
  participante_id bigint references public.usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint salas_chat_privado_participante check (
    (tipo = 'privado' and participante_id is not null) or
    (tipo != 'privado')
  )
);

comment on table public.salas_chat is 'Salas de chat: Sala Geral, chat de documento, conversas privadas 1-para-1, ou grupos';
comment on column public.salas_chat.tipo is 'geral (sala única do sistema), documento (vinculado a um doc), privado (conversa 1-para-1), grupo (múltiplos usuários)';
comment on column public.salas_chat.documento_id is 'ID do documento vinculado (somente para tipo = documento)';
comment on column public.salas_chat.participante_id is 'ID do segundo participante (somente para tipo = privado)';

create index if not exists idx_salas_chat_criado_por on public.salas_chat(criado_por);
create index if not exists idx_salas_chat_tipo on public.salas_chat(tipo);
create index if not exists idx_salas_chat_documento_id on public.salas_chat(documento_id);
create index if not exists idx_salas_chat_participante_id on public.salas_chat(participante_id);

-- Índice parcial único: apenas uma Sala Geral
create unique index if not exists idx_salas_chat_unico_sala_geral
  on public.salas_chat (tipo, nome)
  where tipo = 'geral';

comment on index idx_salas_chat_unico_sala_geral is 'Garante que existe apenas uma Sala Geral no sistema com nome canônico "Sala Geral"';

-- Índice parcial único: evitar duplicidade de conversas privadas
create unique index if not exists idx_salas_chat_unico_privado
  on public.salas_chat (
    tipo,
    least(criado_por, participante_id),
    greatest(criado_por, participante_id)
  )
  where tipo = 'privado';

comment on index idx_salas_chat_unico_privado is 'Evita duplicidade de conversas privadas 1-para-1 entre os mesmos usuários';

-- Mensagens de chat
create table if not exists public.mensagens_chat (
  id bigint generated always as identity primary key,
  sala_id bigint not null references public.salas_chat(id) on delete cascade,
  usuario_id bigint not null references public.usuarios(id) on delete restrict,
  conteudo text not null,
  tipo text not null check (tipo in ('texto', 'arquivo', 'sistema')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.mensagens_chat is 'Mensagens de chat enviadas em salas';
comment on column public.mensagens_chat.tipo is 'texto (mensagem normal), arquivo (upload), sistema (notificações automáticas)';

create index if not exists idx_mensagens_chat_sala_id on public.mensagens_chat(sala_id);
create index if not exists idx_mensagens_chat_usuario_id on public.mensagens_chat(usuario_id);
create index if not exists idx_mensagens_chat_created_at on public.mensagens_chat(created_at);
create index if not exists idx_mensagens_chat_conteudo_trgm on public.mensagens_chat using gin(conteudo gin_trgm_ops);

-- ============================================================================
-- RLS Policies
-- ============================================================================

alter table public.pastas enable row level security;
alter table public.documentos enable row level security;
alter table public.documentos_versoes enable row level security;
alter table public.documentos_uploads enable row level security;
alter table public.documentos_compartilhados enable row level security;
alter table public.templates enable row level security;
alter table public.salas_chat enable row level security;
alter table public.mensagens_chat enable row level security;

-- service_role: acesso total
create policy "service role full access - pastas"
  on public.pastas for all
  to service_role
  using (true) with check (true);

create policy "service role full access - documentos"
  on public.documentos for all
  to service_role
  using (true) with check (true);

create policy "service role full access - documentos_versoes"
  on public.documentos_versoes for all
  to service_role
  using (true) with check (true);

create policy "service role full access - documentos_uploads"
  on public.documentos_uploads for all
  to service_role
  using (true) with check (true);

create policy "service role full access - documentos_compartilhados"
  on public.documentos_compartilhados for all
  to service_role
  using (true) with check (true);

create policy "service role full access - templates"
  on public.templates for all
  to service_role
  using (true) with check (true);

create policy "service role full access - salas_chat"
  on public.salas_chat for all
  to service_role
  using (true) with check (true);

create policy "service role full access - mensagens_chat"
  on public.mensagens_chat for all
  to service_role
  using (true) with check (true);

-- authenticated: acesso básico (SELECT)
create policy "authenticated select - documentos"
  on public.documentos for select
  to authenticated
  using (
    criado_por = get_current_user_id() or
    id in (
      select documento_id from public.documentos_compartilhados
      where usuario_id = get_current_user_id()
    )
  );

create policy "authenticated select - salas_chat"
  on public.salas_chat for select
  to authenticated
  using (
    tipo = 'geral' or
    criado_por = get_current_user_id() or
    participante_id = get_current_user_id() or
    (tipo = 'documento' and documento_id in (
      select id from public.documentos
      where criado_por = get_current_user_id() or
      id in (
        select documento_id from public.documentos_compartilhados
        where usuario_id = get_current_user_id()
      )
    ))
  );

create policy "authenticated select - mensagens_chat"
  on public.mensagens_chat for select
  to authenticated
  using (
    sala_id in (
      select id from public.salas_chat
      where criado_por = get_current_user_id()
        or participante_id = get_current_user_id()
        or tipo = 'geral'
        or (tipo = 'documento' and documento_id in (
          select id from public.documentos
          where criado_por = get_current_user_id()
        ))
    )
  );
