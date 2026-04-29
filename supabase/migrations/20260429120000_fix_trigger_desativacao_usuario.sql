-- Migration: Corrige trigger e RPCs de desativação de usuário
-- Problema: trigger e RPCs referenciavam public.pendentes_manifestacao e
-- public.expedientes_manuais, que não existem em produção.
-- A tabela correta para pendentes é public.expedientes.

-- ============================================================================
-- Corrigir: desatribuir_todos_pendentes_usuario
-- ============================================================================
create or replace function public.desatribuir_todos_pendentes_usuario(
  p_usuario_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.expedientes
  set responsavel_id = null
  where responsavel_id = p_usuario_id;
end;
$$;

comment on function public.desatribuir_todos_pendentes_usuario(bigint) is
  'Desatribui todos os expedientes (pendentes de manifestação) de um usuário. Usado na desativação de usuário.';

-- ============================================================================
-- Corrigir: desatribuir_todos_expedientes_usuario (tabela expedientes_manuais
-- não existe; a função agora é no-op para evitar erros)
-- ============================================================================
create or replace function public.desatribuir_todos_expedientes_usuario(
  p_usuario_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- expedientes_manuais não existe; expedientes já é tratado por
  -- desatribuir_todos_pendentes_usuario
  null;
end;
$$;

comment on function public.desatribuir_todos_expedientes_usuario(bigint) is
  'No-op: expedientes_manuais foi consolidado em expedientes. Mantido para compatibilidade.';

-- ============================================================================
-- Corrigir: trigger desativar_usuario_auto_desatribuir
-- Remove referências a pendentes_manifestacao e expedientes_manuais
-- ============================================================================
create or replace function public.desativar_usuario_auto_desatribuir()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count_processos   int := 0;
  v_count_audiencias  int := 0;
  v_count_pendentes   int := 0;
  v_count_contratos   int := 0;
  v_total_itens       int := 0;
  v_usuario_executante_id bigint;
begin
  if old.ativo = true and new.ativo = false then

    begin
      v_usuario_executante_id := coalesce(
        nullif(current_setting('app.current_user_id', true), '')::bigint,
        new.id
      );
    exception
      when others then
        v_usuario_executante_id := new.id;
    end;

    select count(*) into v_count_processos
    from public.acervo
    where responsavel_id = new.id;

    select count(*) into v_count_audiencias
    from public.audiencias
    where responsavel_id = new.id;

    select count(*) into v_count_pendentes
    from public.expedientes
    where responsavel_id = new.id;

    select count(*) into v_count_contratos
    from public.contratos
    where responsavel_id = new.id;

    v_total_itens := v_count_processos + v_count_audiencias + v_count_pendentes + v_count_contratos;

    if v_count_processos > 0 then
      update public.acervo
      set responsavel_id = null
      where responsavel_id = new.id;
    end if;

    if v_count_audiencias > 0 then
      update public.audiencias
      set responsavel_id = null
      where responsavel_id = new.id;
    end if;

    if v_count_pendentes > 0 then
      update public.expedientes
      set responsavel_id = null
      where responsavel_id = new.id;
    end if;

    if v_count_contratos > 0 then
      update public.contratos
      set responsavel_id = null
      where responsavel_id = new.id;
    end if;

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
        'nome_usuario',              new.nome_exibicao,
        'total_itens_desatribuidos', v_total_itens,
        'processos',                 v_count_processos,
        'audiencias',                v_count_audiencias,
        'pendentes',                 v_count_pendentes,
        'contratos',                 v_count_contratos
      )
    );

  end if;

  return new;
end;
$$;

comment on function public.desativar_usuario_auto_desatribuir is
  'Trigger que automaticamente desatribui usuário de todos os itens ao ser desativado. Tabelas: acervo, audiencias, expedientes, contratos.';
