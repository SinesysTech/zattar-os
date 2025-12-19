-- ============================================================================
-- TRIGGER: Atribuição Automática de Responsável para Processos (acervo)
-- ============================================================================
-- Data: 2025-01-24
-- Objetivo: Quando um novo processo é inserido ou atualizado sem responsável,
--           atribuir automaticamente ao responsável da região com menor carga
--
-- Lógica:
-- 1. Identifica a região pelo TRT
-- 2. Lista os responsáveis daquela região
-- 3. Conta quantos processos únicos cada um já tem
-- 4. Atribui ao responsável com MENOS processos (balanceamento)
--
-- REGIÕES:
-- - SUDESTE: Guido (21) e Tamiris (22) - TRT1, TRT2, TRT3, TRT15, TRT17
-- - OUTRAS: Ister (24) e Tiago (20) - Demais TRTs
-- ============================================================================

-- Função para atribuir responsável baseado na região e balanceamento
create or replace function atribuir_responsavel_processo_automatico()
returns trigger
language plpgsql
security definer
as $$
declare
  v_regiao text;
  v_responsavel_ids bigint[];
  v_responsavel_escolhido bigint;
  v_min_processos bigint;
  v_responsavel_candidato bigint;
  v_count_processos bigint;
begin
  -- Apenas atribuir se ainda não tem responsável e é acervo geral
  if NEW.responsavel_id IS NOT NULL OR NEW.origem != 'acervo_geral' then
    return NEW;
  end if;

  -- 1. Identificar região pelo TRT
  if NEW.trt IN ('TRT1', 'TRT2', 'TRT3', 'TRT15', 'TRT17') then
    v_regiao := 'sudeste';
    v_responsavel_ids := ARRAY[21, 22]; -- Guido e Tamiris
  else
    v_regiao := 'outras';
    v_responsavel_ids := ARRAY[24, 20]; -- Ister e Tiago
  end if;

  -- 2. Encontrar o responsável com MENOS processos únicos
  v_min_processos := 9999999; -- Valor inicial alto
  v_responsavel_escolhido := v_responsavel_ids[1]; -- Default

  -- Iterar pelos responsáveis da região
  foreach v_responsavel_candidato in array v_responsavel_ids
  loop
    -- Contar quantos processos únicos este responsável já tem
    select count(distinct numero_processo)
    into v_count_processos
    from acervo
    where origem = 'acervo_geral'
      and responsavel_id = v_responsavel_candidato;

    -- Se tem menos processos que o mínimo atual, escolhe este
    if v_count_processos < v_min_processos then
      v_min_processos := v_count_processos;
      v_responsavel_escolhido := v_responsavel_candidato;
    end if;
  end loop;

  -- 3. Atribuir o responsável escolhido
  NEW.responsavel_id := v_responsavel_escolhido;

  return NEW;
end;
$$;

-- Criar trigger que executa ANTES de INSERT ou UPDATE
drop trigger if exists trigger_atribuir_responsavel_automatico on acervo;

create trigger trigger_atribuir_responsavel_automatico
  before insert or update of responsavel_id
  on acervo
  for each row
  execute function atribuir_responsavel_processo_automatico();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
comment on function atribuir_responsavel_processo_automatico is
'Atribui automaticamente responsável para novos processos do acervo geral baseado na região (TRT) e balanceamento de carga. Escolhe o responsável da região com MENOS processos únicos.';

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. Trigger executa ANTES (BEFORE) do INSERT/UPDATE, modificando o NEW
-- 2. Conta processos ÚNICOS (distinct numero_processo) para balanceamento justo
-- 3. Apenas atua em processos de origem = 'acervo_geral'
-- 4. Se processo já tem responsável, não sobrescreve
-- 5. IDs dos responsáveis estão hardcoded (Guido:21, Tamiris:22, Ister:24, Tiago:20)
--    Se necessário alterar responsáveis no futuro, atualizar a função
-- 6. Performance: Faz SELECT count() a cada inserção - se virar gargalo,
--    considerar cache em Redis ou tabela de contadores
-- ============================================================================
