-- ============================================================================
-- TRIGGER: Atribuição Automática de Responsável para Perícias
-- ============================================================================
-- Data: 2026-01-08
-- Objetivo: Quando uma perícia é inserida ou atualizada com processo_id,
--           atribuir automaticamente o mesmo responsável do processo
--
-- Lógica:
-- 1. Verifica se a perícia tem processo_id vinculado
-- 2. Busca o responsavel_id do processo
-- 3. Atribui o mesmo responsável à perícia
--
-- REGRA DE NEGÓCIO:
-- Quando um processo é atribuído a um usuário, todas as perícias desse
-- processo devem ser automaticamente atribuídas ao mesmo usuário
-- (espelhando o comportamento de expedientes)
-- ============================================================================

-- Função para atribuir responsável do processo à perícia
create or replace function atribuir_responsavel_pericia_automatico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_responsavel_processo bigint;
begin
  -- Apenas atribuir se:
  -- 1. Perícia ainda não tem responsável
  -- 2. Perícia tem processo_id vinculado
  if NEW.responsavel_id IS NOT NULL OR NEW.processo_id IS NULL then
    return NEW;
  end if;

  -- Buscar o responsável do processo vinculado
  select responsavel_id
  into v_responsavel_processo
  from acervo
  where id = NEW.processo_id
    and origem = 'acervo_geral';

  -- Se o processo tem responsável, atribuir à perícia
  if v_responsavel_processo IS NOT NULL then
    NEW.responsavel_id := v_responsavel_processo;
  end if;

  return NEW;
end;
$$;

-- Criar trigger que executa ANTES de INSERT ou UPDATE
drop trigger if exists trigger_atribuir_responsavel_pericia_automatico on pericias;

create trigger trigger_atribuir_responsavel_pericia_automatico
  before insert or update of processo_id, responsavel_id
  on pericias
  for each row
  execute function atribuir_responsavel_pericia_automatico();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
comment on function atribuir_responsavel_pericia_automatico is
'Atribui automaticamente à perícia o mesmo responsável do processo vinculado. Garante que perícias herdam o responsável do processo.';

-- ============================================================================
-- TRIGGER ADICIONAL: Atualizar perícias quando processo muda de responsável
-- ============================================================================
-- Quando um processo tem seu responsável alterado, todas as perícias
-- vinculadas devem ser atualizadas automaticamente

create or replace function propagar_responsavel_processo_para_pericias()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Apenas atuar se o responsavel_id mudou
  if NEW.responsavel_id IS DISTINCT FROM OLD.responsavel_id then
    -- Atualizar todas as perícias deste processo
    update pericias
    set
      responsavel_id = NEW.responsavel_id,
      updated_at = now()
    where processo_id = NEW.id;
  end if;

  return NEW;
end;
$$;

-- Criar trigger que executa DEPOIS de UPDATE no acervo
drop trigger if exists trigger_propagar_responsavel_para_pericias on acervo;

create trigger trigger_propagar_responsavel_para_pericias
  after update of responsavel_id
  on acervo
  for each row
  execute function propagar_responsavel_processo_para_pericias();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
comment on function propagar_responsavel_processo_para_pericias is
'Quando um processo tem seu responsável alterado, propaga automaticamente a mudança para todas as perícias vinculadas.';

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. Primeiro trigger (BEFORE INSERT/UPDATE em pericias):
--    - Atribui responsável na criação/atualização de perícia
--    - Usa processo_id para buscar o responsável
--
-- 2. Segundo trigger (AFTER UPDATE em acervo):
--    - Propaga mudanças de responsável do processo para perícias
--    - Garante consistência quando processo muda de responsável
--
-- 3. Se perícia já tem responsável, não sobrescreve (respeita atribuição manual)
--
-- 4. Se processo não tem responsável, perícia também não receberá
--
-- 5. Performance: SELECT simples por PK (id) do acervo - muito rápido
--    UPDATE pode afetar múltiplas perícias de uma vez
-- ============================================================================
