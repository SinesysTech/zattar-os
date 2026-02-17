-- Migration: Trigger de desativação automática de usuário
-- Descrição: Quando um usuário é desativado (ativo: true → false), automaticamente desatribui de processos, audiências, pendentes e expedientes
-- Registra log com contagem de itens desatribuídos

-- ============================================================================
-- Função do Trigger: desativar_usuario_auto_desatribuir
-- Descrição: Desatribui usuário de todos os itens quando desativado
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
begin
  -- Detectar mudança de ativo=true para ativo=false
  if old.ativo = true and new.ativo = false then

    -- Obter ID do usuário que está executando a operação
    -- Tenta obter do contexto da aplicação; se não existir, usa o ID do próprio usuário
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
        'contratos', v_count_contratos
      )
    );

    raise notice 'Usuário % desativado. Total de % item(ns) desatribuído(s)', new.nome_exibicao, v_total_itens;

  end if;

  return new;
end;
$$;

comment on function public.desativar_usuario_auto_desatribuir is
  'Trigger que automaticamente desatribui usuário de todos os itens (processos, audiências, pendentes, expedientes, contratos) ao ser desativado. Registra log com contagens.';

-- ============================================================================
-- Aplicar Trigger
-- ============================================================================
-- Remover trigger se já existir (para permitir rerun da migration)
drop trigger if exists trigger_desativar_usuario_auto_desatribuir on public.usuarios;

-- Criar trigger BEFORE UPDATE
-- Executado ANTES da atualização do campo 'ativo'
-- Condição: apenas quando o valor de 'ativo' mudar
create trigger trigger_desativar_usuario_auto_desatribuir
before update of ativo on public.usuarios
for each row
when (old.ativo is distinct from new.ativo)
execute function public.desativar_usuario_auto_desatribuir();

comment on trigger trigger_desativar_usuario_auto_desatribuir on public.usuarios is
  'Desatribui automaticamente usuário de todos os itens ao ser desativado (ativo: true → false). Registra log de desativação com contagem de itens.';
