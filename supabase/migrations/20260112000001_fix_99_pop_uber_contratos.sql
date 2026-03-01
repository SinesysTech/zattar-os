-- Migration: Corrige contratos com parte contrária "99 POP E UBER"
--
-- Problema: A parte contrária "99 POP E UBER" estava cadastrada incorretamente.
-- Na verdade, são dois contratos separados:
--   1. Um com "99 Tecnologia" (já existe)
--   2. Outro com "Uber Tecnologia do Brasil" (já existe)
--
-- Solução:
--   1. Para cada contrato com "99 POP E UBER":
--      - Altera a parte contrária para "99 Tecnologia"
--      - Cria um novo contrato idêntico com "Uber Tecnologia do Brasil"
--   2. Remove o registro de parte contrária "99 POP E UBER"

do $$
declare
  v_99_pop_uber_id bigint;
  v_99_tecnologia_id bigint;
  v_uber_id bigint;
  v_contrato record;
  v_parte record;
  v_novo_contrato_id bigint;
  v_papel_parte_contraria public.papel_contratual;
  v_contratos_processados integer := 0;
begin
  -- Buscar IDs das partes contrárias
  select id into v_99_pop_uber_id
  from public.partes_contrarias
  where nome ilike '%99 POP E UBER%'
  limit 1;

  select id into v_99_tecnologia_id
  from public.partes_contrarias
  where nome ilike '%99 Tecnologia%'
    and nome not ilike '%POP%'
    and nome not ilike '%UBER%'
  limit 1;

  select id into v_uber_id
  from public.partes_contrarias
  where nome ilike '%Uber%'
    and nome ilike '%Brasil%'
  limit 1;

  -- Validações
  if v_99_pop_uber_id is null then
    raise notice 'Parte contrária "99 POP E UBER" não encontrada. Migration não necessária.';
    return;
  end if;

  if v_99_tecnologia_id is null then
    raise exception 'Parte contrária "99 Tecnologia" não encontrada. Verifique o cadastro.';
  end if;

  if v_uber_id is null then
    raise exception 'Parte contrária "Uber Tecnologia do Brasil" não encontrada. Verifique o cadastro.';
  end if;

  raise notice 'IDs encontrados: 99 POP E UBER=%, 99 Tecnologia=%, Uber=% ',
    v_99_pop_uber_id, v_99_tecnologia_id, v_uber_id;

  -- Processar cada contrato que tem "99 POP E UBER" como parte contrária
  for v_parte in
    select cp.*, c.*
    from public.contrato_partes cp
    join public.contratos c on c.id = cp.contrato_id
    where cp.tipo_entidade = 'parte_contraria'
      and cp.entidade_id = v_99_pop_uber_id
  loop
    raise notice 'Processando contrato ID: %', v_parte.contrato_id;

    -- 1. Atualizar a parte contrária existente para "99 Tecnologia"
    update public.contrato_partes
    set
      entidade_id = v_99_tecnologia_id,
      nome_snapshot = (select nome from public.partes_contrarias where id = v_99_tecnologia_id)
    where id = v_parte.id;

    raise notice '  - Atualizado para 99 Tecnologia';

    -- 2. Criar novo contrato idêntico
    insert into public.contratos (
      segmento_id,
      tipo_contrato,
      tipo_cobranca,
      cliente_id,
      papel_cliente_no_contrato,
      status,
      cadastrado_em,
      responsavel_id,
      created_by,
      observacoes,
      dados_anteriores,
      created_at,
      updated_at
    )
    select
      segmento_id,
      tipo_contrato,
      tipo_cobranca,
      cliente_id,
      papel_cliente_no_contrato,
      status,
      cadastrado_em,
      responsavel_id,
      created_by,
      coalesce(observacoes, '') ||
        E'\n[Migration 20260112] Duplicado do contrato #' || v_parte.contrato_id ||
        ' - Separação de partes contrárias 99 POP E UBER',
      dados_anteriores,
      created_at,
      now()
    from public.contratos
    where id = v_parte.contrato_id
    returning id into v_novo_contrato_id;

    raise notice '  - Novo contrato criado ID: %', v_novo_contrato_id;

    -- 3. Copiar todas as partes do contrato original para o novo (exceto a parte 99 POP E UBER)
    -- Primeiro, copiar o cliente e outras partes
    insert into public.contrato_partes (
      contrato_id,
      tipo_entidade,
      entidade_id,
      papel_contratual,
      ordem,
      nome_snapshot,
      cpf_cnpj_snapshot
    )
    select
      v_novo_contrato_id,
      tipo_entidade,
      entidade_id,
      papel_contratual,
      ordem,
      nome_snapshot,
      cpf_cnpj_snapshot
    from public.contrato_partes
    where contrato_id = v_parte.contrato_id
      and id != v_parte.id; -- Exclui a parte 99 POP E UBER que foi atualizada

    raise notice '  - Partes copiadas (exceto parte contrária)';

    -- 4. Adicionar "Uber Tecnologia do Brasil" como parte contrária do novo contrato
    insert into public.contrato_partes (
      contrato_id,
      tipo_entidade,
      entidade_id,
      papel_contratual,
      ordem,
      nome_snapshot,
      cpf_cnpj_snapshot
    )
    values (
      v_novo_contrato_id,
      'parte_contraria',
      v_uber_id,
      v_parte.papel_contratual, -- Mesmo papel contratual da parte original
      v_parte.ordem,
      (select nome from public.partes_contrarias where id = v_uber_id),
      (select coalesce(cnpj, cpf) from public.partes_contrarias where id = v_uber_id)
    );

    raise notice '  - Uber Tecnologia do Brasil adicionada ao novo contrato';

    -- 5. Copiar histórico de status para o novo contrato
    insert into public.contrato_status_historico (
      contrato_id,
      from_status,
      to_status,
      changed_at,
      changed_by,
      reason,
      metadata
    )
    select
      v_novo_contrato_id,
      from_status,
      to_status,
      changed_at,
      changed_by,
      coalesce(reason, '') || ' [Duplicado do contrato #' || v_parte.contrato_id || ']',
      metadata
    from public.contrato_status_historico
    where contrato_id = v_parte.contrato_id;

    raise notice '  - Histórico de status copiado';

    -- 6. Copiar vínculos com processos (se existirem)
    insert into public.contrato_processos (
      contrato_id,
      processo_id
    )
    select
      v_novo_contrato_id,
      processo_id
    from public.contrato_processos
    where contrato_id = v_parte.contrato_id
    on conflict do nothing;

    raise notice '  - Vínculos com processos copiados';

    v_contratos_processados := v_contratos_processados + 1;
  end loop;

  raise notice 'Total de contratos processados: %', v_contratos_processados;

  -- 7. Deletar o registro de parte contrária "99 POP E UBER"
  -- Só deleta se não houver mais nenhum contrato vinculado
  if not exists (
    select 1 from public.contrato_partes
    where tipo_entidade = 'parte_contraria'
      and entidade_id = v_99_pop_uber_id
  ) then
    delete from public.partes_contrarias where id = v_99_pop_uber_id;
    raise notice 'Parte contrária "99 POP E UBER" (ID: %) removida com sucesso.', v_99_pop_uber_id;
  else
    raise warning 'Ainda existem contratos vinculados a "99 POP E UBER". Registro não foi removido.';
  end if;

  raise notice 'Migration concluída com sucesso!';
end;
$$;

-- Comentário final
comment on table public.contratos is 'Contratos jurídicos do escritório de advocacia';
