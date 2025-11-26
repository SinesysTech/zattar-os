-- ============================================================================
-- Tabela: processo_partes
-- Relacionamento N:N entre processos e partes (clientes, partes contrárias, terceiros)
-- ============================================================================

create table if not exists public.processo_partes (
  id bigint generated always as identity primary key,
  
  -- Foreign key para o processo (tabela acervo)
  processo_id bigint not null references public.acervo(id) on delete cascade,
  
  -- Tipo da entidade participante (FK polimórfica)
  tipo_entidade text not null check (tipo_entidade in ('cliente', 'parte_contraria', 'terceiro')),
  
  -- ID da entidade na tabela correspondente (FK polimórfica, sem constraint direta)
  entidade_id bigint not null,
  
  -- ID da parte no PJE (obrigatório, do PJE)
  id_pje bigint not null,
  
  -- ID da pessoa no PJE (opcional, para auditoria PJE)
  id_pessoa_pje bigint null,
  
  -- ID do tipo de parte no PJE (opcional, do PJE)
  id_tipo_parte bigint null,
  
  -- Tipo de participante no processo (do PJE, deve ser um dos tipos válidos)
  tipo_parte text not null check (tipo_parte in ('AUTOR', 'REU', 'RECLAMANTE', 'RECLAMADO', 'EXEQUENTE', 'EXECUTADO', 'EMBARGANTE', 'EMBARGADO', 'APELANTE', 'APELADO', 'AGRAVANTE', 'AGRAVADO', 'PERITO', 'MINISTERIO_PUBLICO', 'ASSISTENTE', 'TESTEMUNHA', 'CUSTOS_LEGIS', 'AMICUS_CURIAE', 'OUTRO')),
  
  -- Polo processual (do mapeamento PJE)
  polo text not null check (polo in ('ATIVO', 'PASSIVO', 'NEUTRO', 'TERCEIRO')),
  
  -- Código do TRT (dos dados do processo)
  trt text not null,
  
  -- Grau do processo (primeiro ou segundo grau)
  grau text not null check (grau in ('primeiro_grau', 'segundo_grau')),
  
  -- Número do processo (dos dados do processo)
  numero_processo text not null,
  
  -- Indica se é a parte principal no polo (obrigatório, do PJE)
  principal boolean not null,

  -- Ordem de exibição dentro do polo (baseado em 0, obrigatório, deve ser >= 0)
  ordem integer not null check (ordem >= 0),
  
  -- Status no PJE (opcional, do PJE)
  status_pje text null,
  
  -- Situação no PJE (opcional, do PJE)
  situacao_pje text null,
  
  -- Indica se é uma autoridade (opcional, do PJE)
  autoridade boolean null,
  
  -- Indica se endereço é desconhecido (opcional, do PJE)
  endereco_desconhecido boolean null,
  
  -- JSON completo do PJE para auditoria e histórico (opcional, do PJE)
  dados_pje_completo jsonb null,
  
  -- Timestamp da última atualização do PJE (opcional, do PJE)
  ultima_atualizacao_pje timestamptz null,
  
  -- Timestamps (internos)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Comentário da tabela
comment on table public.processo_partes is 'Relacionamento N:N entre processos (acervo) e entidades (clientes/partes contrárias/terceiros). Cada registro representa uma participação única em uma combinação processo-grau.';

-- Comentários das colunas
comment on column public.processo_partes.id is 'Chave primária, auto-incremento';
comment on column public.processo_partes.processo_id is 'Referência para acervo.id (processo), cascata ao deletar';
comment on column public.processo_partes.tipo_entidade is 'Tipo da entidade participante: cliente, parte_contraria ou terceiro (determina qual tabela fazer join)';
comment on column public.processo_partes.entidade_id is 'ID da entidade na tabela correspondente (FK polimórfica, sem constraint direta)';
comment on column public.processo_partes.id_pje is 'ID da parte no PJE (idParte, obrigatório, do PJE)';
comment on column public.processo_partes.id_pessoa_pje is 'ID da pessoa no PJE (idPessoa, opcional, para auditoria PJE)';
comment on column public.processo_partes.id_tipo_parte is 'ID do tipo de parte no PJE (opcional, do PJE)';
comment on column public.processo_partes.tipo_parte is 'Tipo de participante no processo (ex: RECLAMANTE, RECLAMADO, do PJE)';
comment on column public.processo_partes.polo is 'Polo processual: ATIVO (autor), PASSIVO (réu), NEUTRO (perito), TERCEIRO (interveniente, do mapeamento PJE)';
comment on column public.processo_partes.trt is 'Código do TRT (dos dados do processo)';
comment on column public.processo_partes.grau is 'Grau do processo: primeiro_grau ou segundo_grau (dos dados do processo)';
comment on column public.processo_partes.numero_processo is 'Número do processo (dos dados do processo)';
comment on column public.processo_partes.principal is 'Indica se é a parte principal no polo (obrigatório, do PJE)';
comment on column public.processo_partes.ordem is 'Ordem de exibição dentro do polo (baseado em 0, obrigatório, deve ser >= 0)';
comment on column public.processo_partes.status_pje is 'Status no PJE (opcional, do PJE)';
comment on column public.processo_partes.situacao_pje is 'Situação no PJE (opcional, do PJE)';
comment on column public.processo_partes.autoridade is 'Indica se é uma autoridade (opcional, do PJE)';
comment on column public.processo_partes.endereco_desconhecido is 'Indica se endereço é desconhecido (opcional, do PJE)';
comment on column public.processo_partes.dados_pje_completo is 'JSON completo do PJE para auditoria e histórico (opcional, do PJE)';
comment on column public.processo_partes.ultima_atualizacao_pje is 'Timestamp da última atualização do PJE (opcional, do PJE)';
comment on column public.processo_partes.created_at is 'Timestamp de criação do registro (interno)';
comment on column public.processo_partes.updated_at is 'Timestamp da última atualização do registro (interno, auto-atualizado)';

-- Constraint única para prevenir duplicatas da mesma entidade no mesmo processo-grau
alter table public.processo_partes add constraint unique_processo_entidade_grau unique (processo_id, tipo_entidade, entidade_id, grau);

-- Índices para performance
create index if not exists idx_processo_partes_processo_id on public.processo_partes using btree (processo_id);
create index if not exists idx_processo_partes_entidade on public.processo_partes using btree (tipo_entidade, entidade_id);
create index if not exists idx_processo_partes_polo on public.processo_partes using btree (polo);
create index if not exists idx_processo_partes_trt_grau on public.processo_partes using btree (trt, grau);
create index if not exists idx_processo_partes_numero_processo on public.processo_partes using btree (numero_processo);
create index if not exists idx_processo_partes_id_pessoa_pje on public.processo_partes using btree (id_pessoa_pje) where id_pessoa_pje is not null;

-- Trigger para auto-atualizar updated_at
create trigger update_processo_partes_updated_at
before update on public.processo_partes
for each row
execute function public.update_updated_at_column();

-- Habilitar Row Level Security
alter table public.processo_partes enable row level security;

-- Políticas RLS
create policy "Service role tem acesso total ao processo_partes"
on public.processo_partes for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler processo_partes"
on public.processo_partes for select
to authenticated
using (true);

create policy "Usuários autenticados podem inserir processo_partes"
on public.processo_partes for insert
to authenticated
with check (true);

create policy "Usuários autenticados podem atualizar processo_partes"
on public.processo_partes for update
to authenticated
using (true)
with check (true);

create policy "Usuários autenticados podem deletar processo_partes"
on public.processo_partes for delete
to authenticated
using (true);
