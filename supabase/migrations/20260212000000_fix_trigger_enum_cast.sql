-- ============================================================================
-- FIX: Cast enum to text in trigger function
-- ============================================================================
-- Data: 2026-02-12
-- Problema: A função atribuir_responsavel_processo_automatico() compara
--           NEW.trt (enum codigo_tribunal) com trts (text[]) sem cast,
--           causando erro: operator does not exist: codigo_tribunal = text
-- Solução: Adicionar cast explícito NEW.trt::text
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
begin
  -- Apenas atribuir se ainda não tem responsável e é acervo geral
  if NEW.responsavel_id IS NOT NULL OR NEW.origem != 'acervo_geral' then
    return NEW;
  end if;

  -- Buscar região que contém o TRT do processo (ordenado por prioridade)
  -- FIX: Cast NEW.trt::text para permitir comparação com array text[]
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

  -- Selecionar responsável baseado no método de balanceamento
  case v_regiao.metodo_balanceamento
    when 'desativado' then
      -- Não atribui automaticamente
      return NEW;

    when 'round_robin' then
      -- Round-robin: próximo da lista de forma circular
      select * into v_estado
      from config_atribuicao_estado
      where regiao_id = v_regiao.id;

      if v_estado is null then
        -- Primeiro uso: criar estado com índice 1
        v_novo_idx := 1;
        insert into config_atribuicao_estado (regiao_id, ultimo_responsavel_idx)
        values (v_regiao.id, 1);
      else
        -- Calcular próximo índice (circular)
        v_novo_idx := (v_estado.ultimo_responsavel_idx % array_length(v_regiao.responsaveis_ids, 1)) + 1;
        update config_atribuicao_estado
        set ultimo_responsavel_idx = v_novo_idx, updated_at = now()
        where regiao_id = v_regiao.id;
      end if;

      v_responsavel_escolhido := v_regiao.responsaveis_ids[v_novo_idx];

    else -- 'contagem_processos' (default)
      -- Balanceamento por menor carga de trabalho
      v_min_processos := 9999999;
      v_responsavel_escolhido := v_regiao.responsaveis_ids[1];

      foreach v_responsavel_candidato in array v_regiao.responsaveis_ids loop
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
baseado no TRT do processo e no método de balanceamento configurado (contagem_processos, round_robin, ou desativado).
CORRIGIDO: Cast explícito de enum para text na comparação com array.';
