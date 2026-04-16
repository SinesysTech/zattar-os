-- ============================================================================
-- FIX: Restaura cast NEW.trt::text no trigger atribuir_responsavel_processo_automatico
-- ============================================================================
-- Data: 2026-04-16
-- Regressão: A correção original de 20260212000000_fix_trigger_enum_cast.sql
--            (que adicionou NEW.trt::text na comparação com trts text[]) foi
--            perdida em 20260323120000_fix_distribuicao_usuario_inativo.sql,
--            que reescreveu a função sem preservar o cast.
--
-- Sintoma: UPDATE em acervo falha com
--   ERROR: operator does not exist: codigo_tribunal = text
-- porque NEW.trt é enum codigo_tribunal e trts é text[].
--
-- Correção: Reaplica a versão de 20260323120000 com o cast ::text restaurado
-- na cláusula where da seleção de região.
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
  -- FIX RESTAURADO: Cast NEW.trt::text para permitir comparação com array text[]
  select * into v_regiao
  from config_regioes_atribuicao
  where ativo = true
    and NEW.trt::text = any(trts)
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
      return NEW;

    when 'round_robin' then
      select * into v_estado
      from config_atribuicao_estado
      where regiao_id = v_regiao.id;

      if v_estado is null then
        v_novo_idx := 1;
        insert into config_atribuicao_estado (regiao_id, ultimo_responsavel_idx)
        values (v_regiao.id, 1);
      else
        v_novo_idx := (v_estado.ultimo_responsavel_idx % array_length(v_responsaveis_ativos, 1)) + 1;
        update config_atribuicao_estado
        set ultimo_responsavel_idx = v_novo_idx, updated_at = now()
        where regiao_id = v_regiao.id;
      end if;

      v_responsavel_escolhido := v_responsaveis_ativos[v_novo_idx];

    else -- 'contagem_processos' (default)
      v_min_processos := 9999999;
      v_responsavel_escolhido := v_responsaveis_ativos[1];

      foreach v_responsavel_candidato in array v_responsaveis_ativos loop
        select count(distinct numero_processo) into v_count_processos
        from acervo
        where origem = 'acervo_geral'
          and responsavel_id = v_responsavel_candidato;

        if v_count_processos < v_min_processos then
          v_min_processos := v_count_processos;
          v_responsavel_escolhido := v_responsavel_candidato;
        end if;
      end loop;
  end case;

  NEW.responsavel_id := v_responsavel_escolhido;
  return NEW;
end;
$$;

comment on function atribuir_responsavel_processo_automatico is
'Atribui automaticamente responsável para novos processos do acervo geral.
Filtra apenas usuários ativos. Cast enum->text restaurado após regressão em 20260323120000.';
