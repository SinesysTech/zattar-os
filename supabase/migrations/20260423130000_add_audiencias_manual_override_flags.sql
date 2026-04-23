-- Migration: Override manual de campos em audiências capturadas do PJe
--
-- Regra de negócio: audiências capturadas do PJe deixam de ter esses campos
-- bloqueados para edição. Quando o usuário editar manualmente, a flag
-- correspondente vira `true` e a próxima sincronização do PJe NÃO sobrescreve
-- o valor local. Enquanto a flag estiver `false`, o PJe continua como fonte
-- (preenche se vier valor, inclusive na primeira captura).
--
-- Campos protegidos: modalidade, url_audiencia_virtual, endereco_presencial.
-- (presenca_hibrida não é sincronizada pelo PJe, portanto não precisa de flag.)

-- 1. Adicionar colunas de controle de override
alter table public.audiencias
  add column modalidade_editada_manualmente boolean not null default false,
  add column url_editada_manualmente boolean not null default false,
  add column endereco_editado_manualmente boolean not null default false;

comment on column public.audiencias.modalidade_editada_manualmente is
  'Quando true, o sync do PJe não sobrescreve modalidade. Seta via action de edição manual. Também curto-circuita o trigger populate_modalidade_audiencia.';
comment on column public.audiencias.url_editada_manualmente is
  'Quando true, o sync do PJe não sobrescreve url_audiencia_virtual. Seta via action de edição manual.';
comment on column public.audiencias.endereco_editado_manualmente is
  'Quando true, o sync do PJe não sobrescreve endereco_presencial. Seta via action de edição manual.';

-- 2. Atualizar trigger populate_modalidade_audiencia para respeitar a flag manual
--    Rule 0 (nova): se modalidade_editada_manualmente = true, preserva valor existente.
create or replace function public.populate_modalidade_audiencia()
returns trigger
language plpgsql
security definer
as $$
declare
  v_tipo_descricao text;
begin
  -- Rule 0: Edição manual vence. Nunca recalcular.
  if new.modalidade_editada_manualmente is true then
    return new;
  end if;

  -- Buscar descrição do tipo de audiência se houver tipo_audiencia_id
  if new.tipo_audiencia_id is not null then
    select descricao into v_tipo_descricao
    from public.tipo_audiencia
    where id = new.tipo_audiencia_id;
  end if;

  -- Regra 1: Se já é híbrida (definida manualmente via modalidade), não altera
  if new.modalidade = 'hibrida' then
    return new;
  end if;

  -- Regra 2: Se tem URL de audiência virtual OU tipo contém 'videoconfer' → virtual
  if new.url_audiencia_virtual is not null and trim(new.url_audiencia_virtual) != '' then
    new.modalidade := 'virtual';
    return new;
  end if;

  if v_tipo_descricao is not null and lower(v_tipo_descricao) like '%videoconfer%' then
    new.modalidade := 'virtual';
    return new;
  end if;

  -- Regra 3: Se tem endereço presencial preenchido → presencial
  if new.endereco_presencial is not null and new.endereco_presencial != '{}'::jsonb then
    new.modalidade := 'presencial';
    return new;
  end if;

  -- Caso contrário, mantém o valor atual (pode ser null)
  return new;
end;
$$;

-- 3. Ampliar o trigger para escutar também a flag (garante re-avaliação se flag for revertida para false no futuro)
drop trigger if exists trigger_set_modalidade_audiencia on public.audiencias;

create trigger trigger_set_modalidade_audiencia
  before insert or update of url_audiencia_virtual, endereco_presencial, tipo_audiencia_id, modalidade, modalidade_editada_manualmente
  on public.audiencias
  for each row
  execute function public.populate_modalidade_audiencia();

-- 4. Recriar view audiencias_com_origem incluindo as novas colunas de override
--    (a view seleciona colunas explicitamente, então precisa ser reconstruída).
drop view if exists public.audiencias_com_origem cascade;

create view public.audiencias_com_origem as
with dados_primeiro_grau as (
  select distinct on (acervo.numero_processo)
    acervo.numero_processo,
    acervo.trt as trt_origem,
    acervo.nome_parte_autora as nome_parte_autora_origem,
    acervo.nome_parte_re as nome_parte_re_origem,
    acervo.descricao_orgao_julgador as orgao_julgador_origem
  from public.acervo
  order by
    acervo.numero_processo,
    case
      when (acervo.grau = 'primeiro_grau'::grau_tribunal) then 0
      else 1
    end,
    acervo.data_autuacao
)
select
  a.id,
  a.id_pje,
  a.advogado_id,
  a.processo_id,
  a.orgao_julgador_id,
  a.trt,
  a.grau,
  a.numero_processo,
  a.data_inicio,
  a.data_fim,
  a.sala_audiencia_nome,
  a.sala_audiencia_id,
  a.status,
  a.status_descricao,
  a.designada,
  a.em_andamento,
  a.documento_ativo,
  a.polo_ativo_nome,
  a.polo_passivo_nome,
  a.url_audiencia_virtual,
  a.created_at,
  a.updated_at,
  a.dados_anteriores,
  a.responsavel_id,
  a.observacoes,
  a.classe_judicial_id,
  a.tipo_audiencia_id,
  a.segredo_justica,
  a.juizo_digital,
  a.polo_ativo_representa_varios,
  a.polo_passivo_representa_varios,
  a.endereco_presencial,
  a.ata_audiencia_id,
  a.hora_inicio,
  a.hora_fim,
  a.modalidade,
  a.url_ata_audiencia,
  a.presenca_hibrida,
  a.modalidade_editada_manualmente,
  a.url_editada_manualmente,
  a.endereco_editado_manualmente,
  -- Campos de origem (fonte da verdade do 1º grau)
  coalesce(dpg.trt_origem::text, a.trt::text) as trt_origem,
  coalesce(dpg.nome_parte_autora_origem, a.polo_ativo_nome) as polo_ativo_origem,
  coalesce(dpg.nome_parte_re_origem, a.polo_passivo_nome) as polo_passivo_origem,
  dpg.orgao_julgador_origem,
  ta.descricao as tipo_descricao
from public.audiencias a
left join dados_primeiro_grau dpg on a.numero_processo = dpg.numero_processo
left join public.tipo_audiencia ta on a.tipo_audiencia_id = ta.id;

comment on view public.audiencias_com_origem is
'View que enriquece as audiências com dados de origem do 1º grau.
Quando uma audiência é de 2º grau, esta view busca no acervo o processo de 1º grau
correspondente (pelo numero_processo) e traz as informações originais das partes.
Isso garante que a "fonte da verdade" para autor/réu seja sempre o 1º grau.
Inclui as flags *_editada_manualmente para sinalizar override manual de campos
que normalmente seriam sincronizados do PJe.';

grant select on public.audiencias_com_origem to authenticated;
grant select on public.audiencias_com_origem to service_role;
