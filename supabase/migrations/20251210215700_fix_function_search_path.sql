-- ============================================================================
-- Migration: Adicionar search_path vazio às funções para segurança
-- ============================================================================
-- Fix security warning: Function Search Path Mutable
-- Todas as funções devem ter search_path = '' para evitar riscos de segurança
-- ============================================================================

-- 1. update_updated_at_column
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.update_updated_at_column() is 'Trigger function para atualizar updated_at antes de UPDATE';

-- 2. update_comunica_cnj_updated_at
create or replace function public.update_comunica_cnj_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.update_comunica_cnj_updated_at() is 'Trigger function para atualizar updated_at na tabela comunica_cnj';

-- 3. refresh_orcamento_vs_realizado
create or replace function public.refresh_orcamento_vs_realizado()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  refresh materialized view concurrently public.v_orcamento_vs_realizado;
end;
$$;

comment on function public.refresh_orcamento_vs_realizado() is 'Atualiza materialized view v_orcamento_vs_realizado de forma concorrente';

-- 4. refresh_processos_cliente_por_cpf
create or replace function public.refresh_processos_cliente_por_cpf()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  refresh materialized view concurrently public.processos_cliente_por_cpf;
end;
$$;

comment on function public.refresh_processos_cliente_por_cpf() is 'Atualiza materialized view processos_cliente_por_cpf de forma concorrente';

-- 5. generate_unique_chat_filename
create or replace function public.generate_unique_chat_filename(original_name text, user_id bigint)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  extension text;
  base_name text;
  counter integer := 0;
  new_name text;
begin
  -- Extrair extensão
  extension := regexp_replace(original_name, '^.+(\.[^.]+)$', '\1');
  base_name := regexp_replace(original_name, '(\.[^.]+)$', '');
  
  -- Tentar nomes até encontrar um único
  loop
    if counter = 0 then
      new_name := base_name || extension;
    else
      new_name := base_name || '_' || counter::text || extension;
    end if;
    
    -- Verificar se o nome já existe para esse usuário
    if not exists (
      select 1 from public.mensagens_chat
      where usuario_id = user_id and conteudo = new_name
    ) then
      exit;
    end if;
    
    counter := counter + 1;
  end loop;
  
  return new_name;
end;
$$;

comment on function public.generate_unique_chat_filename(text, bigint) is 'Gera nome de arquivo único para chat, evitando duplicação';
