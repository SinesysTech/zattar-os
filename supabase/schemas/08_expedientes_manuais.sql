-- Tabela de expedientes criados manualmente
-- Diferente de pendentes_manifestacao (que vêm do PJE), estes são criados pelos usuários

create table public.expedientes_manuais (
  id bigint generated always as identity primary key,
  processo_id bigint not null references public.acervo(id) on delete cascade,
  trt public.codigo_tribunal not null,
  grau public.grau_tribunal not null,
  numero_processo text not null,
  tipo_expediente_id bigint references public.tipos_expedientes(id) on delete set null,
  descricao text not null,
  data_prazo_legal timestamptz,
  prazo_vencido boolean generated always as (data_prazo_legal < now()) stored,
  responsavel_id bigint references public.usuarios(id) on delete set null,
  baixado_em timestamptz,
  protocolo_id text,
  justificativa_baixa text,
  criado_por bigint not null references public.usuarios(id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- Evitar duplicatas de expedientes manuais
  -- Permite criar múltiplos expedientes para o mesmo processo, mas não idênticos
  constraint unique_expediente_manual unique (
    processo_id,
    tipo_expediente_id,
    descricao,
    data_prazo_legal
  ),

  -- Mesma constraint de baixa: protocolo OU justificativa obrigatória
  constraint check_baixa_valida_manual check (
    baixado_em is null
    or (
      protocolo_id is not null
      or (justificativa_baixa is not null and trim(justificativa_baixa) != '')
    )
  )
);

comment on table public.expedientes_manuais is 'Expedientes criados manualmente pelos usuários. Diferente de pendentes_manifestacao (origem: PJE)';
comment on column public.expedientes_manuais.processo_id is 'Referência ao processo no acervo (obrigatório - expediente sempre vinculado a processo)';
comment on column public.expedientes_manuais.trt is 'TRT do processo (desnormalizado para facilitar filtros)';
comment on column public.expedientes_manuais.grau is 'Grau do processo (desnormalizado para facilitar filtros)';
comment on column public.expedientes_manuais.numero_processo is 'Número do processo (desnormalizado para facilitar buscas)';
comment on column public.expedientes_manuais.tipo_expediente_id is 'Tipo do expediente (ex: Contestação, Recurso, Impugnação)';
comment on column public.expedientes_manuais.descricao is 'Descrição detalhada do expediente criado manualmente';
comment on column public.expedientes_manuais.data_prazo_legal is 'Data limite para cumprimento do expediente';
comment on column public.expedientes_manuais.prazo_vencido is 'Calculado automaticamente: true se data_prazo_legal < now()';
comment on column public.expedientes_manuais.responsavel_id is 'Usuário responsável pelo expediente';
comment on column public.expedientes_manuais.baixado_em is 'Data e hora em que o expediente foi baixado (concluído)';
comment on column public.expedientes_manuais.protocolo_id is 'ID do protocolo de peça protocolada em resposta ao expediente';
comment on column public.expedientes_manuais.justificativa_baixa is 'Justificativa de baixa sem protocolo de peça';
comment on column public.expedientes_manuais.criado_por is 'Usuário que criou o expediente manual';

-- Índices para performance
create index idx_expedientes_manuais_processo_id on public.expedientes_manuais using btree (processo_id);
create index idx_expedientes_manuais_trt on public.expedientes_manuais using btree (trt);
create index idx_expedientes_manuais_grau on public.expedientes_manuais using btree (grau);
create index idx_expedientes_manuais_numero_processo on public.expedientes_manuais using btree (numero_processo);
create index idx_expedientes_manuais_tipo_expediente on public.expedientes_manuais using btree (tipo_expediente_id);
create index idx_expedientes_manuais_responsavel on public.expedientes_manuais using btree (responsavel_id);
create index idx_expedientes_manuais_prazo on public.expedientes_manuais using btree (data_prazo_legal);
create index idx_expedientes_manuais_baixado on public.expedientes_manuais using btree (baixado_em) where baixado_em is null;
create index idx_expedientes_manuais_criado_por on public.expedientes_manuais using btree (criado_por);

-- Trigger para atualizar updated_at
create trigger update_expedientes_manuais_updated_at
before update on public.expedientes_manuais
for each row
execute function public.update_updated_at_column();

-- Trigger para sincronizar dados do processo (TRT, Grau, Número)
create or replace function public.sync_expediente_manual_processo_info()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Preencher TRT, grau e número do processo automaticamente
  if new.processo_id is not null then
    select
      acervo.trt,
      acervo.grau,
      acervo.numero_processo
    into
      new.trt,
      new.grau,
      new.numero_processo
    from public.acervo
    where acervo.id = new.processo_id
    limit 1;
  end if;

  return new;
end;
$$;

comment on function public.sync_expediente_manual_processo_info() is 'Preenche automaticamente TRT, grau e número do processo em expedientes manuais';

-- Aplicar trigger antes de inserir ou atualizar
create trigger sync_expediente_manual_processo_info_trigger
before insert or update on public.expedientes_manuais
for each row
execute function public.sync_expediente_manual_processo_info();

-- Habilitar RLS
alter table public.expedientes_manuais enable row level security;
