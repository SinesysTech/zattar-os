-- =============================================================================
-- Migration: Fix References to Renamed Tables
-- Descrição: Atualiza todas as funções e triggers que ainda referenciam
--            pendentes_manifestacao (renomeada para expedientes) e
--            expedientes_manuais (merged em expedientes)
-- Data: 2024-12-24
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: DROP TRIGGERS (Remove Dependencies)
-- -----------------------------------------------------------------------------

-- Drop triggers on expedientes table to recreate them
drop trigger if exists trigger_atribuir_responsavel_expediente_automatico on expedientes;
drop trigger if exists log_atribuicao_expedientes on expedientes;
drop trigger if exists trigger_desativar_usuario_auto_desatribuir on public.usuarios;

-- -----------------------------------------------------------------------------
-- STEP 2: DROP OBSOLETE VIEW
-- -----------------------------------------------------------------------------

-- Remove expedientes_unificados view completely (no backward compatibility)
-- This view is now obsolete since expedientes_manuais was merged into expedientes
drop view if exists public.expedientes_unificados;

-- -----------------------------------------------------------------------------
-- STEP 3: UPDATE FUNCTIONS (Fix Table References)
-- -----------------------------------------------------------------------------

-- 1. Update atribuir_responsavel_pendente() - CRITICAL FIX
create or replace function public.atribuir_responsavel_pendente(
  pendente_id bigint,
  responsavel_id_param bigint,
  usuario_executou_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  resultado jsonb;
begin
  -- Definir contexto do usuário antes do UPDATE
  perform set_config('app.current_user_id', usuario_executou_id::text, false);

  -- Executar UPDATE (FIXED: expedientes instead of pendentes_manifestacao)
  update public.expedientes
  set responsavel_id = responsavel_id_param
  where id = pendente_id
  returning to_jsonb(expedientes.*) into resultado;

  -- Limpar contexto
  perform set_config('app.current_user_id', '', true);

  return resultado;
end;
$$;

comment on function public.atribuir_responsavel_pendente(bigint, bigint, bigint) is
'Atribui responsável a um expediente com contexto de usuário para trigger de log';

-- 2. Update propagar_responsavel_processo_para_expedientes()
create or replace function propagar_responsavel_processo_para_expedientes()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Apenas atuar se o responsavel_id mudou
  if NEW.responsavel_id IS DISTINCT FROM OLD.responsavel_id then
    -- Atualizar todos os expedientes deste processo (FIXED: expedientes instead of pendentes_manifestacao)
    update expedientes
    set
      responsavel_id = NEW.responsavel_id,
      updated_at = now()
    where processo_id = NEW.id;
  end if;

  return NEW;
end;
$$;

comment on function propagar_responsavel_processo_para_expedientes is
'Quando um processo tem seu responsável alterado, propaga automaticamente a mudança para todos os expedientes vinculados.';

-- 3. Update desativar_usuario_auto_desatribuir() - MAJOR CLEANUP
create or replace function public.desativar_usuario_auto_desatribuir()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count_processos int := 0;
  v_count_audiencias int := 0;
  v_count_expedientes int := 0;  -- CLEANED: Single count for all expedientes
  v_count_contratos int := 0;
  v_total_itens int := 0;
  v_usuario_executante_id bigint;
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

    -- FIXED: Count from expedientes (unified table)
    select count(*) into v_count_expedientes
    from public.expedientes
    where responsavel_id = new.id;

    select count(*) into v_count_contratos
    from public.contratos
    where responsavel_id = new.id;

    v_total_itens := v_count_processos + v_count_audiencias + v_count_expedientes + v_count_contratos;

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

    -- FIXED: Unassign expedientes (unified table)
    if v_count_expedientes > 0 then
      update public.expedientes
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

    -- CLEANED: Log with single expedientes count (no legacy pendentes/expedientes_manuais split)
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
        'expedientes', v_count_expedientes,
        'contratos', v_count_contratos
      )
    );

    raise notice 'Usuário % desativado. Total de % item(ns) desatribuído(s)', new.nome_exibicao, v_total_itens;

  end if;

  return new;
end;
$$;

comment on function public.desativar_usuario_auto_desatribuir is
  'Trigger que automaticamente desatribui usuário de todos os itens (processos, audiências, expedientes, contratos) ao ser desativado. Registra log com contagens.';

-- -----------------------------------------------------------------------------
-- STEP 4: RECREATE TRIGGERS (On Correct Tables)
-- -----------------------------------------------------------------------------

-- Trigger on expedientes table (FIXED: not pendentes_manifestacao)
create trigger trigger_atribuir_responsavel_expediente_automatico
  before insert or update of processo_id, responsavel_id
  on expedientes
  for each row
  execute function atribuir_responsavel_expediente_automatico();

comment on trigger trigger_atribuir_responsavel_expediente_automatico on expedientes is
'Atribui automaticamente ao expediente o mesmo responsável do processo vinculado';

-- Log trigger on expedientes table (FIXED: not pendentes_manifestacao)
create trigger log_atribuicao_expedientes
  after update of responsavel_id on public.expedientes
  for each row
  when (old.responsavel_id is distinct from new.responsavel_id)
  execute function public.log_atribuicao_responsavel();

comment on trigger log_atribuicao_expedientes on public.expedientes is
'Registra automaticamente mudanças em responsavel_id na tabela expedientes';

-- User deactivation trigger (recreate - was dropped earlier)
create trigger trigger_desativar_usuario_auto_desatribuir
  before update of ativo on public.usuarios
  for each row
  when (old.ativo is distinct from new.ativo)
  execute function public.desativar_usuario_auto_desatribuir();

comment on trigger trigger_desativar_usuario_auto_desatribuir on public.usuarios is
  'Desatribui automaticamente usuário de todos os itens ao ser desativado (ativo: true → false). Registra log de desativação com contagem de itens.';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- All references to pendentes_manifestacao and expedientes_manuais removed
-- No backward compatibility, no adapters, no aliases - clean migration
-- =============================================================================
