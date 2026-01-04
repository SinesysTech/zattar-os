-- ============================================================================
-- Funções e Triggers para Geração Automática de Notificações
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: criar_notificacao
-- ----------------------------------------------------------------------------
-- Função auxiliar para criar notificações de forma padronizada
-- Usada por triggers e outras funções do sistema
--
-- Parâmetros:
--   p_usuario_id: ID do usuário destinatário
--   p_tipo: Tipo da notificação (tipo_notificacao_usuario)
--   p_titulo: Título da notificação
--   p_descricao: Descrição da notificação
--   p_entidade_tipo: Tipo da entidade (processo, audiencia, expediente, pericia)
--   p_entidade_id: ID da entidade relacionada
--   p_dados_adicionais: Dados adicionais em JSONB (opcional)
-- ----------------------------------------------------------------------------

create or replace function public.criar_notificacao(
  p_usuario_id bigint,
  p_tipo public.tipo_notificacao_usuario,
  p_titulo text,
  p_descricao text,
  p_entidade_tipo text,
  p_entidade_id bigint,
  p_dados_adicionais jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_notificacao_id bigint;
begin
  -- Validar que o usuário existe e está ativo
  if not exists (
    select 1
    from public.usuarios
    where id = p_usuario_id
    and ativo = true
  ) then
    return null;
  end if;

  -- Inserir notificação
  insert into public.notificacoes (
    usuario_id,
    tipo,
    titulo,
    descricao,
    entidade_tipo,
    entidade_id,
    dados_adicionais
  ) values (
    p_usuario_id,
    p_tipo,
    p_titulo,
    p_descricao,
    p_entidade_tipo,
    p_entidade_id,
    p_dados_adicionais
  )
  returning id into v_notificacao_id;

  -- Broadcast via Realtime para notificação em tempo real
  perform realtime.send(
    'user:' || p_usuario_id::text || ':notifications',
    'notification_created',
    jsonb_build_object(
      'id', v_notificacao_id,
      'tipo', p_tipo,
      'titulo', p_titulo,
      'entidade_tipo', p_entidade_tipo,
      'entidade_id', p_entidade_id
    ),
    false
  );

  return v_notificacao_id;
end;
$$;

comment on function public.criar_notificacao(bigint, public.tipo_notificacao_usuario, text, text, text, bigint, jsonb) is 'Cria uma notificação para um usuário e envia evento via Realtime';

-- ----------------------------------------------------------------------------
-- Trigger: notificar_processo_atribuido
-- ----------------------------------------------------------------------------
-- Cria notificação quando um processo é atribuído a um usuário
-- ----------------------------------------------------------------------------

create or replace function public.notificar_processo_atribuido()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_numero_processo text;
  v_titulo text;
  v_descricao text;
begin
  -- Só criar notificação se responsavel_id foi definido ou alterado
  if new.responsavel_id is not null
    and (old.responsavel_id is distinct from new.responsavel_id)
  then
    -- Buscar número do processo
    v_numero_processo := new.numero_processo;

    -- Criar título e descrição
    v_titulo := 'Processo atribuído';
    v_descricao := format(
      'O processo %s foi atribuído a você',
      v_numero_processo
    );

    -- Criar notificação
    perform public.criar_notificacao(
      new.responsavel_id,
      'processo_atribuido',
      v_titulo,
      v_descricao,
      'processo',
      new.id,
      jsonb_build_object(
        'numero_processo', v_numero_processo,
        'trt', new.trt,
        'grau', new.grau
      )
    );
  end if;

  return new;
end;
$$;

comment on function public.notificar_processo_atribuido() is 'Cria notificação quando processo é atribuído a um usuário';

-- Criar trigger na tabela acervo
drop trigger if exists trigger_notificar_processo_atribuido on public.acervo;
create trigger trigger_notificar_processo_atribuido
after insert or update of responsavel_id
on public.acervo
for each row
execute function public.notificar_processo_atribuido();

-- ----------------------------------------------------------------------------
-- Trigger: notificar_processo_movimentacao
-- ----------------------------------------------------------------------------
-- Cria notificação quando há movimentação em um processo atribuído
-- ----------------------------------------------------------------------------

create or replace function public.notificar_processo_movimentacao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_numero_processo text;
  v_titulo text;
  v_descricao text;
  v_total_movimentos_anterior integer;
  v_total_movimentos_novo integer;
begin
  -- Só criar notificação se processo está atribuído e timeline_jsonb foi alterado
  if new.responsavel_id is not null
    and old.timeline_jsonb is distinct from new.timeline_jsonb
    and new.timeline_jsonb is not null
  then
    v_numero_processo := new.numero_processo;

    -- Extrair total de movimentos do timeline_jsonb
    v_total_movimentos_anterior := coalesce(
      (old.timeline_jsonb->'metadata'->>'totalMovimentos')::integer,
      0
    );
    v_total_movimentos_novo := coalesce(
      (new.timeline_jsonb->'metadata'->>'totalMovimentos')::integer,
      0
    );

    -- Só notificar se houve aumento no número de movimentos
    if v_total_movimentos_novo > v_total_movimentos_anterior then
      v_titulo := 'Nova movimentação no processo';
      v_descricao := format(
        'O processo %s teve %s nova(s) movimentação(ões)',
        v_numero_processo,
        v_total_movimentos_novo - v_total_movimentos_anterior
      );

      perform public.criar_notificacao(
        new.responsavel_id,
        'processo_movimentacao',
        v_titulo,
        v_descricao,
        'processo',
        new.id,
        jsonb_build_object(
          'numero_processo', v_numero_processo,
          'total_movimentos', v_total_movimentos_novo,
          'novos_movimentos', v_total_movimentos_novo - v_total_movimentos_anterior
        )
      );
    end if;
  end if;

  return new;
end;
$$;

comment on function public.notificar_processo_movimentacao() is 'Cria notificação quando há movimentação em processo atribuído';

-- Criar trigger na tabela acervo
drop trigger if exists trigger_notificar_processo_movimentacao on public.acervo;
create trigger trigger_notificar_processo_movimentacao
after update of timeline_jsonb
on public.acervo
for each row
execute function public.notificar_processo_movimentacao();

-- ----------------------------------------------------------------------------
-- Trigger: notificar_audiencia_atribuida
-- ----------------------------------------------------------------------------
-- Cria notificação quando uma audiência é atribuída a um usuário
-- ----------------------------------------------------------------------------

create or replace function public.notificar_audiencia_atribuida()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_numero_processo text;
  v_data_inicio timestamp with time zone;
  v_titulo text;
  v_descricao text;
begin
  -- Só criar notificação se responsavel_id foi definido ou alterado
  if new.responsavel_id is not null
    and (old.responsavel_id is distinct from new.responsavel_id)
  then
    v_numero_processo := new.numero_processo;
    v_data_inicio := new.data_inicio;

    v_titulo := 'Audiência atribuída';
    v_descricao := format(
      'Uma audiência do processo %s foi atribuída a você',
      v_numero_processo
    );

    if v_data_inicio is not null then
      v_descricao := v_descricao || format(' para %s', to_char(v_data_inicio, 'DD/MM/YYYY HH24:MI'));
    end if;

    perform public.criar_notificacao(
      new.responsavel_id,
      'audiencia_atribuida',
      v_titulo,
      v_descricao,
      'audiencia',
      new.id,
      jsonb_build_object(
        'numero_processo', v_numero_processo,
        'data_inicio', v_data_inicio,
        'trt', new.trt,
        'grau', new.grau
      )
    );
  end if;

  return new;
end;
$$;

comment on function public.notificar_audiencia_atribuida() is 'Cria notificação quando audiência é atribuída a um usuário';

-- Criar trigger na tabela audiencias
drop trigger if exists trigger_notificar_audiencia_atribuida on public.audiencias;
create trigger trigger_notificar_audiencia_atribuida
after insert or update of responsavel_id
on public.audiencias
for each row
execute function public.notificar_audiencia_atribuida();

-- ----------------------------------------------------------------------------
-- Trigger: notificar_audiencia_alterada
-- ----------------------------------------------------------------------------
-- Cria notificação quando uma audiência atribuída tem alterações importantes
-- ----------------------------------------------------------------------------

create or replace function public.notificar_audiencia_alterada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_numero_processo text;
  v_titulo text;
  v_descricao text;
  v_alteracoes text[] := array[]::text[];
begin
  -- Só criar notificação se audiência está atribuída e houve alterações relevantes
  if new.responsavel_id is not null then
    v_numero_processo := new.numero_processo;

    -- Detectar alterações relevantes
    if old.data_inicio is distinct from new.data_inicio then
      v_alteracoes := array_append(
        v_alteracoes,
        format('Data alterada para %s', to_char(new.data_inicio, 'DD/MM/YYYY HH24:MI'))
      );
    end if;

    if old.status is distinct from new.status then
      v_alteracoes := array_append(
        v_alteracoes,
        format('Status alterado para %s', new.status_descricao)
      );
    end if;

    if old.modalidade is distinct from new.modalidade then
      v_alteracoes := array_append(
        v_alteracoes,
        format('Modalidade alterada para %s', new.modalidade)
      );
    end if;

    -- Criar notificação se houver alterações
    if array_length(v_alteracoes, 1) > 0 then
      v_titulo := 'Audiência alterada';
      v_descricao := format(
        'A audiência do processo %s foi alterada: %s',
        v_numero_processo,
        array_to_string(v_alteracoes, ', ')
      );

      perform public.criar_notificacao(
        new.responsavel_id,
        'audiencia_alterada',
        v_titulo,
        v_descricao,
        'audiencia',
        new.id,
        jsonb_build_object(
          'numero_processo', v_numero_processo,
          'alteracoes', v_alteracoes
        )
      );
    end if;
  end if;

  return new;
end;
$$;

comment on function public.notificar_audiencia_alterada() is 'Cria notificação quando audiência atribuída tem alterações importantes';

-- Criar trigger na tabela audiencias
drop trigger if exists trigger_notificar_audiencia_alterada on public.audiencias;
create trigger trigger_notificar_audiencia_alterada
after update of data_inicio, status, modalidade
on public.audiencias
for each row
execute function public.notificar_audiencia_alterada();

-- ----------------------------------------------------------------------------
-- Trigger: notificar_expediente_atribuido
-- ----------------------------------------------------------------------------
-- Cria notificação quando um expediente é atribuído a um usuário
-- ----------------------------------------------------------------------------

create or replace function public.notificar_expediente_atribuido()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_numero_processo text;
  v_tipo_expediente text;
  v_data_prazo timestamp with time zone;
  v_titulo text;
  v_descricao text;
begin
  -- Só criar notificação se responsavel_id foi definido ou alterado
  if new.responsavel_id is not null
    and (old.responsavel_id is distinct from new.responsavel_id)
  then
    v_numero_processo := new.numero_processo;
    v_data_prazo := new.data_prazo_legal_parte;

    -- Buscar tipo de expediente se disponível
    if new.tipo_expediente_id is not null then
      select tipo_expediente into v_tipo_expediente
      from public.tipos_expedientes
      where id = new.tipo_expediente_id;
    end if;

    v_titulo := 'Expediente atribuído';
    v_descricao := format(
      'Um expediente do processo %s foi atribuído a você',
      v_numero_processo
    );

    if v_tipo_expediente is not null then
      v_descricao := v_descricao || format(' (%s)', v_tipo_expediente);
    end if;

    if v_data_prazo is not null then
      v_descricao := v_descricao || format(' com prazo até %s', to_char(v_data_prazo, 'DD/MM/YYYY'));
    end if;

    perform public.criar_notificacao(
      new.responsavel_id,
      'expediente_atribuido',
      v_titulo,
      v_descricao,
      'expediente',
      new.id,
      jsonb_build_object(
        'numero_processo', v_numero_processo,
        'tipo_expediente', v_tipo_expediente,
        'data_prazo', v_data_prazo,
        'prazo_vencido', new.prazo_vencido
      )
    );
  end if;

  return new;
end;
$$;

comment on function public.notificar_expediente_atribuido() is 'Cria notificação quando expediente é atribuído a um usuário';

-- Criar trigger na tabela expedientes
drop trigger if exists trigger_notificar_expediente_atribuido on public.expedientes;
create trigger trigger_notificar_expediente_atribuido
after insert or update of responsavel_id
on public.expedientes
for each row
execute function public.notificar_expediente_atribuido();

-- ----------------------------------------------------------------------------
-- Trigger: notificar_expediente_alterado
-- ----------------------------------------------------------------------------
-- Cria notificação quando um expediente atribuído tem alterações importantes
-- ----------------------------------------------------------------------------

create or replace function public.notificar_expediente_alterado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_numero_processo text;
  v_titulo text;
  v_descricao text;
  v_alteracoes text[] := array[]::text[];
begin
  -- Só criar notificação se expediente está atribuído e houve alterações relevantes
  if new.responsavel_id is not null then
    v_numero_processo := new.numero_processo;

    -- Detectar alterações relevantes
    if old.data_prazo_legal_parte is distinct from new.data_prazo_legal_parte then
      v_alteracoes := array_append(
        v_alteracoes,
        format('Prazo alterado para %s', to_char(new.data_prazo_legal_parte, 'DD/MM/YYYY'))
      );
    end if;

    if old.prazo_vencido is distinct from new.prazo_vencido and new.prazo_vencido = true then
      v_alteracoes := array_append(v_alteracoes, 'Prazo vencido');
    end if;

    if old.baixado_em is distinct from new.baixado_em and new.baixado_em is not null then
      v_alteracoes := array_append(v_alteracoes, 'Expediente baixado');
    end if;

    -- Criar notificação se houver alterações
    if array_length(v_alteracoes, 1) > 0 then
      v_titulo := 'Expediente alterado';
      v_descricao := format(
        'O expediente do processo %s foi alterado: %s',
        v_numero_processo,
        array_to_string(v_alteracoes, ', ')
      );

      perform public.criar_notificacao(
        new.responsavel_id,
        'expediente_alterado',
        v_titulo,
        v_descricao,
        'expediente',
        new.id,
        jsonb_build_object(
          'numero_processo', v_numero_processo,
          'alteracoes', v_alteracoes
        )
      );
    end if;
  end if;

  return new;
end;
$$;

comment on function public.notificar_expediente_alterado() is 'Cria notificação quando expediente atribuído tem alterações importantes';

-- Criar trigger na tabela expedientes
drop trigger if exists trigger_notificar_expediente_alterado on public.expedientes;
create trigger trigger_notificar_expediente_alterado
after update of data_prazo_legal_parte, prazo_vencido, baixado_em
on public.expedientes
for each row
execute function public.notificar_expediente_alterado();

-- ============================================================================
-- RLS Policies para Realtime
-- ============================================================================
-- Políticas para permitir que usuários leiam suas próprias notificações via Realtime

-- Política para ler mensagens Realtime de notificações
create policy if not exists "users_can_read_own_notifications_realtime"
on realtime.messages
for select
to authenticated
using (
  topic like 'user:%:notifications' and
  exists (
    select 1
    from public.usuarios
    where id = split_part(topic, ':', 2)::bigint
    and auth_user_id = (select auth.uid())
  )
);

-- Índice para performance da política RLS
create index if not exists idx_realtime_messages_topic_user
on realtime.messages(topic)
where topic like 'user:%:notifications';

-- ============================================================================
-- Função: Verificar e Notificar Prazos Vencendo/Vencidos
-- ============================================================================
-- Esta função verifica expedientes com prazos próximos ou vencidos
-- e cria notificações para os responsáveis.
-- Deve ser executada periodicamente via pg_cron (ex: a cada hora)
-- ----------------------------------------------------------------------------

create or replace function public.verificar_e_notificar_prazos()
returns table (
  notificacoes_criadas bigint,
  prazos_vencendo bigint,
  prazos_vencidos bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_notificacoes_criadas bigint := 0;
  v_prazos_vencendo bigint := 0;
  v_prazos_vencidos bigint := 0;
  v_expediente record;
  v_dias_para_vencer integer;
  v_titulo text;
  v_descricao text;
  v_notificacao_id bigint;
begin
  -- Buscar expedientes com responsável atribuído e prazo definido
  -- que ainda não foram baixados
  for v_expediente in
    select
      e.id,
      e.responsavel_id,
      e.numero_processo,
      e.data_prazo_legal_parte,
      e.prazo_vencido,
      e.tipo_expediente_id,
      te.tipo_expediente
    from public.expedientes e
    left join public.tipos_expedientes te on e.tipo_expediente_id = te.id
    where e.responsavel_id is not null
      and e.data_prazo_legal_parte is not null
      and e.baixado_em is null
      and (
        -- Prazo vencido (não notificado ainda)
        (e.prazo_vencido = true and not exists (
          select 1
          from public.notificacoes n
          where n.entidade_tipo = 'expediente'
            and n.entidade_id = e.id
            and n.tipo = 'prazo_vencido'
            and n.created_at > e.updated_at
        ))
        or
        -- Prazo vencendo (3 dias ou menos, não notificado nos últimos 24h)
        (e.prazo_vencido = false
          and e.data_prazo_legal_parte <= (now() + interval '3 days')
          and e.data_prazo_legal_parte > now()
          and not exists (
            select 1
            from public.notificacoes n
            where n.entidade_tipo = 'expediente'
              and n.entidade_id = e.id
              and n.tipo = 'prazo_vencendo'
              and n.created_at > (now() - interval '24 hours')
          ))
      )
  loop
    -- Calcular dias para vencer
    v_dias_para_vencer := extract(day from (v_expediente.data_prazo_legal_parte - now()))::integer;

    -- Determinar tipo de notificação e criar mensagem
    if v_expediente.prazo_vencido then
      -- Prazo já vencido
      v_prazos_vencidos := v_prazos_vencidos + 1;
      v_titulo := 'Prazo vencido';
      v_descricao := format(
        'O prazo do expediente do processo %s venceu',
        v_expediente.numero_processo
      );

      if v_expediente.tipo_expediente is not null then
        v_descricao := v_descricao || format(' (%s)', v_expediente.tipo_expediente);
      end if;

      -- Criar notificação
      v_notificacao_id := public.criar_notificacao(
        v_expediente.responsavel_id,
        'prazo_vencido',
        v_titulo,
        v_descricao,
        'expediente',
        v_expediente.id,
        jsonb_build_object(
          'numero_processo', v_expediente.numero_processo,
          'data_prazo', v_expediente.data_prazo_legal_parte,
          'tipo_expediente', v_expediente.tipo_expediente
        )
      );

      if v_notificacao_id is not null then
        v_notificacoes_criadas := v_notificacoes_criadas + 1;
      end if;
    else
      -- Prazo vencendo (3 dias ou menos)
      v_prazos_vencendo := v_prazos_vencendo + 1;
      v_titulo := 'Prazo vencendo';
      v_descricao := format(
        'O prazo do expediente do processo %s vence em %s dia(s)',
        v_expediente.numero_processo,
        v_dias_para_vencer
      );

      if v_expediente.tipo_expediente is not null then
        v_descricao := v_descricao || format(' (%s)', v_expediente.tipo_expediente);
      end if;

      -- Criar notificação
      v_notificacao_id := public.criar_notificacao(
        v_expediente.responsavel_id,
        'prazo_vencendo',
        v_titulo,
        v_descricao,
        'expediente',
        v_expediente.id,
        jsonb_build_object(
          'numero_processo', v_expediente.numero_processo,
          'data_prazo', v_expediente.data_prazo_legal_parte,
          'dias_para_vencer', v_dias_para_vencer,
          'tipo_expediente', v_expediente.tipo_expediente
        )
      );

      if v_notificacao_id is not null then
        v_notificacoes_criadas := v_notificacoes_criadas + 1;
      end if;
    end if;
  end loop;

  -- Retornar estatísticas
  return query select
    v_notificacoes_criadas,
    v_prazos_vencendo,
    v_prazos_vencidos;
end;
$$;

comment on function public.verificar_e_notificar_prazos() is 'Verifica expedientes com prazos próximos ou vencidos e cria notificações. Deve ser executada periodicamente via pg_cron.';

-- Criar job agendado para verificar prazos (executa a cada hora)
-- Nota: pg_cron precisa estar habilitado no Supabase
-- Descomente a linha abaixo após confirmar que pg_cron está disponível
-- select cron.schedule(
--   'verificar-prazos-expedientes',
--   '0 * * * *', -- A cada hora
--   $$select public.verificar_e_notificar_prazos()$$
-- );

