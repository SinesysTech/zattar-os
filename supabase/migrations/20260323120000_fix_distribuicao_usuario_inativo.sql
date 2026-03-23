-- ============================================================================
-- FIX: Distribuição automática não deve atribuir a usuários inativos
-- ============================================================================
-- Data: 2026-03-23
-- Problema: Quando um usuário é desativado, ele é removido das atribuições
--           existentes, mas permanece na lista responsaveis_ids da
--           config_regioes_atribuicao. A distribuição automática continua
--           atribuindo processos a ele — e como seus processos foram zerados,
--           o método contagem_processos o escolhe PRIMEIRO (menor carga).
--
-- Correção em 2 partes:
-- 1. Atualizar trigger de distribuição para filtrar usuários inativos
-- 2. Atualizar trigger de desativação para remover o usuário de responsaveis_ids
-- ============================================================================

-- ============================================================================
-- PARTE 1: Atualizar função de distribuição automática de processos
-- Agora filtra usuários inativos antes de atribuir
-- ============================================================================

create or replace function atribuir_responsavel_processo_automatico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_regiao record;
  v_responsavel_escolhido bigint;
  v_min_processos bigint;
  v_responsavel_candidato bigint;
  v_count_processos bigint;
  v_estado record;
  v_novo_idx int;
  v_responsaveis_ativos bigint[];
begin
  -- Apenas atribuir se ainda não tem responsável e é acervo geral
  if NEW.responsavel_id IS NOT NULL OR NEW.origem != 'acervo_geral' then
    return NEW;
  end if;

  -- Buscar região que contém o TRT do processo (ordenado por prioridade)
  select * into v_regiao
  from config_regioes_atribuicao
  where ativo = true
    and NEW.trt = any(trts)
  order by prioridade desc
  limit 1;

  -- Se não encontrou região configurada, não atribui
  if v_regiao is null then
    return NEW;
  end if;

  -- Verificar se há responsáveis configurados
  if v_regiao.responsaveis_ids is null or array_length(v_regiao.responsaveis_ids, 1) is null then
    return NEW;
  end if;

  -- Filtrar apenas responsáveis ativos
  select array_agg(u_id)
  into v_responsaveis_ativos
  from unnest(v_regiao.responsaveis_ids) as u_id
  join usuarios on usuarios.id = u_id and usuarios.ativo = true;

  -- Se nenhum responsável ativo, não atribui
  if v_responsaveis_ativos is null or array_length(v_responsaveis_ativos, 1) is null then
    raise notice 'Nenhum responsável ativo encontrado para região "%" (TRT: %)', v_regiao.nome, NEW.trt;
    return NEW;
  end if;

  -- Selecionar responsável baseado no método de balanceamento
  case v_regiao.metodo_balanceamento
    when 'desativado' then
      -- Não atribui automaticamente
      return NEW;

    when 'round_robin' then
      -- Round-robin: próximo da lista de forma circular (usando apenas ativos)
      select * into v_estado
      from config_atribuicao_estado
      where regiao_id = v_regiao.id;

      if v_estado is null then
        -- Primeiro uso: criar estado com índice 1
        v_novo_idx := 1;
        insert into config_atribuicao_estado (regiao_id, ultimo_responsavel_idx)
        values (v_regiao.id, 1);
      else
        -- Calcular próximo índice (circular) usando array de ativos
        v_novo_idx := (v_estado.ultimo_responsavel_idx % array_length(v_responsaveis_ativos, 1)) + 1;
        update config_atribuicao_estado
        set ultimo_responsavel_idx = v_novo_idx, updated_at = now()
        where regiao_id = v_regiao.id;
      end if;

      v_responsavel_escolhido := v_responsaveis_ativos[v_novo_idx];

    else -- 'contagem_processos' (default)
      -- Balanceamento por menor carga de trabalho (apenas ativos)
      v_min_processos := 9999999;
      v_responsavel_escolhido := v_responsaveis_ativos[1];

      foreach v_responsavel_candidato in array v_responsaveis_ativos loop
        -- Contar processos únicos atribuídos a este responsável
        select count(distinct numero_processo) into v_count_processos
        from acervo
        where origem = 'acervo_geral'
          and responsavel_id = v_responsavel_candidato;

        -- Escolher o que tem menos processos
        if v_count_processos < v_min_processos then
          v_min_processos := v_count_processos;
          v_responsavel_escolhido := v_responsavel_candidato;
        end if;
      end loop;
  end case;

  -- Atribuir o responsável escolhido
  NEW.responsavel_id := v_responsavel_escolhido;
  return NEW;
end;
$$;

comment on function atribuir_responsavel_processo_automatico is
'Atribui automaticamente responsável para novos processos do acervo geral.
Utiliza a tabela config_regioes_atribuicao para determinar qual responsável atribuir
baseado no TRT do processo e no método de balanceamento configurado.
IMPORTANTE: Filtra apenas usuários ativos (ativo=true) antes da distribuição.';

-- ============================================================================
-- PARTE 2: Atualizar trigger de desativação para remover de responsaveis_ids
-- Quando um usuário é desativado, além de desatribuir os itens existentes,
-- agora também remove o ID do usuário de config_regioes_atribuicao
-- ============================================================================

create or replace function public.desativar_usuario_auto_desatribuir()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count_processos int := 0;
  v_count_audiencias int := 0;
  v_count_pendentes int := 0;
  v_count_expedientes int := 0;
  v_count_contratos int := 0;
  v_total_itens int := 0;
  v_usuario_executante_id bigint;
  v_regioes_removidas text[];
  v_regiao record;
begin
  -- Detectar mudança de ativo=true para ativo=false
  if old.ativo = true and new.ativo = false then

    -- Obter ID do usuário que está executando a operação
    begin
      v_usuario_executante_id := coalesce(
        nullif(current_setting('app.current_user_id', true), '')::bigint,
        new.id
      );
    exception
      when others then
        v_usuario_executante_id := new.id;
    end;

    -- Contar itens atribuídos (para log posterior)
    select count(*) into v_count_processos
    from public.acervo
    where responsavel_id = new.id;

    select count(*) into v_count_audiencias
    from public.audiencias
    where responsavel_id = new.id;

    select count(*) into v_count_pendentes
    from public.pendentes_manifestacao
    where responsavel_id = new.id;

    select count(*) into v_count_expedientes
    from public.expedientes_manuais
    where responsavel_id = new.id;

    select count(*) into v_count_contratos
    from public.contratos
    where responsavel_id = new.id;

    v_total_itens := v_count_processos + v_count_audiencias + v_count_pendentes + v_count_expedientes + v_count_contratos;

    -- Desatribuir processos (acervo)
    if v_count_processos > 0 then
      update public.acervo
      set responsavel_id = null
      where responsavel_id = new.id;

      raise notice 'Desatribuídos % processo(s) do usuário %', v_count_processos, new.nome_exibicao;
    end if;

    -- Desatribuir audiências
    if v_count_audiencias > 0 then
      update public.audiencias
      set responsavel_id = null
      where responsavel_id = new.id;

      raise notice 'Desatribuídas % audiência(s) do usuário %', v_count_audiencias, new.nome_exibicao;
    end if;

    -- Desatribuir pendentes de manifestação
    if v_count_pendentes > 0 then
      update public.pendentes_manifestacao
      set responsavel_id = null
      where responsavel_id = new.id;

      raise notice 'Desatribuídos % pendente(s) do usuário %', v_count_pendentes, new.nome_exibicao;
    end if;

    -- Desatribuir expedientes manuais
    if v_count_expedientes > 0 then
      update public.expedientes_manuais
      set responsavel_id = null
      where responsavel_id = new.id;

      raise notice 'Desatribuídos % expediente(s) do usuário %', v_count_expedientes, new.nome_exibicao;
    end if;

    -- Desatribuir contratos
    if v_count_contratos > 0 then
      update public.contratos
      set responsavel_id = null
      where responsavel_id = new.id;

      raise notice 'Desatribuídos % contrato(s) do usuário %', v_count_contratos, new.nome_exibicao;
    end if;

    -- Remover usuário de config_regioes_atribuicao.responsaveis_ids
    v_regioes_removidas := ARRAY[]::text[];
    for v_regiao in
      select id, nome
      from public.config_regioes_atribuicao
      where new.id = any(responsaveis_ids)
    loop
      update public.config_regioes_atribuicao
      set responsaveis_ids = array_remove(responsaveis_ids, new.id)
      where id = v_regiao.id;

      v_regioes_removidas := array_append(v_regioes_removidas, v_regiao.nome);
    end loop;

    if array_length(v_regioes_removidas, 1) > 0 then
      raise notice 'Usuário % removido da distribuição automática das regiões: %',
        new.nome_exibicao, array_to_string(v_regioes_removidas, ', ');
    end if;

    -- Registrar log de desativação com contagem de itens
    insert into public.logs_alteracao (
      tipo_entidade,
      entidade_id,
      tipo_evento,
      usuario_que_executou_id,
      dados_evento
    ) values (
      'usuarios',
      new.id,
      'desativacao_usuario',
      v_usuario_executante_id,
      jsonb_build_object(
        'nome_usuario', new.nome_exibicao,
        'total_itens_desatribuidos', v_total_itens,
        'processos', v_count_processos,
        'audiencias', v_count_audiencias,
        'pendentes', v_count_pendentes,
        'expedientes_manuais', v_count_expedientes,
        'contratos', v_count_contratos,
        'regioes_distribuicao_removidas', to_jsonb(v_regioes_removidas)
      )
    );

    raise notice 'Usuário % desativado. Total de % item(ns) desatribuído(s)', new.nome_exibicao, v_total_itens;

  end if;

  return new;
end;
$$;

comment on function public.desativar_usuario_auto_desatribuir is
  'Trigger que automaticamente desatribui usuário de todos os itens (processos, audiências, pendentes, expedientes, contratos) ao ser desativado. Também remove o usuário da configuração de distribuição automática (config_regioes_atribuicao). Registra log com contagens.';

-- ============================================================================
-- NOTAS
-- ============================================================================
-- 1. PARTE 1: A função de distribuição agora faz JOIN com a tabela usuarios
--    para filtrar apenas responsáveis com ativo=true. Isso é uma defesa em
--    profundidade — mesmo que o ID permaneça na lista, ele não será usado.
--
-- 2. PARTE 2: O trigger de desativação agora usa array_remove() para limpar
--    o ID do usuário de todas as regiões de distribuição. Isso garante que
--    a configuração reflita a realidade.
--
-- 3. Ambas as correções são complementares:
--    - PARTE 1: Proteção no momento da distribuição (safety net)
--    - PARTE 2: Limpeza proativa na desativação (source of truth)
--
-- 4. O log de desativação agora inclui as regiões de onde o usuário foi removido
-- ============================================================================
