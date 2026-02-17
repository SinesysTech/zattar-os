-- Migration: Refatoração do Schema de Audiências
-- Adiciona modalidade (virtual/presencial/híbrida) e horários separados
-- Aplicada em: 2024-11-26

-- 1. Criar enum de modalidade
create type public.modalidade_audiencia as enum ('virtual', 'presencial', 'hibrida');

comment on type public.modalidade_audiencia is 'Modalidade de participação na audiência: virtual (videoconferência), presencial (física) ou híbrida (mista)';

-- 2. Adicionar novas colunas
alter table public.audiencias
  add column hora_inicio time null,
  add column hora_fim time null,
  add column modalidade public.modalidade_audiencia null;

comment on column public.audiencias.hora_inicio is 'Hora de início da audiência (extraída de pautaAudienciaHorario.horaInicial do PJE)';
comment on column public.audiencias.hora_fim is 'Hora de fim da audiência (extraída de pautaAudienciaHorario.horaFinal do PJE)';
comment on column public.audiencias.modalidade is 'Modalidade da audiência: virtual, presencial ou híbrida. Populada automaticamente por trigger, exceto híbrida que é manual.';

-- 3. Criar função para popular modalidade automaticamente
create or replace function public.populate_modalidade_audiencia()
returns trigger
language plpgsql
security definer
as $$
declare
  v_tipo_descricao text;
begin
  -- Buscar descrição do tipo de audiência se houver tipo_audiencia_id
  if new.tipo_audiencia_id is not null then
    select descricao into v_tipo_descricao
    from public.tipo_audiencia
    where id = new.tipo_audiencia_id;
  end if;

  -- Regra 1: Se já é híbrida (definida manualmente), não altera
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

comment on function public.populate_modalidade_audiencia() is 'Popula automaticamente a modalidade da audiência baseado em URL virtual, tipo de audiência ou endereço presencial';

-- 4. Criar trigger
create trigger trigger_set_modalidade_audiencia
  before insert or update of url_audiencia_virtual, endereco_presencial, tipo_audiencia_id, modalidade
  on public.audiencias
  for each row
  execute function public.populate_modalidade_audiencia();

-- 5. Popular hora_inicio e hora_fim dos registros existentes (extrair de data_inicio/data_fim)
update public.audiencias
set
  hora_inicio = data_inicio::time,
  hora_fim = data_fim::time
where hora_inicio is null or hora_fim is null;

-- 6. Popular modalidade dos registros existentes
-- Primeiro, marcar como virtual os que têm URL preenchida
update public.audiencias
set modalidade = 'virtual'
where url_audiencia_virtual is not null
  and trim(url_audiencia_virtual) != ''
  and modalidade is null;

-- Depois, marcar como virtual os que têm tipo com 'videoconfer'
update public.audiencias a
set modalidade = 'virtual'
from public.tipo_audiencia t
where a.tipo_audiencia_id = t.id
  and lower(t.descricao) like '%videoconfer%'
  and a.modalidade is null;

-- Por fim, marcar como presencial os que têm endereço
update public.audiencias
set modalidade = 'presencial'
where endereco_presencial is not null
  and endereco_presencial != '{}'::jsonb
  and modalidade is null;

-- 7. Remover coluna url (não utilizada - 0 registros)
alter table public.audiencias drop column if exists url;

-- 8. Remover coluna pauta_audiencia_horario_id (redundante)
alter table public.audiencias drop column if exists pauta_audiencia_horario_id;

-- 9. Criar índice para filtro por modalidade
create index if not exists idx_audiencias_modalidade on public.audiencias (modalidade);
