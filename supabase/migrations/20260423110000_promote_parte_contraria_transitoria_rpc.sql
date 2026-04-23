-- Migration: RPC transacional para promover parte contrária transitória
-- Data: 2026-04-23 11:00:00
-- Descrição: Função que, numa única transação, (a) atualiza todas as
--            linhas de contrato_partes que apontam para a transitória
--            para passarem a apontar para uma parte_contraria definitiva,
--            e (b) marca a transitória como promovida (status='promovido').
--
-- Chamada pelo backend via supabase.rpc('promote_parte_contraria_transitoria', ...)
-- após ter criado (ou identificado) a parte_contraria alvo.

create or replace function public.promote_parte_contraria_transitoria(
  p_transitoria_id bigint,
  p_parte_contraria_id bigint,
  p_promovido_por bigint
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_transitoria record;
  v_parte record;
  v_contratos_atualizados integer;
begin
  -- Lock otimista na transitória (evita dupla promoção simultânea)
  select * into v_transitoria
  from public.partes_contrarias_transitorias
  where id = p_transitoria_id
  for update;

  if not found then
    raise exception 'Transitória % não encontrada', p_transitoria_id
      using errcode = 'P0001';
  end if;

  if v_transitoria.status = 'promovido' then
    raise exception 'Transitória % já foi promovida (promovido_para_id=%)',
      p_transitoria_id, v_transitoria.promovido_para_id
      using errcode = 'P0001';
  end if;

  -- Valida que a parte_contraria alvo existe
  select id into v_parte
  from public.partes_contrarias
  where id = p_parte_contraria_id;

  if not found then
    raise exception 'Parte contrária % não encontrada', p_parte_contraria_id
      using errcode = 'P0001';
  end if;

  -- Atualiza contrato_partes: troca tipo_entidade e entidade_id para apontar
  -- para a parte_contraria definitiva. Captura quantas linhas foram afetadas
  -- para auditoria.
  update public.contrato_partes
  set
    tipo_entidade = 'parte_contraria',
    entidade_id = p_parte_contraria_id
  where tipo_entidade = 'parte_contraria_transitoria'
    and entidade_id = p_transitoria_id;

  get diagnostics v_contratos_atualizados = row_count;

  -- Marca a transitória como promovida
  update public.partes_contrarias_transitorias
  set
    status = 'promovido',
    promovido_para_id = p_parte_contraria_id,
    promovido_por = p_promovido_por,
    promovido_em = now()
  where id = p_transitoria_id;

  return jsonb_build_object(
    'transitoria_id', p_transitoria_id,
    'parte_contraria_id', p_parte_contraria_id,
    'contratos_atualizados', v_contratos_atualizados,
    'promovido_em', now()
  );
end;
$$;

comment on function public.promote_parte_contraria_transitoria is
  'Promove uma parte contrária transitória para uma parte_contraria definitiva, atualizando todas as linhas de contrato_partes que a referenciavam. Transacional. Retorna jsonb com transitoria_id, parte_contraria_id, contratos_atualizados (int) e promovido_em. Lança exceção com errcode P0001 se a transitória não existir, já foi promovida, ou a parte_contraria alvo não existir.';

-- Permite que usuários autenticados executem. Permissão de negócio (quem
-- pode promover) é validada no backend via checkPermission antes da chamada.
grant execute on function public.promote_parte_contraria_transitoria(bigint, bigint, bigint)
  to authenticated, service_role;
