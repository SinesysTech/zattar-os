-- Migration: baixa / reversão atômicas com auditoria
--
-- Contexto: o service realizarBaixa chamava repository.baixarExpediente (UPDATE
-- isolado) e depois a RPC registrar_baixa_expediente (INSERT em logs_alteracao).
-- Se o UPDATE sucedia mas o INSERT falhava, o expediente ficava baixado sem
-- registro de auditoria — operação sem rastro para quem auditou o sistema.
--
-- Esta migration cria RPCs que unificam UPDATE + log em uma única transação
-- plpgsql. Ou tudo persiste, ou nada. Retornam o expediente atualizado
-- como jsonb, prontos para consumo pelo service.
--
-- As RPCs antigas (registrar_baixa_expediente, registrar_reversao_baixa_expediente)
-- ficam intocadas para compatibilidade com callers externos (scripts admin,
-- jobs legados, MCP tools antigas).

-- =============================================================================
-- baixar_expediente_atomic
-- =============================================================================

create or replace function public.baixar_expediente_atomic(
  p_expediente_id bigint,
  p_usuario_id bigint,
  p_protocolo_id text default null,
  p_justificativa text default null,
  p_baixado_em timestamptz default null,
  p_resultado_decisao text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expediente public.expedientes%rowtype;
begin
  if p_expediente_id is null or p_expediente_id <= 0 then
    raise exception 'ID de expediente inválido.';
  end if;

  -- Invariante: precisa ter protocolo OU justificativa.
  if (p_protocolo_id is null or length(trim(p_protocolo_id)) = 0)
     and (p_justificativa is null or length(trim(p_justificativa)) = 0) then
    raise exception 'Informe protocolo ou justificativa para a baixa.';
  end if;

  -- Contexto para triggers de log downstream
  perform set_config('app.current_user_id', p_usuario_id::text, true);

  -- UPDATE + RETURNING atômico. Se expediente não existir, v_expediente.id será null.
  update public.expedientes
  set baixado_em = coalesce(p_baixado_em, now()),
      protocolo_id = p_protocolo_id,
      justificativa_baixa = p_justificativa,
      resultado_decisao = p_resultado_decisao,
      updated_at = now()
  where id = p_expediente_id
  returning * into v_expediente;

  if v_expediente.id is null then
    raise exception 'Expediente % não encontrado.', p_expediente_id;
  end if;

  -- Auditoria na mesma transação
  insert into public.logs_alteracao (
    tipo_entidade,
    entidade_id,
    tipo_evento,
    usuario_que_executou_id,
    dados_evento
  ) values (
    'expedientes',
    p_expediente_id,
    'baixa_expediente',
    p_usuario_id,
    jsonb_build_object(
      'protocolo_id', p_protocolo_id,
      'justificativa_baixa', p_justificativa,
      'baixado_em', v_expediente.baixado_em,
      'resultado_decisao', p_resultado_decisao
    )
  );

  return to_jsonb(v_expediente);
end;
$$;

grant execute on function public.baixar_expediente_atomic(bigint, bigint, text, text, timestamptz, text)
  to service_role;

comment on function public.baixar_expediente_atomic(bigint, bigint, text, text, timestamptz, text) is
  'Baixa um expediente (UPDATE) + registra log de auditoria em uma única transação. Rollback se algum passo falhar.';

-- =============================================================================
-- reverter_baixa_expediente_atomic
-- =============================================================================

create or replace function public.reverter_baixa_expediente_atomic(
  p_expediente_id bigint,
  p_usuario_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_protocolo_anterior text;
  v_justificativa_anterior text;
  v_expediente public.expedientes%rowtype;
begin
  if p_expediente_id is null or p_expediente_id <= 0 then
    raise exception 'ID de expediente inválido.';
  end if;

  -- Captura os dados anteriores para o log de auditoria (antes do UPDATE zerar).
  select protocolo_id, justificativa_baixa
  into v_protocolo_anterior, v_justificativa_anterior
  from public.expedientes
  where id = p_expediente_id;

  if not found then
    raise exception 'Expediente % não encontrado.', p_expediente_id;
  end if;

  perform set_config('app.current_user_id', p_usuario_id::text, true);

  -- UPDATE + RETURNING. Só executa se estava baixado (baixado_em IS NOT NULL).
  update public.expedientes
  set baixado_em = null,
      protocolo_id = null,
      justificativa_baixa = null,
      resultado_decisao = null,
      updated_at = now()
  where id = p_expediente_id
    and baixado_em is not null
  returning * into v_expediente;

  if v_expediente.id is null then
    raise exception 'Expediente % não está baixado ou não foi encontrado.', p_expediente_id;
  end if;

  insert into public.logs_alteracao (
    tipo_entidade,
    entidade_id,
    tipo_evento,
    usuario_que_executou_id,
    dados_evento
  ) values (
    'expedientes',
    p_expediente_id,
    'reversao_baixa_expediente',
    p_usuario_id,
    jsonb_build_object(
      'protocolo_id_anterior', v_protocolo_anterior,
      'justificativa_anterior', v_justificativa_anterior,
      'revertido_em', now()
    )
  );

  return to_jsonb(v_expediente);
end;
$$;

grant execute on function public.reverter_baixa_expediente_atomic(bigint, bigint)
  to service_role;

comment on function public.reverter_baixa_expediente_atomic(bigint, bigint) is
  'Reverte a baixa de um expediente (UPDATE) + registra log de auditoria em uma única transação. Rollback se algum passo falhar.';
