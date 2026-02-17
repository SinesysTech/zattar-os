-- Migration: Criar funções RPC para atribuir responsável com contexto de usuário
-- Essas funções definem o contexto antes do UPDATE para que o trigger funcione

-- Função para atualizar responsavel_id em acervo
create or replace function public.atribuir_responsavel_acervo(
  processo_id bigint,
  responsavel_id_param bigint,
  usuario_executou_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  resultado jsonb;
begin
  -- Definir contexto do usuário antes do UPDATE
  perform set_config('app.current_user_id', usuario_executou_id::text, false);
  
  -- Executar UPDATE
  update public.acervo
  set responsavel_id = responsavel_id_param
  where id = processo_id
  returning to_jsonb(acervo.*) into resultado;
  
  -- Limpar contexto
  perform set_config('app.current_user_id', '', true);
  
  return resultado;
end;
$$;

comment on function public.atribuir_responsavel_acervo(bigint, bigint, bigint) is 'Atribui responsável a um processo do acervo com contexto de usuário para trigger de log';

-- Função para atualizar responsavel_id em audiencias
create or replace function public.atribuir_responsavel_audiencia(
  audiencia_id bigint,
  responsavel_id_param bigint,
  usuario_executou_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  resultado jsonb;
begin
  -- Definir contexto do usuário antes do UPDATE
  perform set_config('app.current_user_id', usuario_executou_id::text, false);
  
  -- Executar UPDATE
  update public.audiencias
  set responsavel_id = responsavel_id_param
  where id = audiencia_id
  returning to_jsonb(audiencias.*) into resultado;
  
  -- Limpar contexto
  perform set_config('app.current_user_id', '', true);
  
  return resultado;
end;
$$;

comment on function public.atribuir_responsavel_audiencia(bigint, bigint, bigint) is 'Atribui responsável a uma audiência com contexto de usuário para trigger de log';

-- Função para atualizar responsavel_id em pendentes_manifestacao
create or replace function public.atribuir_responsavel_pendente(
  pendente_id bigint,
  responsavel_id_param bigint,
  usuario_executou_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  resultado jsonb;
begin
  -- Definir contexto do usuário antes do UPDATE
  perform set_config('app.current_user_id', usuario_executou_id::text, false);
  
  -- Executar UPDATE
  update public.pendentes_manifestacao
  set responsavel_id = responsavel_id_param
  where id = pendente_id
  returning to_jsonb(pendentes_manifestacao.*) into resultado;
  
  -- Limpar contexto
  perform set_config('app.current_user_id', '', true);
  
  return resultado;
end;
$$;

comment on function public.atribuir_responsavel_pendente(bigint, bigint, bigint) is 'Atribui responsável a um processo pendente de manifestação com contexto de usuário para trigger de log';

