-- Migration: Criar tabela membros_sala_chat
--
-- Esta tabela é necessária para:
-- 1. Controlar membros de salas de grupo (tipo = 'grupo')
-- 2. Permitir soft delete de conversas por usuário (sem afetar outros membros)
-- 3. Garantir que RLS funcione corretamente para grupos
--
-- Sem esta tabela, o sistema de chat não consegue verificar membros
-- e falha ao tentar enviar/receber mensagens.

-- Criar tabela de membros de sala
create table if not exists public.membros_sala_chat (
  id bigint generated always as identity primary key,
  sala_id bigint not null references public.salas_chat(id) on delete cascade,
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Unique constraint para evitar duplicatas
  unique (sala_id, usuario_id)
);

comment on table public.membros_sala_chat is 'Membros de salas de chat. Permite soft delete por usuário e suporte a grupos.';
comment on column public.membros_sala_chat.sala_id is 'ID da sala de chat';
comment on column public.membros_sala_chat.usuario_id is 'ID do usuário membro';
comment on column public.membros_sala_chat.is_active is 'Se false, o usuário removeu a conversa da sua lista (soft delete)';
comment on column public.membros_sala_chat.deleted_at is 'Timestamp de quando o usuário removeu a conversa';

-- Índices para performance
create index if not exists idx_membros_sala_chat_sala_id on public.membros_sala_chat(sala_id);
create index if not exists idx_membros_sala_chat_usuario_id on public.membros_sala_chat(usuario_id);
create index if not exists idx_membros_sala_chat_is_active on public.membros_sala_chat(is_active);
create index if not exists idx_membros_sala_chat_sala_usuario_active
  on public.membros_sala_chat(sala_id, usuario_id, is_active);

-- Habilitar RLS
alter table public.membros_sala_chat enable row level security;

-- Policy: service_role tem acesso total
create policy "service role full access - membros_sala_chat"
  on public.membros_sala_chat for all
  to service_role
  using (true) with check (true);

-- Policy: usuários autenticados podem ver seus próprios memberships
create policy "authenticated select own - membros_sala_chat"
  on public.membros_sala_chat for select
  to authenticated
  using (usuario_id = get_current_user_id());

-- Policy: usuários podem ver membros de salas onde são membros ativos
create policy "authenticated select room members - membros_sala_chat"
  on public.membros_sala_chat for select
  to authenticated
  using (
    sala_id in (
      select sala_id from public.membros_sala_chat
      where usuario_id = get_current_user_id() and is_active = true
    )
  );

-- Atualizar RLS de salas_chat para incluir grupos via membros_sala_chat
-- Primeiro remover a policy antiga
drop policy if exists "authenticated select - salas_chat" on public.salas_chat;

-- Recriar com suporte a grupos
create policy "authenticated select - salas_chat"
  on public.salas_chat for select
  to authenticated
  using (
    tipo = 'geral' or
    criado_por = get_current_user_id() or
    participante_id = get_current_user_id() or
    -- Suporte a grupos: verificar se é membro ativo
    (tipo = 'grupo' and id in (
      select sala_id from public.membros_sala_chat
      where usuario_id = get_current_user_id() and is_active = true
    )) or
    (tipo = 'documento' and documento_id in (
      select id from public.documentos
      where criado_por = get_current_user_id() or
      id in (
        select documento_id from public.documentos_compartilhados
        where usuario_id = get_current_user_id()
      )
    ))
  );

-- Atualizar RLS de mensagens_chat para incluir grupos via membros_sala_chat
drop policy if exists "authenticated select - mensagens_chat" on public.mensagens_chat;

create policy "authenticated select - mensagens_chat"
  on public.mensagens_chat for select
  to authenticated
  using (
    sala_id in (
      select id from public.salas_chat
      where criado_por = get_current_user_id()
        or participante_id = get_current_user_id()
        or tipo = 'geral'
        or (tipo = 'grupo' and id in (
          select sala_id from public.membros_sala_chat
          where usuario_id = get_current_user_id() and is_active = true
        ))
        or (tipo = 'documento' and documento_id in (
          select id from public.documentos
          where criado_por = get_current_user_id()
        ))
    )
  );

-- Adicionar policy de INSERT para mensagens_chat (authenticated users)
-- Isso permite que usuários enviem mensagens em salas onde são membros
create policy "authenticated insert - mensagens_chat"
  on public.mensagens_chat for insert
  to authenticated
  with check (
    -- Verificar se o usuário pode enviar mensagens nesta sala
    sala_id in (
      select id from public.salas_chat
      where criado_por = get_current_user_id()
        or participante_id = get_current_user_id()
        or tipo = 'geral'
        or (tipo = 'grupo' and id in (
          select sala_id from public.membros_sala_chat
          where usuario_id = get_current_user_id() and is_active = true
        ))
        or (tipo = 'documento' and documento_id in (
          select id from public.documentos
          where criado_por = get_current_user_id()
        ))
    )
    -- E o usuario_id deve ser o do usuário atual
    and usuario_id = get_current_user_id()
  );

-- Trigger para atualizar updated_at
create or replace function update_membros_sala_chat_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_membros_sala_chat_updated_at on public.membros_sala_chat;
create trigger trigger_membros_sala_chat_updated_at
  before update on public.membros_sala_chat
  for each row
  execute function update_membros_sala_chat_updated_at();

-- Popular membros para salas existentes:
-- 1. Para salas tipo 'geral': adicionar todos os usuários ativos
-- 2. Para salas tipo 'privado': adicionar criador e participante
-- 3. Para salas tipo 'documento': adicionar criador e usuários com acesso ao documento

-- Sala Geral: adicionar todos os usuários ativos
insert into public.membros_sala_chat (sala_id, usuario_id)
select s.id, u.id
from public.salas_chat s
cross join public.usuarios u
where s.tipo = 'geral'
  and u.status = 'ativo'
on conflict (sala_id, usuario_id) do nothing;

-- Salas privadas: adicionar criador e participante
insert into public.membros_sala_chat (sala_id, usuario_id)
select s.id, s.criado_por
from public.salas_chat s
where s.tipo = 'privado'
on conflict (sala_id, usuario_id) do nothing;

insert into public.membros_sala_chat (sala_id, usuario_id)
select s.id, s.participante_id
from public.salas_chat s
where s.tipo = 'privado' and s.participante_id is not null
on conflict (sala_id, usuario_id) do nothing;

-- Salas de documento: adicionar criador
insert into public.membros_sala_chat (sala_id, usuario_id)
select s.id, s.criado_por
from public.salas_chat s
where s.tipo = 'documento'
on conflict (sala_id, usuario_id) do nothing;

-- Salas de grupo: adicionar criador
insert into public.membros_sala_chat (sala_id, usuario_id)
select s.id, s.criado_por
from public.salas_chat s
where s.tipo = 'grupo'
on conflict (sala_id, usuario_id) do nothing;

-- Adicionar tabela à publicação Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'membros_sala_chat'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.membros_sala_chat;
    RAISE NOTICE 'Tabela membros_sala_chat adicionada à publicação supabase_realtime';
  ELSE
    RAISE NOTICE 'Tabela membros_sala_chat já está na publicação supabase_realtime';
  END IF;
END $$;
