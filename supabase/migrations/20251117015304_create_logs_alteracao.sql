-- Migration: Criar tabela genérica de logs de alteração
-- Esta migration cria a tabela logs_alteracao para rastrear todas as alterações
-- em qualquer entidade do sistema, começando com atribuições de responsável

-- Tabela genérica de logs de alteração
create table public.logs_alteracao (
  id bigint generated always as identity primary key,
  
  -- Identificação da entidade alterada
  tipo_entidade text not null check (tipo_entidade in ('acervo', 'audiencias', 'pendentes_manifestacao', 'usuarios', 'advogados')),
  entidade_id bigint not null,
  
  -- Tipo de evento/alteracao
  tipo_evento text not null,
  
  -- Quem executou a ação (sempre presente)
  usuario_que_executou_id bigint not null references public.usuarios(id) on delete restrict,
  
  -- Campos específicos para atribuição de responsável (caso mais comum)
  -- Null para outros tipos de eventos
  responsavel_anterior_id bigint references public.usuarios(id) on delete set null,
  responsavel_novo_id bigint references public.usuarios(id) on delete set null,
  
  -- Dados flexíveis em JSONB para qualquer informação adicional
  dados_evento jsonb,
  
  -- Controle
  created_at timestamptz default now() not null
);

comment on table public.logs_alteracao is 'Logs genéricos de alterações em todas as entidades do sistema. Suporta qualquer tipo de evento através do campo tipo_evento e dados_evento JSONB';
comment on column public.logs_alteracao.tipo_entidade is 'Tipo da entidade que foi alterada (acervo, audiencias, pendentes_manifestacao, usuarios, advogados, etc)';
comment on column public.logs_alteracao.entidade_id is 'ID do registro da entidade que foi alterada';
comment on column public.logs_alteracao.tipo_evento is 'Tipo do evento/alteracao (atribuicao_responsavel, transferencia_responsavel, desatribuicao_responsavel, mudanca_status, observacao_adicionada, etc)';
comment on column public.logs_alteracao.usuario_que_executou_id is 'Usuário que executou a ação';
comment on column public.logs_alteracao.responsavel_anterior_id is 'Responsável anterior (usado apenas para eventos de atribuição/transferência)';
comment on column public.logs_alteracao.responsavel_novo_id is 'Novo responsável (usado apenas para eventos de atribuição/transferência)';
comment on column public.logs_alteracao.dados_evento is 'Dados adicionais específicos do evento em formato JSONB. Flexível para qualquer tipo de informação';
comment on column public.logs_alteracao.created_at is 'Data e hora em que o log foi criado';

-- Índices para performance
create index idx_logs_alteracao_tipo_entidade_id on public.logs_alteracao using btree (tipo_entidade, entidade_id);
create index idx_logs_alteracao_tipo_evento on public.logs_alteracao using btree (tipo_evento);
create index idx_logs_alteracao_usuario_executou on public.logs_alteracao using btree (usuario_que_executou_id);
create index idx_logs_alteracao_responsavel_novo on public.logs_alteracao using btree (responsavel_novo_id) where responsavel_novo_id is not null;
create index idx_logs_alteracao_created_at on public.logs_alteracao using btree (created_at desc);

-- Índice GIN para busca em dados_evento JSONB
create index idx_logs_alteracao_dados_evento on public.logs_alteracao using gin (dados_evento);

-- Habilitar RLS
alter table public.logs_alteracao enable row level security;

