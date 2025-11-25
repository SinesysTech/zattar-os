-- ============================================================================
-- TRIGGER: Atribuição Automática de Responsável para Expedientes
-- ============================================================================
-- Data: 2025-01-24
-- Objetivo: Quando um expediente é inserido ou atualizado com processo_id,
--           atribuir automaticamente o mesmo responsável do processo
--
-- Lógica:
-- 1. Verifica se o expediente tem processo_id vinculado
-- 2. Busca o responsavel_id do processo
-- 3. Atribui o mesmo responsável ao expediente
--
-- REGRA DE NEGÓCIO:
-- Quando um processo é atribuído a um usuário, todos os expedientes desse
-- processo devem ser automaticamente atribuídos ao mesmo usuário
-- ============================================================================

-- Função para atribuir responsável do processo ao expediente
create or replace function atribuir_responsavel_expediente_automatico()
returns trigger
language plpgsql
security definer
as $$
declare
  v_responsavel_processo bigint;
begin
  -- Apenas atribuir se:
  -- 1. Expediente ainda não tem responsável
  -- 2. Expediente tem processo_id vinculado
  if NEW.responsavel_id IS NOT NULL OR NEW.processo_id IS NULL then
    return NEW;
  end if;

  -- Buscar o responsável do processo vinculado
  select responsavel_id
  into v_responsavel_processo
  from acervo
  where id = NEW.processo_id
    and origem = 'acervo_geral';

  -- Se o processo tem responsável, atribuir ao expediente
  if v_responsavel_processo IS NOT NULL then
    NEW.responsavel_id := v_responsavel_processo;
  end if;

  return NEW;
end;
$$;

-- Criar trigger que executa ANTES de INSERT ou UPDATE
drop trigger if exists trigger_atribuir_responsavel_expediente_automatico on pendentes_manifestacao;

create trigger trigger_atribuir_responsavel_expediente_automatico
  before insert or update of processo_id, responsavel_id
  on pendentes_manifestacao
  for each row
  execute function atribuir_responsavel_expediente_automatico();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
comment on function atribuir_responsavel_expediente_automatico is
'Atribui automaticamente ao expediente o mesmo responsável do processo vinculado. Garante que expedientes herdam o responsável do processo.';

-- ============================================================================
-- TRIGGER ADICIONAL: Atualizar expedientes quando processo muda de responsável
-- ============================================================================
-- Quando um processo tem seu responsável alterado, todos os expedientes
-- vinculados devem ser atualizados automaticamente

create or replace function propagar_responsavel_processo_para_expedientes()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Apenas atuar se o responsavel_id mudou
  if NEW.responsavel_id IS DISTINCT FROM OLD.responsavel_id then
    -- Atualizar todos os expedientes deste processo
    update pendentes_manifestacao
    set
      responsavel_id = NEW.responsavel_id,
      updated_at = now()
    where processo_id = NEW.id;
  end if;

  return NEW;
end;
$$;

-- Criar trigger que executa DEPOIS de UPDATE no acervo
drop trigger if exists trigger_propagar_responsavel_para_expedientes on acervo;

create trigger trigger_propagar_responsavel_para_expedientes
  after update of responsavel_id
  on acervo
  for each row
  execute function propagar_responsavel_processo_para_expedientes();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
comment on function propagar_responsavel_processo_para_expedientes is
'Quando um processo tem seu responsável alterado, propaga automaticamente a mudança para todos os expedientes vinculados.';

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. Primeiro trigger (BEFORE INSERT/UPDATE em pendentes_manifestacao):
--    - Atribui responsável na criação/atualização de expediente
--    - Usa processo_id para buscar o responsável
--
-- 2. Segundo trigger (AFTER UPDATE em acervo):
--    - Propaga mudanças de responsável do processo para expedientes
--    - Garante consistência quando processo muda de responsável
--
-- 3. Se expediente já tem responsável, não sobrescreve (respeita atribuição manual)
--
-- 4. Se processo não tem responsável, expediente também não receberá
--
-- 5. Performance: SELECT simples por PK (id) do acervo - muito rápido
--    UPDATE pode afetar múltiplos expedientes de uma vez
-- ============================================================================
