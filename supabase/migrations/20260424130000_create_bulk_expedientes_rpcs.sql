-- Migration: RPCs bulk all-or-nothing para expedientes
--
-- Contexto: as actions de bulk (transferir responsável em massa, baixar em massa)
-- iteravam em Promise.allSettled chamando o service individual por ID. Cada call
-- abria sua própria transação — se metade falhasse por uma invariante (ex.: 50
-- expedientes já baixados), a outra metade persistia, deixando estado inconsistente
-- e auditoria parcial.
--
-- Estas RPCs executam tudo numa única transação Postgres (plpgsql functions são
-- naturalmente transacionais). Um RAISE EXCEPTION em qualquer ponto dispara
-- rollback completo: ou todos os expedientes são processados, ou nenhum.

-- =============================================================================
-- bulk_atribuir_responsavel_expedientes
-- =============================================================================

create or replace function public.bulk_atribuir_responsavel_expedientes(
  p_expediente_ids bigint[],
  p_responsavel_id bigint,
  p_usuario_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total int;
  v_atualizados int;
begin
  v_total := coalesce(array_length(p_expediente_ids, 1), 0);
  if v_total = 0 then
    raise exception 'Lista de expedientes vazia.';
  end if;

  -- Contexto para triggers de log
  perform set_config('app.current_user_id', p_usuario_id::text, true);

  -- UPDATE transacional único: ou todos os ids existentes são atualizados, ou nenhum.
  update public.expedientes
  set responsavel_id = p_responsavel_id,
      updated_at = now()
  where id = any(p_expediente_ids);

  get diagnostics v_atualizados = row_count;

  if v_atualizados <> v_total then
    raise exception 'Expedientes não encontrados. Esperado: %, atualizado: %. Operação abortada.',
      v_total, v_atualizados;
  end if;

  return jsonb_build_object(
    'atualizados', v_atualizados,
    'total', v_total
  );
end;
$$;

grant execute on function public.bulk_atribuir_responsavel_expedientes(bigint[], bigint, bigint)
  to service_role;

comment on function public.bulk_atribuir_responsavel_expedientes(bigint[], bigint, bigint) is
  'Atribui um único responsável a múltiplos expedientes em transação única. All-or-nothing: se algum id não existir, aborta tudo.';

-- =============================================================================
-- bulk_baixar_expedientes
-- =============================================================================

create or replace function public.bulk_baixar_expedientes(
  p_expediente_ids bigint[],
  p_justificativa text,
  p_baixado_em timestamptz,
  p_usuario_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total int;
  v_ja_baixados int;
  v_atualizados int;
begin
  v_total := coalesce(array_length(p_expediente_ids, 1), 0);
  if v_total = 0 then
    raise exception 'Lista de expedientes vazia.';
  end if;

  if p_justificativa is null or length(trim(p_justificativa)) = 0 then
    raise exception 'Justificativa é obrigatória para baixa em massa.';
  end if;

  perform set_config('app.current_user_id', p_usuario_id::text, true);

  -- Pré-check: algum já baixado? Aborta antes de tocar em qualquer linha.
  select count(*) into v_ja_baixados
  from public.expedientes
  where id = any(p_expediente_ids)
    and baixado_em is not null;

  if v_ja_baixados > 0 then
    raise exception 'Existem % expediente(s) já baixado(s) na seleção. Operação abortada.',
      v_ja_baixados;
  end if;

  -- UPDATE transacional
  update public.expedientes
  set baixado_em = p_baixado_em,
      justificativa_baixa = p_justificativa,
      updated_at = now()
  where id = any(p_expediente_ids);

  get diagnostics v_atualizados = row_count;

  if v_atualizados <> v_total then
    raise exception 'Expedientes não encontrados. Esperado: %, atualizado: %. Operação abortada.',
      v_total, v_atualizados;
  end if;

  -- Auditoria: um log por expediente, no mesmo commit do UPDATE
  insert into public.logs_alteracao (
    tipo_entidade,
    entidade_id,
    tipo_evento,
    usuario_que_executou_id,
    dados_evento
  )
  select
    'expedientes',
    unnest(p_expediente_ids),
    'baixa_expediente',
    p_usuario_id,
    jsonb_build_object(
      'justificativa_baixa', p_justificativa,
      'baixado_em', p_baixado_em,
      'origem', 'bulk'
    );

  return jsonb_build_object(
    'atualizados', v_atualizados,
    'total', v_total
  );
end;
$$;

grant execute on function public.bulk_baixar_expedientes(bigint[], text, timestamptz, bigint)
  to service_role;

comment on function public.bulk_baixar_expedientes(bigint[], text, timestamptz, bigint) is
  'Baixa múltiplos expedientes em transação única. Falha se algum já estiver baixado ou não for encontrado. All-or-nothing.';
