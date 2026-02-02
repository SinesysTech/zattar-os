-- Migration: Create Generic Audit Trigger
-- Creates a function and triggers to log manual changes in tracked tables

-- Function to log generic changes
create or replace function public.log_generic_changes()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_tipo_entidade text;
  v_usuario_executou_id bigint;
  v_changes jsonb;
  v_old_data jsonb;
  v_new_data jsonb;
  v_key text;
  v_val_old jsonb;
  v_val_new jsonb;
begin
  -- Determine entity type based on table name
  v_tipo_entidade := tg_table_name;
  
  -- Get current user from app context
  -- Assumes app.current_user_id is set by the application
  v_usuario_executou_id := coalesce(
    (current_setting('app.current_user_id', true))::bigint,
    null
  );
  
  -- If no user in context, do not log (system/robot changes)
  if v_usuario_executou_id is null then
    return new;
  end if;

  -- Initialize changes object
  v_changes := '{}'::jsonb;
  v_old_data := to_jsonb(old);
  v_new_data := to_jsonb(new);

  -- Iterate over columns to find differences
  for v_key in select jsonb_object_keys(v_new_data)
  loop
    -- Skip ignored columns
    continue when v_key in ('updated_at', 'created_at', 'dados_anteriores', 'responsavel_id', 'dados_antigos', 'search_vector');

    v_val_old := v_old_data -> v_key;
    v_val_new := v_new_data -> v_key;

    -- Compare values (handling nulls)
    if v_val_old is distinct from v_val_new then
      -- Add to changes log
      v_changes := v_changes || jsonb_build_object(
        v_key, jsonb_build_object('old', v_val_old, 'new', v_val_new)
      );
    end if;
  end loop;

  -- If there are changes, insert log
  if v_changes != '{}'::jsonb then
    insert into public.logs_alteracao (
      tipo_entidade,
      entidade_id,
      tipo_evento,
      usuario_que_executou_id,
      dados_evento
    ) values (
      v_tipo_entidade,
      new.id,
      'alteracao_manual', -- Generic event type for manual edits
      v_usuario_executou_id,
      jsonb_build_object('changes', v_changes)
    );
  end if;
  
  return new;
end;
$$;

comment on function public.log_generic_changes() is 'Trigger function to log manual changes to generic fields, ignoring system updates and specific columns';

-- Apply triggers to tables

-- Audiencias
drop trigger if exists log_changes_audiencias on public.audiencias;
create trigger log_changes_audiencias
after update on public.audiencias
for each row
execute function public.log_generic_changes();

-- Expedientes
drop trigger if exists log_changes_expedientes on public.expedientes;
create trigger log_changes_expedientes
after update on public.expedientes
for each row
execute function public.log_generic_changes();

-- Pericias
drop trigger if exists log_changes_pericias on public.pericias;
create trigger log_changes_pericias
after update on public.pericias
for each row
execute function public.log_generic_changes();
