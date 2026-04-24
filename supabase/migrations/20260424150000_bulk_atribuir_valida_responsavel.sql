-- Migration: validar que o responsavelId é um usuário ativo
--
-- Antes a RPC aceitava qualquer bigint em p_responsavel_id e confiava na FK
-- constraint do Postgres — mas a FK não distingue usuário ativo de inativo,
-- e passar o ID de um usuário desativado gerava atribuição inválida sem erro.
--
-- Esta redefinição adiciona um check explícito dentro da mesma transação:
-- se p_responsavel_id não é null, o usuário precisa existir E estar ativo.

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
  v_responsavel_ativo boolean;
begin
  v_total := coalesce(array_length(p_expediente_ids, 1), 0);
  if v_total = 0 then
    raise exception 'Lista de expedientes vazia.';
  end if;

  -- Se há um responsável, precisa existir E estar ativo. Remoção
  -- (p_responsavel_id IS NULL) é sempre permitida.
  if p_responsavel_id is not null then
    select ativo into v_responsavel_ativo
    from public.usuarios
    where id = p_responsavel_id;

    if not found then
      raise exception 'Responsável % não encontrado.', p_responsavel_id;
    end if;

    if v_responsavel_ativo is not true then
      raise exception 'Responsável % está inativo — não pode receber atribuições.', p_responsavel_id;
    end if;
  end if;

  perform set_config('app.current_user_id', p_usuario_id::text, true);

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

comment on function public.bulk_atribuir_responsavel_expedientes(bigint[], bigint, bigint) is
  'Atribui responsável a múltiplos expedientes em transação única. Valida que o responsável (se não-null) existe e está ativo. All-or-nothing.';
