-- Propagação de tags contrato → processo

create or replace function public.propagate_contrato_tags_on_contrato_processos_insert()
returns trigger
language plpgsql
as $$
begin
  insert into public.processo_tags (processo_id, tag_id)
  select new.processo_id, ct.tag_id
  from public.contrato_tags ct
  where ct.contrato_id = new.contrato_id
  on conflict (processo_id, tag_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_propagate_contrato_tags_on_contrato_processos_insert on public.contrato_processos;

create trigger trg_propagate_contrato_tags_on_contrato_processos_insert
after insert on public.contrato_processos
for each row
execute function public.propagate_contrato_tags_on_contrato_processos_insert();

create or replace function public.propagate_contrato_tags_on_contrato_tags_insert()
returns trigger
language plpgsql
as $$
begin
  insert into public.processo_tags (processo_id, tag_id)
  select cp.processo_id, new.tag_id
  from public.contrato_processos cp
  where cp.contrato_id = new.contrato_id
  on conflict (processo_id, tag_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_propagate_contrato_tags_on_contrato_tags_insert on public.contrato_tags;

create trigger trg_propagate_contrato_tags_on_contrato_tags_insert
after insert on public.contrato_tags
for each row
execute function public.propagate_contrato_tags_on_contrato_tags_insert();
