-- Migration: Sistema de Expedientes Manuais
-- Cria tabelas para permitir criação manual de expedientes pelos usuários
-- Mantém separação entre expedientes do PJE (pendentes_manifestacao) e expedientes manuais

-- ============================================================================
-- 1. CRIAR TABELA DE TIPOS DE EXPEDIENTES
-- ============================================================================

create table if not exists public.tipos_expedientes (
  id bigint generated always as identity primary key,
  tipo_expediente text not null unique,
  created_by bigint not null references public.usuarios(id) on delete cascade,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.tipos_expedientes is 'Tipos de expedientes cadastrados pelos usuários para classificação de expedientes manuais e do PJE';
comment on column public.tipos_expedientes.tipo_expediente is 'Nome do tipo de expediente (ex: Contestação, Recurso, Impugnação)';
comment on column public.tipos_expedientes.created_by is 'Usuário que criou o tipo de expediente';

-- Índices
create index if not exists idx_tipos_expedientes_tipo on public.tipos_expedientes using btree (tipo_expediente);
create index if not exists idx_tipos_expedientes_created_by on public.tipos_expedientes using btree (created_by);

-- Trigger para atualizar updated_at
create trigger update_tipos_expedientes_updated_at
before update on public.tipos_expedientes
for each row
execute function public.update_updated_at_column();

-- RLS
alter table public.tipos_expedientes enable row level security;

-- ============================================================================
-- 2. CRIAR TABELA DE EXPEDIENTES MANUAIS
-- ============================================================================

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

-- Trigger para sincronizar dados do processo
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

create trigger sync_expediente_manual_processo_info_trigger
before insert or update on public.expedientes_manuais
for each row
execute function public.sync_expediente_manual_processo_info();

-- RLS
alter table public.expedientes_manuais enable row level security;

-- ============================================================================
-- 3. CRIAR VIEW UNIFICADA
-- ============================================================================

create or replace view public.expedientes_unificados as
select
  'pje'::text as origem,
  pm.id,
  pm.processo_id,
  pm.trt,
  pm.grau,
  pm.numero_processo,
  pm.tipo_expediente_id,
  pm.descricao_arquivos as descricao,
  pm.data_prazo_legal_parte as data_prazo_legal,
  pm.prazo_vencido,
  pm.responsavel_id,
  pm.baixado_em,
  pm.protocolo_id,
  pm.justificativa_baixa,
  pm.id_pje,
  null::bigint as criado_por,
  pm.classe_judicial,
  pm.codigo_status_processo,
  pm.descricao_orgao_julgador,
  pm.nome_parte_autora,
  pm.nome_parte_re,
  pm.data_autuacao,
  pm.segredo_justica,
  pm.juizo_digital,
  pm.created_at,
  pm.updated_at
from public.pendentes_manifestacao pm

union all

select
  'manual'::text as origem,
  em.id,
  em.processo_id,
  em.trt,
  em.grau,
  em.numero_processo,
  em.tipo_expediente_id,
  em.descricao,
  em.data_prazo_legal,
  em.prazo_vencido,
  em.responsavel_id,
  em.baixado_em,
  em.protocolo_id,
  em.justificativa_baixa,
  null::bigint as id_pje,
  em.criado_por,
  null::text as classe_judicial,
  null::text as codigo_status_processo,
  null::text as descricao_orgao_julgador,
  null::text as nome_parte_autora,
  null::text as nome_parte_re,
  null::timestamptz as data_autuacao,
  false as segredo_justica,
  false as juizo_digital,
  em.created_at,
  em.updated_at
from public.expedientes_manuais em;

comment on view public.expedientes_unificados is 'VIEW unificada de expedientes do PJE e expedientes manuais. Campo "origem" indica a fonte (pje | manual)';

-- ============================================================================
-- 4. POLÍTICAS RLS
-- ============================================================================

-- Tipos de Expedientes
create policy "Service role: acesso total a tipos_expedientes"
  on public.tipos_expedientes
  for all
  to service_role
  using (true)
  with check (true);

create policy "Usuários autenticados podem ler tipos_expedientes"
  on public.tipos_expedientes
  for select
  to authenticated
  using (true);

-- Expedientes Manuais
create policy "Service role: acesso total a expedientes_manuais"
  on public.expedientes_manuais
  for all
  to service_role
  using (true)
  with check (true);

create policy "Usuários autenticados podem ler expedientes_manuais"
  on public.expedientes_manuais
  for select
  to authenticated
  using (true);
