-- Materialized view para mensagens de chat com dados de usuário
-- Elimina necessidade de query adicional após INSERT event do Realtime

create materialized view public.mensagens_chat_com_usuario as
select 
  m.id,
  m.sala_id,
  m.usuario_id,
  m.conteudo,
  m.tipo,
  m.created_at,
  m.updated_at,
  m.deleted_at,
  m.status,
  m.data,
  u.nome_completo as usuario_nome_completo,
  u.nome_exibicao as usuario_nome_exibicao,
  u.email_corporativo as usuario_email_corporativo,
  u.avatar_url as usuario_avatar_url
from public.mensagens_chat m
left join public.usuarios u on m.usuario_id = u.id
where m.deleted_at is null;

-- Índice único necessário para refresh CONCURRENTLY
create unique index idx_mensagens_chat_com_usuario_id 
  on public.mensagens_chat_com_usuario (id);

-- Índice para filtro por sala
create index idx_mensagens_chat_com_usuario_sala_created 
  on public.mensagens_chat_com_usuario (sala_id, created_at desc);

-- Comentário
comment on materialized view public.mensagens_chat_com_usuario is 
  'View materializada com mensagens de chat e dados de usuário. Atualizar via refresh a cada 5 minutos.';

-- Função para refresh
create or replace function public.refresh_mensagens_chat_com_usuario()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently public.mensagens_chat_com_usuario;
exception
  when others then
    -- Fallback para refresh normal se CONCURRENTLY falhar
    refresh materialized view public.mensagens_chat_com_usuario;
end;
$$;

comment on function public.refresh_mensagens_chat_com_usuario is 
  'Atualiza materialized view mensagens_chat_com_usuario de forma concorrente';

-- RLS
alter materialized view public.mensagens_chat_com_usuario owner to postgres;

-- Refresh inicial
select public.refresh_mensagens_chat_com_usuario();
