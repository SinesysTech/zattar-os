-- Seed: criar pipeline default para cada segmento ativo que não possui pipeline
-- Cada pipeline recebe 4 estágios padrão mapeando os status_contrato existentes

do $$
declare
  seg record;
  new_pipeline_id bigint;
begin
  for seg in
    select s.id, s.nome
    from public.segmentos s
    where s.ativo = true
      and not exists (
        select 1 from public.contrato_pipelines cp where cp.segmento_id = s.id
      )
    order by s.nome
  loop
    insert into public.contrato_pipelines (segmento_id, nome, descricao, ativo)
    values (seg.id, 'Pipeline ' || seg.nome, 'Pipeline padrão para ' || seg.nome, true)
    returning id into new_pipeline_id;

    insert into public.contrato_pipeline_estagios (pipeline_id, nome, slug, cor, ordem, is_default) values
      (new_pipeline_id, 'Em Contratação', 'em_contratacao', '#3B82F6', 0, true),
      (new_pipeline_id, 'Contratado', 'contratado', '#22C55E', 1, false),
      (new_pipeline_id, 'Distribuído', 'distribuido', '#EAB308', 2, false),
      (new_pipeline_id, 'Desistência', 'desistencia', '#EF4444', 3, false);
  end loop;
end;
$$;
