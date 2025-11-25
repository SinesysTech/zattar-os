-- Migration: Criar função e triggers para log automático de atribuições
-- Esta migration cria a função que registra automaticamente mudanças em responsavel_id
-- e os triggers que executam essa função nas três tabelas

-- Função para registrar log de atribuição de responsável
create or replace function public.log_atribuicao_responsavel()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  tipo_entidade text;
  tipo_evento text;
  usuario_executou_id bigint;
begin
  -- Determinar tipo de entidade baseado no nome da tabela
  tipo_entidade := tg_table_name;
  
  -- Obter usuário atual do contexto da aplicação
  -- A aplicação deve definir 'app.current_user_id' antes de fazer UPDATE
  -- Exemplo: SET app.current_user_id = '10';
  usuario_executou_id := coalesce(
    (current_setting('app.current_user_id', true))::bigint,
    null
  );
  
  -- Se não houver usuário no contexto, não criar log
  -- Isso permite que operações do sistema (capturas automáticas) não criem logs
  if usuario_executou_id is null then
    return new;
  end if;
  
  -- Determinar tipo de evento baseado na mudança
  if old.responsavel_id is null and new.responsavel_id is not null then
    tipo_evento := 'atribuicao_responsavel';
  elsif old.responsavel_id is not null and new.responsavel_id is null then
    tipo_evento := 'desatribuicao_responsavel';
  elsif old.responsavel_id is distinct from new.responsavel_id then
    tipo_evento := 'transferencia_responsavel';
  else
    -- Sem mudança no responsável, não criar log
    return new;
  end if;
  
  -- Inserir log na tabela logs_alteracao
  insert into public.logs_alteracao (
    tipo_entidade,
    entidade_id,
    tipo_evento,
    usuario_que_executou_id,
    responsavel_anterior_id,
    responsavel_novo_id,
    dados_evento
  ) values (
    tipo_entidade,
    new.id,
    tipo_evento,
    usuario_executou_id,
    old.responsavel_id,
    new.responsavel_id,
    jsonb_build_object(
      'numero_processo', coalesce(new.numero_processo, ''),
      'trt', new.trt::text,
      'grau', new.grau::text
    )
  );
  
  return new;
end;
$$;

comment on function public.log_atribuicao_responsavel() is 'Função trigger que registra automaticamente mudanças em responsavel_id nas tabelas de processos. Detecta atribuição, transferência e desatribuição de responsável';

-- Trigger para tabela acervo
create trigger log_atribuicao_acervo
after update of responsavel_id on public.acervo
for each row
when (old.responsavel_id is distinct from new.responsavel_id)
execute function public.log_atribuicao_responsavel();

comment on trigger log_atribuicao_acervo on public.acervo is 'Registra automaticamente mudanças em responsavel_id na tabela acervo';

-- Trigger para tabela audiencias
create trigger log_atribuicao_audiencias
after update of responsavel_id on public.audiencias
for each row
when (old.responsavel_id is distinct from new.responsavel_id)
execute function public.log_atribuicao_responsavel();

comment on trigger log_atribuicao_audiencias on public.audiencias is 'Registra automaticamente mudanças em responsavel_id na tabela audiencias';

-- Trigger para tabela pendentes_manifestacao
create trigger log_atribuicao_pendentes
after update of responsavel_id on public.pendentes_manifestacao
for each row
when (old.responsavel_id is distinct from new.responsavel_id)
execute function public.log_atribuicao_responsavel();

comment on trigger log_atribuicao_pendentes on public.pendentes_manifestacao is 'Registra automaticamente mudanças em responsavel_id na tabela pendentes_manifestacao';

