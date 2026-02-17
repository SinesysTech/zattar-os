-- Base Schema Migration
-- Consolidated schema with all enums and CREATE statements

-- =====================================================
-- SECTION 1: EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS hypopg WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS index_advisor WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- =====================================================
-- SECTION 2: ALL ENUM TYPES
-- =====================================================

CREATE TYPE public.Instancia AS ENUM ('PRIMEIRO_GRAU', 'SEGUNDO_GRAU', 'TRIBUNAL_SUPERIOR');
CREATE TYPE public.NotificationSeverity AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE public.NotificationType AS ENUM ('SYNC_FAILED', 'SYNC_EXHAUSTED', 'SCRAPE_EXECUTION_FAILED', 'TRIBUNAL_SCRAPE_FAILED', 'STORAGE_FULL', 'CLEANUP_ERROR', 'EXTERNAL_STORAGE_DOWN');
CREATE TYPE public.StatusArquivamento AS ENUM ('ATIVO', 'ARQUIVADO', 'BAIXADO');
CREATE TYPE public.StatusExpediente AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO');
CREATE TYPE public.SyncStatus AS ENUM ('PENDING', 'SYNCING', 'SYNCED', 'PARTIAL', 'FAILED', 'DELETED');
CREATE TYPE public.TipoAcaoHistorico AS ENUM ('ATRIBUIDO', 'TRANSFERIDO', 'BAIXADO', 'REVERSAO_BAIXA', 'PROTOCOLO_ADICIONADO', 'OBSERVACAO_ADICIONADA');
CREATE TYPE public.TipoExpedienteEnum AS ENUM ('IMPUGNACAO_A_CONTESTACAO', 'RAZOES_FINAIS', 'RECURSO_ORDINARIO', 'MANIFESTACAO', 'RECURSO_DE_REVISTA', 'AGRAVO_DE_INSTRUMENTO_EM_RECURSO_ORDINARIO', 'CONTRARRAZOES_AOS_EMBARGOS_DE_DECLARACAO', 'CONTRARRAZOES_AO_RECURSO_ORDINARIO', 'EMENDA_A_INICIAL', 'AGRAVO_DE_INSTRUMENTO_EM_RECURSO_DE_REVISTA', 'CONTRARRAZOES_AO_RECURSO_DE_REVISTA', 'AGRAVO_INTERNO', 'ADITAMENTO_A_INICIAL', 'IMPUGNACAO_AO_CUMPRIMENTO_DE_SENTENCA', 'IMPUGNACAO_AO_LAUDO_PERICIAL', 'IMPUGNACAO_AO_CALCULO_PERICIAL', 'APRESENTACAO_DE_CALCULOS', 'IMPUGNACAO_AOS_EMBARGOS_DE_EXECUCAO', 'APRESENTACAO_DE_QUESITOS', 'AUDIENCIA', 'CONTRARRAZOES_AO_RECURSO_ORDINARIO_ADESIVO', 'CONTRAMINUTA_AO_AGRAVO_DE_PETICAO', 'CONTRAMINUTA_AO_AGRAVO_INTERNO', 'PERICIA', 'CONTRAMINUTA_AO_AGRAVO_DE_INSTRUMENTO_EM_RECURSO_DE_REVISTA', 'CONTRAMINUTA_AO_AGRAVO_DE_INSTRUMENTO_EM_RECURSO_ORDINARIO', 'SESSAO_DE_JULGAMENTO', 'CEJUSC', 'VERIFICAR');
CREATE TYPE public.TipoTribunal AS ENUM ('TRT', 'TJ', 'TRF', 'TST', 'STF', 'STJ');
CREATE TYPE public.codigo_tribunal AS ENUM ('TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24', 'TST');
CREATE TYPE public.estado_civil AS ENUM ('solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel', 'outro');
CREATE TYPE public.forma_pagamento_financeiro AS ENUM ('dinheiro', 'transferencia_bancaria', 'ted', 'pix', 'boleto', 'cartao_credito', 'cartao_debito', 'cheque', 'deposito_judicial');
CREATE TYPE public.genero_usuario AS ENUM ('masculino', 'feminino', 'outro', 'prefiro_nao_informar');
CREATE TYPE public.grau_tribunal AS ENUM ('primeiro_grau', 'segundo_grau', 'tribunal_superior');
CREATE TYPE public.meio_comunicacao AS ENUM ('E', 'D');
CREATE TYPE public.modalidade_audiencia AS ENUM ('virtual', 'presencial', 'hibrida');
CREATE TYPE public.natureza_conta AS ENUM ('devedora', 'credora');
CREATE TYPE public.nivel_conta AS ENUM ('sintetica', 'analitica');
CREATE TYPE public.origem_expediente AS ENUM ('captura', 'manual', 'comunica_cnj');
CREATE TYPE public.origem_lancamento AS ENUM ('manual', 'acordo_judicial', 'contrato', 'folha_pagamento', 'importacao_bancaria', 'recorrente');
CREATE TYPE public.papel_contratual AS ENUM ('autora', 're');
CREATE TYPE public.periodo_orcamento AS ENUM ('mensal', 'trimestral', 'semestral', 'anual');
CREATE TYPE public.polo_processual AS ENUM ('autor', 're');
CREATE TYPE public.situacao_pericia AS ENUM ('S', 'L', 'C', 'F', 'P', 'R');
CREATE TYPE public.status_audiencia AS ENUM ('C', 'M', 'F');
CREATE TYPE public.status_captura AS ENUM ('pending', 'in_progress', 'completed', 'failed');
CREATE TYPE public.status_conciliacao AS ENUM ('pendente', 'conciliado', 'divergente', 'ignorado');
CREATE TYPE public.status_conta_bancaria AS ENUM ('ativa', 'inativa', 'encerrada');
CREATE TYPE public.status_contrato AS ENUM ('em_contratacao', 'contratado', 'distribuido', 'desistencia');
CREATE TYPE public.status_lancamento AS ENUM ('pendente', 'confirmado', 'cancelado', 'estornado');
CREATE TYPE public.status_orcamento AS ENUM ('rascunho', 'aprovado', 'em_execucao', 'encerrado');
CREATE TYPE public.tipo_acesso_tribunal AS ENUM ('primeiro_grau', 'segundo_grau', 'unificado', 'unico');
CREATE TYPE public.tipo_captura AS ENUM ('acervo_geral', 'arquivados', 'audiencias', 'pendentes', 'partes', 'comunica_cnj', 'combinada', 'pericias');
CREATE TYPE public.tipo_cobranca AS ENUM ('pro_exito', 'pro_labore');
CREATE TYPE public.tipo_conta_bancaria AS ENUM ('corrente', 'poupanca', 'investimento', 'caixa');
CREATE TYPE public.tipo_conta_contabil AS ENUM ('ativo', 'passivo', 'receita', 'despesa', 'patrimonio_liquido');
CREATE TYPE public.tipo_contrato AS ENUM ('ajuizamento', 'defesa', 'ato_processual', 'assessoria', 'consultoria', 'extrajudicial', 'parecer');
CREATE TYPE public.tipo_lancamento AS ENUM ('receita', 'despesa');
CREATE TYPE public.tipo_notificacao_usuario AS ENUM ('processo_atribuido', 'processo_movimentacao', 'audiencia_atribuida', 'audiencia_alterada', 'expediente_atribuido', 'expediente_alterado', 'prazo_vencendo', 'prazo_vencido', 'sistema_alerta');
CREATE TYPE public.tipo_peca_juridica AS ENUM ('peticao_inicial', 'contestacao', 'recurso_ordinario', 'agravo', 'embargos_declaracao', 'manifestacao', 'parecer', 'contrato_honorarios', 'procuracao', 'outro');
CREATE TYPE public.tipo_pessoa AS ENUM ('pf', 'pj');

-- =====================================================
-- SECTION 3: TABLES AND FUNCTIONS
-- =====================================================


-- =====================================================
-- From: 00_permissions.sql
-- =====================================================

-- Conceder permissões ao service_role para bypassar RLS
-- Este arquivo deve ser executado primeiro (00_) para garantir que o service_role tenha acesso

-- 1. Conceder USAGE no schema public ao service_role
grant usage on schema public to service_role;

-- 2. Conceder permissões em todas as tabelas existentes ao service_role
grant select, insert, update, delete on all tables in schema public to service_role;

-- 3. Conceder permissões em tabelas futuras (default privileges)
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;

-- 4. Conceder permissões em sequences (para identity columns)
grant usage, select on all sequences in schema public to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;

-- 5. Conceder permissões em funções
grant execute on all functions in schema public to service_role;
alter default privileges in schema public grant execute on functions to service_role;


-- =====================================================
-- From: 02_advogados.sql
-- =====================================================

-- Tabela de advogados

create table public.advogados (
  id bigint generated always as identity primary key,
  nome_completo text not null,
  cpf text not null unique,
  oab text not null,
  uf_oab text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
comment on table public.advogados is 'Cadastro de advogados do sistema';
comment on column public.advogados.nome_completo is 'Nome completo do advogado';
comment on column public.advogados.cpf is 'CPF do advogado (único)';
comment on column public.advogados.oab is 'Número da OAB do advogado';
comment on column public.advogados.uf_oab is 'UF onde a OAB foi emitida';

-- Índice para busca por CPF
create index idx_advogados_cpf on public.advogados using btree (cpf);

-- Índice para busca por OAB e UF OAB
create index idx_advogados_oab on public.advogados using btree (oab, uf_oab);

-- Trigger para atualizar updated_at automaticamente
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger update_advogados_updated_at
before update on public.advogados
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.advogados enable row level security;


-- =====================================================
-- From: 04_acervo.sql
-- =====================================================

-- Tabela de acervo de processos (acervo geral + arquivados)
-- Armazena todos os processos capturados, seja do acervo geral ou arquivados

create table public.acervo (
  id bigint generated always as identity primary key,
  id_pje bigint not null,
  advogado_id bigint not null references public.advogados(id) on delete cascade,
  origem text not null check (origem in ('acervo_geral', 'arquivado')),
  trt public.codigo_tribunal not null,
  grau public.grau_tribunal not null,
  numero_processo text not null,
  numero bigint not null,
  descricao_orgao_julgador text not null,
  classe_judicial text not null,
  segredo_justica boolean not null default false,
  codigo_status_processo text not null,
  prioridade_processual integer not null default 0,
  nome_parte_autora text not null,
  qtde_parte_autora integer not null default 1,
  nome_parte_re text not null,
  qtde_parte_re integer not null default 1,
  data_autuacao timestamptz not null,
  juizo_digital boolean not null default false,
  data_arquivamento timestamptz,
  data_proxima_audiencia timestamptz,
  tem_associacao boolean not null default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  -- Garantir unicidade do processo: mesmo processo pode ter IDs diferentes em graus diferentes
  -- Não inclui advogado_id porque múltiplos advogados podem estar no mesmo processo
  unique (id_pje, trt, grau, numero_processo)
);
comment on table public.acervo is 'Acervo completo de processos capturados do PJE. Timeline armazenada em timeline_jsonb (JSONB).';
comment on column public.acervo.id_pje is 'ID do processo no sistema PJE';
comment on column public.acervo.advogado_id is 'Referência ao advogado que capturou o processo (não faz parte da unicidade, pois múltiplos advogados podem estar no mesmo processo)';
comment on column public.acervo.origem is 'Origem do processo: acervo_geral ou arquivado';
comment on column public.acervo.trt is 'Código do TRT onde o processo está tramitando';
comment on column public.acervo.grau is 'Grau do processo (primeiro_grau ou segundo_grau)';
comment on column public.acervo.numero_processo is 'Número do processo no formato CNJ (ex: 0101450-28.2025.5.01.0431)';
comment on column public.acervo.numero is 'Número sequencial do processo';
comment on column public.acervo.descricao_orgao_julgador is 'Descrição completa do órgão julgador';
comment on column public.acervo.classe_judicial is 'Classe judicial do processo (ex: ATOrd, ATSum)';
comment on column public.acervo.segredo_justica is 'Indica se o processo está em segredo de justiça';
comment on column public.acervo.codigo_status_processo is 'Código do status do processo (ex: DISTRIBUIDO)';
comment on column public.acervo.prioridade_processual is 'Prioridade processual do processo';
comment on column public.acervo.nome_parte_autora is 'Nome da parte autora';
comment on column public.acervo.qtde_parte_autora is 'Quantidade de partes autoras';
comment on column public.acervo.nome_parte_re is 'Nome da parte ré';
comment on column public.acervo.qtde_parte_re is 'Quantidade de partes rés';
comment on column public.acervo.data_autuacao is 'Data de autuação do processo';
comment on column public.acervo.juizo_digital is 'Indica se o processo é de juízo digital';
comment on column public.acervo.data_arquivamento is 'Data de arquivamento do processo (pode estar presente mesmo em acervo geral)';
comment on column public.acervo.data_proxima_audiencia is 'Data da próxima audiência agendada';
comment on column public.acervo.tem_associacao is 'Indica se o processo possui processos associados';

-- Índices para melhor performance
create index idx_acervo_advogado_id on public.acervo using btree (advogado_id);
create index idx_acervo_origem on public.acervo using btree (origem);
create index idx_acervo_trt on public.acervo using btree (trt);
create index idx_acervo_grau on public.acervo using btree (grau);
create index idx_acervo_numero_processo on public.acervo using btree (numero_processo);
create index idx_acervo_id_pje on public.acervo using btree (id_pje);
create index idx_acervo_data_autuacao on public.acervo using btree (data_autuacao);
create index idx_acervo_data_arquivamento on public.acervo using btree (data_arquivamento);
create index idx_acervo_advogado_trt_grau on public.acervo using btree (advogado_id, trt, grau);
create index idx_acervo_numero_processo_trt_grau on public.acervo using btree (numero_processo, trt, grau);

-- Trigger para atualizar updated_at automaticamente
create trigger update_acervo_updated_at
before update on public.acervo
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.acervo enable row level security;


-- =====================================================
-- From: 04_acervo_functions.sql
-- =====================================================

-- ============================================================================
-- Funções Auxiliares para Tabela Acervo
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: random_acervo_sample
-- ----------------------------------------------------------------------------
-- Retorna uma amostra aleatória de registros da tabela acervo.
-- Usado para validação e benchmark de migrations da timeline.
--
-- Parâmetros:
--   limit_n: Número de registros a retornar
--
-- Retorna: setof acervo (conjunto de linhas da tabela acervo)
-- ----------------------------------------------------------------------------

create or replace function public.random_acervo_sample(limit_n integer)
returns setof public.acervo
language sql
security invoker
set search_path = ''
stable
as $$
  select *
  from public.acervo
  order by random()
  limit limit_n;
$$;

comment on function public.random_acervo_sample(integer) is 'Retorna uma amostra aleatória de registros da tabela acervo. Usado para validação e benchmark de migrations da timeline.';


-- =====================================================
-- From: 05_orgao_julgador.sql
-- =====================================================

-- Tabela de órgãos julgadores
-- Armazena informações dos órgãos julgadores que aparecem nas audiências

create table public.orgao_julgador (
  id bigint generated always as identity primary key,
  id_pje bigint not null,
  trt public.codigo_tribunal not null,
  grau public.grau_tribunal not null,
  descricao text not null,
  cejusc boolean not null default false,
  ativo boolean not null default true,
  posto_avancado boolean not null default false,
  novo_orgao_julgador boolean not null default false,
  codigo_serventia_cnj integer not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  -- Garantir unicidade por ID do PJE, TRT e grau
  unique (id_pje, trt, grau)
);
comment on table public.orgao_julgador is 'Órgãos julgadores dos processos capturados do PJE';
comment on column public.orgao_julgador.id_pje is 'ID do órgão julgador no sistema PJE';
comment on column public.orgao_julgador.trt is 'Código do TRT onde o órgão julgador está localizado';
comment on column public.orgao_julgador.grau is 'Grau do processo (primeiro_grau ou segundo_grau)';
comment on column public.orgao_julgador.descricao is 'Descrição completa do órgão julgador (ex: 72ª Vara do Trabalho do Rio de Janeiro)';
comment on column public.orgao_julgador.cejusc is 'Indica se é um CEJUSC (Centro Judiciário de Solução de Conflitos)';
comment on column public.orgao_julgador.ativo is 'Indica se o órgão julgador está ativo';
comment on column public.orgao_julgador.posto_avancado is 'Indica se é um posto avançado';
comment on column public.orgao_julgador.novo_orgao_julgador is 'Indica se é um novo órgão julgador';
comment on column public.orgao_julgador.codigo_serventia_cnj is 'Código da serventia no CNJ';

-- Índices para melhor performance
create index idx_orgao_julgador_id_pje on public.orgao_julgador using btree (id_pje);
create index idx_orgao_julgador_trt on public.orgao_julgador using btree (trt);
create index idx_orgao_julgador_grau on public.orgao_julgador using btree (grau);
create index idx_orgao_julgador_trt_grau on public.orgao_julgador using btree (trt, grau);
create index idx_orgao_julgador_descricao on public.orgao_julgador using btree (descricao);

-- Trigger para atualizar updated_at automaticamente
create trigger update_orgao_julgador_updated_at
before update on public.orgao_julgador
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.orgao_julgador enable row level security;


-- =====================================================
-- From: 06_expedientes.sql
-- =====================================================

-- ============================================================================
-- Tabela de expedientes processuais unificados
-- Consolida expedientes do PJE (captura), criados manualmente e do Comunica CNJ
-- ============================================================================

create table public.expedientes (
  id bigint generated always as identity primary key,
  id_pje bigint not null,
  advogado_id bigint references public.advogados(id) on delete cascade,
  processo_id bigint references public.acervo(id) on delete set null,
  trt public.codigo_tribunal not null,
  grau public.grau_tribunal not null,
  numero_processo text not null,
  descricao_orgao_julgador text not null,
  classe_judicial text not null,
  numero bigint not null,
  segredo_justica boolean not null default false,
  codigo_status_processo text not null,
  prioridade_processual integer not null default 0,
  nome_parte_autora text not null,
  qtde_parte_autora integer not null default 1,
  nome_parte_re text not null,
  qtde_parte_re integer not null default 1,
  data_autuacao timestamptz,
  juizo_digital boolean not null default false,
  data_arquivamento timestamptz,
  id_documento bigint,
  data_ciencia_parte timestamptz,
  data_prazo_legal_parte timestamptz,
  data_criacao_expediente timestamptz,
  prazo_vencido boolean not null default false,
  sigla_orgao_julgador text,
  dados_anteriores jsonb,
  responsavel_id bigint references public.usuarios(id) on delete set null,
  baixado_em timestamptz,
  protocolo_id text,
  justificativa_baixa text,
  tipo_expediente_id bigint references public.tipos_expedientes(id) on delete set null,
  descricao_arquivos text,
  arquivo_nome text,
  arquivo_url text,
  arquivo_bucket text,
  arquivo_key text,
  observacoes text,
  origem public.origem_expediente not null default 'captura',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- Garantir unicidade do expediente
  unique (id_pje, trt, grau, numero_processo),

  -- Constraint: se baixado_em não é null, então protocolo_id OU justificativa_baixa deve estar preenchido
  constraint check_baixa_valida check (
    baixado_em is null
    or (
      protocolo_id is not null
      or (justificativa_baixa is not null and trim(justificativa_baixa) != '')
    )
  )
);

comment on table public.expedientes is 'Expedientes processuais unificados. Inclui expedientes capturados do PJE (origem=captura), criados manualmente (origem=manual) e criados a partir de comunicações do CNJ (origem=comunica_cnj). RLS: Service role tem acesso total. Usuários autenticados podem ler.';
comment on column public.expedientes.id_pje is 'ID do expediente no sistema PJE (não é o ID do processo)';
comment on column public.expedientes.advogado_id is 'Advogado que capturou o expediente. Pode ser NULL para expedientes manuais ou criados via CNJ.';
comment on column public.expedientes.processo_id is 'Referência ao processo na tabela acervo (preenchido via trigger baseado no numero_processo)';
comment on column public.expedientes.trt is 'Código do TRT onde o processo está tramitando';
comment on column public.expedientes.grau is 'Grau do processo (primeiro_grau ou segundo_grau)';
comment on column public.expedientes.numero_processo is 'Número do processo no formato CNJ (usado para relacionar com acervo)';
comment on column public.expedientes.descricao_orgao_julgador is 'Descrição completa do órgão julgador';
comment on column public.expedientes.classe_judicial is 'Classe judicial do processo (ex: ATOrd, ATSum)';
comment on column public.expedientes.numero is 'Número sequencial do processo';
comment on column public.expedientes.segredo_justica is 'Indica se o processo está em segredo de justiça';
comment on column public.expedientes.codigo_status_processo is 'Código do status do processo (ex: DISTRIBUIDO)';
comment on column public.expedientes.prioridade_processual is 'Prioridade processual do processo';
comment on column public.expedientes.nome_parte_autora is 'Nome da parte autora';
comment on column public.expedientes.qtde_parte_autora is 'Quantidade de partes autoras';
comment on column public.expedientes.nome_parte_re is 'Nome da parte ré';
comment on column public.expedientes.qtde_parte_re is 'Quantidade de partes rés';
comment on column public.expedientes.data_autuacao is 'Data de autuação/distribuição do processo. Para expedientes criados via captura PJE, vem do próprio PJE. Para expedientes criados via Comunica CNJ, deve ser buscada na tabela acervo pelo numero_processo e grau. Pode ser null se o processo não existir no acervo.';
comment on column public.expedientes.juizo_digital is 'Indica se o processo é de juízo digital';
comment on column public.expedientes.data_arquivamento is 'Data de arquivamento do processo';
comment on column public.expedientes.id_documento is 'ID do documento/expediente pendente';
comment on column public.expedientes.data_ciencia_parte is 'Data em que a parte tomou ciência do expediente';
comment on column public.expedientes.data_prazo_legal_parte is 'Data limite para manifestação da parte';
comment on column public.expedientes.data_criacao_expediente is 'Data de criação do expediente';
comment on column public.expedientes.prazo_vencido is 'Indica se o prazo para manifestação já venceu';
comment on column public.expedientes.sigla_orgao_julgador is 'Sigla do órgão julgador (ex: VT33RJ)';
comment on column public.expedientes.baixado_em is 'Data e hora em que o expediente foi baixado (marcado como respondido). Null indica que o expediente ainda está pendente';
comment on column public.expedientes.protocolo_id is 'ID do protocolo da peça protocolada em resposta ao expediente (pode conter números e letras). Deve estar preenchido quando houve protocolo de peça';
comment on column public.expedientes.justificativa_baixa is 'Justificativa para baixa do expediente sem protocolo de peça. Deve estar preenchido quando não houve protocolo';
comment on column public.expedientes.tipo_expediente_id is 'Tipo de expediente associado. Referência à tabela tipos_expedientes. Null indica que o expediente não possui tipo atribuído.';
comment on column public.expedientes.descricao_arquivos is 'Descrição ou referência a arquivos relacionados ao expediente. Campo de texto livre para documentação adicional.';
comment on column public.expedientes.arquivo_nome is 'Nome do arquivo no Backblaze B2';
comment on column public.expedientes.arquivo_url is 'URL pública do arquivo no Backblaze B2';
comment on column public.expedientes.arquivo_bucket is 'Nome do bucket no Backblaze B2';
comment on column public.expedientes.arquivo_key is 'Chave do arquivo no Backblaze B2';
comment on column public.expedientes.observacoes is 'Anotações/observações internas do expediente pendente de manifestação';
comment on column public.expedientes.origem is 'Origem do expediente: captura (PJE), manual (criado pelo usuário), comunica_cnj (criado a partir de comunicação CNJ)';
comment on column public.expedientes.dados_anteriores is 'Armazena o estado anterior do registro antes da última atualização. Null quando o registro foi inserido ou quando não houve mudanças na última captura.';
comment on column public.expedientes.responsavel_id is 'Usuário responsável pelo processo pendente de manifestação. Pode ser atribuído, transferido ou desatribuído. Todas as alterações são registradas em logs_alteracao';

-- Índices para melhor performance
create index idx_expedientes_advogado_id on public.expedientes using btree (advogado_id);
create index idx_expedientes_processo_id on public.expedientes using btree (processo_id);
create index idx_expedientes_trt on public.expedientes using btree (trt);
create index idx_expedientes_grau on public.expedientes using btree (grau);
create index idx_expedientes_numero_processo on public.expedientes using btree (numero_processo);
create index idx_expedientes_id_pje on public.expedientes using btree (id_pje);
create index idx_expedientes_prazo_vencido on public.expedientes using btree (prazo_vencido);
create index idx_expedientes_data_prazo_legal on public.expedientes using btree (data_prazo_legal_parte);
create index idx_expedientes_advogado_trt_grau on public.expedientes using btree (advogado_id, trt, grau);
create index idx_expedientes_numero_processo_advogado on public.expedientes using btree (numero_processo, advogado_id);
create index idx_expedientes_baixado_em on public.expedientes using btree (baixado_em) where baixado_em is not null;
create index idx_expedientes_advogado_baixado on public.expedientes using btree (advogado_id, baixado_em) where baixado_em is null;
create index idx_expedientes_responsavel_id on public.expedientes using btree (responsavel_id);
create index idx_expedientes_tipo_expediente_id on public.expedientes using btree (tipo_expediente_id);
create index idx_expedientes_origem on public.expedientes using btree (origem);

-- Trigger para atualizar updated_at automaticamente
create trigger update_expedientes_updated_at
before update on public.expedientes
for each row
execute function public.update_updated_at_column();

-- Function para preencher processo_id baseado no numero_processo
create or replace function public.sync_expedientes_processo_id()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Buscar o processo_id na tabela acervo baseado no numero_processo, trt e grau
  if new.processo_id is null and new.numero_processo is not null then
    select acervo.id
    into new.processo_id
    from public.acervo
    where acervo.numero_processo = new.numero_processo
      and acervo.trt = new.trt
      and acervo.grau = new.grau
    limit 1;
  end if;

  return new;
end;
$$;
comment on function public.sync_expedientes_processo_id() is 'Preenche automaticamente processo_id em expedientes baseado no numero_processo';

-- Trigger para preencher processo_id antes de inserir ou atualizar
create trigger sync_expedientes_processo_id_trigger
before insert or update on public.expedientes
for each row
when (new.processo_id is null)
execute function public.sync_expedientes_processo_id();

-- Função para registrar baixa nos logs
create or replace function public.registrar_baixa_expediente(
  p_expediente_id bigint,
  p_usuario_id bigint,
  p_protocolo_id text default null,
  p_justificativa text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.logs_alteracao (
    tipo_entidade,
    entidade_id,
    tipo_evento,
    usuario_que_executou_id,
    dados_evento
  ) values (
    'expedientes',
    p_expediente_id,
    'baixa_expediente',
    p_usuario_id,
    jsonb_build_object(
      'protocolo_id', p_protocolo_id,
      'justificativa_baixa', p_justificativa,
      'baixado_em', now()
    )
  );
end;
$$;
comment on function public.registrar_baixa_expediente is 'Registra a baixa de um expediente nos logs de alteração';

-- Função para registrar reversão nos logs
create or replace function public.registrar_reversao_baixa_expediente(
  p_expediente_id bigint,
  p_usuario_id bigint,
  p_protocolo_id_anterior text default null,
  p_justificativa_anterior text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.logs_alteracao (
    tipo_entidade,
    entidade_id,
    tipo_evento,
    usuario_que_executou_id,
    dados_evento
  ) values (
    'expedientes',
    p_expediente_id,
    'reversao_baixa_expediente',
    p_usuario_id,
    jsonb_build_object(
      'protocolo_id_anterior', p_protocolo_id_anterior,
      'justificativa_anterior', p_justificativa_anterior,
      'revertido_em', now()
    )
  );
end;
$$;
comment on function public.registrar_reversao_baixa_expediente is 'Registra a reversão da baixa de um expediente nos logs de alteração';

-- Habilitar RLS
alter table public.expedientes enable row level security;

-- Políticas RLS
create policy "Service role tem acesso total aos expedientes"
on public.expedientes for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler expedientes"
on public.expedientes for select
to authenticated
using (true);

create policy "Usuários autenticados podem inserir expedientes"
on public.expedientes for insert
to authenticated
with check (true);

create policy "Usuários autenticados podem atualizar expedientes"
on public.expedientes for update
to authenticated
using (true)
with check (true);

-- =====================================================
-- From: 07_audiencias.sql
-- =====================================================

-- Tabela de audiências
-- Armazena audiências agendadas dos processos

create table public.audiencias (
  id bigint generated always as identity primary key,
  id_pje bigint not null,
  advogado_id bigint not null references public.advogados(id) on delete cascade,
  processo_id bigint not null references public.acervo(id) on delete cascade,
  orgao_julgador_id bigint references public.orgao_julgador(id) on delete set null,
  trt public.codigo_tribunal not null,
  grau public.grau_tribunal not null,
  numero_processo text not null,
  data_inicio timestamptz not null,
  data_fim timestamptz not null,
  hora_inicio time,
  hora_fim time,
  modalidade public.modalidade_audiencia,
  sala_audiencia_nome text,
  sala_audiencia_id bigint,
  status text not null,
  status_descricao text,
  tipo_audiencia_id bigint references public.tipo_audiencia(id) on delete set null,
  classe_judicial_id bigint references public.classe_judicial(id) on delete set null,
  designada boolean not null default false,
  em_andamento boolean not null default false,
  documento_ativo boolean not null default false,
  polo_ativo_nome text,
  polo_ativo_representa_varios boolean not null default false,
  polo_passivo_nome text,
  polo_passivo_representa_varios boolean not null default false,
  url_audiencia_virtual text,
  endereco_presencial jsonb,
  presenca_hibrida text check (presenca_hibrida is null or presenca_hibrida in ('advogado', 'cliente')),
  ata_audiencia_id bigint,
  url_ata_audiencia text,
  segredo_justica boolean not null default false,
  juizo_digital boolean not null default false,
  responsavel_id bigint references public.usuarios(id) on delete set null,
  observacoes text,
  dados_anteriores jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  -- Garantir unicidade da audiência: mesmo processo pode ter múltiplos advogados habilitados
  -- Não inclui advogado_id porque múltiplos advogados do mesmo escritório podem ver a mesma audiência
  unique (id_pje, trt, grau, numero_processo)
);
comment on table public.audiencias is 'Audiências agendadas dos processos capturados do PJE. A unicidade da audiência é garantida por (id_pje, trt, grau, numero_processo), permitindo que múltiplos advogados vejam a mesma audiência do mesmo processo sem duplicação';
comment on column public.audiencias.id_pje is 'ID da audiência no sistema PJE';
comment on column public.audiencias.advogado_id is 'Referência ao advogado que capturou a audiência (não faz parte da unicidade, pois múltiplos advogados podem ver a mesma audiência)';
comment on column public.audiencias.processo_id is 'Referência ao processo na tabela acervo (ID do processo no PJE)';
comment on column public.audiencias.orgao_julgador_id is 'Referência ao órgão julgador da audiência';
comment on column public.audiencias.trt is 'Código do TRT onde a audiência está agendada';
comment on column public.audiencias.grau is 'Grau do processo (primeiro_grau ou segundo_grau)';
comment on column public.audiencias.numero_processo is 'Número do processo no formato CNJ (usado para garantir unicidade junto com id_pje, trt e grau)';
comment on column public.audiencias.data_inicio is 'Data e hora de início da audiência';
comment on column public.audiencias.data_fim is 'Data e hora de fim da audiência';
comment on column public.audiencias.hora_inicio is 'Hora de início da audiência (extraída de pautaAudienciaHorario.horaInicial do PJE)';
comment on column public.audiencias.hora_fim is 'Hora de fim da audiência (extraída de pautaAudienciaHorario.horaFinal do PJE)';
comment on column public.audiencias.modalidade is 'Modalidade da audiência: virtual, presencial ou híbrida. Populada automaticamente por trigger, exceto híbrida que é manual.';
comment on column public.audiencias.sala_audiencia_nome is 'Nome da sala de audiência';
comment on column public.audiencias.sala_audiencia_id is 'ID da sala de audiência no PJE';
comment on column public.audiencias.status is 'Status da audiência (M=Marcada, R=Realizada, C=Cancelada)';
comment on column public.audiencias.status_descricao is 'Descrição do status da audiência';
comment on column public.audiencias.tipo_audiencia_id is 'FK para tipo_audiencia com descricao, codigo e is_virtual';
comment on column public.audiencias.classe_judicial_id is 'FK para classe_judicial com descricao e sigla';
comment on column public.audiencias.designada is 'Indica se a audiência está designada';
comment on column public.audiencias.em_andamento is 'Indica se a audiência está em andamento';
comment on column public.audiencias.documento_ativo is 'Indica se há documento ativo relacionado';
comment on column public.audiencias.polo_ativo_nome is 'Nome da parte autora';
comment on column public.audiencias.polo_ativo_representa_varios is 'Indica se o polo ativo representa múltiplas partes';
comment on column public.audiencias.polo_passivo_nome is 'Nome da parte ré';
comment on column public.audiencias.polo_passivo_representa_varios is 'Indica se o polo passivo representa múltiplas partes';
comment on column public.audiencias.url_audiencia_virtual is 'URL para audiências virtuais (Zoom, Google Meet, etc). Quando preenchida, modalidade = virtual';
comment on column public.audiencias.endereco_presencial is 'Endereço da audiência presencial em JSON (logradouro, numero, cidade, etc). Quando preenchido, modalidade = presencial';
comment on column public.audiencias.presenca_hibrida is 'Para audiências híbridas: indica quem comparece presencialmente (advogado ou cliente). Null para modalidades não-híbridas.';
comment on column public.audiencias.ata_audiencia_id is 'ID do documento de ata da audiência no PJE';
comment on column public.audiencias.url_ata_audiencia is 'URL para download da ata da audiência';
comment on column public.audiencias.segredo_justica is 'Indica se o processo está em segredo de justiça';
comment on column public.audiencias.juizo_digital is 'Indica se o processo está em juízo digital';
comment on column public.audiencias.responsavel_id is 'Usuário responsável pela audiência. Pode ser atribuído, transferido ou desatribuído. Todas as alterações são registradas em logs_alteracao';
comment on column public.audiencias.observacoes is 'Observações sobre a audiência';
comment on column public.audiencias.dados_anteriores is 'Armazena o estado anterior do registro antes da última atualização. Null quando o registro foi inserido ou quando não houve mudanças na última captura.';

-- Índices para melhor performance
create index idx_audiencias_advogado_id on public.audiencias using btree (advogado_id);
create index idx_audiencias_processo_id on public.audiencias using btree (processo_id);
create index idx_audiencias_orgao_julgador_id on public.audiencias using btree (orgao_julgador_id);
create index idx_audiencias_trt on public.audiencias using btree (trt);
create index idx_audiencias_grau on public.audiencias using btree (grau);
create index idx_audiencias_id_pje on public.audiencias using btree (id_pje);
create index idx_audiencias_numero_processo on public.audiencias using btree (numero_processo);
create index idx_audiencias_status on public.audiencias using btree (status);
create index idx_audiencias_data_inicio on public.audiencias using btree (data_inicio);
create index idx_audiencias_data_fim on public.audiencias using btree (data_fim);
create index idx_audiencias_responsavel_id on public.audiencias using btree (responsavel_id);
create index idx_audiencias_advogado_trt_grau on public.audiencias using btree (advogado_id, trt, grau);
create index idx_audiencias_processo_data on public.audiencias using btree (processo_id, data_inicio);
create index idx_audiencias_modalidade on public.audiencias using btree (modalidade);

-- Função e trigger para popular modalidade automaticamente
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

create trigger trigger_set_modalidade_audiencia
  before insert or update of url_audiencia_virtual, endereco_presencial, tipo_audiencia_id, modalidade
  on public.audiencias
  for each row
  execute function public.populate_modalidade_audiencia();

-- Trigger para atualizar updated_at automaticamente
create trigger update_audiencias_updated_at
before update on public.audiencias
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.audiencias enable row level security;


-- =====================================================
-- From: 07_tipos_expedientes.sql
-- =====================================================

-- Tabela de tipos de expedientes
-- Armazena os tipos de expedientes cadastrados pelos usuários

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

-- Índice para busca por nome
create index if not exists idx_tipos_expedientes_tipo on public.tipos_expedientes using btree (tipo_expediente);
create index if not exists idx_tipos_expedientes_created_by on public.tipos_expedientes using btree (created_by);

-- Trigger para atualizar updated_at automaticamente
create trigger update_tipos_expedientes_updated_at
before update on public.tipos_expedientes
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.tipos_expedientes enable row level security;

-- =====================================================
-- From: 08_usuarios.sql
-- =====================================================

-- ============================================================================
-- Tabela: usuarios
-- Cadastro de usuários do sistema (funcionários e colaboradores do escritório)
-- ============================================================================

create table if not exists public.usuarios (
  id bigint generated always as identity primary key,

  -- Dados básicos
  nome_completo text not null,
  nome_exibicao text not null,
  cpf text not null unique,
  rg text,
  data_nascimento date,
  genero public.genero_usuario,

  -- Dados profissionais
  oab text,
  uf_oab text,

  -- Dados de contato
  email_pessoal text,
  email_corporativo text not null unique,
  telefone text,
  ramal text,

  -- Endereço (JSONB)
  endereco jsonb,

  -- Mídia
  avatar_url text,
  cover_url text,

  -- Controle
  auth_user_id uuid references auth.users(id),
  cargo_id bigint references public.cargos(id),
  is_super_admin boolean default false,
  ativo boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

comment on table public.usuarios is 'Cadastro de usuários do sistema (funcionários e colaboradores do escritório de advocacia)';
comment on column public.usuarios.id is 'ID sequencial do usuário';
comment on column public.usuarios.nome_completo is 'Nome completo do usuário';
comment on column public.usuarios.nome_exibicao is 'Nome para exibição no sistema';
comment on column public.usuarios.cpf is 'CPF do usuário (único, sem formatação)';
comment on column public.usuarios.rg is 'RG do usuário';
comment on column public.usuarios.data_nascimento is 'Data de nascimento do usuário';
comment on column public.usuarios.genero is 'Gênero do usuário';
comment on column public.usuarios.oab is 'Número da OAB (se o usuário for advogado)';
comment on column public.usuarios.uf_oab is 'UF onde a OAB foi emitida';
comment on column public.usuarios.email_pessoal is 'E-mail pessoal do usuário';
comment on column public.usuarios.email_corporativo is 'E-mail corporativo do usuário (único)';
comment on column public.usuarios.telefone is 'Telefone do usuário';
comment on column public.usuarios.ramal is 'Ramal do telefone';
comment on column public.usuarios.endereco is 'Endereço completo em JSONB (logradouro, numero, complemento, bairro, cidade, estado, pais, cep)';
comment on column public.usuarios.avatar_url is 'URL da imagem de avatar do usuário armazenada no Supabase Storage (bucket: avatars)';
comment on column public.usuarios.cover_url is 'URL da imagem de capa/banner do perfil do usuário armazenada no Supabase Storage (bucket: covers)';
comment on column public.usuarios.auth_user_id is 'Referência ao usuário no Supabase Auth (opcional)';
comment on column public.usuarios.cargo_id is 'ID do cargo do usuário (opcional, para organização interna)';
comment on column public.usuarios.is_super_admin is 'Indica se o usuário é super admin (bypassa todas as permissões)';
comment on column public.usuarios.ativo is 'Indica se o usuário está ativo no sistema';

-- Índices
create unique index if not exists idx_usuarios_cpf on public.usuarios(cpf);
create unique index if not exists idx_usuarios_email_corporativo on public.usuarios(email_corporativo);
create index if not exists idx_usuarios_auth_user_id on public.usuarios(auth_user_id);
create index if not exists idx_usuarios_cargo_id on public.usuarios(cargo_id);
create index if not exists idx_usuarios_ativo on public.usuarios(ativo);
create index if not exists idx_usuarios_nome_completo on public.usuarios(nome_completo);
create index if not exists idx_usuarios_oab on public.usuarios(oab, uf_oab) where oab is not null;
create index if not exists idx_usuarios_endereco on public.usuarios using gin (endereco);

-- Trigger para atualizar updated_at automaticamente
create trigger update_usuarios_updated_at
before update on public.usuarios
for each row
execute function public.update_updated_at_column();

-- RLS
alter table public.usuarios enable row level security;

create policy "Service role tem acesso total a usuarios"
on public.usuarios for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler usuarios"
on public.usuarios for select
to authenticated
using (true);

create policy "Usuários podem atualizar seu próprio perfil"
on public.usuarios for update
to authenticated
using ((select auth.uid()) = auth_user_id)
with check ((select auth.uid()) = auth_user_id);

-- =====================================================
-- From: 09_clientes.sql
-- =====================================================

-- ============================================================================
-- Tabela: clientes
-- Clientes do escritório - Tabela global, relação com processo via processo_partes
-- CPF/CNPJ são as chaves únicas para deduplicação.
-- id_pessoa_pje foi movido para cadastros_pje.
-- ============================================================================

create table public.clientes (
  id bigint generated always as identity primary key,
  
  -- Tipo e identificação
  tipo_pessoa public.tipo_pessoa not null,
  nome text not null,
  nome_social_fantasia text, -- Nome social (PF) ou Nome fantasia (PJ)
  cpf text unique,
  cnpj text unique,
  
  -- Documentação e dados básicos
  rg text,
  data_nascimento date,
  genero public.genero_usuario,
  estado_civil public.estado_civil,
  nacionalidade text,
  inscricao_estadual text,
  
  -- Dados do PJE
  tipo_documento text check (tipo_documento in ('CPF', 'CNPJ')),
  emails jsonb, -- Array de emails do PJE
  status_pje text,
  situacao_pje text,
  login_pje text,
  autoridade boolean default false,
  
  -- Telefones
  ddd_celular text,
  numero_celular text,
  ddd_residencial text,
  numero_residencial text,
  ddd_comercial text,
  numero_comercial text,
  
  -- Dados PF - PJE detalhados
  sexo text,
  nome_genitora text,
  naturalidade_id_pje integer,
  naturalidade_municipio text,
  naturalidade_estado_id_pje integer,
  naturalidade_estado_sigla text,
  uf_nascimento_id_pje integer,
  uf_nascimento_sigla text,
  uf_nascimento_descricao text,
  pais_nascimento_id_pje integer,
  pais_nascimento_codigo text,
  pais_nascimento_descricao text,
  escolaridade_codigo integer,
  situacao_cpf_receita_id integer,
  situacao_cpf_receita_descricao text,
  pode_usar_celular_mensagem boolean default false,
  
  -- Dados PJ - PJE detalhados
  data_abertura date,
  data_fim_atividade date,
  orgao_publico boolean default false,
  tipo_pessoa_codigo_pje text,
  tipo_pessoa_label_pje text,
  tipo_pessoa_validacao_receita text,
  ds_tipo_pessoa text,
  situacao_cnpj_receita_id integer,
  situacao_cnpj_receita_descricao text,
  ramo_atividade text,
  cpf_responsavel text,
  oficial boolean default false,
  ds_prazo_expediente_automatico text,
  porte_codigo integer,
  porte_descricao text,
  ultima_atualizacao_pje timestamptz,
  
  -- Endereço e controle
  endereco_id bigint references public.enderecos(id),
  observacoes text,
  created_by bigint references public.usuarios(id) on delete set null,
  dados_anteriores jsonb,
  ativo boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.clientes is 'Clientes do escritório - Tabela global, relação com processo via processo_partes';

-- Comentários dos campos principais
comment on column public.clientes.tipo_pessoa is 'Tipo de pessoa: física (pf) ou jurídica (pj)';
comment on column public.clientes.nome is 'Nome completo (PF) ou Razão Social (PJ)';
comment on column public.clientes.nome_social_fantasia is 'Nome social (para PF) ou nome fantasia (para PJ). Coluna única que serve para ambos os tipos de pessoa.';
comment on column public.clientes.cpf is 'CPF do cliente (obrigatório para PF, único)';
comment on column public.clientes.cnpj is 'CNPJ do cliente (obrigatório para PJ, único)';
comment on column public.clientes.tipo_documento is 'Tipo do documento principal: CPF ou CNPJ';
comment on column public.clientes.emails is 'Array de emails do PJE em formato JSONB: ["email1@...", "email2@..."]';
comment on column public.clientes.status_pje is 'Status da pessoa no PJE (ex: A=Ativo)';
comment on column public.clientes.situacao_pje is 'Situação da pessoa no PJE (ex: Ativo, Inativo)';
comment on column public.clientes.login_pje is 'Login/usuário da pessoa no sistema PJE';
comment on column public.clientes.sexo is 'Sexo da pessoa física no PJE: MASCULINO, FEMININO (campo texto, diferente do enum genero)';
comment on column public.clientes.situacao_cpf_receita_descricao is 'Situação do CPF na Receita Federal (REGULAR, IRREGULAR, etc)';
comment on column public.clientes.ds_tipo_pessoa is 'Descrição do tipo de pessoa jurídica (ex: Sociedade Anônima Aberta, LTDA)';
comment on column public.clientes.situacao_cnpj_receita_descricao is 'Situação do CNPJ na Receita Federal (ATIVA, BAIXADA, etc)';
comment on column public.clientes.ramo_atividade is 'Ramo de atividade da pessoa jurídica';
comment on column public.clientes.porte_descricao is 'Descrição do porte da empresa (Micro, Pequeno, Médio, Grande)';
comment on column public.clientes.endereco_id is 'FK para endereços.id - Endereço principal do cliente';
comment on column public.clientes.dados_anteriores is 'Armazena o estado anterior do registro antes da última atualização. Null quando o registro foi inserido ou quando não houve mudanças.';

-- Índices para melhor performance
create index idx_clientes_tipo_pessoa on public.clientes using btree (tipo_pessoa);
create index idx_clientes_cpf on public.clientes using btree (cpf) where cpf is not null;
create index idx_clientes_cnpj on public.clientes using btree (cnpj) where cnpj is not null;
create index idx_clientes_nome on public.clientes using btree (nome);
create index idx_clientes_ativo on public.clientes using btree (ativo);
create index idx_clientes_created_by on public.clientes using btree (created_by);
create index idx_clientes_endereco_id on public.clientes using btree (endereco_id);

-- Trigger para atualizar updated_at automaticamente
create trigger update_clientes_updated_at
before update on public.clientes
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.clientes enable row level security;

-- Políticas RLS
create policy "Service role tem acesso total aos clientes"
on public.clientes for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler clientes"
on public.clientes for select
to authenticated
using (true);

-- =====================================================
-- From: 10_partes_contrarias.sql
-- =====================================================

-- ============================================================================
-- Tabela: partes_contrarias
-- Partes contrárias em processos - Tabela global, relação com processo via processo_partes
-- CPF/CNPJ são as chaves únicas para deduplicação.
-- id_pessoa_pje foi movido para cadastros_pje.
-- ============================================================================

create table public.partes_contrarias (
  id bigint generated always as identity primary key,
  
  -- Tipo e identificação
  tipo_pessoa public.tipo_pessoa not null,
  nome text not null,
  nome_social_fantasia text, -- Nome social (PF) ou Nome fantasia (PJ)
  cpf text unique,
  cnpj text unique,
  
  -- Documentação e dados básicos
  rg text,
  data_nascimento date,
  genero public.genero_usuario,
  estado_civil public.estado_civil,
  nacionalidade text,
  inscricao_estadual text,
  
  -- Dados do PJE
  tipo_documento text check (tipo_documento in ('CPF', 'CNPJ')),
  emails jsonb, -- Array de emails do PJE
  status_pje text,
  situacao_pje text,
  login_pje text,
  autoridade boolean default false,
  
  -- Telefones
  ddd_celular text,
  numero_celular text,
  ddd_residencial text,
  numero_residencial text,
  ddd_comercial text,
  numero_comercial text,
  
  -- Dados PF - PJE detalhados
  sexo text,
  nome_genitora text,
  naturalidade_id_pje integer,
  naturalidade_municipio text,
  naturalidade_estado_id_pje integer,
  naturalidade_estado_sigla text,
  uf_nascimento_id_pje integer,
  uf_nascimento_sigla text,
  uf_nascimento_descricao text,
  pais_nascimento_id_pje integer,
  pais_nascimento_codigo text,
  pais_nascimento_descricao text,
  escolaridade_codigo integer,
  situacao_cpf_receita_id integer,
  situacao_cpf_receita_descricao text,
  pode_usar_celular_mensagem boolean default false,
  
  -- Dados PJ - PJE detalhados
  data_abertura date,
  data_fim_atividade date,
  orgao_publico boolean default false,
  tipo_pessoa_codigo_pje text,
  tipo_pessoa_label_pje text,
  tipo_pessoa_validacao_receita text,
  ds_tipo_pessoa text,
  situacao_cnpj_receita_id integer,
  situacao_cnpj_receita_descricao text,
  ramo_atividade text,
  cpf_responsavel text,
  oficial boolean default false,
  ds_prazo_expediente_automatico text,
  porte_codigo integer,
  porte_descricao text,
  ultima_atualizacao_pje timestamptz,
  
  -- Endereço e controle
  endereco_id bigint references public.enderecos(id),
  observacoes text,
  created_by bigint references public.usuarios(id) on delete set null,
  dados_anteriores jsonb,
  ativo boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.partes_contrarias is 'Partes contrárias em processos - Tabela global, relação com processo via processo_partes';

-- Comentários dos campos principais
comment on column public.partes_contrarias.tipo_pessoa is 'Tipo de pessoa: física (pf) ou jurídica (pj)';
comment on column public.partes_contrarias.nome is 'Nome completo (PF) ou Razão Social (PJ)';
comment on column public.partes_contrarias.nome_social_fantasia is 'Nome social (para PF) ou nome fantasia (para PJ). Coluna única que serve para ambos os tipos de pessoa.';
comment on column public.partes_contrarias.cpf is 'CPF da parte contrária (obrigatório para PF, único)';
comment on column public.partes_contrarias.cnpj is 'CNPJ da parte contrária (obrigatório para PJ, único)';
comment on column public.partes_contrarias.tipo_documento is 'Tipo do documento principal: CPF ou CNPJ';
comment on column public.partes_contrarias.emails is 'Array de emails do PJE em formato JSONB: ["email1@...", "email2@..."]';
comment on column public.partes_contrarias.status_pje is 'Status da pessoa no PJE (ex: A=Ativo)';
comment on column public.partes_contrarias.situacao_pje is 'Situação da pessoa no PJE (ex: Ativo, Inativo)';
comment on column public.partes_contrarias.login_pje is 'Login/usuário da pessoa no sistema PJE';
comment on column public.partes_contrarias.sexo is 'Sexo da pessoa física no PJE: MASCULINO, FEMININO (campo texto, diferente do enum genero)';
comment on column public.partes_contrarias.situacao_cpf_receita_descricao is 'Situação do CPF na Receita Federal (REGULAR, IRREGULAR, etc)';
comment on column public.partes_contrarias.ds_tipo_pessoa is 'Descrição do tipo de pessoa jurídica (ex: Sociedade Anônima Aberta, LTDA)';
comment on column public.partes_contrarias.situacao_cnpj_receita_descricao is 'Situação do CNPJ na Receita Federal (ATIVA, BAIXADA, etc)';
comment on column public.partes_contrarias.ramo_atividade is 'Ramo de atividade da pessoa jurídica';
comment on column public.partes_contrarias.porte_descricao is 'Descrição do porte da empresa (Micro, Pequeno, Médio, Grande)';
comment on column public.partes_contrarias.endereco_id is 'FK para endereços.id - Endereço principal da parte contrária';
comment on column public.partes_contrarias.dados_anteriores is 'Armazena o estado anterior do registro antes da última atualização. Null quando o registro foi inserido ou quando não houve mudanças.';

-- Índices para melhor performance
create index idx_partes_contrarias_tipo_pessoa on public.partes_contrarias using btree (tipo_pessoa);
create index idx_partes_contrarias_cpf on public.partes_contrarias using btree (cpf) where cpf is not null;
create index idx_partes_contrarias_cnpj on public.partes_contrarias using btree (cnpj) where cnpj is not null;
create index idx_partes_contrarias_nome on public.partes_contrarias using btree (nome);
create index idx_partes_contrarias_ativo on public.partes_contrarias using btree (ativo);
create index idx_partes_contrarias_created_by on public.partes_contrarias using btree (created_by);
create index idx_partes_contrarias_endereco_id on public.partes_contrarias using btree (endereco_id);

-- Trigger para atualizar updated_at automaticamente
create trigger update_partes_contrarias_updated_at
before update on public.partes_contrarias
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.partes_contrarias enable row level security;

-- Políticas RLS
create policy "Service role tem acesso total às partes contrárias"
on public.partes_contrarias for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler partes contrárias"
on public.partes_contrarias for select
to authenticated
using (true);

-- =====================================================
-- From: 11_contratos.sql
-- =====================================================

-- Tabela de contratos do sistema
-- Contratos jurídicos do escritório de advocacia

create table public.contratos (
  id bigint generated always as identity primary key,

  -- Dados do contrato
  segmento_id bigint references public.segmentos(id),
  tipo_contrato public.tipo_contrato not null,
  tipo_cobranca public.tipo_cobranca not null,
  
  -- Partes do contrato
  cliente_id bigint not null references public.clientes(id) on delete restrict,
  papel_cliente_no_contrato public.papel_contratual not null,
  
  -- Status e datas
  status public.status_contrato not null default 'em_contratacao',
  cadastrado_em timestamptz default now() not null,
  
  -- Controle
  responsavel_id bigint references public.usuarios(id) on delete set null,
  created_by bigint references public.usuarios(id) on delete set null,
  observacoes text,
  dados_anteriores jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.contratos is 'Contratos jurídicos do escritório de advocacia';

-- Comentários dos campos
comment on column public.contratos.segmento_id is 'ID do segmento (área de atuação) do contrato';
comment on column public.contratos.tipo_contrato is 'Tipo de contrato jurídico';
comment on column public.contratos.tipo_cobranca is 'Tipo de cobrança (pró-exito ou pró-labore)';
comment on column public.contratos.cliente_id is 'ID do cliente principal do contrato';
comment on column public.contratos.papel_cliente_no_contrato is 'Papel contratual que o cliente principal ocupa (autora ou ré)';
comment on column public.contratos.status is 'Status do contrato no sistema';
comment on column public.contratos.cadastrado_em is 'Data/hora de cadastro do contrato (antigo data_contratacao)';
comment on column public.contratos.responsavel_id is 'ID do usuário responsável pelo contrato';
comment on column public.contratos.created_by is 'ID do usuário que criou o registro';
comment on column public.contratos.observacoes is 'Observações gerais sobre o contrato';
comment on column public.contratos.dados_anteriores is 'Armazena o estado anterior do registro antes da última atualização. Null quando o registro foi inserido ou quando não houve mudanças.';

-- Índices para melhor performance
create index idx_contratos_segmento_id on public.contratos using btree (segmento_id);
create index idx_contratos_tipo_contrato on public.contratos using btree (tipo_contrato);
create index idx_contratos_status on public.contratos using btree (status);
create index idx_contratos_cliente_id on public.contratos using btree (cliente_id);
create index idx_contratos_responsavel_id on public.contratos using btree (responsavel_id);
create index idx_contratos_created_by on public.contratos using btree (created_by);

-- Trigger para atualizar updated_at automaticamente
create trigger update_contratos_updated_at
before update on public.contratos
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.contratos enable row level security;


-- =====================================================
-- From: 12_contrato_processos.sql
-- =====================================================

-- Tabela de relacionamento entre contratos e processos
-- Um contrato pode ter múltiplos processos associados

create table public.contrato_processos (
  id bigint generated always as identity primary key,
  contrato_id bigint not null references public.contratos(id) on delete cascade,
  processo_id bigint not null references public.acervo(id) on delete cascade,
  created_at timestamptz default now() not null,
  
  -- Garantir que um processo não seja associado duas vezes ao mesmo contrato
  unique (contrato_id, processo_id)
);

comment on table public.contrato_processos is 'Relacionamento entre contratos e processos. Um contrato pode ter múltiplos processos associados.';

-- Comentários dos campos
comment on column public.contrato_processos.contrato_id is 'ID do contrato';
comment on column public.contrato_processos.processo_id is 'ID do processo na tabela acervo';
comment on column public.contrato_processos.created_at is 'Data de criação do relacionamento';

-- Índices para melhor performance
create index idx_contrato_processos_contrato_id on public.contrato_processos using btree (contrato_id);
create index idx_contrato_processos_processo_id on public.contrato_processos using btree (processo_id);
create index idx_contrato_processos_contrato_processo on public.contrato_processos using btree (contrato_id, processo_id);

-- Habilitar RLS
alter table public.contrato_processos enable row level security;


-- =====================================================
-- From: 13_tribunais.sql
-- =====================================================

-- ============================================================================
-- Tabela: tribunais
-- Cadastro de tribunais do sistema
-- ============================================================================

create table if not exists public.tribunais (
  id text primary key,
  codigo text not null,
  nome text not null,
  regiao text,
  uf text,
  "cidadeSede" text,
  ativo boolean default true,
  "createdAt" timestamp without time zone default current_timestamp,
  "updatedAt" timestamp without time zone
);

comment on table public.tribunais is 'Cadastro de tribunais do sistema (TRTs, TJs, TRFs, etc)';
comment on column public.tribunais.id is 'Identificador único do tribunal';
comment on column public.tribunais.codigo is 'Código do tribunal (ex: TRT1, TJSP)';
comment on column public.tribunais.nome is 'Nome completo do tribunal';
comment on column public.tribunais.regiao is 'Região do tribunal';
comment on column public.tribunais.uf is 'UF do tribunal';
comment on column public.tribunais."cidadeSede" is 'Cidade sede do tribunal';
comment on column public.tribunais.ativo is 'Indica se o tribunal está ativo';

-- Índices
create index if not exists idx_tribunais_codigo on public.tribunais(codigo);
create index if not exists idx_tribunais_ativo on public.tribunais(ativo);


-- ============================================================================
-- Tabela: tribunais_config
-- Configurações de acesso aos tribunais para captura
-- ============================================================================

create table if not exists public.tribunais_config (
  id text primary key,
  tribunal_id text not null references public.tribunais(id),
  sistema text default 'PJE',
  tipo_acesso public.tipo_acesso_tribunal not null,
  url_base text not null,
  url_login_seam text not null,
  url_api text,
  custom_timeouts jsonb,
  created_at timestamp without time zone default current_timestamp,
  updated_at timestamp without time zone
);

comment on table public.tribunais_config is 'Configurações de acesso aos tribunais para captura do PJE-TRT, TJs, TRFs e Tribunais Superiores';
comment on column public.tribunais_config.id is 'Identificador único da configuração';
comment on column public.tribunais_config.tribunal_id is 'Referência ao tribunal na tabela tribunais (FK)';
comment on column public.tribunais_config.sistema is 'Sistema de processo judicial (PJE, PROJUDI, ESAJ, etc)';
comment on column public.tribunais_config.tipo_acesso is 'Tipo de acesso: primeiro_grau, segundo_grau, unificado, unico';
comment on column public.tribunais_config.url_base is 'URL base do tribunal';
comment on column public.tribunais_config.url_login_seam is 'URL completa da página de login SSO';
comment on column public.tribunais_config.url_api is 'URL da API REST do sistema';
comment on column public.tribunais_config.custom_timeouts is 'Timeouts customizados em JSONB (login, redirect, networkIdle, api)';

-- Índices
create index if not exists idx_tribunais_config_tribunal_id on public.tribunais_config(tribunal_id);
create index if not exists idx_tribunais_config_tipo_acesso on public.tribunais_config(tipo_acesso);


-- ============================================================================
-- Tabela: orgaos_tribunais
-- Órgãos dos tribunais (varas, turmas, etc)
-- ============================================================================

create table if not exists public.orgaos_tribunais (
  id text primary key,
  "tribunalId" text not null references public.tribunais(id),
  "orgaoIdCNJ" integer not null,
  nome text not null,
  tipo text,
  ativo boolean default true,
  metadados jsonb,
  "createdAt" timestamp without time zone default current_timestamp,
  "updatedAt" timestamp without time zone default current_timestamp
);

comment on table public.orgaos_tribunais is 'Órgãos dos tribunais (varas, turmas, câmaras, etc)';
comment on column public.orgaos_tribunais.id is 'Identificador único do órgão';
comment on column public.orgaos_tribunais."tribunalId" is 'Referência ao tribunal';
comment on column public.orgaos_tribunais."orgaoIdCNJ" is 'ID do órgão no CNJ';
comment on column public.orgaos_tribunais.nome is 'Nome do órgão';
comment on column public.orgaos_tribunais.tipo is 'Tipo do órgão (vara, turma, etc)';
comment on column public.orgaos_tribunais.ativo is 'Indica se o órgão está ativo';
comment on column public.orgaos_tribunais.metadados is 'Metadados adicionais em JSONB';

-- Índices
create index if not exists idx_orgaos_tribunais_tribunal_id on public.orgaos_tribunais("tribunalId");
create index if not exists idx_orgaos_tribunais_orgao_cnj on public.orgaos_tribunais("orgaoIdCNJ");

-- =====================================================
-- From: 14_logs_alteracao.sql
-- =====================================================

-- ============================================================================
-- Tabela: logs_alteracao
-- Logs de auditoria de alterações no sistema
-- ============================================================================

create table if not exists public.logs_alteracao (
  id bigint generated always as identity primary key,
  tipo_entidade text not null check (tipo_entidade in ('acervo', 'audiencias', 'expedientes', 'usuarios', 'advogados', 'clientes', 'partes_contrarias', 'contratos')),
  entidade_id bigint not null,
  tipo_evento text not null,
  usuario_que_executou_id bigint not null references public.usuarios(id),
  responsavel_anterior_id bigint references public.usuarios(id),
  responsavel_novo_id bigint references public.usuarios(id),
  dados_evento jsonb,
  created_at timestamp with time zone default now()
);

comment on table public.logs_alteracao is 'Logs de auditoria de alterações. RLS: Service role tem acesso total. Usuários autenticados podem ler.';
comment on column public.logs_alteracao.tipo_entidade is 'Tipo da entidade alterada (acervo, audiencias, expedientes, etc)';
comment on column public.logs_alteracao.entidade_id is 'ID do registro da entidade alterada';
comment on column public.logs_alteracao.tipo_evento is 'Tipo do evento/alteração (atribuicao_responsavel, transferencia_responsavel, etc)';
comment on column public.logs_alteracao.usuario_que_executou_id is 'Usuário que executou a ação';
comment on column public.logs_alteracao.responsavel_anterior_id is 'Responsável anterior (para eventos de atribuição/transferência)';
comment on column public.logs_alteracao.responsavel_novo_id is 'Novo responsável (para eventos de atribuição/transferência)';
comment on column public.logs_alteracao.dados_evento is 'Dados adicionais específicos do evento em JSONB';
comment on column public.logs_alteracao.created_at is 'Data e hora do log';

-- Índices
create index if not exists idx_logs_alteracao_tipo_entidade on public.logs_alteracao(tipo_entidade);
create index if not exists idx_logs_alteracao_entidade_id on public.logs_alteracao(entidade_id);
create index if not exists idx_logs_alteracao_tipo_evento on public.logs_alteracao(tipo_evento);
create index if not exists idx_logs_alteracao_created_at on public.logs_alteracao(created_at);

-- RLS
alter table public.logs_alteracao enable row level security;

create policy "Service role tem acesso total aos logs"
on public.logs_alteracao for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler logs"
on public.logs_alteracao for select
to authenticated
using (true);


-- ============================================================================
-- Tabela: locks
-- Locks distribuídos para operações críticas
-- ============================================================================

create table if not exists public.locks (
  id bigint generated always as identity primary key,
  lock_key text not null unique,
  locked_at timestamp with time zone default now(),
  locked_by text,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

comment on table public.locks is 'Locks distribuídos para operações críticas';
comment on column public.locks.lock_key is 'Chave única do lock';
comment on column public.locks.locked_at is 'Data/hora em que o lock foi adquirido';
comment on column public.locks.locked_by is 'Identificador de quem adquiriu o lock';
comment on column public.locks.expires_at is 'Data/hora de expiração do lock';

-- Índices
create index if not exists idx_locks_expires_at on public.locks(expires_at);

-- =====================================================
-- From: 15_enderecos.sql
-- =====================================================

-- ============================================================================
-- Tabela: enderecos
-- Endereços de clientes, partes contrárias e terceiros
-- ============================================================================

create table if not exists public.enderecos (
  id bigint generated always as identity primary key,
  id_pje bigint,
  entidade_tipo text not null check (entidade_tipo in ('cliente', 'parte_contraria', 'terceiro')),
  entidade_id bigint not null,

  -- Contexto do processo
  trt text,
  grau text check (grau in ('primeiro_grau', 'segundo_grau')),
  numero_processo text,

  -- Endereço
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cep text,

  -- Município
  id_municipio_pje integer,
  municipio text,
  municipio_ibge text,

  -- Estado
  estado_id_pje integer,
  estado_sigla text,
  estado_descricao text,
  estado text,

  -- País
  pais_id_pje integer,
  pais_codigo text,
  pais_descricao text,
  pais text,

  -- Metadados PJE
  classificacoes_endereco jsonb,
  correspondencia boolean default false,
  situacao text,
  id_usuario_cadastrador_pje bigint,
  data_alteracao_pje timestamp with time zone,
  dados_pje_completo jsonb,

  -- Controle
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.enderecos is 'Endereços de clientes, partes contrárias e terceiros. Estrutura idêntica ao PJE.';
comment on column public.enderecos.id_pje is 'ID do endereço no sistema PJE';
comment on column public.enderecos.entidade_tipo is 'Tipo da entidade dona do endereço: cliente, parte_contraria, terceiro';
comment on column public.enderecos.entidade_id is 'ID da entidade na respectiva tabela';
comment on column public.enderecos.trt is 'Tribunal Regional do Trabalho (contexto do processo)';
comment on column public.enderecos.grau is 'Grau do processo (primeiro_grau, segundo_grau)';
comment on column public.enderecos.numero_processo is 'Número do processo (contexto do processo)';
comment on column public.enderecos.classificacoes_endereco is 'Array de classificações do PJE: R=Residencial, C=Comercial, A=Atual';
comment on column public.enderecos.correspondencia is 'Indica se é endereço de correspondência';
comment on column public.enderecos.situacao is 'Situação do endereço no PJE: P=Principal, V=Vigente';
comment on column public.enderecos.estado is 'Nome completo do estado';
comment on column public.enderecos.pais is 'Nome completo do país';
comment on column public.enderecos.dados_pje_completo is 'JSON completo do endereço capturado do PJE (auditoria)';

-- Índices
create index if not exists idx_enderecos_entidade on public.enderecos(entidade_tipo, entidade_id);
create index if not exists idx_enderecos_processo on public.enderecos(numero_processo, trt, grau);
create index if not exists idx_enderecos_id_pje on public.enderecos(id_pje);

-- Índice unique parcial para deduplicação de endereços do PJE
-- Permite upsert idempotente por (id_pje, entidade_tipo, entidade_id)
-- Só aplica quando id_pje não é null (endereços manuais não são afetados)
create unique index if not exists idx_enderecos_pje_unique
on public.enderecos(id_pje, entidade_tipo, entidade_id)
where id_pje is not null;

-- RLS
alter table public.enderecos enable row level security;

create policy "Service role tem acesso total aos enderecos"
on public.enderecos for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler enderecos"
on public.enderecos for select
to authenticated
using (true);

-- =====================================================
-- From: 16_terceiros.sql
-- =====================================================

-- ============================================================================
-- Tabela: terceiros
-- Terceiros em processos (peritos, MP, assistentes, etc)
-- ============================================================================

create table if not exists public.terceiros (
  id bigint generated always as identity primary key,
  id_tipo_parte bigint,

  -- Tipo e polo
  tipo_parte text not null,
  polo text not null,

  -- Identificação
  tipo_pessoa public.tipo_pessoa not null,
  nome text not null,
  nome_fantasia text,
  cpf text,
  cnpj text,
  tipo_documento text check (tipo_documento in ('CPF', 'CNPJ')),

  -- Flags
  principal boolean default false,
  autoridade boolean default false,
  endereco_desconhecido boolean default false,

  -- Status PJE
  status_pje text,
  situacao_pje text,
  login_pje text,
  ordem integer,

  -- Contato
  emails jsonb,
  ddd_celular text,
  numero_celular text,
  ddd_residencial text,
  numero_residencial text,
  ddd_comercial text,
  numero_comercial text,

  -- Dados PF
  sexo text,
  rg text,
  data_nascimento date,
  genero public.genero_usuario,
  estado_civil public.estado_civil,
  nome_genitora text,
  nacionalidade text,
  uf_nascimento_id_pje integer,
  uf_nascimento_sigla text,
  uf_nascimento_descricao text,
  naturalidade_id_pje integer,
  naturalidade_municipio text,
  naturalidade_estado_id_pje integer,
  naturalidade_estado_sigla text,
  pais_nascimento_id_pje integer,
  pais_nascimento_codigo text,
  pais_nascimento_descricao text,
  escolaridade_codigo integer,
  situacao_cpf_receita_id integer,
  situacao_cpf_receita_descricao text,
  pode_usar_celular_mensagem boolean default false,

  -- Dados PJ
  data_abertura date,
  data_fim_atividade date,
  orgao_publico boolean default false,
  tipo_pessoa_codigo_pje text,
  tipo_pessoa_label_pje text,
  tipo_pessoa_validacao_receita text,
  ds_tipo_pessoa text,
  situacao_cnpj_receita_id integer,
  situacao_cnpj_receita_descricao text,
  ramo_atividade text,
  cpf_responsavel text,
  oficial boolean default false,
  ds_prazo_expediente_automatico text,
  porte_codigo integer,
  porte_descricao text,
  inscricao_estadual text,

  -- Observações e endereço
  observacoes text,
  endereco_id bigint references public.enderecos(id),

  -- Controle
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  -- Auditoria
  dados_anteriores jsonb
);

-- id_pessoa_pje foi movido para a tabela cadastros_pje para permitir múltiplos IDs por pessoa
-- Vínculo com processo é feito via processo_partes
comment on table public.terceiros is 'Terceiros globais - Peritos, Ministério Público, Assistentes, etc';
comment on column public.terceiros.tipo_parte is 'Tipo da parte: PERITO, MINISTERIO_PUBLICO, ASSISTENTE, etc';
comment on column public.terceiros.polo is 'Polo processual: ativo, passivo, outros';

-- Índices
create index if not exists idx_terceiros_tipo_parte on public.terceiros(tipo_parte);

-- Constraints de unicidade por CPF/CNPJ
alter table public.terceiros add constraint terceiros_cpf_unique unique (cpf) where (cpf is not null);
alter table public.terceiros add constraint terceiros_cnpj_unique unique (cnpj) where (cnpj is not null);

-- RLS
alter table public.terceiros enable row level security;

create policy "Service role tem acesso total aos terceiros"
on public.terceiros for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler terceiros"
on public.terceiros for select
to authenticated
using (true);

-- =====================================================
-- From: 17_processo_partes.sql
-- =====================================================

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
-- =====================================================
-- From: 18_representantes.sql
-- =====================================================

-- ============================================================================
-- Tabela: representantes (estrutura final por CPF)
-- Representantes legais únicos por CPF. Vínculo com processos via processo_partes.
-- id_pessoa_pje agora é rastreado em cadastros_pje, permitindo múltiplos IDs por pessoa.
-- ============================================================================

create table if not exists public.representantes (
  id bigint generated always as identity primary key,

  -- Identificação (chave de negócio)
  cpf text not null unique,
  nome text not null,
  sexo text,
  tipo text,

  -- Dados OAB - Array JSONB para múltiplas inscrições
  -- Formato: [{"numero": "MG128404", "uf": "MG", "situacao": "REGULAR"}, ...]
  oabs jsonb default '[]'::jsonb,

  -- Contato
  emails jsonb,
  email text,
  ddd_celular text,
  numero_celular text,
  ddd_residencial text,
  numero_residencial text,
  ddd_comercial text,
  numero_comercial text,

  -- Metadados e endereço
  endereco_id bigint references public.enderecos(id),
  dados_anteriores jsonb,

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Comentários
comment on table public.representantes is 'Representantes legais únicos por CPF. Vínculo com processos via processo_partes.';
comment on column public.representantes.cpf is 'CPF único do representante (constraint UNIQUE).';
comment on column public.representantes.oabs is 'Array de inscrições na OAB. Formato: [{"numero": "MG128404", "uf": "MG", "situacao": "REGULAR"}]. Um advogado pode ter inscrições em múltiplos estados.';
comment on column public.representantes.dados_anteriores is 'Dados antigos armazenados para auditoria.';

-- Índices relevantes
create index if not exists idx_representantes_cpf on public.representantes(cpf);
create index if not exists idx_representantes_oabs on public.representantes using gin (oabs);
create index if not exists idx_representantes_endereco on public.representantes(endereco_id);

-- RLS
alter table public.representantes enable row level security;

create policy "Service role tem acesso total aos representantes"
on public.representantes for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler representantes"
on public.representantes for select
to authenticated
using (true);

-- =====================================================
-- From: 19_audiencias_auxiliares.sql
-- =====================================================

-- ============================================================================
-- Tabela: classe_judicial
-- Classes judiciais do PJE por TRT e grau
-- ============================================================================

create table if not exists public.classe_judicial (
  id bigint generated always as identity primary key,
  id_pje bigint not null,
  trt public.codigo_tribunal not null,
  grau public.grau_tribunal not null,
  codigo text not null,
  descricao text not null,
  sigla text,
  requer_processo_referencia_codigo text,
  controla_valor_causa boolean default false,
  pode_incluir_autoridade boolean default false,
  piso_valor_causa numeric,
  teto_valor_causa numeric,
  ativo boolean default true,
  id_classe_judicial_pai bigint,
  possui_filhos boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  unique (id_pje, trt, grau)
);

comment on table public.classe_judicial is 'Classes judiciais do PJE por TRT e grau (ex: ATOrd, ATSum, RO)';
comment on column public.classe_judicial.id_pje is 'ID da classe judicial no sistema PJE';
comment on column public.classe_judicial.trt is 'Código do TRT';
comment on column public.classe_judicial.grau is 'Grau (primeiro_grau ou segundo_grau)';
comment on column public.classe_judicial.codigo is 'Código numérico da classe judicial no PJE';
comment on column public.classe_judicial.descricao is 'Descrição completa da classe judicial';
comment on column public.classe_judicial.sigla is 'Sigla da classe judicial';
comment on column public.classe_judicial.controla_valor_causa is 'Indica se controla valor da causa';
comment on column public.classe_judicial.pode_incluir_autoridade is 'Indica se pode incluir autoridade';
comment on column public.classe_judicial.piso_valor_causa is 'Valor mínimo da causa para esta classe';
comment on column public.classe_judicial.teto_valor_causa is 'Valor máximo da causa para esta classe';
comment on column public.classe_judicial.id_classe_judicial_pai is 'ID da classe judicial pai (para classes hierárquicas)';
comment on column public.classe_judicial.possui_filhos is 'Indica se possui classes judiciais filhas';

-- Índices
create index if not exists idx_classe_judicial_trt_grau on public.classe_judicial(trt, grau);
create index if not exists idx_classe_judicial_sigla on public.classe_judicial(sigla);

-- RLS
alter table public.classe_judicial enable row level security;

create policy "Service role tem acesso total a classe_judicial"
on public.classe_judicial for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler classe_judicial"
on public.classe_judicial for select
to authenticated
using (true);


-- ============================================================================
-- Tabela: tipo_audiencia
-- Tipos de audiência do PJE (deduplicados por descrição)
-- ============================================================================

create table if not exists public.tipo_audiencia (
  id bigint generated always as identity primary key,
  descricao text not null unique,
  is_virtual boolean default false not null,
  trts_metadata jsonb default '[]'::jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

comment on table public.tipo_audiencia is 'Tipos de audiência do PJE (deduplicados por descrição)';
comment on column public.tipo_audiencia.descricao is 'Descrição única do tipo de audiência';
comment on column public.tipo_audiencia.is_virtual is 'Indica se é audiência virtual';
comment on column public.tipo_audiencia.trts_metadata is 'Array de TRTs que usam este tipo: [{trt, grau, id_pje, codigo, old_id}]';

-- Índices
create index if not exists idx_tipo_audiencia_descricao on public.tipo_audiencia(descricao);
create index if not exists idx_tipo_audiencia_is_virtual on public.tipo_audiencia(is_virtual);
create index if not exists idx_tipo_audiencia_trts_metadata on public.tipo_audiencia using gin(trts_metadata);

-- RLS
alter table public.tipo_audiencia enable row level security;

create policy "Service role tem acesso total a tipo_audiencia"
on public.tipo_audiencia for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler tipo_audiencia"
on public.tipo_audiencia for select
to authenticated
using (true);


-- ============================================================================
-- Tabela: sala_audiencia
-- Salas de audiência do PJE por TRT, grau e órgão julgador
-- ============================================================================

create table if not exists public.sala_audiencia (
  id bigint generated always as identity primary key,
  id_pje bigint,
  trt public.codigo_tribunal not null,
  grau public.grau_tribunal not null,
  orgao_julgador_id bigint not null references public.orgao_julgador(id),
  nome text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  unique (id_pje, trt, grau, orgao_julgador_id),
  unique (nome, trt, grau, orgao_julgador_id)
);

comment on table public.sala_audiencia is 'Salas de audiência do PJE por TRT, grau e órgão julgador';
comment on column public.sala_audiencia.id_pje is 'ID da sala no sistema PJE';
comment on column public.sala_audiencia.trt is 'Código do TRT';
comment on column public.sala_audiencia.grau is 'Grau (primeiro_grau ou segundo_grau)';
comment on column public.sala_audiencia.orgao_julgador_id is 'Referência ao órgão julgador';
comment on column public.sala_audiencia.nome is 'Nome da sala de audiência';

-- Índices
create index if not exists idx_sala_audiencia_orgao on public.sala_audiencia(orgao_julgador_id);
create index if not exists idx_sala_audiencia_trt_grau on public.sala_audiencia(trt, grau);

-- RLS
alter table public.sala_audiencia enable row level security;

create policy "Service role tem acesso total a sala_audiencia"
on public.sala_audiencia for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler sala_audiencia"
on public.sala_audiencia for select
to authenticated
using (true);

-- =====================================================
-- From: 19_cadastros_pje.sql
-- =====================================================

-- Schema: cadastros_pje
-- Descrição: Tabela unificada para mapear entidades (clientes, partes contrárias, terceiros, representantes) 
-- aos seus múltiplos IDs nos sistemas judiciais (PJE, ESAJ, etc.). 
-- Uma pessoa pode ter IDs diferentes em cada tribunal/grau.
-- Esta tabela resolve o problema de id_pessoa_pje não ser globalmente único.

-- Tabela unificada para mapear entidades aos seus IDs nos sistemas judiciais
create table if not exists public.cadastros_pje (
  id bigint generated always as identity primary key,

  -- Referência polimórfica à entidade
  tipo_entidade text not null check (tipo_entidade in ('cliente', 'parte_contraria', 'terceiro', 'representante')),
  entidade_id bigint not null,

  -- Identificação no sistema judicial
  id_pessoa_pje bigint not null,
  sistema text not null default 'pje_trt' check (sistema in ('pje_trt', 'pje_tst', 'esaj', 'projudi')),
  tribunal text not null,  -- 'TRT01', 'TRT03', 'TST', 'TJMG', etc.
  grau text check (grau in ('primeiro_grau', 'segundo_grau') or grau is null),

  -- Dados extras do cadastro (telefones PJE, emails PJE, status, etc.)
  dados_cadastro_pje jsonb default '{}',

  -- Auditoria
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Constraint: Mesmo id_pessoa_pje no mesmo sistema/tribunal/grau só pode existir uma vez por tipo_entidade
  constraint cadastros_pje_unique unique (tipo_entidade, id_pessoa_pje, sistema, tribunal, grau)
);

-- Índices para queries frequentes
create index if not exists idx_cadastros_pje_entidade on public.cadastros_pje(tipo_entidade, entidade_id);
create index if not exists idx_cadastros_pje_id_pessoa on public.cadastros_pje(id_pessoa_pje, sistema, tribunal);
create index if not exists idx_cadastros_pje_tribunal on public.cadastros_pje(tribunal, sistema);

-- Comentário descritivo na tabela
comment on table public.cadastros_pje is 'Mapeia entidades (clientes, partes contrárias, terceiros, representantes) aos seus múltiplos IDs nos sistemas judiciais (PJE, ESAJ, etc.). Uma pessoa pode ter IDs diferentes em cada tribunal/grau.';

-- Comentários nas colunas
comment on column public.cadastros_pje.tipo_entidade is 'Tipo da entidade referenciada: cliente, parte_contraria, terceiro, representante';
comment on column public.cadastros_pje.entidade_id is 'ID da entidade na tabela correspondente';
comment on column public.cadastros_pje.id_pessoa_pje is 'ID da pessoa no sistema judicial (não é único global)';
comment on column public.cadastros_pje.sistema is 'Sistema judicial: pje_trt, pje_tst, esaj, projudi';
comment on column public.cadastros_pje.tribunal is 'Código do tribunal (TRT01, TRT03, TST, TJMG, etc.)';
comment on column public.cadastros_pje.grau is 'Grau do processo: primeiro_grau, segundo_grau, ou null';
comment on column public.cadastros_pje.dados_cadastro_pje is 'Dados extras do cadastro no sistema judicial (telefones, emails, status, etc.)';

-- Trigger para atualizar updated_at automaticamente
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_cadastros_pje_updated_at 
    before update on public.cadastros_pje 
    for each row 
    execute procedure public.update_updated_at_column();

-- Habilitar Row Level Security (RLS)
alter table public.cadastros_pje enable row level security;

-- Políticas RLS
create policy "Enable all operations for service_role" on public.cadastros_pje
    for all using (auth.role() = 'service_role');

create policy "Enable read for authenticated users" on public.cadastros_pje
    for select using (auth.role() = 'authenticated');
-- =====================================================
-- From: 20_acordos_condenacoes.sql
-- =====================================================

-- ============================================================================
-- Tabela: acordos_condenacoes
-- Acordos, condenações e custas processuais vinculados a processos
-- ============================================================================

create table if not exists public.acordos_condenacoes (
  id bigint generated always as identity primary key,
  processo_id bigint not null references public.acervo(id),
  tipo text not null check (tipo in ('acordo', 'condenacao', 'custas_processuais')),
  direcao text not null check (direcao in ('recebimento', 'pagamento')),
  valor_total numeric not null check (valor_total > 0),
  data_vencimento_primeira_parcela date not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago_parcial', 'pago_total', 'atrasado')),
  numero_parcelas integer not null default 1 check (numero_parcelas > 0),
  forma_distribuicao text check (forma_distribuicao in ('integral', 'dividido')),
  percentual_escritorio numeric default 30.00 check (percentual_escritorio >= 0 and percentual_escritorio <= 100),
  percentual_cliente numeric generated always as (100 - percentual_escritorio) stored,
  honorarios_sucumbenciais_total numeric default 0 check (honorarios_sucumbenciais_total >= 0),
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.acordos_condenacoes is 'Acordos, condenações e custas processuais vinculados a processos';
comment on column public.acordos_condenacoes.processo_id is 'ID do processo ao qual o acordo/condenação está vinculado';
comment on column public.acordos_condenacoes.tipo is 'Tipo: acordo, condenacao ou custas_processuais';
comment on column public.acordos_condenacoes.direcao is 'Direção: recebimento (escritório recebe) ou pagamento (escritório paga)';
comment on column public.acordos_condenacoes.valor_total is 'Valor total do acordo/condenação/custas';
comment on column public.acordos_condenacoes.data_vencimento_primeira_parcela is 'Data de vencimento da primeira parcela ou parcela única';
comment on column public.acordos_condenacoes.status is 'Status calculado baseado nas parcelas: pendente, pago_parcial, pago_total, atrasado';
comment on column public.acordos_condenacoes.numero_parcelas is 'Quantidade de parcelas (1 para pagamento único)';
comment on column public.acordos_condenacoes.forma_distribuicao is 'Como o valor será distribuído: integral ou dividido';
comment on column public.acordos_condenacoes.percentual_escritorio is 'Percentual dos honorários contratuais do escritório (padrão 30%)';
comment on column public.acordos_condenacoes.percentual_cliente is 'Percentual do cliente (calculado automaticamente: 100 - percentual_escritorio)';
comment on column public.acordos_condenacoes.honorarios_sucumbenciais_total is 'Valor total dos honorários sucumbenciais (100% do escritório)';

-- Índices
create index if not exists idx_acordos_condenacoes_processo on public.acordos_condenacoes(processo_id);
create index if not exists idx_acordos_condenacoes_tipo on public.acordos_condenacoes(tipo);
create index if not exists idx_acordos_condenacoes_status on public.acordos_condenacoes(status);
create index if not exists idx_acordos_condenacoes_direcao on public.acordos_condenacoes(direcao);

-- RLS
alter table public.acordos_condenacoes enable row level security;

create policy "Service role tem acesso total a acordos_condenacoes"
on public.acordos_condenacoes for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler acordos_condenacoes"
on public.acordos_condenacoes for select
to authenticated
using (true);


-- ============================================================================
-- Tabela: parcelas
-- Parcelas individuais de acordos, condenações ou custas processuais
-- ============================================================================

create table if not exists public.parcelas (
  id bigint generated always as identity primary key,
  acordo_condenacao_id bigint not null references public.acordos_condenacoes(id) on delete cascade,
  numero_parcela integer not null check (numero_parcela > 0),
  valor_bruto_credito_principal numeric not null check (valor_bruto_credito_principal >= 0),
  honorarios_sucumbenciais numeric default 0 check (honorarios_sucumbenciais >= 0),
  honorarios_contratuais numeric default 0,
  data_vencimento date not null,
  status text not null default 'pendente' check (status in ('pendente', 'recebida', 'paga', 'atrasado')),
  data_efetivacao timestamp with time zone,
  forma_pagamento text not null check (forma_pagamento in ('transferencia_direta', 'deposito_judicial', 'deposito_recursal')),
  dados_pagamento jsonb,
  editado_manualmente boolean default false,
  valor_repasse_cliente numeric,
  status_repasse text default 'nao_aplicavel' check (status_repasse in ('nao_aplicavel', 'pendente_declaracao', 'pendente_transferencia', 'repassado')),
  arquivo_declaracao_prestacao_contas text,
  data_declaracao_anexada timestamp with time zone,
  arquivo_comprovante_repasse text,
  data_repasse timestamp with time zone,
  usuario_repasse_id bigint references public.usuarios(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  unique (acordo_condenacao_id, numero_parcela)
);

comment on table public.parcelas is 'Parcelas individuais de acordos, condenações ou custas processuais';
comment on column public.parcelas.acordo_condenacao_id is 'ID do acordo/condenação ao qual a parcela pertence';
comment on column public.parcelas.numero_parcela is 'Número sequencial da parcela (1, 2, 3...)';
comment on column public.parcelas.valor_bruto_credito_principal is 'Valor bruto do crédito principal da parcela';
comment on column public.parcelas.honorarios_sucumbenciais is 'Valor de honorários sucumbenciais nesta parcela';
comment on column public.parcelas.honorarios_contratuais is 'Honorários contratuais calculados via trigger';
comment on column public.parcelas.data_vencimento is 'Data de vencimento da parcela';
comment on column public.parcelas.status is 'Status da parcela: pendente, recebida, paga, atrasado';
comment on column public.parcelas.data_efetivacao is 'Data em que a parcela foi marcada como recebida/paga';
comment on column public.parcelas.forma_pagamento is 'Forma de pagamento: transferencia_direta, deposito_judicial, deposito_recursal';
comment on column public.parcelas.dados_pagamento is 'Dados adicionais do pagamento (número de alvará, etc)';
comment on column public.parcelas.editado_manualmente is 'Flag indicando se os valores foram editados manualmente';
comment on column public.parcelas.valor_repasse_cliente is 'Valor a ser repassado ao cliente';
comment on column public.parcelas.status_repasse is 'Status do repasse: nao_aplicavel, pendente_declaracao, pendente_transferencia, repassado';
comment on column public.parcelas.arquivo_declaracao_prestacao_contas is 'Path do arquivo da declaração de prestação de contas';
comment on column public.parcelas.data_declaracao_anexada is 'Data em que a declaração foi anexada';
comment on column public.parcelas.arquivo_comprovante_repasse is 'Path do arquivo do comprovante de transferência';
comment on column public.parcelas.data_repasse is 'Data em que o repasse ao cliente foi realizado';
comment on column public.parcelas.usuario_repasse_id is 'ID do usuário que realizou o repasse';

-- Índices
create index if not exists idx_parcelas_acordo on public.parcelas(acordo_condenacao_id);
create index if not exists idx_parcelas_status on public.parcelas(status);
create index if not exists idx_parcelas_vencimento on public.parcelas(data_vencimento);
create index if not exists idx_parcelas_status_repasse on public.parcelas(status_repasse);

-- RLS
alter table public.parcelas enable row level security;

create policy "Service role tem acesso total a parcelas"
on public.parcelas for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler parcelas"
on public.parcelas for select
to authenticated
using (true);

-- =====================================================
-- From: 21_captura_logs_brutos.sql
-- =====================================================

-- ============================================================================
-- Tabela: captura_logs_brutos
-- Logs brutos de captura (payloads e metadados) para auditoria e reprocessamento
-- Persistência de logs brutos em PostgreSQL (jsonb) para auditoria e reprocessamento
-- ============================================================================

create table if not exists public.captura_logs_brutos (
  id bigint generated always as identity primary key,

  -- Identificador estável (UUID v4 gerado na aplicação) para referenciar o log bruto
  raw_log_id text not null unique,

  -- ID do log de captura em public.capturas_log
  -- Pode ser -1 quando a falha ocorreu antes de existir capturas_log (erros “pré-log”)
  captura_log_id bigint not null,

  -- Contexto da captura
  tipo_captura text not null,
  advogado_id bigint references public.advogados(id),
  credencial_id bigint references public.credenciais(id),
  credencial_ids bigint[],
  trt public.codigo_tribunal,
  grau public.grau_tribunal,

  -- Status do item (sucesso/erro por processo ou unidade de captura)
  status text not null check (status in ('success', 'error')),

  -- Dados (JSONB)
  requisicao jsonb,
  payload_bruto jsonb,
  resultado_processado jsonb,
  logs jsonb,

  -- Erro (texto) para buscas e triagem rápida
  erro text,

  -- Timestamps
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.captura_logs_brutos is 'Logs brutos de captura (payloads e metadados) para auditoria e reprocessamento. Persistido em PostgreSQL (jsonb).';
comment on column public.captura_logs_brutos.raw_log_id is 'Identificador estável do log bruto (string/UUID).';
comment on column public.captura_logs_brutos.captura_log_id is 'ID do log de captura em capturas_log (pode ser -1 quando a falha ocorreu antes de existir capturas_log).';
comment on column public.captura_logs_brutos.payload_bruto is 'Payload bruto retornado pelo PJE (JSONB). Pode ser null quando a falha ocorre antes da chamada ao PJE.';

-- Índices para consultas frequentes (listagem, filtros, contagens e ordenação)
create index if not exists idx_captura_logs_brutos_captura_log_id
on public.captura_logs_brutos using btree (captura_log_id);

create index if not exists idx_captura_logs_brutos_captura_log_id_criado_em_desc
on public.captura_logs_brutos using btree (captura_log_id, criado_em desc);

create index if not exists idx_captura_logs_brutos_status
on public.captura_logs_brutos using btree (status);

create index if not exists idx_captura_logs_brutos_status_criado_em_desc
on public.captura_logs_brutos using btree (status, criado_em desc);

create index if not exists idx_captura_logs_brutos_advogado_id
on public.captura_logs_brutos using btree (advogado_id);

create index if not exists idx_captura_logs_brutos_credencial_id
on public.captura_logs_brutos using btree (credencial_id);

create index if not exists idx_captura_logs_brutos_trt_grau_status_criado_em_desc
on public.captura_logs_brutos using btree (trt, grau, status, criado_em desc);

-- RLS
alter table public.captura_logs_brutos enable row level security;

-- Service role: acesso total (operações administrativas e jobs)
create policy "Service role pode selecionar captura_logs_brutos"
on public.captura_logs_brutos for select
to service_role
using (true);

create policy "Service role pode inserir captura_logs_brutos"
on public.captura_logs_brutos for insert
to service_role
with check (true);

create policy "Service role pode atualizar captura_logs_brutos"
on public.captura_logs_brutos for update
to service_role
using (true)
with check (true);

create policy "Service role pode deletar captura_logs_brutos"
on public.captura_logs_brutos for delete
to service_role
using (true);



-- =====================================================
-- From: 21_capturas.sql
-- =====================================================

-- ============================================================================
-- Tabela: capturas_log
-- Histórico de capturas executadas no sistema
-- ============================================================================

create table if not exists public.capturas_log (
  id bigint generated always as identity primary key,
  tipo_captura public.tipo_captura not null,
  advogado_id bigint references public.advogados(id),
  credencial_ids bigint[] default '{}',
  status public.status_captura not null default 'pending',
  resultado jsonb,
  erro text,
  iniciado_em timestamp with time zone default now(),
  concluido_em timestamp with time zone,
  created_at timestamp with time zone default now()
);

comment on table public.capturas_log is 'Histórico de capturas executadas no sistema. Registra todas as execuções de capturas de processos, audiências e expedientes do PJE.';
comment on column public.capturas_log.tipo_captura is 'Tipo de captura (acervo_geral, arquivados, audiencias, pendentes, partes)';
comment on column public.capturas_log.advogado_id is 'ID do advogado que possui o agendamento';
comment on column public.capturas_log.credencial_ids is 'Array de IDs das credenciais utilizadas na captura';
comment on column public.capturas_log.status is 'Status da captura: pending, in_progress, completed, failed';
comment on column public.capturas_log.resultado is 'Resultado da captura em JSONB';
comment on column public.capturas_log.erro is 'Mensagem de erro (se houver)';
comment on column public.capturas_log.iniciado_em is 'Data/hora de início da captura';
comment on column public.capturas_log.concluido_em is 'Data/hora de conclusão da captura';

-- Índices
create index if not exists idx_capturas_log_tipo on public.capturas_log(tipo_captura);
create index if not exists idx_capturas_log_status on public.capturas_log(status);
create index if not exists idx_capturas_log_advogado on public.capturas_log(advogado_id);
create index if not exists idx_capturas_log_iniciado_em on public.capturas_log(iniciado_em);
create index if not exists idx_capturas_log_credencial_ids on public.capturas_log using gin (credencial_ids);

-- RLS
alter table public.capturas_log enable row level security;

create policy "Service role tem acesso total a capturas_log"
on public.capturas_log for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler capturas_log"
on public.capturas_log for select
to authenticated
using (true);


-- ============================================================================
-- Tabela: agendamentos
-- Agendamentos de execução automática de capturas
-- ============================================================================

create table if not exists public.agendamentos (
  id bigint generated always as identity primary key,
  tipo_captura public.tipo_captura not null,
  advogado_id bigint references public.advogados(id),
  credencial_ids bigint[] not null,
  periodicidade text not null check (periodicidade in ('diario', 'a_cada_N_dias')),
  dias_intervalo integer,
  horario time not null,
  ativo boolean default true,
  parametros_extras jsonb,
  ultima_execucao timestamp with time zone,
  proxima_execucao timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.agendamentos is 'Agendamentos de execução automática de capturas';
comment on column public.agendamentos.tipo_captura is 'Tipo de captura (acervo_geral, arquivados, audiencias, pendentes)';
comment on column public.agendamentos.advogado_id is 'ID do advogado que possui o agendamento';
comment on column public.agendamentos.credencial_ids is 'Array de IDs das credenciais a serem utilizadas na captura';
comment on column public.agendamentos.periodicidade is 'Tipo de periodicidade: diario ou a_cada_N_dias';
comment on column public.agendamentos.dias_intervalo is 'Número de dias entre execuções (usado quando periodicidade = a_cada_N_dias)';
comment on column public.agendamentos.horario is 'Horário de execução no formato HH:mm';
comment on column public.agendamentos.ativo is 'Indica se o agendamento está ativo';
comment on column public.agendamentos.parametros_extras is 'Parâmetros extras específicos do tipo de captura (dataInicio, dataFim, filtroPrazo)';
comment on column public.agendamentos.ultima_execucao is 'Timestamp da última execução do agendamento';
comment on column public.agendamentos.proxima_execucao is 'Timestamp calculado da próxima execução';

-- Índices
create index if not exists idx_agendamentos_tipo on public.agendamentos(tipo_captura);
create index if not exists idx_agendamentos_ativo on public.agendamentos(ativo);
create index if not exists idx_agendamentos_proxima_execucao on public.agendamentos(proxima_execucao);
create index if not exists idx_agendamentos_advogado on public.agendamentos(advogado_id);

-- RLS
alter table public.agendamentos enable row level security;

create policy "Service role tem acesso total a agendamentos"
on public.agendamentos for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler agendamentos"
on public.agendamentos for select
to authenticated
using (true);

-- =====================================================
-- From: 22_cargos_permissoes.sql
-- =====================================================

-- ============================================================================
-- Tabela: cargos
-- Cargos para organização interna de usuários
-- ============================================================================

create table if not exists public.cargos (
  id bigint generated always as identity primary key,
  nome text not null unique,
  descricao text,
  ativo boolean default true,
  created_by bigint references public.usuarios(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.cargos is 'Cargos para organização interna de usuários (ex: Advogado Sênior, Estagiário)';
comment on column public.cargos.id is 'ID sequencial do cargo';
comment on column public.cargos.nome is 'Nome do cargo (único, obrigatório)';
comment on column public.cargos.descricao is 'Descrição opcional do cargo';
comment on column public.cargos.ativo is 'Indica se o cargo está ativo (default: true)';
comment on column public.cargos.created_by is 'ID do usuário que criou o cargo';
comment on column public.cargos.created_at is 'Data e hora de criação';
comment on column public.cargos.updated_at is 'Data e hora da última atualização';

-- Índices
create index if not exists idx_cargos_ativo on public.cargos(ativo);

-- RLS
alter table public.cargos enable row level security;

create policy "Service role tem acesso total a cargos"
on public.cargos for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler cargos"
on public.cargos for select
to authenticated
using (true);


-- ============================================================================
-- Tabela: permissoes
-- Permissões granulares por usuário
-- ============================================================================

create table if not exists public.permissoes (
  id bigint generated always as identity primary key,
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  recurso text not null,
  operacao text not null,
  permitido boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  unique (usuario_id, recurso, operacao)
);

comment on table public.permissoes is 'Permissões granulares por usuário. RLS: Service role tem acesso total. Usuários podem ler suas próprias permissões. Backend verifica is_super_admin.';
comment on column public.permissoes.id is 'ID sequencial da permissão';
comment on column public.permissoes.usuario_id is 'ID do usuário que possui a permissão';
comment on column public.permissoes.recurso is 'Recurso (ex: advogados, contratos, acervo)';
comment on column public.permissoes.operacao is 'Operação (ex: listar, criar, editar, deletar, atribuir_responsavel)';
comment on column public.permissoes.permitido is 'Indica se a permissão está permitida (default: true)';
comment on column public.permissoes.created_at is 'Data e hora de criação';
comment on column public.permissoes.updated_at is 'Data e hora da última atualização';

-- Índices
create index if not exists idx_permissoes_usuario on public.permissoes(usuario_id);
create index if not exists idx_permissoes_recurso on public.permissoes(recurso);
create index if not exists idx_permissoes_recurso_operacao on public.permissoes(recurso, operacao);

-- RLS
alter table public.permissoes enable row level security;

create policy "Service role tem acesso total a permissoes"
on public.permissoes for all
to service_role
using (true)
with check (true);

create policy "Usuários podem ler suas próprias permissões"
on public.permissoes for select
to authenticated
using ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id));


-- ============================================================================
-- Seeds básicos de cargos
-- ============================================================================

insert into public.cargos (nome, descricao)
values
  ('Administrador', 'Acesso total ao sistema'),
  ('Gerente', 'Gestão financeira e de operações'),
  ('Funcionário', 'Acesso restrito aos próprios dados')
on conflict (nome) do nothing;

-- ============================================================================
-- Tabela: cargo_permissoes
-- Permissões padrão por cargo (template aplicado aos usuários do cargo)
-- ============================================================================

create table if not exists public.cargo_permissoes (
  id bigint generated always as identity primary key,
  cargo_id bigint not null references public.cargos(id) on delete cascade,
  recurso text not null,
  operacao text not null,
  permitido boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (cargo_id, recurso, operacao)
);

comment on table public.cargo_permissoes is 'Permissões padrão associadas a cada cargo. Aplicadas como template ao criar usuários.';
comment on column public.cargo_permissoes.id is 'ID sequencial da permissão do cargo';
comment on column public.cargo_permissoes.cargo_id is 'Cargo que recebe a permissão padrão';
comment on column public.cargo_permissoes.recurso is 'Recurso do sistema (ex: salarios, folhas_pagamento)';
comment on column public.cargo_permissoes.operacao is 'Operação permitida para o cargo';
comment on column public.cargo_permissoes.permitido is 'Indica se a operação é permitida (default true)';
comment on column public.cargo_permissoes.created_at is 'Data de criação da permissão padrão';
comment on column public.cargo_permissoes.updated_at is 'Data da última atualização da permissão padrão';

create index if not exists idx_cargo_permissoes_cargo on public.cargo_permissoes(cargo_id);

alter table public.cargo_permissoes enable row level security;

create policy "Service role tem acesso total a cargo_permissoes"
on public.cargo_permissoes for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler cargo_permissoes"
on public.cargo_permissoes for select
to authenticated
using (true);

-- ============================================================================
-- Seeds de permissões padrão por cargo (foco em RH/Salários)
-- ============================================================================

-- Administrador: acesso completo a salários e folhas
insert into public.cargo_permissoes (cargo_id, recurso, operacao)
select id, recurso, operacao
from public.cargos,
     (values
       ('salarios', 'listar'),
       ('salarios', 'visualizar'),
       ('salarios', 'criar'),
       ('salarios', 'editar'),
       ('salarios', 'deletar'),
       ('salarios', 'visualizar_todos'),
       ('folhas_pagamento', 'listar'),
       ('folhas_pagamento', 'visualizar'),
       ('folhas_pagamento', 'editar'),
       ('folhas_pagamento', 'criar'),
       ('folhas_pagamento', 'aprovar'),
       ('folhas_pagamento', 'pagar'),
       ('folhas_pagamento', 'cancelar'),
       ('folhas_pagamento', 'deletar'),
       ('folhas_pagamento', 'visualizar_todos')
     ) as perms(recurso, operacao)
where nome = 'Administrador'
on conflict (cargo_id, recurso, operacao) do nothing;

-- Gerente: visão completa com criação/aprovação de folha, sem pagar/cancelar
insert into public.cargo_permissoes (cargo_id, recurso, operacao)
select id, recurso, operacao
from public.cargos,
     (values
       ('salarios', 'listar'),
       ('salarios', 'visualizar'),
       ('salarios', 'visualizar_todos'),
       ('folhas_pagamento', 'listar'),
       ('folhas_pagamento', 'visualizar'),
       ('folhas_pagamento', 'criar'),
       ('folhas_pagamento', 'aprovar'),
       ('folhas_pagamento', 'visualizar_todos')
     ) as perms(recurso, operacao)
where nome = 'Gerente'
on conflict (cargo_id, recurso, operacao) do nothing;

-- Funcionário: apenas visualização própria
insert into public.cargo_permissoes (cargo_id, recurso, operacao)
select id, recurso, operacao
from public.cargos,
     (values
       ('salarios', 'listar'),
       ('salarios', 'visualizar'),
       ('folhas_pagamento', 'listar'),
       ('folhas_pagamento', 'visualizar')
     ) as perms(recurso, operacao)
where nome = 'Funcionário'
on conflict (cargo_id, recurso, operacao) do nothing;

-- ============================================================================
-- Seeds de permissões padrão por cargo (DRE - Demonstração de Resultado)
-- ============================================================================

-- Administrador: acesso completo ao DRE
insert into public.cargo_permissoes (cargo_id, recurso, operacao)
select id, recurso, operacao
from public.cargos,
     (values
       ('dre', 'listar'),
       ('dre', 'visualizar'),
       ('dre', 'exportar')
     ) as perms(recurso, operacao)
where nome = 'Administrador'
on conflict (cargo_id, recurso, operacao) do nothing;

-- Gerente: acesso completo ao DRE para análises financeiras
insert into public.cargo_permissoes (cargo_id, recurso, operacao)
select id, recurso, operacao
from public.cargos,
     (values
       ('dre', 'listar'),
       ('dre', 'visualizar'),
       ('dre', 'exportar')
     ) as perms(recurso, operacao)
where nome = 'Gerente'
on conflict (cargo_id, recurso, operacao) do nothing;

-- ============================================================================
-- Seeds de permissões padrão por cargo (Pangea - Banco Nacional de Precedentes)
-- ============================================================================

-- Administrador: acesso completo ao Pangea
insert into public.cargo_permissoes (cargo_id, recurso, operacao)
select id, recurso, operacao
from public.cargos,
     (values
       ('pangea', 'listar'),
       ('pangea', 'visualizar'),
       ('pangea', 'exportar')
     ) as perms(recurso, operacao)
where nome = 'Administrador'
on conflict (cargo_id, recurso, operacao) do nothing;

-- Gerente: acesso completo ao Pangea
insert into public.cargo_permissoes (cargo_id, recurso, operacao)
select id, recurso, operacao
from public.cargos,
     (values
       ('pangea', 'listar'),
       ('pangea', 'visualizar'),
       ('pangea', 'exportar')
     ) as perms(recurso, operacao)
where nome = 'Gerente'
on conflict (cargo_id, recurso, operacao) do nothing;

-- ============================================================================
-- Documenta‡Æo de novas permissÄes financeiras
-- ============================================================================
-- plano_contas: listar, visualizar, criar, editar, deletar, exportar
-- contas_pagar: listar, visualizar, criar, editar, deletar, pagar, cancelar, exportar, gerar_recorrentes
-- contas_receber: listar, visualizar, criar, editar, deletar, receber, cancelar, exportar, gerar_recorrentes
-- orcamentos: listar, visualizar, criar, editar, deletar, aprovar, iniciar_execucao, encerrar, exportar
-- conciliacao_bancaria: listar, visualizar, importar, conciliar, desconciliar, exportar

-- =====================================================
-- From: 23_dashboard.sql
-- =====================================================

-- ============================================================================
-- Tabela: layouts_painel
-- Configurações de layout do painel do usuário
-- ============================================================================

create table if not exists public.layouts_painel (
  id bigint generated always as identity primary key,
  usuario_id bigint not null references public.usuarios(id) on delete cascade unique,
  widgets jsonb not null default '[]',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.layouts_painel is 'Configurações de layout do painel do usuário';
comment on column public.layouts_painel.usuario_id is 'ID do usuário dono do layout';
comment on column public.layouts_painel.widgets is 'Configuração dos widgets em JSONB (posição, tamanho, tipo, etc)';

-- RLS
alter table public.layouts_painel enable row level security;

create policy "Service role tem acesso total a layouts_painel"
on public.layouts_painel for all
to service_role
using (true)
with check (true);

create policy "Usuários podem gerenciar seu próprio layout"
on public.layouts_painel for all
to authenticated
using ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id))
with check ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id));


-- ============================================================================
-- Tabela: links_personalizados
-- Links personalizados do usuário
-- ============================================================================

create table if not exists public.links_personalizados (
  id bigint generated always as identity primary key,
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  titulo text not null,
  url text not null,
  icone text,
  ordem integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.links_personalizados is 'Links personalizados do usuário';
comment on column public.links_personalizados.usuario_id is 'ID do usuário dono do link';
comment on column public.links_personalizados.titulo is 'Título do link';
comment on column public.links_personalizados.url is 'URL do link';
comment on column public.links_personalizados.icone is 'Ícone do link (nome ou URL)';
comment on column public.links_personalizados.ordem is 'Ordem de exibição';

-- Índices
create index if not exists idx_links_personalizados_usuario on public.links_personalizados(usuario_id);

-- RLS
alter table public.links_personalizados enable row level security;

create policy "Service role tem acesso total a links_personalizados"
on public.links_personalizados for all
to service_role
using (true)
with check (true);

create policy "Usuários podem gerenciar seus próprios links"
on public.links_personalizados for all
to authenticated
using ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id))
with check ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id));


-- ============================================================================
-- Tabela: tarefas
-- Tarefas do usuário
-- ============================================================================

-- ----------------------------------------------------------------------------
-- IMPORTANTE
-- ----------------------------------------------------------------------------
-- Este módulo é alinhado 1:1 ao template de Tasks (TanStack Table).
-- Não existe retrocompatibilidade com o modelo antigo (titulo/descricao/prioridade numérica/data_prevista).
--
-- Campos usados pela UI (contrato do template):
-- - id (text): ex: TASK-0001
-- - title (text)
-- - status (text): backlog | todo | in progress | done | canceled
-- - label (text): bug | feature | documentation
-- - priority (text): low | medium | high
--
-- O id é gerado via sequence para manter o formato TASK-xxxx.

create sequence if not exists public.tarefas_seq;

create table if not exists public.tarefas (
  id text primary key default (
    'TASK-' || lpad(nextval('public.tarefas_seq')::text, 4, '0')
  ),
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  title text not null,
  status text not null default 'todo',
  label text not null default 'feature',
  priority text not null default 'medium',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint tarefas_status_check check (status in ('backlog', 'todo', 'in progress', 'done', 'canceled')),
  constraint tarefas_label_check check (label in ('bug', 'feature', 'documentation')),
  constraint tarefas_priority_check check (priority in ('low', 'medium', 'high'))
);

comment on table public.tarefas is 'Tarefas do usuário';
comment on column public.tarefas.usuario_id is 'ID do usuário dono da tarefa';
comment on column public.tarefas.id is 'Identificador da tarefa no formato TASK-0001';
comment on column public.tarefas.title is 'Título da tarefa';
comment on column public.tarefas.status is 'Status: backlog, todo, in progress, done, canceled';
comment on column public.tarefas.label is 'Label: bug, feature, documentation';
comment on column public.tarefas.priority is 'Prioridade: low, medium, high';

-- Índices
create index if not exists idx_tarefas_usuario on public.tarefas(usuario_id);
create index if not exists idx_tarefas_status on public.tarefas(status);
create index if not exists idx_tarefas_label on public.tarefas(label);
create index if not exists idx_tarefas_priority on public.tarefas(priority);

-- RLS
alter table public.tarefas enable row level security;

create policy "Service role tem acesso total a tarefas"
on public.tarefas for all
to service_role
using (true)
with check (true);

create policy "Usuários podem gerenciar suas próprias tarefas"
on public.tarefas for all
to authenticated
using ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id))
with check ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id));


-- ============================================================================
-- Tabela: notas
-- Notas do usuário
-- ============================================================================

create table if not exists public.notas (
  id bigint generated always as identity primary key,
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  titulo text,
  conteudo text not null,
  cor text default '#ffffff',
  fixada boolean default false,
  -- v2 (notas app): campos para alinhar ao front-end de `app/(dashboard)/notas`
  is_archived boolean not null default false,
  tipo text not null default 'text',
  items jsonb,
  image_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.notas is 'Notas do usuário';
comment on column public.notas.usuario_id is 'ID do usuário dono da nota';
comment on column public.notas.titulo is 'Título da nota (opcional)';
comment on column public.notas.conteudo is 'Conteúdo da nota';
comment on column public.notas.cor is 'Cor de fundo da nota (hex)';
comment on column public.notas.fixada is 'Indica se a nota está fixada';
comment on column public.notas.is_archived is 'Indica se a nota está arquivada (não aparece na lista principal).';
comment on column public.notas.tipo is 'Tipo da nota: text, checklist, image.';
comment on column public.notas.items is 'Itens de checklist (jsonb). Usado quando tipo=checklist.';
comment on column public.notas.image_url is 'URL/path da imagem da nota. Usado quando tipo=image.';

-- Índices
create index if not exists idx_notas_usuario on public.notas(usuario_id);
create index if not exists idx_notas_fixada on public.notas(fixada);
create index if not exists idx_notas_usuario_archived on public.notas(usuario_id, is_archived);

-- RLS
alter table public.notas enable row level security;

-- constraints (mantidos aqui para alinhamento de schema; policies estão em migrations por caveat do diff)
alter table public.notas
  drop constraint if exists notas_tipo_check;

alter table public.notas
  add constraint notas_tipo_check check (tipo in ('text', 'checklist', 'image'));

create policy "Service role tem acesso total a notas"
on public.notas for all
to service_role
using (true)
with check (true);

create policy "Usuários podem gerenciar suas próprias notas"
on public.notas for all
to authenticated
using ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id))
with check ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id));


-- ============================================================================
-- Tabela: nota_etiquetas
-- Etiquetas (labels) do usuário para o app de notas
-- ============================================================================

create table if not exists public.nota_etiquetas (
  id bigint generated always as identity primary key,
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  title text not null,
  color text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint nota_etiquetas_usuario_title_unique unique (usuario_id, title)
);

comment on table public.nota_etiquetas is 'Etiquetas (labels) do usuário no app de notas.';
comment on column public.nota_etiquetas.usuario_id is 'ID do usuário dono da etiqueta.';
comment on column public.nota_etiquetas.title is 'Título da etiqueta (ex: Reuniões).';
comment on column public.nota_etiquetas.color is 'Cor/estilo (string) usado pelo front-end (ex: bg-green-500).';

create index if not exists idx_nota_etiquetas_usuario on public.nota_etiquetas(usuario_id);

alter table public.nota_etiquetas enable row level security;

-- ============================================================================
-- Tabela: nota_etiqueta_vinculos
-- Vínculo N:N entre notas e etiquetas
-- ============================================================================

create table if not exists public.nota_etiqueta_vinculos (
  nota_id bigint not null references public.notas(id) on delete cascade,
  etiqueta_id bigint not null references public.nota_etiquetas(id) on delete cascade,
  created_at timestamp with time zone default now(),
  constraint nota_etiqueta_vinculos_pkey primary key (nota_id, etiqueta_id)
);

comment on table public.nota_etiqueta_vinculos is 'Tabela de junção entre notas e etiquetas (N:N).';
comment on column public.nota_etiqueta_vinculos.nota_id is 'ID da nota (public.notas.id).';
comment on column public.nota_etiqueta_vinculos.etiqueta_id is 'ID da etiqueta (public.nota_etiquetas.id).';

create index if not exists idx_nota_etiqueta_vinculos_nota on public.nota_etiqueta_vinculos(nota_id);
create index if not exists idx_nota_etiqueta_vinculos_etiqueta on public.nota_etiqueta_vinculos(etiqueta_id);

alter table public.nota_etiqueta_vinculos enable row level security;


-- ============================================================================
-- Funções: Contagem de processos únicos
-- Conta processos únicos por numero_processo diretamente no banco
-- ============================================================================

create or replace function public.count_processos_unicos(
  p_origem text default null,
  p_responsavel_id bigint default null,
  p_data_inicio timestamptz default null,
  p_data_fim timestamptz default null
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count bigint;
begin
  select count(distinct numero_processo)
  into v_count
  from public.acervo
  where numero_processo is not null
    and numero_processo != ''
    and (p_origem is null or origem = p_origem)
    and (p_responsavel_id is null or responsavel_id = p_responsavel_id)
    and (p_data_inicio is null or created_at >= p_data_inicio)
    and (p_data_fim is null or created_at < p_data_fim);
  
  return v_count;
end;
$$;

comment on function public.count_processos_unicos is 'Conta processos únicos por numero_processo. Parâmetros opcionais: origem (acervo_geral/arquivado), responsavel_id, data_inicio, data_fim';

-- =====================================================
-- From: 23_kanban.sql
-- =====================================================

-- ============================================================================
-- kanban (template)
-- ============================================================================
--
-- objetivo:
-- - persistir o template de kanban (colunas + cards) no banco
-- - alinhar 1:1 ao modelo do template (ids string, prioridade low/medium/high, progress 0..100, users como jsonb)
--
-- segurança:
-- - rls habilitado em todas as tabelas
-- - policies permissive para service_role (acesso total)
-- - policies para authenticated (somente linhas do próprio usuário via public.usuarios.auth_user_id)
--

-- ----------------------------------------------------------------------------
-- sequence: kanban_columns_seq (para ids COL-0001)
-- ----------------------------------------------------------------------------
create sequence if not exists public.kanban_columns_seq;

-- ----------------------------------------------------------------------------
-- table: kanban_columns
-- ----------------------------------------------------------------------------
create table if not exists public.kanban_columns (
  id text primary key default (
    'COL-' || lpad(nextval('public.kanban_columns_seq')::text, 4, '0')
  ),
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

comment on table public.kanban_columns is 'Colunas do quadro Kanban do usuário (template).';
comment on column public.kanban_columns.id is 'Identificador da coluna no formato COL-0001.';
comment on column public.kanban_columns.usuario_id is 'ID do usuário dono da coluna.';
comment on column public.kanban_columns.title is 'Título da coluna (ex: Backlog).';
comment on column public.kanban_columns.position is 'Ordenação da coluna no quadro (0..n).';

create index if not exists idx_kanban_columns_usuario on public.kanban_columns(usuario_id);
create index if not exists idx_kanban_columns_usuario_position on public.kanban_columns(usuario_id, position);

alter table public.kanban_columns enable row level security;

create policy "Service role full access kanban_columns"
on public.kanban_columns
for all
to service_role
using (true)
with check (true);

create policy "Authenticated manage own kanban_columns"
on public.kanban_columns
for all
to authenticated
using ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id))
with check ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id));

-- ----------------------------------------------------------------------------
-- sequence: kanban_tasks_seq (para ids KBT-0001)
-- ----------------------------------------------------------------------------
create sequence if not exists public.kanban_tasks_seq;

-- ----------------------------------------------------------------------------
-- table: kanban_tasks
-- ----------------------------------------------------------------------------
create table if not exists public.kanban_tasks (
  id text primary key default (
    'KBT-' || lpad(nextval('public.kanban_tasks_seq')::text, 4, '0')
  ),
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  column_id text not null references public.kanban_columns(id) on delete cascade,
  title text not null,
  description text,
  priority text not null default 'medium',
  assignee text,
  due_date date,
  progress integer not null default 0,
  attachments integer not null default 0,
  comments integer not null default 0,
  users jsonb not null default '[]'::jsonb,
  position integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint kanban_tasks_priority_check check (priority in ('low', 'medium', 'high')),
  constraint kanban_tasks_progress_check check (progress >= 0 and progress <= 100),
  constraint kanban_tasks_attachments_check check (attachments >= 0),
  constraint kanban_tasks_comments_check check (comments >= 0)
);

comment on table public.kanban_tasks is 'Cards/tarefas do quadro Kanban do usuário (template).';
comment on column public.kanban_tasks.id is 'Identificador do card no formato KBT-0001.';
comment on column public.kanban_tasks.usuario_id is 'ID do usuário dono do card.';
comment on column public.kanban_tasks.column_id is 'ID da coluna (public.kanban_columns.id).';
comment on column public.kanban_tasks.title is 'Título do card.';
comment on column public.kanban_tasks.description is 'Descrição do card (opcional).';
comment on column public.kanban_tasks.priority is 'Prioridade: low, medium, high.';
comment on column public.kanban_tasks.assignee is 'Nome do responsável (opcional).';
comment on column public.kanban_tasks.due_date is 'Data prevista (opcional).';
comment on column public.kanban_tasks.progress is 'Progresso (0..100).';
comment on column public.kanban_tasks.attachments is 'Quantidade de anexos (contador).';
comment on column public.kanban_tasks.comments is 'Quantidade de comentários (contador).';
comment on column public.kanban_tasks.users is 'Lista de usuários do card (array jsonb com name/src/alt/fallback).';
comment on column public.kanban_tasks.position is 'Ordenação do card dentro da coluna (0..n).';

create index if not exists idx_kanban_tasks_usuario on public.kanban_tasks(usuario_id);
create index if not exists idx_kanban_tasks_usuario_column on public.kanban_tasks(usuario_id, column_id);
create index if not exists idx_kanban_tasks_usuario_column_position on public.kanban_tasks(usuario_id, column_id, position);

alter table public.kanban_tasks enable row level security;

create policy "Service role full access kanban_tasks"
on public.kanban_tasks
for all
to service_role
using (true)
with check (true);

create policy "Authenticated manage own kanban_tasks"
on public.kanban_tasks
for all
to authenticated
using ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id))
with check ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id));



-- =====================================================
-- From: 24_processos_cliente_por_cpf_view.sql
-- =====================================================

-- ============================================================================
-- VIEW Materializada: processos_cliente_por_cpf
-- Relaciona clientes (por CPF) com seus processos para busca otimizada
-- Usada pelo endpoint de consulta do Agente IA WhatsApp
-- ============================================================================

-- Criar a VIEW materializada
create materialized view if not exists public.processos_cliente_por_cpf as
select
  -- Cliente
  c.cpf,
  c.nome as cliente_nome,
  c.id as cliente_id,

  -- Participacao
  pp.tipo_parte,
  pp.polo,
  pp.principal as parte_principal,

  -- Processo (campos relevantes)
  a.id as processo_id,
  a.id_pje,              -- ID do processo no PJE (necessário para captura de timeline)
  a.advogado_id,         -- ID do advogado que capturou (necessário para credenciais)
  a.numero_processo,
  a.trt,
  a.grau,
  a.classe_judicial,
  a.nome_parte_autora,
  a.nome_parte_re,
  a.descricao_orgao_julgador,
  a.codigo_status_processo,
  a.origem,
  a.data_autuacao,
  a.data_arquivamento,
  a.data_proxima_audiencia,
  a.segredo_justica,
  a.timeline_jsonb

from public.clientes c
join public.processo_partes pp
  on pp.tipo_entidade = 'cliente'
  and pp.entidade_id = c.id
join public.acervo a
  on pp.processo_id = a.id
where c.cpf is not null
  and c.ativo = true;

comment on materialized view public.processos_cliente_por_cpf is 'VIEW materializada para busca otimizada de processos por CPF do cliente. Usada pelo Agente IA WhatsApp.';

-- Indices criticos para performance
create unique index if not exists idx_processos_cliente_cpf_unique
  on public.processos_cliente_por_cpf(cpf, processo_id, grau);

create index if not exists idx_processos_cliente_cpf_busca
  on public.processos_cliente_por_cpf(cpf);

create index if not exists idx_processos_cliente_cpf_numero
  on public.processos_cliente_por_cpf(numero_processo);

-- ============================================================================
-- Funcao para refresh da VIEW
-- ============================================================================

create or replace function public.refresh_processos_cliente_por_cpf()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently public.processos_cliente_por_cpf;
end;
$$;

comment on function public.refresh_processos_cliente_por_cpf() is 'Atualiza a VIEW materializada processos_cliente_por_cpf de forma concorrente (sem bloquear leituras)';

-- ============================================================================
-- Trigger para refresh automatico apos mudancas em processo_partes
-- ============================================================================

create or replace function public.trigger_refresh_processos_cliente_por_cpf()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Apenas refresh se a entidade for cliente
  if (tg_op = 'DELETE' and old.tipo_entidade = 'cliente') or
     (tg_op = 'INSERT' and new.tipo_entidade = 'cliente') or
     (tg_op = 'UPDATE' and (old.tipo_entidade = 'cliente' or new.tipo_entidade = 'cliente')) then
    -- Agendar refresh assincrono (nao bloqueia a transacao)
    perform pg_notify('refresh_view', 'processos_cliente_por_cpf');
  end if;

  return coalesce(new, old);
end;
$$;

-- Nota: O trigger abaixo esta comentado pois refresh sincrono pode impactar performance.
-- Recomenda-se usar refresh periodico via cron ou apos capturas.
--
-- create trigger trg_refresh_processos_cliente_cpf
-- after insert or update or delete on public.processo_partes
-- for each row
-- execute function public.trigger_refresh_processos_cliente_por_cpf();

-- =====================================================
-- From: 25_assinatura_digital.sql
-- =====================================================

-- ============================================================================
-- Assinatura Digital: tabelas de assinatura eletrônica
-- ============================================================================

-- NOTA: Segmentos são gerenciados pela tabela global 'segmentos' (ver 10_segmentos.sql)
-- As tabelas de assinatura digital referenciam 'segmentos' em vez de ter tabela própria

-- Templates de PDF
create table if not exists public.assinatura_digital_templates (
  id bigint generated always as identity primary key,
  template_uuid uuid not null default gen_random_uuid() unique,
  nome text not null,
  descricao text,
  tipo_template text default 'pdf' check (tipo_template in ('pdf', 'markdown')),
  segmento_id bigint references public.segmentos(id),
  pdf_url text,
  arquivo_original text not null,
  arquivo_nome text not null,
  arquivo_tamanho integer not null,
  status text default 'ativo',
  versao integer default 1,
  ativo boolean default true,
  campos text default '[]',
  conteudo_markdown text,
  criado_por text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.assinatura_digital_templates is 'Templates de PDF usados na geração de documentos assinados';
comment on column public.assinatura_digital_templates.template_uuid is 'UUID público do template';
comment on column public.assinatura_digital_templates.tipo_template is 'Tipo do template: pdf (arquivo PDF) ou markdown (conteúdo gerado)';
comment on column public.assinatura_digital_templates.segmento_id is 'ID do segmento associado ao template (null = template global)';
comment on column public.assinatura_digital_templates.pdf_url is 'URL do arquivo PDF no storage (para templates tipo pdf)';
comment on column public.assinatura_digital_templates.campos is 'Definição de campos do template em JSON serializado';

create index if not exists idx_assinatura_digital_templates_ativo on public.assinatura_digital_templates(ativo);
create index if not exists idx_assinatura_digital_templates_nome on public.assinatura_digital_templates(nome);
create index if not exists idx_assinatura_digital_templates_segmento on public.assinatura_digital_templates(segmento_id);
create index if not exists idx_assinatura_digital_templates_tipo on public.assinatura_digital_templates(tipo_template);

-- Formulários
create table if not exists public.assinatura_digital_formularios (
  id bigint generated always as identity primary key,
  formulario_uuid uuid not null default gen_random_uuid() unique,
  nome text not null,
  slug text not null unique,
  descricao text,
  segmento_id bigint not null references public.segmentos(id) on delete restrict,
  form_schema jsonb,
  schema_version text default '1.0.0',
  template_ids text[] default '{}',
  ativo boolean default true,
  ordem integer default 0,
  foto_necessaria boolean default true,
  geolocation_necessaria boolean default false,
  metadados_seguranca text default '["ip","user_agent"]',
  criado_por text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.assinatura_digital_formularios is 'Formulários de assinatura digital vinculados a segmentos e templates';
comment on column public.assinatura_digital_formularios.slug is 'Slug único do formulário';
comment on column public.assinatura_digital_formularios.form_schema is 'Schema JSON do formulário (estrutura dos campos)';
comment on column public.assinatura_digital_formularios.template_ids is 'Lista de UUIDs de templates associados';

create index if not exists idx_assinatura_digital_formularios_segmento on public.assinatura_digital_formularios(segmento_id);
create index if not exists idx_assinatura_digital_formularios_ativo on public.assinatura_digital_formularios(ativo);
create index if not exists idx_assinatura_digital_formularios_ordem_nome on public.assinatura_digital_formularios(ordem nulls first, nome);

-- Sessões de assinatura (para métricas/estado)
create table if not exists public.assinatura_digital_sessoes_assinatura (
  id bigint generated always as identity primary key,
  acao_id bigint unique,
  sessao_uuid uuid not null default gen_random_uuid() unique,
  status text default 'pendente',
  ip_address text,
  user_agent text,
  device_info jsonb,
  geolocation jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  expires_at timestamp with time zone
);

comment on table public.assinatura_digital_sessoes_assinatura is 'Sessões de assinatura digital (estado da jornada do signatário)';

create index if not exists idx_assinatura_digital_sessoes_status on public.assinatura_digital_sessoes_assinatura(status);
create index if not exists idx_assinatura_digital_sessoes_expires_at on public.assinatura_digital_sessoes_assinatura(expires_at);
create index if not exists idx_assinatura_digital_sessoes_created_at on public.assinatura_digital_sessoes_assinatura(created_at);

-- Assinaturas finalizadas
create table if not exists public.assinatura_digital_assinaturas (
  id bigint generated always as identity primary key,
  cliente_id bigint not null,
  acao_id bigint not null,
  template_uuid text not null,
  segmento_id bigint not null references public.segmentos(id) on delete restrict,
  formulario_id bigint not null references public.assinatura_digital_formularios(id) on delete restrict,
  sessao_uuid uuid not null,
  assinatura_url text not null,
  foto_url text,
  pdf_url text not null,
  protocolo text not null unique,
  ip_address text,
  user_agent text,
  latitude double precision,
  longitude double precision,
  geolocation_accuracy double precision,
  geolocation_timestamp text,
  data_assinatura timestamp with time zone not null,
  status text default 'concluida',
  enviado_sistema_externo boolean default false,
  data_envio_externo timestamp with time zone,
  hash_original_sha256 text not null,
  hash_final_sha256 text,
  termos_aceite_versao text not null,
  termos_aceite_data timestamp with time zone not null,
  dispositivo_fingerprint_raw jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.assinatura_digital_assinaturas is 'Assinaturas concluídas, com metadados e URLs de artefatos';
comment on column public.assinatura_digital_assinaturas.hash_original_sha256 is 'Hash SHA-256 PDF original (integridade conteúdo)';
comment on column public.assinatura_digital_assinaturas.hash_final_sha256 is 'Hash SHA-256 PDF final (com manifesto)';
comment on column public.assinatura_digital_assinaturas.termos_aceite_versao is 'Versão termos (v1.0-MP2200-2)';
comment on column public.assinatura_digital_assinaturas.termos_aceite_data is 'Timestamp aceite termos';
comment on column public.assinatura_digital_assinaturas.dispositivo_fingerprint_raw is 'Fingerprint dispositivo (JSONB: tela, bateria, etc.)';

create index if not exists idx_assinatura_digital_assinaturas_cliente on public.assinatura_digital_assinaturas(cliente_id);
create index if not exists idx_assinatura_digital_assinaturas_acao on public.assinatura_digital_assinaturas(acao_id);
create index if not exists idx_assinatura_digital_assinaturas_segmento on public.assinatura_digital_assinaturas(segmento_id);
create index if not exists idx_assinatura_digital_assinaturas_formulario on public.assinatura_digital_assinaturas(formulario_id);
create index if not exists idx_assinatura_digital_assinaturas_status on public.assinatura_digital_assinaturas(status);
create index if not exists idx_assinatura_digital_assinaturas_data on public.assinatura_digital_assinaturas(data_assinatura);
create index if not exists idx_assinatura_digital_assinaturas_hash_original on public.assinatura_digital_assinaturas(hash_original_sha256);

-- RLS
alter table public.assinatura_digital_templates enable row level security;
alter table public.assinatura_digital_formularios enable row level security;
alter table public.assinatura_digital_sessoes_assinatura enable row level security;
alter table public.assinatura_digital_assinaturas enable row level security;

-- service_role full access
create policy "service role full access - assinatura_digital_templates"
  on public.assinatura_digital_templates for all
  to service_role
  using (true) with check (true);

create policy "service role full access - assinatura_digital_formularios"
  on public.assinatura_digital_formularios for all
  to service_role
  using (true) with check (true);

create policy "service role full access - assinatura_digital_sessoes_assinatura"
  on public.assinatura_digital_sessoes_assinatura for all
  to service_role
  using (true) with check (true);

create policy "service role full access - assinatura_digital_assinaturas"
  on public.assinatura_digital_assinaturas for all
  to service_role
  using (true) with check (true);

-- authenticated: leitura básica (listar catálogos)
create policy "authenticated select - assinatura_digital_templates"
  on public.assinatura_digital_templates for select
  to authenticated
  using (true);

create policy "authenticated select - assinatura_digital_formularios"
  on public.assinatura_digital_formularios for select
  to authenticated
  using (true);

create policy "authenticated select - assinatura_digital_sessoes_assinatura"
  on public.assinatura_digital_sessoes_assinatura for select
  to authenticated
  using (true);

create policy "authenticated insert - assinatura_digital_sessoes_assinatura"
  on public.assinatura_digital_sessoes_assinatura for insert
  to authenticated
  with check (true);

create policy "authenticated update - assinatura_digital_sessoes_assinatura"
  on public.assinatura_digital_sessoes_assinatura for update
  to authenticated
  using (true);

create policy "authenticated insert - assinatura_digital_assinaturas"
  on public.assinatura_digital_assinaturas for insert
  to authenticated
  with check (true);

create policy "authenticated select - assinatura_digital_assinaturas"
  on public.assinatura_digital_assinaturas for select
  to authenticated
  using (true);

-- ============================================================================
-- NOVO FLUXO: Documento via upload de PDF + múltiplos assinantes (links públicos)
-- ============================================================================

-- Documento de assinatura (PDF pronto uploadado)
create table if not exists public.assinatura_digital_documentos (
  id bigint generated always as identity primary key,
  documento_uuid uuid not null default gen_random_uuid() unique,
  titulo text,
  status text not null default 'rascunho' check (status in ('rascunho', 'pronto', 'concluido', 'cancelado')),
  selfie_habilitada boolean not null default false,
  pdf_original_url text not null,
  pdf_final_url text,
  hash_original_sha256 text,
  hash_final_sha256 text,
  created_by bigint references public.usuarios(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.assinatura_digital_documentos is 'Documentos de assinatura criados via upload de PDF pronto, com múltiplos assinantes e links públicos.';
comment on column public.assinatura_digital_documentos.documento_uuid is 'UUID público do documento de assinatura.';
comment on column public.assinatura_digital_documentos.selfie_habilitada is 'Se true, o fluxo público exige selfie antes de assinar.';
comment on column public.assinatura_digital_documentos.pdf_original_url is 'URL do PDF original uploadado no storage (Backblaze B2).';
comment on column public.assinatura_digital_documentos.pdf_final_url is 'URL do PDF final com assinaturas/rubricas aplicadas.';

create index if not exists idx_assinatura_digital_documentos_status on public.assinatura_digital_documentos(status);
create index if not exists idx_assinatura_digital_documentos_created_at on public.assinatura_digital_documentos(created_at);

-- Assinantes do documento (1..N), incluindo convidados (sem criar entidade)
create table if not exists public.assinatura_digital_documento_assinantes (
  id bigint generated always as identity primary key,
  documento_id bigint not null references public.assinatura_digital_documentos(id) on delete cascade,
  assinante_tipo text not null check (assinante_tipo in ('cliente', 'parte_contraria', 'representante', 'terceiro', 'usuario', 'convidado')),
  assinante_entidade_id bigint,
  dados_snapshot jsonb not null default '{}'::jsonb,
  dados_confirmados boolean not null default false,
  token text not null unique,
  status text not null default 'pendente' check (status in ('pendente', 'concluido')),
  selfie_url text,
  assinatura_url text,
  rubrica_url text,
  ip_address text,
  user_agent text,
  geolocation jsonb,
  termos_aceite_versao text,
  termos_aceite_data timestamp with time zone,
  dispositivo_fingerprint_raw jsonb,
  concluido_em timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.assinatura_digital_documento_assinantes is 'Assinantes de um documento de assinatura. Suporta entidades do sistema ou convidados (dados no jsonb).';
comment on column public.assinatura_digital_documento_assinantes.dados_snapshot is 'Snapshot de identificação do assinante (nome, cpf, email, telefone). Não cria entidade para convidado.';
comment on column public.assinatura_digital_documento_assinantes.token is 'Token opaco e não enumerável para acesso público (sem expiração e sem reuso após conclusão).';

create index if not exists idx_assinatura_digital_doc_assinantes_documento on public.assinatura_digital_documento_assinantes(documento_id);
create index if not exists idx_assinatura_digital_doc_assinantes_status on public.assinatura_digital_documento_assinantes(status);
create index if not exists idx_assinatura_digital_doc_assinantes_tipo_entidade on public.assinatura_digital_documento_assinantes(assinante_tipo, assinante_entidade_id);

-- Âncoras (assinatura/rubrica) no PDF por assinante
create table if not exists public.assinatura_digital_documento_ancoras (
  id bigint generated always as identity primary key,
  documento_id bigint not null references public.assinatura_digital_documentos(id) on delete cascade,
  documento_assinante_id bigint not null references public.assinatura_digital_documento_assinantes(id) on delete cascade,
  tipo text not null check (tipo in ('assinatura', 'rubrica')),
  pagina integer not null check (pagina >= 1),
  x_norm double precision not null check (x_norm >= 0 and x_norm <= 1),
  y_norm double precision not null check (y_norm >= 0 and y_norm <= 1),
  w_norm double precision not null check (w_norm > 0 and w_norm <= 1),
  h_norm double precision not null check (h_norm > 0 and h_norm <= 1),
  created_at timestamp with time zone default now()
);

comment on table public.assinatura_digital_documento_ancoras is 'Âncoras visuais no PDF (coordenadas normalizadas) associadas a um assinante e a um tipo (assinatura/rubrica).';
comment on column public.assinatura_digital_documento_ancoras.x_norm is 'Coordenada X normalizada (0..1) relativa à largura da página.';
comment on column public.assinatura_digital_documento_ancoras.y_norm is 'Coordenada Y normalizada (0..1) relativa à altura da página (referência no topo no front; converter ao aplicar no PDF).';

create index if not exists idx_assinatura_digital_doc_ancoras_documento on public.assinatura_digital_documento_ancoras(documento_id);
create index if not exists idx_assinatura_digital_doc_ancoras_assinante on public.assinatura_digital_documento_ancoras(documento_assinante_id);
create index if not exists idx_assinatura_digital_doc_ancoras_tipo on public.assinatura_digital_documento_ancoras(tipo);

-- RLS (novo fluxo)
alter table public.assinatura_digital_documentos enable row level security;
alter table public.assinatura_digital_documento_assinantes enable row level security;
alter table public.assinatura_digital_documento_ancoras enable row level security;

-- service_role full access (novo fluxo)
create policy "service role full access - assinatura_digital_documentos"
  on public.assinatura_digital_documentos for all
  to service_role
  using (true) with check (true);

create policy "service role full access - assinatura_digital_documento_assinantes"
  on public.assinatura_digital_documento_assinantes for all
  to service_role
  using (true) with check (true);

create policy "service role full access - assinatura_digital_documento_ancoras"
  on public.assinatura_digital_documento_ancoras for all
  to service_role
  using (true) with check (true);

-- authenticated: permitir leitura básica para telas administrativas (acesso efetivo controlado via API)
create policy "authenticated select - assinatura_digital_documentos"
  on public.assinatura_digital_documentos for select
  to authenticated
  using (true);

create policy "authenticated select - assinatura_digital_documento_assinantes"
  on public.assinatura_digital_documento_assinantes for select
  to authenticated
  using (true);

create policy "authenticated select - assinatura_digital_documento_ancoras"
  on public.assinatura_digital_documento_ancoras for select
  to authenticated
  using (true);
-- =====================================================
-- From: 26_plano_contas.sql
-- =====================================================

-- ============================================================================
-- Schema: Plano de Contas
-- Sistema de Gestão Financeira (SGF)
-- ============================================================================
-- Estrutura hierárquica de contas contábeis para classificação de receitas,
-- despesas, ativos e passivos do escritório.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabela: plano_contas
-- ----------------------------------------------------------------------------
-- Plano de contas contábil com estrutura hierárquica. Contas sintéticas agrupam
-- outras contas, enquanto contas analíticas recebem lançamentos diretos.

create table public.plano_contas (
  id bigint generated always as identity primary key,

  -- Identificação da conta
  codigo text not null,
  nome text not null,
  descricao text,

  -- Classificação contábil
  tipo_conta public.tipo_conta_contabil not null,
  natureza public.natureza_conta not null,
  nivel public.nivel_conta not null,

  -- Hierarquia
  conta_pai_id bigint references public.plano_contas(id) on delete restrict,

  -- Configurações
  aceita_lancamento boolean not null default false,
  ordem_exibicao integer,
  ativo boolean not null default true,

  -- Auditoria
  created_by bigint references public.usuarios(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- Constraints
  constraint plano_contas_codigo_unique unique (codigo),
  constraint plano_contas_nivel_aceita_lancamento_check check (
    (nivel = 'analitica' and aceita_lancamento = true) or
    (nivel = 'sintetica' and aceita_lancamento = false)
  ),
  constraint plano_contas_sem_auto_referencia_check check (conta_pai_id != id)
);

-- Comentário da tabela
comment on table public.plano_contas is 'Plano de contas contábil hierárquico. Contas sintéticas agrupam outras contas para fins de totalização em relatórios. Contas analíticas recebem lançamentos financeiros diretos. Segue estrutura padrão de contabilidade: Ativo, Passivo, Receita, Despesa e Patrimônio Líquido.';

-- Comentários das colunas
comment on column public.plano_contas.id is 'Identificador único da conta contábil';
comment on column public.plano_contas.codigo is 'Código hierárquico da conta (ex: 1.1.01, 3.2.05). Formato livre, mas recomenda-se usar pontos como separadores de níveis.';
comment on column public.plano_contas.nome is 'Nome descritivo da conta (ex: Caixa e Bancos, Honorários Advocatícios)';
comment on column public.plano_contas.descricao is 'Descrição detalhada do propósito e uso da conta';
comment on column public.plano_contas.tipo_conta is 'Tipo da conta: ativo (bens e direitos), passivo (obrigações), receita, despesa ou patrimonio_liquido';
comment on column public.plano_contas.natureza is 'Natureza contábil: devedora (aumenta com débito) ou credora (aumenta com crédito)';
comment on column public.plano_contas.nivel is 'Nível da conta: sintetica (agrupa outras contas) ou analitica (recebe lançamentos)';
comment on column public.plano_contas.conta_pai_id is 'Referência à conta pai na hierarquia. NULL para contas de primeiro nível.';
comment on column public.plano_contas.aceita_lancamento is 'Se true, a conta pode receber lançamentos financeiros. Apenas contas analíticas aceitam lançamentos.';
comment on column public.plano_contas.ordem_exibicao is 'Ordem de exibição em relatórios e listagens. Menor número aparece primeiro.';
comment on column public.plano_contas.ativo is 'Se false, a conta não aparece em seleções e não pode receber novos lançamentos';
comment on column public.plano_contas.created_by is 'Usuário que criou o registro';
comment on column public.plano_contas.created_at is 'Data e hora de criação do registro';
comment on column public.plano_contas.updated_at is 'Data e hora da última atualização';

-- ----------------------------------------------------------------------------
-- Índices
-- ----------------------------------------------------------------------------

create index idx_plano_contas_codigo on public.plano_contas (codigo);
comment on index public.idx_plano_contas_codigo is 'Índice para busca rápida por código da conta';

create index idx_plano_contas_tipo_conta on public.plano_contas (tipo_conta);
comment on index public.idx_plano_contas_tipo_conta is 'Índice para filtrar contas por tipo (ativo, passivo, receita, etc.)';

create index idx_plano_contas_conta_pai on public.plano_contas (conta_pai_id);
comment on index public.idx_plano_contas_conta_pai is 'Índice para navegação hierárquica (buscar filhos de uma conta pai)';

create index idx_plano_contas_ativo on public.plano_contas (ativo);
comment on index public.idx_plano_contas_ativo is 'Índice para filtrar apenas contas ativas';

create index idx_plano_contas_aceita_lancamento on public.plano_contas (aceita_lancamento) where aceita_lancamento = true;
comment on index public.idx_plano_contas_aceita_lancamento is 'Índice parcial para listar apenas contas que aceitam lançamentos (analíticas)';

-- ----------------------------------------------------------------------------
-- Trigger: Atualizar updated_at automaticamente
-- ----------------------------------------------------------------------------

create trigger update_plano_contas_updated_at
  before update on public.plano_contas
  for each row
  execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Function: validar_hierarquia_plano_contas
-- ----------------------------------------------------------------------------
-- Valida que a atribuição de conta_pai_id não cria ciclos na hierarquia.
-- Um ciclo ocorre quando um ancestral é definido como filho de um descendente.

create or replace function public.validar_hierarquia_plano_contas()
returns trigger
language plpgsql
security invoker
as $$
declare
  v_ancestral_id bigint;
begin
  -- Se não há conta pai, não há risco de ciclo
  if new.conta_pai_id is null then
    return new;
  end if;

  -- Verifica se o novo pai é descendente do registro atual (o que criaria um ciclo)
  -- Percorre a hierarquia a partir do novo pai até encontrar o registro atual ou chegar à raiz
  with recursive ancestrais as (
    -- Começa com o novo pai proposto
    select id, conta_pai_id, 1 as nivel
    from public.plano_contas
    where id = new.conta_pai_id

    union all

    -- Sobe na hierarquia
    select p.id, p.conta_pai_id, a.nivel + 1
    from public.plano_contas p
    join ancestrais a on p.id = a.conta_pai_id
    where a.nivel < 100 -- Limite de segurança para evitar loops infinitos
  )
  select id into v_ancestral_id
  from ancestrais
  where id = new.id
  limit 1;

  -- Se encontrou o registro atual na cadeia de ancestrais, temos um ciclo
  if v_ancestral_id is not null then
    raise exception 'Operação criaria ciclo na hierarquia do plano de contas. A conta "%" (ID %) não pode ter como pai a conta ID % pois isso criaria uma referência circular.',
      new.nome, new.id, new.conta_pai_id;
  end if;

  return new;
end;
$$;

comment on function public.validar_hierarquia_plano_contas() is 'Trigger function que valida a hierarquia do plano de contas para evitar ciclos. Um ciclo ocorre quando uma conta é definida como filha de um de seus próprios descendentes, criando uma referência circular infinita.';

-- Trigger para validar hierarquia antes de inserir/atualizar
create trigger trigger_validar_hierarquia_plano_contas
  before insert or update of conta_pai_id on public.plano_contas
  for each row
  when (new.conta_pai_id is not null)
  execute function public.validar_hierarquia_plano_contas();

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------

alter table public.plano_contas enable row level security;

-- Política para service role (acesso total)
create policy "Service role tem acesso total ao plano de contas"
  on public.plano_contas
  for all
  to service_role
  using (true)
  with check (true);

-- Política para usuários autenticados (somente leitura)
create policy "Usuários autenticados podem visualizar plano de contas"
  on public.plano_contas
  for select
  to authenticated
  using (true);

-- Política para inserção por usuários autenticados (opcional - pode ser restrito via permissões)
create policy "Usuários autenticados podem inserir no plano de contas"
  on public.plano_contas
  for insert
  to authenticated
  with check (true);

-- Política para atualização por usuários autenticados
create policy "Usuários autenticados podem atualizar plano de contas"
  on public.plano_contas
  for update
  to authenticated
  using (true)
  with check (true);

-- =====================================================
-- From: 27_centros_custo.sql
-- =====================================================

-- ============================================================================
-- Schema: Centros de Custo
-- Sistema de Gestão Financeira (SGF)
-- ============================================================================
-- Centros de custo para rastreamento de despesas e receitas por departamento,
-- projeto ou área do escritório.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabela: centros_custo
-- ----------------------------------------------------------------------------
-- Centros de custo com estrutura hierárquica opcional. Permitem acompanhar
-- gastos e receitas por área do escritório (Administrativo, Judicial, etc.).

create table public.centros_custo (
  id bigint generated always as identity primary key,

  -- Identificação
  codigo text not null,
  nome text not null,
  descricao text,

  -- Hierarquia
  centro_pai_id bigint references public.centros_custo(id) on delete restrict,

  -- Responsável
  responsavel_id bigint references public.usuarios(id),

  -- Status
  ativo boolean not null default true,

  -- Auditoria
  created_by bigint references public.usuarios(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- Constraints
  constraint centros_custo_codigo_unique unique (codigo),
  constraint centros_custo_sem_auto_referencia_check check (centro_pai_id != id)
);

-- Comentário da tabela
comment on table public.centros_custo is 'Centros de custo para rastreamento financeiro por departamento ou área. Permitem análise de gastos e receitas segmentada por unidade de negócio, projeto ou setor do escritório. Estrutura hierárquica opcional.';

-- Comentários das colunas
comment on column public.centros_custo.id is 'Identificador único do centro de custo';
comment on column public.centros_custo.codigo is 'Código único do centro de custo (ex: ADM, JUD, MKT). Recomenda-se usar siglas curtas e padronizadas.';
comment on column public.centros_custo.nome is 'Nome descritivo do centro de custo (ex: Administrativo, Judicial, Marketing)';
comment on column public.centros_custo.descricao is 'Descrição detalhada do propósito e escopo do centro de custo';
comment on column public.centros_custo.centro_pai_id is 'Referência ao centro de custo pai na hierarquia. NULL para centros de primeiro nível.';
comment on column public.centros_custo.responsavel_id is 'Usuário responsável pelo controle orçamentário do centro de custo';
comment on column public.centros_custo.ativo is 'Se false, o centro de custo não aparece em seleções e não pode receber novos lançamentos';
comment on column public.centros_custo.created_by is 'Usuário que criou o registro';
comment on column public.centros_custo.created_at is 'Data e hora de criação do registro';
comment on column public.centros_custo.updated_at is 'Data e hora da última atualização';

-- ----------------------------------------------------------------------------
-- Índices
-- ----------------------------------------------------------------------------

create index idx_centros_custo_codigo on public.centros_custo (codigo);
comment on index public.idx_centros_custo_codigo is 'Índice para busca rápida por código do centro de custo';

create index idx_centros_custo_responsavel on public.centros_custo (responsavel_id);
comment on index public.idx_centros_custo_responsavel is 'Índice para listar centros de custo por responsável';

create index idx_centros_custo_ativo on public.centros_custo (ativo);
comment on index public.idx_centros_custo_ativo is 'Índice para filtrar apenas centros de custo ativos';

create index idx_centros_custo_pai on public.centros_custo (centro_pai_id);
comment on index public.idx_centros_custo_pai is 'Índice para navegação hierárquica (buscar filhos de um centro pai)';

-- ----------------------------------------------------------------------------
-- Trigger: Atualizar updated_at automaticamente
-- ----------------------------------------------------------------------------

create trigger update_centros_custo_updated_at
  before update on public.centros_custo
  for each row
  execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Function: validar_hierarquia_centros_custo
-- ----------------------------------------------------------------------------
-- Valida que a atribuição de centro_pai_id não cria ciclos na hierarquia.
-- Um ciclo ocorre quando um ancestral é definido como filho de um descendente.

create or replace function public.validar_hierarquia_centros_custo()
returns trigger
language plpgsql
security invoker
as $$
declare
  v_ancestral_id bigint;
begin
  -- Se não há centro pai, não há risco de ciclo
  if new.centro_pai_id is null then
    return new;
  end if;

  -- Verifica se o novo pai é descendente do registro atual (o que criaria um ciclo)
  -- Percorre a hierarquia a partir do novo pai até encontrar o registro atual ou chegar à raiz
  with recursive ancestrais as (
    -- Começa com o novo pai proposto
    select id, centro_pai_id, 1 as nivel
    from public.centros_custo
    where id = new.centro_pai_id

    union all

    -- Sobe na hierarquia
    select c.id, c.centro_pai_id, a.nivel + 1
    from public.centros_custo c
    join ancestrais a on c.id = a.centro_pai_id
    where a.nivel < 100 -- Limite de segurança para evitar loops infinitos
  )
  select id into v_ancestral_id
  from ancestrais
  where id = new.id
  limit 1;

  -- Se encontrou o registro atual na cadeia de ancestrais, temos um ciclo
  if v_ancestral_id is not null then
    raise exception 'Operação criaria ciclo na hierarquia de centros de custo. O centro "%" (ID %) não pode ter como pai o centro ID % pois isso criaria uma referência circular.',
      new.nome, new.id, new.centro_pai_id;
  end if;

  return new;
end;
$$;

comment on function public.validar_hierarquia_centros_custo() is 'Trigger function que valida a hierarquia de centros de custo para evitar ciclos. Um ciclo ocorre quando um centro é definido como filho de um de seus próprios descendentes, criando uma referência circular infinita.';

-- Trigger para validar hierarquia antes de inserir/atualizar
create trigger trigger_validar_hierarquia_centros_custo
  before insert or update of centro_pai_id on public.centros_custo
  for each row
  when (new.centro_pai_id is not null)
  execute function public.validar_hierarquia_centros_custo();

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------

alter table public.centros_custo enable row level security;

-- Política para service role (acesso total)
create policy "Service role tem acesso total aos centros de custo"
  on public.centros_custo
  for all
  to service_role
  using (true)
  with check (true);

-- Política para usuários autenticados (somente leitura)
create policy "Usuários autenticados podem visualizar centros de custo"
  on public.centros_custo
  for select
  to authenticated
  using (true);

-- Política para inserção por usuários autenticados
create policy "Usuários autenticados podem inserir centros de custo"
  on public.centros_custo
  for insert
  to authenticated
  with check (true);

-- Política para atualização por usuários autenticados
create policy "Usuários autenticados podem atualizar centros de custo"
  on public.centros_custo
  for update
  to authenticated
  using (true)
  with check (true);

-- =====================================================
-- From: 28_contas_bancarias.sql
-- =====================================================

-- ============================================================================
-- Schema: Contas Bancárias
-- Sistema de Gestão Financeira (SGF)
-- ============================================================================
-- Cadastro de contas bancárias e caixas do escritório para controle de saldos
-- e movimentações financeiras.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabela: contas_bancarias
-- ----------------------------------------------------------------------------
-- Contas bancárias (corrente, poupança, investimento) e caixas físicos do
-- escritório. O saldo_atual é atualizado automaticamente via trigger quando
-- lançamentos são confirmados.

create table public.contas_bancarias (
  id bigint generated always as identity primary key,

  -- Identificação
  nome text not null,
  tipo public.tipo_conta_bancaria not null,

  -- Dados bancários
  banco_codigo text,
  banco_nome text,
  agencia text,
  numero_conta text,
  digito_conta text,
  pix_chave text,

  -- Saldos
  saldo_inicial numeric(15,2) not null default 0,
  saldo_atual numeric(15,2) not null default 0,
  data_saldo_inicial date not null,

  -- Vinculação contábil
  conta_contabil_id bigint references public.plano_contas(id),

  -- Informações adicionais
  observacoes text,

  -- Status
  status public.status_conta_bancaria not null default 'ativa',
  ativo boolean not null default true,

  -- Auditoria
  created_by bigint references public.usuarios(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Comentário da tabela
comment on table public.contas_bancarias is 'Contas bancárias e caixas do escritório. Inclui contas correntes, poupanças, investimentos e caixas físicos. O saldo_atual é atualizado automaticamente quando lançamentos são confirmados. Pode ser vinculada a uma conta do plano de contas para integração contábil.';

-- Comentários das colunas
comment on column public.contas_bancarias.id is 'Identificador único da conta bancária';
comment on column public.contas_bancarias.nome is 'Nome identificador da conta (ex: Banco do Brasil - CC 12345-6, Caixa Principal)';
comment on column public.contas_bancarias.tipo is 'Tipo da conta: corrente, poupanca, investimento ou caixa (dinheiro em espécie)';
comment on column public.contas_bancarias.banco_codigo is 'Código COMPE/ISPB do banco (ex: 001 para Banco do Brasil, 341 para Itaú)';
comment on column public.contas_bancarias.banco_nome is 'Nome do banco (ex: Banco do Brasil, Itaú Unibanco)';
comment on column public.contas_bancarias.agencia is 'Número da agência sem dígito verificador';
comment on column public.contas_bancarias.numero_conta is 'Número da conta sem dígito verificador';
comment on column public.contas_bancarias.digito_conta is 'Dígito verificador da conta';
comment on column public.contas_bancarias.pix_chave is 'Chave PIX cadastrada para esta conta (CPF, CNPJ, e-mail, telefone ou aleatória)';
comment on column public.contas_bancarias.saldo_inicial is 'Saldo inicial da conta na data de cadastro. Base para cálculo do saldo atual.';
comment on column public.contas_bancarias.saldo_atual is 'Saldo atual da conta. Atualizado automaticamente por trigger ao confirmar lançamentos.';
comment on column public.contas_bancarias.data_saldo_inicial is 'Data de referência do saldo inicial. Lançamentos anteriores a esta data não são considerados.';
comment on column public.contas_bancarias.conta_contabil_id is 'Conta do plano de contas vinculada. Permite integração com contabilidade.';
comment on column public.contas_bancarias.observacoes is 'Observações adicionais sobre a conta';
comment on column public.contas_bancarias.status is 'Status da conta: ativa, inativa ou encerrada';
comment on column public.contas_bancarias.ativo is 'Se false, a conta não aparece em seleções para novos lançamentos';
comment on column public.contas_bancarias.created_by is 'Usuário que criou o registro';
comment on column public.contas_bancarias.created_at is 'Data e hora de criação do registro';
comment on column public.contas_bancarias.updated_at is 'Data e hora da última atualização';

-- ----------------------------------------------------------------------------
-- Índices
-- ----------------------------------------------------------------------------

create index idx_contas_bancarias_tipo on public.contas_bancarias (tipo);
comment on index public.idx_contas_bancarias_tipo is 'Índice para filtrar contas por tipo (corrente, poupança, etc.)';

create index idx_contas_bancarias_status on public.contas_bancarias (status);
comment on index public.idx_contas_bancarias_status is 'Índice para filtrar contas por status';

create index idx_contas_bancarias_ativo on public.contas_bancarias (ativo);
comment on index public.idx_contas_bancarias_ativo is 'Índice para filtrar apenas contas ativas';

create index idx_contas_bancarias_conta_contabil on public.contas_bancarias (conta_contabil_id);
comment on index public.idx_contas_bancarias_conta_contabil is 'Índice para buscar conta bancária por conta contábil vinculada';

-- ----------------------------------------------------------------------------
-- Trigger: Atualizar updated_at automaticamente
-- ----------------------------------------------------------------------------

create trigger update_contas_bancarias_updated_at
  before update on public.contas_bancarias
  for each row
  execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------

alter table public.contas_bancarias enable row level security;

-- Política para service role (acesso total)
create policy "Service role tem acesso total às contas bancárias"
  on public.contas_bancarias
  for all
  to service_role
  using (true)
  with check (true);

-- Política para usuários autenticados (somente leitura)
create policy "Usuários autenticados podem visualizar contas bancárias"
  on public.contas_bancarias
  for select
  to authenticated
  using (true);

-- Política para inserção por usuários autenticados
create policy "Usuários autenticados podem inserir contas bancárias"
  on public.contas_bancarias
  for insert
  to authenticated
  with check (true);

-- Política para atualização por usuários autenticados
create policy "Usuários autenticados podem atualizar contas bancárias"
  on public.contas_bancarias
  for update
  to authenticated
  using (true)
  with check (true);

-- =====================================================
-- From: 29_lancamentos_financeiros.sql
-- =====================================================

-- ============================================================================
-- Schema: Lançamentos Financeiros
-- Sistema de Gestão Financeira (SGF)
-- ============================================================================
-- Lançamentos financeiros (receitas, despesas, transferências) com integração
-- a clientes, contratos, acordos judiciais e outras entidades do sistema.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabela: lancamentos_financeiros
-- ----------------------------------------------------------------------------
-- Lançamentos financeiros do escritório. Podem ser manuais, originados de
-- acordos judiciais, folha de pagamento, importação bancária ou recorrentes.
-- Suporta transferências entre contas com lançamento de contrapartida.

create table public.lancamentos_financeiros (
  id bigint generated always as identity primary key,

  -- Tipo e identificação
  tipo public.tipo_lancamento not null,
  descricao text not null,
  valor numeric(15,2) not null,

  -- Datas
  data_lancamento date not null,
  data_competencia date not null,
  data_vencimento date,
  data_efetivacao timestamp with time zone,

  -- Status e origem
  status public.status_lancamento not null default 'pendente',
  origem public.origem_lancamento not null,
  forma_pagamento public.forma_pagamento_financeiro,

  -- Contas e classificação
  conta_bancaria_id bigint references public.contas_bancarias(id),
  conta_contabil_id bigint not null references public.plano_contas(id),
  centro_custo_id bigint references public.centros_custo(id),

  -- Categorização adicional
  categoria text,
  documento text,
  observacoes text,

  -- Dados flexíveis
  anexos jsonb default '[]'::jsonb,
  dados_adicionais jsonb default '{}'::jsonb,

  -- Relacionamentos com outras entidades
  cliente_id bigint references public.clientes(id),
  contrato_id bigint references public.contratos(id),
  acordo_condenacao_id bigint references public.acordos_condenacoes(id),
  parcela_id bigint references public.parcelas(id),
  usuario_id bigint references public.usuarios(id),

  -- Transferências (quando tipo = 'transferencia')
  conta_destino_id bigint references public.contas_bancarias(id),
  lancamento_contrapartida_id bigint references public.lancamentos_financeiros(id),

  -- Recorrência
  recorrente boolean not null default false,
  frequencia_recorrencia text,
  lancamento_origem_id bigint references public.lancamentos_financeiros(id),

  -- Auditoria
  created_by bigint references public.usuarios(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- Constraints
  constraint lancamentos_valor_positivo check (valor > 0),
  constraint lancamentos_transferencia_destino check (
    (tipo = 'transferencia' and conta_destino_id is not null) or
    (tipo != 'transferencia')
  ),
  constraint lancamentos_confirmado_efetivado check (
    (status = 'confirmado' and data_efetivacao is not null) or
    (status != 'confirmado')
  ),
  constraint lancamentos_frequencia_valida check (
    frequencia_recorrencia is null or
    frequencia_recorrencia in ('mensal', 'trimestral', 'semestral', 'anual')
  )
);

-- Comentário da tabela
comment on table public.lancamentos_financeiros is 'Lançamentos financeiros do escritório. Registra todas as movimentações: receitas, despesas, transferências entre contas, aplicações e resgates. Integra-se com acordos judiciais, contratos, folha de pagamento e importação bancária. Suporta lançamentos recorrentes com geração automática.';

-- Comentários das colunas
comment on column public.lancamentos_financeiros.id is 'Identificador único do lançamento';
comment on column public.lancamentos_financeiros.tipo is 'Tipo do lançamento: receita, despesa, transferencia, aplicacao ou resgate';
comment on column public.lancamentos_financeiros.descricao is 'Descrição do lançamento (ex: Honorários processo 0001234-56.2024, Aluguel Jan/2025)';
comment on column public.lancamentos_financeiros.valor is 'Valor do lançamento. Sempre positivo; o tipo indica se é entrada ou saída.';
comment on column public.lancamentos_financeiros.data_lancamento is 'Data em que o lançamento foi registrado no sistema';
comment on column public.lancamentos_financeiros.data_competencia is 'Data de competência contábil. Usada para DRE e relatórios gerenciais.';
comment on column public.lancamentos_financeiros.data_vencimento is 'Data de vencimento para contas a pagar/receber. NULL para lançamentos à vista.';
comment on column public.lancamentos_financeiros.data_efetivacao is 'Data e hora em que o pagamento/recebimento foi efetivado. Preenchido quando status = confirmado.';
comment on column public.lancamentos_financeiros.status is 'Status do lançamento: pendente, confirmado, cancelado ou estornado';
comment on column public.lancamentos_financeiros.origem is 'Origem do lançamento: manual, acordo_judicial, contrato, folha_pagamento, importacao_bancaria ou recorrente';
comment on column public.lancamentos_financeiros.forma_pagamento is 'Forma de pagamento/recebimento: dinheiro, pix, boleto, transferência, etc.';
comment on column public.lancamentos_financeiros.conta_bancaria_id is 'Conta bancária de origem (para saídas) ou destino (para entradas)';
comment on column public.lancamentos_financeiros.conta_contabil_id is 'Conta do plano de contas. Deve ser uma conta analítica que aceita lançamentos.';
comment on column public.lancamentos_financeiros.centro_custo_id is 'Centro de custo para rastreamento departamental';
comment on column public.lancamentos_financeiros.categoria is 'Categoria adicional para classificação (ex: Aluguel, Salários, Custas Processuais)';
comment on column public.lancamentos_financeiros.documento is 'Número do documento fiscal ou comprovante (nota fiscal, recibo, etc.)';
comment on column public.lancamentos_financeiros.observacoes is 'Observações adicionais sobre o lançamento';
comment on column public.lancamentos_financeiros.anexos is 'Array JSON com paths de arquivos anexados (comprovantes, notas fiscais)';
comment on column public.lancamentos_financeiros.dados_adicionais is 'Dados extras em formato JSON (número da parcela, informações de importação, etc.)';
comment on column public.lancamentos_financeiros.cliente_id is 'Cliente relacionado ao lançamento (quando aplicável)';
comment on column public.lancamentos_financeiros.contrato_id is 'Contrato relacionado ao lançamento (quando aplicável)';
comment on column public.lancamentos_financeiros.acordo_condenacao_id is 'Acordo/condenação que originou o lançamento (quando origem = acordo_judicial)';
comment on column public.lancamentos_financeiros.parcela_id is 'Parcela específica do acordo que originou o lançamento';
comment on column public.lancamentos_financeiros.usuario_id is 'Usuário relacionado (ex: funcionário em lançamento de salário)';
comment on column public.lancamentos_financeiros.conta_destino_id is 'Conta de destino para transferências entre contas';
comment on column public.lancamentos_financeiros.lancamento_contrapartida_id is 'Lançamento espelho criado automaticamente em transferências';
comment on column public.lancamentos_financeiros.recorrente is 'Se true, o lançamento é base para geração automática de recorrentes';
comment on column public.lancamentos_financeiros.frequencia_recorrencia is 'Frequência de geração: mensal, trimestral, semestral ou anual';
comment on column public.lancamentos_financeiros.lancamento_origem_id is 'Lançamento que originou este (quando gerado automaticamente de recorrente)';
comment on column public.lancamentos_financeiros.created_by is 'Usuário que criou o registro';
comment on column public.lancamentos_financeiros.created_at is 'Data e hora de criação do registro';
comment on column public.lancamentos_financeiros.updated_at is 'Data e hora da última atualização';

-- ----------------------------------------------------------------------------
-- Índices
-- ----------------------------------------------------------------------------

create index idx_lancamentos_tipo on public.lancamentos_financeiros (tipo);
comment on index public.idx_lancamentos_tipo is 'Índice para filtrar lançamentos por tipo';

create index idx_lancamentos_status on public.lancamentos_financeiros (status);
comment on index public.idx_lancamentos_status is 'Índice para filtrar lançamentos por status';

create index idx_lancamentos_origem on public.lancamentos_financeiros (origem);
comment on index public.idx_lancamentos_origem is 'Índice para filtrar lançamentos por origem';

create index idx_lancamentos_data_lancamento on public.lancamentos_financeiros (data_lancamento);
comment on index public.idx_lancamentos_data_lancamento is 'Índice para buscar lançamentos por data de registro';

create index idx_lancamentos_data_competencia on public.lancamentos_financeiros (data_competencia);
comment on index public.idx_lancamentos_data_competencia is 'Índice para relatórios por competência (DRE, balancetes)';

create index idx_lancamentos_data_vencimento on public.lancamentos_financeiros (data_vencimento);
comment on index public.idx_lancamentos_data_vencimento is 'Índice para controle de contas a pagar/receber por vencimento';

create index idx_lancamentos_conta_bancaria on public.lancamentos_financeiros (conta_bancaria_id);
comment on index public.idx_lancamentos_conta_bancaria is 'Índice para listar movimentações de uma conta bancária';

create index idx_lancamentos_conta_contabil on public.lancamentos_financeiros (conta_contabil_id);
comment on index public.idx_lancamentos_conta_contabil is 'Índice para relatórios por conta contábil';

create index idx_lancamentos_centro_custo on public.lancamentos_financeiros (centro_custo_id);
comment on index public.idx_lancamentos_centro_custo is 'Índice para relatórios por centro de custo';

create index idx_lancamentos_cliente on public.lancamentos_financeiros (cliente_id);
comment on index public.idx_lancamentos_cliente is 'Índice para listar lançamentos de um cliente';

create index idx_lancamentos_contrato on public.lancamentos_financeiros (contrato_id);
comment on index public.idx_lancamentos_contrato is 'Índice para listar lançamentos de um contrato';

create index idx_lancamentos_acordo on public.lancamentos_financeiros (acordo_condenacao_id);
comment on index public.idx_lancamentos_acordo is 'Índice para listar lançamentos de um acordo/condenação';

create index idx_lancamentos_parcela on public.lancamentos_financeiros (parcela_id);
comment on index public.idx_lancamentos_parcela is 'Índice para buscar lançamento de uma parcela específica';

create index idx_lancamentos_recorrente on public.lancamentos_financeiros (recorrente) where recorrente = true;
comment on index public.idx_lancamentos_recorrente is 'Índice parcial para listar apenas lançamentos recorrentes';

create index idx_lancamentos_anexos on public.lancamentos_financeiros using gin (anexos);
comment on index public.idx_lancamentos_anexos is 'Índice GIN para busca em anexos JSON';

create index idx_lancamentos_dados_adicionais on public.lancamentos_financeiros using gin (dados_adicionais);
comment on index public.idx_lancamentos_dados_adicionais is 'Índice GIN para busca em dados adicionais JSON';

-- ----------------------------------------------------------------------------
-- Trigger: Atualizar updated_at automaticamente
-- ----------------------------------------------------------------------------

create trigger update_lancamentos_financeiros_updated_at
  before update on public.lancamentos_financeiros
  for each row
  execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------

alter table public.lancamentos_financeiros enable row level security;

-- Política para service role (acesso total)
create policy "Service role tem acesso total aos lançamentos financeiros"
  on public.lancamentos_financeiros
  for all
  to service_role
  using (true)
  with check (true);

-- Política para usuários autenticados (somente leitura)
create policy "Usuários autenticados podem visualizar lançamentos"
  on public.lancamentos_financeiros
  for select
  to authenticated
  using (true);

-- Política para inserção por usuários autenticados
create policy "Usuários autenticados podem inserir lançamentos"
  on public.lancamentos_financeiros
  for insert
  to authenticated
  with check (true);

-- Política para atualização por usuários autenticados
create policy "Usuários autenticados podem atualizar lançamentos"
  on public.lancamentos_financeiros
  for update
  to authenticated
  using (true)
  with check (true);

-- =====================================================
-- From: 30_salarios.sql
-- =====================================================

-- ============================================================================
-- Schema: Salários e Folha de Pagamento
-- Sistema de Gestão Financeira (SGF)
-- ============================================================================
-- Gestão de salários fixos mensais e folhas de pagamento do escritório.
-- Integra-se com lançamentos financeiros para controle de despesas.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabela: salarios
-- ----------------------------------------------------------------------------
-- Salários fixos mensais dos usuários (funcionários). Mantém histórico de
-- alterações salariais através da vigência.

create table public.salarios (
  id bigint generated always as identity primary key,

  -- Funcionário
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  cargo_id bigint references public.cargos(id),

  -- Valor
  salario_bruto numeric(15,2) not null,

  -- Vigência
  data_inicio_vigencia date not null,
  data_fim_vigencia date,

  -- Informações adicionais
  observacoes text,

  -- Status
  ativo boolean not null default true,

  -- Auditoria
  created_by bigint references public.usuarios(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- Constraints
  constraint salarios_valor_positivo check (salario_bruto > 0),
  constraint salarios_vigencia_valida check (
    data_fim_vigencia is null or data_fim_vigencia > data_inicio_vigencia
  ),
  constraint salarios_usuario_data_inicio_unique unique (usuario_id, data_inicio_vigencia)
);

-- Comentário da tabela
comment on table public.salarios is 'Salários fixos mensais dos funcionários do escritório. Mantém histórico de alterações salariais através do campo de vigência. Um funcionário pode ter múltiplos registros, mas apenas um ativo por período.';

-- Comentários das colunas
comment on column public.salarios.id is 'Identificador único do registro de salário';
comment on column public.salarios.usuario_id is 'Funcionário titular do salário';
comment on column public.salarios.cargo_id is 'Cargo associado ao salário (opcional)';
comment on column public.salarios.salario_bruto is 'Valor bruto do salário mensal';
comment on column public.salarios.data_inicio_vigencia is 'Data de início da vigência deste salário';
comment on column public.salarios.data_fim_vigencia is 'Data de fim da vigência. NULL indica salário atual/vigente.';
comment on column public.salarios.observacoes is 'Observações sobre o salário (motivo de alteração, etc.)';
comment on column public.salarios.ativo is 'Se false, o registro está inativo';
comment on column public.salarios.created_by is 'Usuário que criou o registro';
comment on column public.salarios.created_at is 'Data e hora de criação do registro';
comment on column public.salarios.updated_at is 'Data e hora da última atualização';

-- ----------------------------------------------------------------------------
-- Índices para salarios
-- ----------------------------------------------------------------------------

create index idx_salarios_usuario on public.salarios (usuario_id);
comment on index public.idx_salarios_usuario is 'Índice para listar salários de um funcionário';

create index idx_salarios_cargo on public.salarios (cargo_id);
comment on index public.idx_salarios_cargo is 'Índice para listar salários por cargo';

create index idx_salarios_vigencia on public.salarios (data_inicio_vigencia, data_fim_vigencia);
comment on index public.idx_salarios_vigencia is 'Índice para buscar salário vigente em determinada data';

create index idx_salarios_ativo on public.salarios (ativo);
comment on index public.idx_salarios_ativo is 'Índice para filtrar salários ativos';

-- ----------------------------------------------------------------------------
-- Trigger: Atualizar updated_at automaticamente
-- ----------------------------------------------------------------------------

create trigger update_salarios_updated_at
  before update on public.salarios
  for each row
  execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Tabela: folhas_pagamento
-- ----------------------------------------------------------------------------
-- Folhas de pagamento mensais consolidadas. Agrupa os pagamentos de todos
-- os funcionários em um período.

create table public.folhas_pagamento (
  id bigint generated always as identity primary key,

  -- Período de referência
  mes_referencia integer not null,
  ano_referencia integer not null,

  -- Datas
  data_geracao timestamp with time zone not null default now(),
  data_pagamento date,

  -- Totais
  valor_total numeric(15,2) not null default 0,

  -- Status
  status text not null default 'rascunho',

  -- Informações adicionais
  observacoes text,

  -- Auditoria
  created_by bigint references public.usuarios(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- Constraints
  constraint folhas_pagamento_mes_valido check (mes_referencia between 1 and 12),
  constraint folhas_pagamento_ano_valido check (ano_referencia >= 2020),
  constraint folhas_pagamento_status_valido check (
    status in ('rascunho', 'aprovada', 'paga', 'cancelada')
  ),
  constraint folhas_pagamento_valor_valido check (valor_total >= 0),
  constraint folhas_pagamento_periodo_unique unique (mes_referencia, ano_referencia)
);

-- Comentário da tabela
comment on table public.folhas_pagamento is 'Folhas de pagamento mensais do escritório. Consolida os pagamentos de todos os funcionários em um período. O status controla o fluxo: rascunho -> aprovada -> paga. Ao aprovar, lançamentos financeiros são gerados automaticamente.';

-- Comentários das colunas
comment on column public.folhas_pagamento.id is 'Identificador único da folha de pagamento';
comment on column public.folhas_pagamento.mes_referencia is 'Mês de referência (1 a 12)';
comment on column public.folhas_pagamento.ano_referencia is 'Ano de referência (>= 2020)';
comment on column public.folhas_pagamento.data_geracao is 'Data e hora em que a folha foi gerada';
comment on column public.folhas_pagamento.data_pagamento is 'Data prevista ou realizada do pagamento';
comment on column public.folhas_pagamento.valor_total is 'Soma de todos os itens da folha';
comment on column public.folhas_pagamento.status is 'Status da folha: rascunho, aprovada, paga ou cancelada';
comment on column public.folhas_pagamento.observacoes is 'Observações adicionais sobre a folha';
comment on column public.folhas_pagamento.created_by is 'Usuário que criou o registro';
comment on column public.folhas_pagamento.created_at is 'Data e hora de criação do registro';
comment on column public.folhas_pagamento.updated_at is 'Data e hora da última atualização';

-- ----------------------------------------------------------------------------
-- Índices para folhas_pagamento
-- ----------------------------------------------------------------------------

create index idx_folhas_pagamento_referencia on public.folhas_pagamento (ano_referencia, mes_referencia);
comment on index public.idx_folhas_pagamento_referencia is 'Índice para buscar folha por período de referência';

create index idx_folhas_pagamento_status on public.folhas_pagamento (status);
comment on index public.idx_folhas_pagamento_status is 'Índice para filtrar folhas por status';

-- ----------------------------------------------------------------------------
-- Trigger: Atualizar updated_at automaticamente
-- ----------------------------------------------------------------------------

create trigger update_folhas_pagamento_updated_at
  before update on public.folhas_pagamento
  for each row
  execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Tabela: itens_folha_pagamento
-- ----------------------------------------------------------------------------
-- Itens individuais da folha de pagamento. Um registro por funcionário
-- por folha.

create table public.itens_folha_pagamento (
  id bigint generated always as identity primary key,

  -- Vinculação
  folha_pagamento_id bigint not null references public.folhas_pagamento(id) on delete cascade,
  usuario_id bigint not null references public.usuarios(id),
  salario_id bigint not null references public.salarios(id),

  -- Valores
  valor_bruto numeric(15,2) not null,

  -- Lançamento gerado
  lancamento_financeiro_id bigint references public.lancamentos_financeiros(id),

  -- Informações adicionais
  observacoes text,

  -- Auditoria
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- Constraints
  constraint itens_folha_valor_positivo check (valor_bruto > 0),
  constraint itens_folha_usuario_unique unique (folha_pagamento_id, usuario_id)
);

-- Comentário da tabela
comment on table public.itens_folha_pagamento is 'Itens individuais da folha de pagamento. Cada registro representa o pagamento de um funcionário em uma folha específica. Vincula o salário vigente usado e o lançamento financeiro gerado após aprovação.';

-- Comentários das colunas
comment on column public.itens_folha_pagamento.id is 'Identificador único do item';
comment on column public.itens_folha_pagamento.folha_pagamento_id is 'Folha de pagamento à qual pertence o item';
comment on column public.itens_folha_pagamento.usuario_id is 'Funcionário que receberá o pagamento';
comment on column public.itens_folha_pagamento.salario_id is 'Salário vigente usado como base para o cálculo';
comment on column public.itens_folha_pagamento.valor_bruto is 'Valor bruto a pagar ao funcionário';
comment on column public.itens_folha_pagamento.lancamento_financeiro_id is 'Lançamento financeiro gerado quando a folha é aprovada. NULL enquanto em rascunho.';
comment on column public.itens_folha_pagamento.observacoes is 'Observações específicas deste item';
comment on column public.itens_folha_pagamento.created_at is 'Data e hora de criação do registro';
comment on column public.itens_folha_pagamento.updated_at is 'Data e hora da última atualização';

-- ----------------------------------------------------------------------------
-- Índices para itens_folha_pagamento
-- ----------------------------------------------------------------------------

create index idx_itens_folha_folha on public.itens_folha_pagamento (folha_pagamento_id);
comment on index public.idx_itens_folha_folha is 'Índice para listar itens de uma folha';

create index idx_itens_folha_usuario on public.itens_folha_pagamento (usuario_id);
comment on index public.idx_itens_folha_usuario is 'Índice para listar pagamentos de um funcionário';

create index idx_itens_folha_lancamento on public.itens_folha_pagamento (lancamento_financeiro_id);
comment on index public.idx_itens_folha_lancamento is 'Índice para buscar item pelo lançamento gerado';

-- ----------------------------------------------------------------------------
-- Trigger: Atualizar updated_at automaticamente
-- ----------------------------------------------------------------------------

create trigger update_itens_folha_pagamento_updated_at
  before update on public.itens_folha_pagamento
  for each row
  execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------

-- RLS para salarios
alter table public.salarios enable row level security;

create policy "Service role tem acesso total aos salários"
  on public.salarios
  for all
  to service_role
  using (true)
  with check (true);

-- Usuário pode ver apenas seu próprio salário
-- Nota: Usa subquery para mapear auth.uid() (uuid) para usuarios.id (bigint) via auth_user_id
create policy "Usuário pode visualizar próprio salário"
  on public.salarios
  for select
  to authenticated
  using (usuario_id in (select id from public.usuarios where auth_user_id = (select auth.uid())));

-- RLS para folhas_pagamento
alter table public.folhas_pagamento enable row level security;

create policy "Service role tem acesso total às folhas de pagamento"
  on public.folhas_pagamento
  for all
  to service_role
  using (true)
  with check (true);

create policy "Usuários autenticados podem visualizar folhas de pagamento"
  on public.folhas_pagamento
  for select
  to authenticated
  using (true);

-- RLS para itens_folha_pagamento
alter table public.itens_folha_pagamento enable row level security;

create policy "Service role tem acesso total aos itens da folha"
  on public.itens_folha_pagamento
  for all
  to service_role
  using (true)
  with check (true);

-- Usuário pode ver apenas seu próprio item na folha
-- Nota: Usa subquery para mapear auth.uid() (uuid) para usuarios.id (bigint) via auth_user_id
create policy "Usuário pode visualizar próprio item da folha"
  on public.itens_folha_pagamento
  for select
  to authenticated
  using (usuario_id in (select id from public.usuarios where auth_user_id = (select auth.uid())));

-- =====================================================
-- From: 31_conciliacao_bancaria.sql
-- =====================================================

-- ============================================================================
-- Schema: Importação e Conciliação Bancária
-- Sistema de Gestão Financeira (SGF)
-- ============================================================================
-- Importação de extratos bancários (OFX/CSV) e conciliação automática/manual
-- com lançamentos financeiros do sistema.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabela: transacoes_bancarias_importadas
-- ----------------------------------------------------------------------------
-- Transações importadas de extratos bancários. Armazena os dados originais
-- do extrato para auditoria e permite detecção de duplicatas via hash.

create table public.transacoes_bancarias_importadas (
  id bigint generated always as identity primary key,

  -- Conta bancária
  conta_bancaria_id bigint not null references public.contas_bancarias(id),

  -- Dados da transação
  data_transacao date not null,
  data_importacao timestamp with time zone not null default now(),
  descricao text not null,
  valor numeric(15,2) not null,
  tipo_transacao text,

  -- Informações adicionais
  documento text,
  saldo_extrato numeric(15,2),

  -- Dados originais e controle
  dados_originais jsonb not null,
  hash_transacao text,
  arquivo_importacao text,

  -- Auditoria
  created_by bigint references public.usuarios(id),
  created_at timestamp with time zone not null default now(),

  -- Constraints
  constraint transacoes_importadas_tipo_valido check (
    tipo_transacao is null or tipo_transacao in ('credito', 'debito')
  )
);

-- Comentário da tabela
comment on table public.transacoes_bancarias_importadas is 'Transações importadas de extratos bancários (OFX, CSV). Armazena os dados originais do extrato para auditoria. O hash_transacao permite detectar e evitar importação de duplicatas. Cada transação pode ser conciliada com lançamentos financeiros do sistema.';

-- Comentários das colunas
comment on column public.transacoes_bancarias_importadas.id is 'Identificador único da transação importada';
comment on column public.transacoes_bancarias_importadas.conta_bancaria_id is 'Conta bancária de origem do extrato';
comment on column public.transacoes_bancarias_importadas.data_transacao is 'Data da transação no extrato bancário';
comment on column public.transacoes_bancarias_importadas.data_importacao is 'Data e hora em que o extrato foi importado no sistema';
comment on column public.transacoes_bancarias_importadas.descricao is 'Descrição da transação conforme consta no extrato';
comment on column public.transacoes_bancarias_importadas.valor is 'Valor da transa‡Æo em valor absoluto; sentido (credito/debito) indicado por tipo_transacao.';
comment on column public.transacoes_bancarias_importadas.tipo_transacao is 'Tipo da transação: credito (entrada) ou debito (saída)';
comment on column public.transacoes_bancarias_importadas.documento is 'Número do documento/cheque conforme extrato';
comment on column public.transacoes_bancarias_importadas.saldo_extrato is 'Saldo após a transação, se disponível no extrato';
comment on column public.transacoes_bancarias_importadas.dados_originais is 'Dados completos da transação conforme arquivo importado (para auditoria)';
comment on column public.transacoes_bancarias_importadas.hash_transacao is 'Hash calculado para detectar transações duplicadas (conta+data+valor+descrição)';
comment on column public.transacoes_bancarias_importadas.arquivo_importacao is 'Path ou nome do arquivo de extrato importado';
comment on column public.transacoes_bancarias_importadas.created_by is 'Usuário que realizou a importação';
comment on column public.transacoes_bancarias_importadas.created_at is 'Data e hora de criação do registro';

-- ----------------------------------------------------------------------------
-- Índices para transacoes_bancarias_importadas
-- ----------------------------------------------------------------------------

create index idx_transacoes_importadas_conta on public.transacoes_bancarias_importadas (conta_bancaria_id);
comment on index public.idx_transacoes_importadas_conta is 'Índice para listar transações de uma conta bancária';

create index idx_transacoes_importadas_data on public.transacoes_bancarias_importadas (data_transacao);
comment on index public.idx_transacoes_importadas_data is 'Índice para filtrar transações por data';

create index idx_transacoes_importadas_hash on public.transacoes_bancarias_importadas (hash_transacao);
comment on index public.idx_transacoes_importadas_hash is 'Índice para detectar duplicatas via hash';

create index idx_transacoes_importadas_dados on public.transacoes_bancarias_importadas using gin (dados_originais);
comment on index public.idx_transacoes_importadas_dados is 'Índice GIN para busca em dados originais JSON';

-- ----------------------------------------------------------------------------
-- Tabela: conciliacoes_bancarias
-- ----------------------------------------------------------------------------
-- Conciliação entre transações importadas e lançamentos financeiros do sistema.
-- Suporta conciliação automática (por similaridade) e manual.

create table public.conciliacoes_bancarias (
  id bigint generated always as identity primary key,

  -- Vinculação
  transacao_importada_id bigint not null references public.transacoes_bancarias_importadas(id) on delete cascade,
  lancamento_financeiro_id bigint references public.lancamentos_financeiros(id) on delete set null,

  -- Status e tipo
  status public.status_conciliacao not null default 'pendente',
  tipo_conciliacao text,

  -- Score de similaridade (para conciliação automática)
  score_similaridade numeric(5,2),

  -- Informações adicionais
  observacoes text,
  dados_adicionais jsonb,

  -- Quem conciliou
  conciliado_por bigint references public.usuarios(id),
  data_conciliacao timestamp with time zone,

  -- Auditoria
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- Constraints
  constraint conciliacoes_transacao_unique unique (transacao_importada_id),
  constraint conciliacoes_tipo_valido check (
    tipo_conciliacao is null or tipo_conciliacao in ('automatica', 'manual')
  ),
  constraint conciliacoes_status_lancamento check (
    (status = 'conciliado' and lancamento_financeiro_id is not null and data_conciliacao is not null) or
    (status != 'conciliado')
  ),
  constraint conciliacoes_score_valido check (
    score_similaridade is null or (score_similaridade >= 0 and score_similaridade <= 100)
  )
);

-- Comentário da tabela
comment on table public.conciliacoes_bancarias is 'Conciliação entre transações importadas de extratos e lançamentos financeiros do sistema. Permite conciliação automática (baseada em similaridade de valores, datas e descrições) ou manual. Cada transação importada pode ter no máximo uma conciliação.';

-- Comentários das colunas
comment on column public.conciliacoes_bancarias.id is 'Identificador único da conciliação';
comment on column public.conciliacoes_bancarias.transacao_importada_id is 'Transação importada do extrato bancário';
comment on column public.conciliacoes_bancarias.lancamento_financeiro_id is 'Lançamento financeiro correspondente no sistema. NULL se não conciliado.';
comment on column public.conciliacoes_bancarias.status is 'Status da conciliação: pendente, conciliado, divergente ou ignorado';
comment on column public.conciliacoes_bancarias.tipo_conciliacao is 'Tipo de conciliação: automatica (sugestão do sistema) ou manual (usuário)';
comment on column public.conciliacoes_bancarias.score_similaridade is 'Score de similaridade (0-100) calculado para conciliação automática';
comment on column public.conciliacoes_bancarias.observacoes is 'Observações sobre a conciliação (motivo de divergência, etc.)';
comment on column public.conciliacoes_bancarias.dados_adicionais is 'Dados adicionais da conciliacao (ex.: sugestoes salvas para revisao)';
comment on column public.conciliacoes_bancarias.conciliado_por is 'Usuário que realizou a conciliação manual';
comment on column public.conciliacoes_bancarias.data_conciliacao is 'Data e hora em que a conciliação foi realizada';
comment on column public.conciliacoes_bancarias.created_at is 'Data e hora de criação do registro';
comment on column public.conciliacoes_bancarias.updated_at is 'Data e hora da última atualização';

-- ----------------------------------------------------------------------------
-- Índices para conciliacoes_bancarias
-- ----------------------------------------------------------------------------

create index idx_conciliacoes_transacao on public.conciliacoes_bancarias (transacao_importada_id);
comment on index public.idx_conciliacoes_transacao is 'Índice para buscar conciliação de uma transação';

create index idx_conciliacoes_lancamento on public.conciliacoes_bancarias (lancamento_financeiro_id);
comment on index public.idx_conciliacoes_lancamento is 'Índice para buscar conciliação de um lançamento';

create index idx_conciliacoes_status on public.conciliacoes_bancarias (status);
comment on index public.idx_conciliacoes_status is 'Índice para filtrar conciliações por status';

-- ----------------------------------------------------------------------------
-- Trigger: Atualizar updated_at automaticamente
-- ----------------------------------------------------------------------------

create trigger update_conciliacoes_bancarias_updated_at
  before update on public.conciliacoes_bancarias
  for each row
  execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------

-- RLS para transacoes_bancarias_importadas
alter table public.transacoes_bancarias_importadas enable row level security;

create policy "Service role tem acesso total às transações importadas"
  on public.transacoes_bancarias_importadas
  for all
  to service_role
  using (true)
  with check (true);

create policy "Usuários autenticados podem visualizar transações importadas"
  on public.transacoes_bancarias_importadas
  for select
  to authenticated
  using (true);

create policy "Usuários autenticados podem inserir transações importadas"
  on public.transacoes_bancarias_importadas
  for insert
  to authenticated
  with check (true);

-- RLS para conciliacoes_bancarias
alter table public.conciliacoes_bancarias enable row level security;

create policy "Service role tem acesso total às conciliações"
  on public.conciliacoes_bancarias
  for all
  to service_role
  using (true)
  with check (true);

create policy "Usuários autenticados podem visualizar conciliações"
  on public.conciliacoes_bancarias
  for select
  to authenticated
  using (true);

create policy "Usuários autenticados podem inserir conciliações"
  on public.conciliacoes_bancarias
  for insert
  to authenticated
  with check (true);

create policy "Usuários autenticados podem atualizar conciliações"
  on public.conciliacoes_bancarias
  for update
  to authenticated
  using (true)
  with check (true);

-- =====================================================
-- From: 32_orcamento.sql
-- =====================================================

-- ============================================================================
-- Schema: Orçamento
-- Sistema de Gestão Financeira (SGF)
-- ============================================================================
-- Gestão orçamentária com planejamento por conta contábil e centro de custo.
-- Permite comparação entre orçado e realizado.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabela: orcamentos
-- ----------------------------------------------------------------------------
-- Orçamentos anuais/mensais do escritório. Define período e status do
-- planejamento orçamentário.

create table public.orcamentos (
  id bigint generated always as identity primary key,

  -- Identificação
  nome text not null,
  descricao text,

  -- Período
  ano integer not null,
  periodo public.periodo_orcamento not null,
  data_inicio date not null,
  data_fim date not null,

  -- Status
  status public.status_orcamento not null default 'rascunho',

  -- Informações adicionais
  observacoes text,

  -- Auditoria
  created_by bigint references public.usuarios(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- Constraints
  constraint orcamentos_ano_valido check (ano >= 2020),
  constraint orcamentos_periodo_valido check (data_fim > data_inicio)
);

-- Comentário da tabela
comment on table public.orcamentos is 'Orçamentos do escritório. Define o planejamento financeiro para um período específico. O status controla o ciclo de vida: rascunho (elaboração) -> aprovado (validado) -> em_execucao (período corrente) -> encerrado (período finalizado). Cada orçamento tem itens detalhados por conta contábil e centro de custo.';

-- Comentários das colunas
comment on column public.orcamentos.id is 'Identificador único do orçamento';
comment on column public.orcamentos.nome is 'Nome do orçamento (ex: Orçamento 2025, Orçamento 1º Semestre 2025)';
comment on column public.orcamentos.descricao is 'Descrição detalhada do orçamento';
comment on column public.orcamentos.ano is 'Ano de referência do orçamento';
comment on column public.orcamentos.periodo is 'Período do orçamento: mensal, trimestral, semestral ou anual';
comment on column public.orcamentos.data_inicio is 'Data de início do período orçado';
comment on column public.orcamentos.data_fim is 'Data de fim do período orçado';
comment on column public.orcamentos.status is 'Status do orçamento: rascunho, aprovado, em_execucao ou encerrado';
comment on column public.orcamentos.observacoes is 'Observações adicionais sobre o orçamento';
comment on column public.orcamentos.created_by is 'Usuário que criou o registro';
comment on column public.orcamentos.created_at is 'Data e hora de criação do registro';
comment on column public.orcamentos.updated_at is 'Data e hora da última atualização';

-- ----------------------------------------------------------------------------
-- Índices para orcamentos
-- ----------------------------------------------------------------------------

create index idx_orcamentos_ano on public.orcamentos (ano);
comment on index public.idx_orcamentos_ano is 'Índice para buscar orçamentos por ano';

create index idx_orcamentos_periodo on public.orcamentos (periodo);
comment on index public.idx_orcamentos_periodo is 'Índice para filtrar orçamentos por tipo de período';

create index idx_orcamentos_status on public.orcamentos (status);
comment on index public.idx_orcamentos_status is 'Índice para filtrar orçamentos por status';

-- ----------------------------------------------------------------------------
-- Trigger: Atualizar updated_at automaticamente
-- ----------------------------------------------------------------------------

create trigger update_orcamentos_updated_at
  before update on public.orcamentos
  for each row
  execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Tabela: orcamento_itens
-- ----------------------------------------------------------------------------
-- Itens do orçamento detalhados por conta contábil e centro de custo.
-- Permite orçamento mensal ou total do período.

create table public.orcamento_itens (
  id bigint generated always as identity primary key,

  -- Vinculação
  orcamento_id bigint not null references public.orcamentos(id) on delete cascade,
  conta_contabil_id bigint not null references public.plano_contas(id),
  centro_custo_id bigint references public.centros_custo(id),

  -- Período específico (opcional)
  mes integer,

  -- Valor
  valor_orcado numeric(15,2) not null,

  -- Informações adicionais
  observacoes text,

  -- Auditoria
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- Constraints
  constraint orcamento_itens_mes_valido check (mes is null or (mes between 1 and 12)),
  constraint orcamento_itens_valor_valido check (valor_orcado >= 0),
  constraint orcamento_itens_unique unique (orcamento_id, conta_contabil_id, centro_custo_id, mes)
);

-- Comentário da tabela
comment on table public.orcamento_itens is 'Itens detalhados do orçamento. Cada item representa o valor orçado para uma combinação de conta contábil e centro de custo. O campo mês permite orçamento mensal (quando preenchido) ou total do período (quando NULL).';

-- Comentários das colunas
comment on column public.orcamento_itens.id is 'Identificador único do item';
comment on column public.orcamento_itens.orcamento_id is 'Orçamento ao qual o item pertence';
comment on column public.orcamento_itens.conta_contabil_id is 'Conta contábil do plano de contas';
comment on column public.orcamento_itens.centro_custo_id is 'Centro de custo (opcional, NULL para todos os centros)';
comment on column public.orcamento_itens.mes is 'Mês específico (1-12). NULL para orçamento total do período.';
comment on column public.orcamento_itens.valor_orcado is 'Valor orçado para a combinação conta/centro/mês';
comment on column public.orcamento_itens.observacoes is 'Observações sobre o item orçado';
comment on column public.orcamento_itens.created_at is 'Data e hora de criação do registro';
comment on column public.orcamento_itens.updated_at is 'Data e hora da última atualização';

-- ----------------------------------------------------------------------------
-- Índices para orcamento_itens
-- ----------------------------------------------------------------------------

create index idx_orcamento_itens_orcamento on public.orcamento_itens (orcamento_id);
comment on index public.idx_orcamento_itens_orcamento is 'Índice para listar itens de um orçamento';

create index idx_orcamento_itens_conta on public.orcamento_itens (conta_contabil_id);
comment on index public.idx_orcamento_itens_conta is 'Índice para buscar orçamento de uma conta contábil';

create index idx_orcamento_itens_centro on public.orcamento_itens (centro_custo_id);
comment on index public.idx_orcamento_itens_centro is 'Índice para buscar orçamento de um centro de custo';

create index idx_orcamento_itens_mes on public.orcamento_itens (mes);
comment on index public.idx_orcamento_itens_mes is 'Índice para filtrar orçamento por mês';

-- ----------------------------------------------------------------------------
-- Trigger: Atualizar updated_at automaticamente
-- ----------------------------------------------------------------------------

create trigger update_orcamento_itens_updated_at
  before update on public.orcamento_itens
  for each row
  execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------

-- RLS para orcamentos
alter table public.orcamentos enable row level security;

create policy "Service role tem acesso total aos orçamentos"
  on public.orcamentos
  for all
  to service_role
  using (true)
  with check (true);

create policy "Usuários autenticados podem visualizar orçamentos"
  on public.orcamentos
  for select
  to authenticated
  using (true);

create policy "Usuários autenticados podem inserir orçamentos"
  on public.orcamentos
  for insert
  to authenticated
  with check (true);

create policy "Usuários autenticados podem atualizar orçamentos"
  on public.orcamentos
  for update
  to authenticated
  using (true)
  with check (true);

-- RLS para orcamento_itens
alter table public.orcamento_itens enable row level security;

create policy "Service role tem acesso total aos itens de orçamento"
  on public.orcamento_itens
  for all
  to service_role
  using (true)
  with check (true);

create policy "Usuários autenticados podem visualizar itens de orçamento"
  on public.orcamento_itens
  for select
  to authenticated
  using (true);

create policy "Usuários autenticados podem inserir itens de orçamento"
  on public.orcamento_itens
  for insert
  to authenticated
  with check (true);

create policy "Usuários autenticados podem atualizar itens de orçamento"
  on public.orcamento_itens
  for update
  to authenticated
  using (true)
  with check (true);

-- =====================================================
-- From: 33_financeiro_functions.sql
-- =====================================================

-- ============================================================================
-- Schema: Functions e Triggers Auxiliares
-- Sistema de Gestão Financeira (SGF)
-- ============================================================================
-- Funções e triggers para validações, cálculos automáticos e integrações
-- entre as tabelas do módulo financeiro.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: validar_conta_aceita_lancamento
-- ----------------------------------------------------------------------------
-- Valida se a conta contábil selecionada aceita lançamentos diretos.
-- Apenas contas analíticas podem receber lançamentos.

create or replace function public.validar_conta_aceita_lancamento()
returns trigger
language plpgsql
security invoker
as $$
declare
  v_aceita_lancamento boolean;
  v_nome_conta text;
begin
  -- Busca informações da conta contábil
  select aceita_lancamento, nome
  into v_aceita_lancamento, v_nome_conta
  from public.plano_contas
  where id = new.conta_contabil_id;

  -- Valida se a conta existe
  if not found then
    raise exception 'Conta contábil com ID % não encontrada.', new.conta_contabil_id;
  end if;

  -- Valida se a conta aceita lançamentos
  if not v_aceita_lancamento then
    raise exception 'A conta contábil "%" (ID %) é sintética e não aceita lançamentos diretos. Utilize uma conta analítica.',
      v_nome_conta, new.conta_contabil_id;
  end if;

  return new;
end;
$$;

comment on function public.validar_conta_aceita_lancamento() is 'Trigger function que valida se a conta contábil selecionada aceita lançamentos. Apenas contas analíticas (aceita_lancamento = true) podem receber lançamentos financeiros diretos.';

-- Trigger para validar conta antes de inserir/atualizar lançamento
create trigger trigger_validar_conta_aceita_lancamento
  before insert or update of conta_contabil_id on public.lancamentos_financeiros
  for each row
  execute function public.validar_conta_aceita_lancamento();

-- ----------------------------------------------------------------------------
-- Function: atualizar_saldo_conta_bancaria
-- ----------------------------------------------------------------------------
-- Atualiza o saldo atual da conta bancária quando um lançamento é confirmado,
-- cancelado ou estornado.

create or replace function public.atualizar_saldo_conta_bancaria()
returns trigger
language plpgsql
security invoker
as $$
declare
  v_diferenca numeric(15,2);
begin
  -- Ignora se não há conta bancária associada
  if new.conta_bancaria_id is null then
    return new;
  end if;

  -- Calcula a diferença de saldo baseada na mudança de status
  v_diferenca := 0;

  -- Lançamento sendo confirmado (de qualquer status para confirmado)
  if new.status = 'confirmado' and (old is null or old.status != 'confirmado') then
    case new.tipo
      when 'receita' then v_diferenca := new.valor;
      when 'despesa' then v_diferenca := -new.valor;
      when 'transferencia' then v_diferenca := -new.valor; -- Saída da conta origem
      when 'aplicacao' then v_diferenca := -new.valor; -- Saída para investimento
      when 'resgate' then v_diferenca := new.valor; -- Entrada de resgate
    end case;
  end if;

  -- Lançamento sendo cancelado ou estornado (de confirmado para outro status)
  if old is not null and old.status = 'confirmado' and new.status in ('cancelado', 'estornado') then
    case new.tipo
      when 'receita' then v_diferenca := -new.valor;
      when 'despesa' then v_diferenca := new.valor;
      when 'transferencia' then v_diferenca := new.valor;
      when 'aplicacao' then v_diferenca := new.valor;
      when 'resgate' then v_diferenca := -new.valor;
    end case;
  end if;

  -- Atualiza o saldo da conta bancária
  if v_diferenca != 0 then
    update public.contas_bancarias
    set saldo_atual = saldo_atual + v_diferenca
    where id = new.conta_bancaria_id;
  end if;

  return new;
end;
$$;

comment on function public.atualizar_saldo_conta_bancaria() is 'Trigger function que atualiza o saldo_atual da conta bancária quando o status do lançamento muda. Receitas aumentam o saldo, despesas diminuem. Transferências diminuem na conta origem.';

-- Trigger para atualizar saldo após mudança de status
create trigger trigger_atualizar_saldo_conta_bancaria
  after insert or update of status on public.lancamentos_financeiros
  for each row
  execute function public.atualizar_saldo_conta_bancaria();

-- ----------------------------------------------------------------------------
-- Function: atualizar_saldo_conta_destino_transferencia
-- ----------------------------------------------------------------------------
-- Atualiza o saldo da conta destino quando uma transferência é confirmada.

create or replace function public.atualizar_saldo_conta_destino_transferencia()
returns trigger
language plpgsql
security invoker
as $$
begin
  -- Ignora se não é transferência ou não tem conta destino
  if new.tipo != 'transferencia' or new.conta_destino_id is null then
    return new;
  end if;

  -- Transferência sendo confirmada
  if new.status = 'confirmado' and (old is null or old.status != 'confirmado') then
    update public.contas_bancarias
    set saldo_atual = saldo_atual + new.valor
    where id = new.conta_destino_id;
  end if;

  -- Transferência sendo cancelada ou estornada
  if old is not null and old.status = 'confirmado' and new.status in ('cancelado', 'estornado') then
    update public.contas_bancarias
    set saldo_atual = saldo_atual - new.valor
    where id = new.conta_destino_id;
  end if;

  return new;
end;
$$;

comment on function public.atualizar_saldo_conta_destino_transferencia() is 'Trigger function que atualiza o saldo da conta destino quando uma transferência é confirmada ou cancelada.';

-- Trigger para atualizar saldo da conta destino
create trigger trigger_atualizar_saldo_conta_destino
  after insert or update of status on public.lancamentos_financeiros
  for each row
  execute function public.atualizar_saldo_conta_destino_transferencia();

-- ----------------------------------------------------------------------------
-- Function: calcular_saldo_periodo
-- ----------------------------------------------------------------------------
-- Calcula o saldo de uma conta bancária em um período específico.

create or replace function public.calcular_saldo_periodo(
  p_conta_bancaria_id bigint,
  p_data_inicio date,
  p_data_fim date
)
returns table (
  saldo_inicial numeric(15,2),
  total_entradas numeric(15,2),
  total_saidas numeric(15,2),
  saldo_final numeric(15,2)
)
language plpgsql
security invoker
as $$
declare
  v_saldo_inicial_conta numeric(15,2);
  v_data_saldo_inicial date;
  v_entradas_antes numeric(15,2);
  v_saidas_antes numeric(15,2);
begin
  -- Busca dados da conta
  select saldo_inicial, data_saldo_inicial
  into v_saldo_inicial_conta, v_data_saldo_inicial
  from public.contas_bancarias
  where id = p_conta_bancaria_id;

  if not found then
    raise exception 'Conta bancária com ID % não encontrada.', p_conta_bancaria_id;
  end if;

  -- Calcula movimentações antes do período para obter saldo inicial
  select
    coalesce(sum(case when l.tipo in ('receita', 'resgate') then l.valor else 0 end), 0) +
    coalesce(sum(case when l.tipo = 'transferencia' and l.conta_destino_id = p_conta_bancaria_id then l.valor else 0 end), 0),
    coalesce(sum(case when l.tipo in ('despesa', 'aplicacao') then l.valor else 0 end), 0) +
    coalesce(sum(case when l.tipo = 'transferencia' and l.conta_bancaria_id = p_conta_bancaria_id then l.valor else 0 end), 0)
  into v_entradas_antes, v_saidas_antes
  from public.lancamentos_financeiros l
  where l.status = 'confirmado'
    and l.data_efetivacao::date < p_data_inicio
    and l.data_efetivacao::date >= v_data_saldo_inicial
    and (l.conta_bancaria_id = p_conta_bancaria_id or l.conta_destino_id = p_conta_bancaria_id);

  -- Saldo inicial do período
  saldo_inicial := v_saldo_inicial_conta + coalesce(v_entradas_antes, 0) - coalesce(v_saidas_antes, 0);

  -- Calcula movimentações do período
  select
    coalesce(sum(case when l.tipo in ('receita', 'resgate') then l.valor else 0 end), 0) +
    coalesce(sum(case when l.tipo = 'transferencia' and l.conta_destino_id = p_conta_bancaria_id then l.valor else 0 end), 0),
    coalesce(sum(case when l.tipo in ('despesa', 'aplicacao') then l.valor else 0 end), 0) +
    coalesce(sum(case when l.tipo = 'transferencia' and l.conta_bancaria_id = p_conta_bancaria_id then l.valor else 0 end), 0)
  into total_entradas, total_saidas
  from public.lancamentos_financeiros l
  where l.status = 'confirmado'
    and l.data_efetivacao::date between p_data_inicio and p_data_fim
    and (l.conta_bancaria_id = p_conta_bancaria_id or l.conta_destino_id = p_conta_bancaria_id);

  total_entradas := coalesce(total_entradas, 0);
  total_saidas := coalesce(total_saidas, 0);
  saldo_final := saldo_inicial + total_entradas - total_saidas;

  return next;
end;
$$;

comment on function public.calcular_saldo_periodo(bigint, date, date) is 'Calcula o saldo de uma conta bancária em um período específico, retornando saldo inicial, total de entradas, total de saídas e saldo final.';

-- ----------------------------------------------------------------------------
-- Function: obter_dre
-- ----------------------------------------------------------------------------
-- Gera Demonstração de Resultado do Exercício (DRE) para um período.

create or replace function public.obter_dre(
  p_data_inicio date,
  p_data_fim date
)
returns table (
  tipo_conta public.tipo_conta_contabil,
  conta_id bigint,
  conta_codigo text,
  conta_nome text,
  valor_total numeric(15,2)
)
language plpgsql
security invoker
as $$
begin
  return query
  select
    pc.tipo_conta,
    pc.id as conta_id,
    pc.codigo as conta_codigo,
    pc.nome as conta_nome,
    coalesce(sum(l.valor), 0) as valor_total
  from public.plano_contas pc
  left join public.lancamentos_financeiros l on
    l.conta_contabil_id = pc.id
    and l.status = 'confirmado'
    and l.data_competencia between p_data_inicio and p_data_fim
  where pc.tipo_conta in ('receita', 'despesa')
    and pc.aceita_lancamento = true
  group by pc.tipo_conta, pc.id, pc.codigo, pc.nome
  having coalesce(sum(l.valor), 0) > 0
  order by pc.tipo_conta, pc.codigo;
end;
$$;

comment on function public.obter_dre(date, date) is 'Gera Demonstração de Resultado do Exercício (DRE) para um período, agrupando receitas e despesas por conta contábil analítica.';

-- ----------------------------------------------------------------------------
-- Function: obter_salario_vigente
-- ----------------------------------------------------------------------------
-- Retorna o salário vigente de um usuário em uma data específica.

create or replace function public.obter_salario_vigente(
  p_usuario_id bigint,
  p_data date default current_date
)
returns public.salarios
language plpgsql
security invoker
as $$
declare
  v_salario public.salarios;
begin
  select *
  into v_salario
  from public.salarios
  where usuario_id = p_usuario_id
    and ativo = true
    and data_inicio_vigencia <= p_data
    and (data_fim_vigencia is null or data_fim_vigencia >= p_data)
  order by data_inicio_vigencia desc
  limit 1;

  return v_salario;
end;
$$;

comment on function public.obter_salario_vigente(bigint, date) is 'Retorna o registro de salário vigente de um usuário em uma data específica. Se não informada, usa a data atual.';

-- ----------------------------------------------------------------------------
-- Function: atualizar_valor_total_folha
-- ----------------------------------------------------------------------------
-- Atualiza o valor total da folha de pagamento quando itens são modificados.

create or replace function public.atualizar_valor_total_folha()
returns trigger
language plpgsql
security invoker
as $$
declare
  v_folha_id bigint;
  v_total numeric(15,2);
begin
  -- Determina qual folha atualizar
  if tg_op = 'DELETE' then
    v_folha_id := old.folha_pagamento_id;
  else
    v_folha_id := new.folha_pagamento_id;
  end if;

  -- Recalcula o total
  select coalesce(sum(valor_bruto), 0)
  into v_total
  from public.itens_folha_pagamento
  where folha_pagamento_id = v_folha_id;

  -- Atualiza a folha
  update public.folhas_pagamento
  set valor_total = v_total
  where id = v_folha_id;

  if tg_op = 'DELETE' then
    return old;
  else
    return new;
  end if;
end;
$$;

comment on function public.atualizar_valor_total_folha() is 'Trigger function que recalcula o valor_total da folha de pagamento quando itens são inseridos, atualizados ou deletados.';

-- Trigger para atualizar valor total da folha
create trigger trigger_atualizar_valor_total_folha
  after insert or update or delete on public.itens_folha_pagamento
  for each row
  execute function public.atualizar_valor_total_folha();

-- ----------------------------------------------------------------------------
-- Function: gerar_lancamento_contrapartida_transferencia
-- ----------------------------------------------------------------------------
-- Cria automaticamente o lançamento de contrapartida quando uma transferência
-- é inserida, vinculando origem e destino via lancamento_contrapartida_id.

create or replace function public.gerar_lancamento_contrapartida_transferencia()
returns trigger
language plpgsql
security invoker
as $$
declare
  v_lancamento_contrapartida_id bigint;
begin
  -- Só processa transferências que ainda não têm contrapartida
  if new.tipo != 'transferencia' or new.lancamento_contrapartida_id is not null then
    return new;
  end if;

  -- Verifica se tem conta destino
  if new.conta_destino_id is null then
    raise exception 'Transferência requer conta_destino_id';
  end if;

  -- Cria o lançamento de contrapartida (entrada na conta destino)
  insert into public.lancamentos_financeiros (
    tipo,
    descricao,
    valor,
    data_lancamento,
    data_competencia,
    data_vencimento,
    data_efetivacao,
    status,
    origem,
    forma_pagamento,
    conta_bancaria_id,
    conta_contabil_id,
    centro_custo_id,
    categoria,
    documento,
    observacoes,
    lancamento_contrapartida_id,
    created_by,
    dados_adicionais
  ) values (
    'receita', -- Na conta destino, é uma entrada
    'Contrapartida: ' || new.descricao,
    new.valor,
    new.data_lancamento,
    new.data_competencia,
    new.data_vencimento,
    new.data_efetivacao,
    new.status,
    new.origem,
    new.forma_pagamento,
    new.conta_destino_id, -- Entra na conta destino
    new.conta_contabil_id,
    new.centro_custo_id,
    new.categoria,
    new.documento,
    'Lançamento de contrapartida gerado automaticamente para transferência ID ' || new.id,
    new.id, -- Vincula ao lançamento original
    new.created_by,
    jsonb_build_object(
      'transferencia_origem_id', new.id,
      'conta_origem_id', new.conta_bancaria_id,
      'eh_contrapartida', true
    )
  )
  returning id into v_lancamento_contrapartida_id;

  -- Atualiza o lançamento original com a referência à contrapartida
  -- Nota: Isso é feito diretamente via UPDATE para evitar loop de trigger
  update public.lancamentos_financeiros
  set lancamento_contrapartida_id = v_lancamento_contrapartida_id
  where id = new.id;

  return new;
end;
$$;

comment on function public.gerar_lancamento_contrapartida_transferencia() is 'Trigger function que cria automaticamente um lançamento de contrapartida quando uma transferência entre contas é inserida. A contrapartida representa a entrada na conta destino, vinculada ao lançamento de saída original via lancamento_contrapartida_id.';

-- Trigger para gerar contrapartida ao inserir transferência
create trigger trigger_gerar_lancamento_contrapartida_transferencia
  after insert on public.lancamentos_financeiros
  for each row
  when (new.tipo = 'transferencia' and new.lancamento_contrapartida_id is null)
  execute function public.gerar_lancamento_contrapartida_transferencia();

-- ----------------------------------------------------------------------------
-- Function: gerar_hash_transacao
-- ----------------------------------------------------------------------------
-- Gera hash para transação bancária importada (detecção de duplicatas).

create or replace function public.gerar_hash_transacao()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.hash_transacao := encode(
    sha256(
      convert_to(
        new.conta_bancaria_id::text ||
        new.data_transacao::text ||
        new.valor::text ||
        coalesce(new.descricao, ''),
        'UTF8'
      )
    ),
    'hex'
  );
  return new;
end;
$$;

comment on function public.gerar_hash_transacao() is 'Trigger function que gera hash SHA256 para transações bancárias importadas, permitindo detecção de duplicatas.';

-- Trigger para gerar hash antes de inserir transação
create trigger trigger_gerar_hash_transacao
  before insert on public.transacoes_bancarias_importadas
  for each row
  when (new.hash_transacao is null)
  execute function public.gerar_hash_transacao();

-- =====================================================
-- From: 34_financeiro_views.sql
-- =====================================================

-- ============================================================================
-- Schema: Views Financeiras
-- Sistema de Gestão Financeira (SGF)
-- ============================================================================
-- Views materializadas e regulares para consultas e relatórios financeiros.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- View Materializada: v_lancamentos_pendentes
-- ----------------------------------------------------------------------------
-- Lançamentos pendentes com detalhes de relacionamentos.
-- Atualizar periodicamente via REFRESH MATERIALIZED VIEW.

create materialized view public.v_lancamentos_pendentes as
select
  l.id,
  l.tipo,
  l.descricao,
  l.valor,
  l.data_lancamento,
  l.data_competencia,
  l.data_vencimento,
  l.status,
  l.origem,
  l.forma_pagamento,
  l.categoria,
  l.documento,
  l.observacoes,
  l.conta_bancaria_id,
  cb.nome as conta_bancaria_nome,
  l.conta_contabil_id,
  pc.codigo as conta_contabil_codigo,
  pc.nome as conta_contabil_nome,
  l.centro_custo_id,
  cc.codigo as centro_custo_codigo,
  cc.nome as centro_custo_nome,
  l.cliente_id,
  c.nome as cliente_nome,
  l.contrato_id,
  l.acordo_condenacao_id,
  l.parcela_id,
  l.usuario_id,
  u.nome_exibicao as usuario_nome,
  (l.data_vencimento - current_date) as dias_ate_vencimento,
  case
    when l.data_vencimento < current_date then 'vencido'
    when l.data_vencimento = current_date then 'vence_hoje'
    when l.data_vencimento <= current_date + 7 then 'vence_em_7_dias'
    when l.data_vencimento <= current_date + 30 then 'vence_em_30_dias'
    else 'futuro'
  end as situacao_vencimento,
  l.created_at,
  l.updated_at
from public.lancamentos_financeiros l
left join public.contas_bancarias cb on l.conta_bancaria_id = cb.id
left join public.plano_contas pc on l.conta_contabil_id = pc.id
left join public.centros_custo cc on l.centro_custo_id = cc.id
left join public.clientes c on l.cliente_id = c.id
left join public.usuarios u on l.usuario_id = u.id
where l.status = 'pendente'
order by l.data_vencimento nulls last, l.data_lancamento;

comment on materialized view public.v_lancamentos_pendentes is 'View materializada com lançamentos pendentes e seus relacionamentos. Inclui dias até vencimento e situação (vencido, vence_hoje, etc.). Atualizar via REFRESH MATERIALIZED VIEW.';

-- Índices na view materializada
create unique index idx_v_lancamentos_pendentes_id on public.v_lancamentos_pendentes (id);
create index idx_v_lancamentos_pendentes_vencimento on public.v_lancamentos_pendentes (data_vencimento);
create index idx_v_lancamentos_pendentes_tipo on public.v_lancamentos_pendentes (tipo);
create index idx_v_lancamentos_pendentes_situacao on public.v_lancamentos_pendentes (situacao_vencimento);

-- ----------------------------------------------------------------------------
-- View: v_fluxo_caixa_mensal
-- ----------------------------------------------------------------------------
-- Fluxo de caixa mensal (receitas, despesas, saldo).
-- Nota: Transferências internas não afetam o saldo líquido global, pois
-- representam apenas movimentação entre contas do próprio escritório.
-- A contrapartida gerada automaticamente anula o efeito da transferência.

create or replace view public.v_fluxo_caixa_mensal as
select
  extract(year from data_competencia)::integer as ano,
  extract(month from data_competencia)::integer as mes,
  -- Receitas: exclui contrapartidas de transferência (identificadas via dados_adicionais)
  sum(case
    when tipo = 'receita' and coalesce((dados_adicionais->>'eh_contrapartida')::boolean, false) = false
    then valor
    else 0
  end) as total_receitas,
  sum(case when tipo = 'despesa' then valor else 0 end) as total_despesas,
  -- Transferências: apenas saídas (tipo = 'transferencia'), entradas são contrapartidas
  sum(case when tipo = 'transferencia' then valor else 0 end) as total_transferencias,
  -- Saldo líquido: transferências se anulam (saída + entrada contrapartida = 0)
  -- Exclui lançamentos que são contrapartida de transferência
  sum(case
    when tipo = 'receita' and coalesce((dados_adicionais->>'eh_contrapartida')::boolean, false) = false
    then valor
    when tipo = 'despesa' then -valor
    when tipo = 'aplicacao' then -valor
    when tipo = 'resgate' then valor
    -- Transferências não afetam saldo líquido global (origem -valor, destino +valor = 0)
    else 0
  end) as saldo_liquido
from public.lancamentos_financeiros
where status = 'confirmado'
group by ano, mes
order by ano desc, mes desc;

comment on view public.v_fluxo_caixa_mensal is 'Fluxo de caixa mensal consolidado. Mostra total de receitas, despesas e saldo líquido por mês. Transferências internas são exibidas separadamente e não afetam o saldo líquido global, pois apenas movimentam valores entre contas do próprio escritório.';

-- ----------------------------------------------------------------------------
-- View: v_fluxo_caixa_diario
-- ----------------------------------------------------------------------------
-- Fluxo de caixa diário para análise detalhada.
-- Nota: Transferências internas não afetam o saldo líquido global.

create or replace view public.v_fluxo_caixa_diario as
select
  data_competencia as data,
  -- Receitas: exclui contrapartidas de transferência
  sum(case
    when tipo = 'receita' and coalesce((dados_adicionais->>'eh_contrapartida')::boolean, false) = false
    then valor
    else 0
  end) as total_receitas,
  sum(case when tipo = 'despesa' then valor else 0 end) as total_despesas,
  -- Saldo líquido: transferências não afetam (contrapartidas se anulam)
  sum(case
    when tipo = 'receita' and coalesce((dados_adicionais->>'eh_contrapartida')::boolean, false) = false
    then valor
    when tipo = 'despesa' then -valor
    when tipo = 'aplicacao' then -valor
    when tipo = 'resgate' then valor
    -- Transferências não afetam saldo líquido global
    else 0
  end) as saldo_liquido,
  -- Quantidade exclui contrapartidas para não duplicar contagem
  count(*) filter (where coalesce((dados_adicionais->>'eh_contrapartida')::boolean, false) = false) as quantidade_lancamentos
from public.lancamentos_financeiros
where status = 'confirmado'
group by data_competencia
order by data_competencia desc;

comment on view public.v_fluxo_caixa_diario is 'Fluxo de caixa diário consolidado. Mostra movimentações e saldo líquido por dia. Transferências internas não afetam o saldo líquido global.';

-- ----------------------------------------------------------------------------
-- View: v_saldo_contas_bancarias
-- ----------------------------------------------------------------------------
-- Saldo atual de todas as contas bancárias ativas.

create or replace view public.v_saldo_contas_bancarias as
select
  cb.id,
  cb.nome,
  cb.tipo,
  cb.banco_nome,
  cb.agencia,
  cb.numero_conta,
  cb.saldo_inicial,
  cb.saldo_atual,
  cb.data_saldo_inicial,
  cb.status,
  pc.codigo as conta_contabil_codigo,
  pc.nome as conta_contabil_nome,
  (
    select count(*)
    from public.lancamentos_financeiros l
    where (l.conta_bancaria_id = cb.id or l.conta_destino_id = cb.id)
      and l.status = 'pendente'
  ) as lancamentos_pendentes
from public.contas_bancarias cb
left join public.plano_contas pc on cb.conta_contabil_id = pc.id
where cb.ativo = true
order by cb.nome;

comment on view public.v_saldo_contas_bancarias is 'Saldo atual de todas as contas bancárias ativas, incluindo vinculação contábil e quantidade de lançamentos pendentes.';

-- ----------------------------------------------------------------------------
-- View: v_orcamento_vs_realizado
-- ----------------------------------------------------------------------------
-- Comparação entre valores orçados e realizados.

create or replace view public.v_orcamento_vs_realizado as
select
  o.id as orcamento_id,
  o.nome as orcamento_nome,
  o.ano,
  o.periodo,
  o.status as orcamento_status,
  o.data_inicio as orcamento_data_inicio,
  o.data_fim as orcamento_data_fim,
  oi.id as item_id,
  oi.conta_contabil_id,
  pc.codigo as conta_codigo,
  pc.nome as conta_nome,
  pc.tipo_conta,
  oi.centro_custo_id,
  cc.codigo as centro_custo_codigo,
  cc.nome as centro_custo_nome,
  oi.mes,
  oi.valor_orcado,
  coalesce((
    select sum(l.valor)
    from public.lancamentos_financeiros l
    where l.conta_contabil_id = oi.conta_contabil_id
      and (oi.centro_custo_id is null or l.centro_custo_id = oi.centro_custo_id)
      and l.status = 'confirmado'
      and l.data_competencia between o.data_inicio and o.data_fim
      and (oi.mes is null or extract(month from l.data_competencia) = oi.mes)
  ), 0) as valor_realizado,
  coalesce((
    select sum(l.valor)
    from public.lancamentos_financeiros l
    where l.conta_contabil_id = oi.conta_contabil_id
      and (oi.centro_custo_id is null or l.centro_custo_id = oi.centro_custo_id)
      and l.status = 'confirmado'
      and l.data_competencia between o.data_inicio and o.data_fim
      and (oi.mes is null or extract(month from l.data_competencia) = oi.mes)
  ), 0) - oi.valor_orcado as variacao,
  case
    when oi.valor_orcado = 0 then null
    else round(
      (coalesce((
        select sum(l.valor)
        from public.lancamentos_financeiros l
        where l.conta_contabil_id = oi.conta_contabil_id
          and (oi.centro_custo_id is null or l.centro_custo_id = oi.centro_custo_id)
          and l.status = 'confirmado'
          and l.data_competencia between o.data_inicio and o.data_fim
          and (oi.mes is null or extract(month from l.data_competencia) = oi.mes)
      ), 0) / oi.valor_orcado) * 100,
      2
    )
  end as percentual_realizado
from public.orcamentos o
join public.orcamento_itens oi on oi.orcamento_id = o.id
join public.plano_contas pc on oi.conta_contabil_id = pc.id
left join public.centros_custo cc on oi.centro_custo_id = cc.id
order by o.ano desc, o.id, pc.codigo, oi.mes;

comment on view public.v_orcamento_vs_realizado is 'Comparação entre valores orçados e realizados por conta contábil e centro de custo. Inclui variação absoluta, percentual de realização e datas do período orçamentário (orcamento_data_inicio, orcamento_data_fim).';

-- ----------------------------------------------------------------------------
-- View: v_lancamentos_por_centro_custo
-- ----------------------------------------------------------------------------
-- Totais de lançamentos por centro de custo.

create or replace view public.v_lancamentos_por_centro_custo as
select
  cc.id as centro_custo_id,
  cc.codigo as centro_custo_codigo,
  cc.nome as centro_custo_nome,
  extract(year from l.data_competencia)::integer as ano,
  extract(month from l.data_competencia)::integer as mes,
  sum(case when l.tipo = 'receita' then l.valor else 0 end) as total_receitas,
  sum(case when l.tipo = 'despesa' then l.valor else 0 end) as total_despesas,
  sum(case
    when l.tipo = 'receita' then l.valor
    when l.tipo = 'despesa' then -l.valor
    else 0
  end) as saldo,
  count(*) as quantidade_lancamentos
from public.centros_custo cc
left join public.lancamentos_financeiros l on
  l.centro_custo_id = cc.id
  and l.status = 'confirmado'
where cc.ativo = true
group by cc.id, cc.codigo, cc.nome, ano, mes
having count(*) > 0
order by cc.codigo, ano desc, mes desc;

comment on view public.v_lancamentos_por_centro_custo is 'Totais de lançamentos agrupados por centro de custo e mês. Mostra receitas, despesas e saldo por período.';

-- ----------------------------------------------------------------------------
-- View: v_conciliacoes_pendentes
-- ----------------------------------------------------------------------------
-- Transações importadas não conciliadas.

create or replace view public.v_conciliacoes_pendentes as
select
  ti.id as transacao_id,
  ti.conta_bancaria_id,
  cb.nome as conta_bancaria_nome,
  ti.data_transacao,
  ti.descricao,
  ti.valor,
  ti.tipo_transacao,
  ti.documento,
  ti.data_importacao,
  c.id as conciliacao_id,
  c.status as conciliacao_status,
  c.score_similaridade,
  c.lancamento_financeiro_id,
  lf.descricao as lancamento_descricao,
  lf.valor as lancamento_valor,
  lf.data_lancamento as lancamento_data
from public.transacoes_bancarias_importadas ti
join public.contas_bancarias cb on ti.conta_bancaria_id = cb.id
left join public.conciliacoes_bancarias c on c.transacao_importada_id = ti.id
left join public.lancamentos_financeiros lf on c.lancamento_financeiro_id = lf.id
where c.id is null or c.status = 'pendente'
order by ti.data_transacao desc, ti.data_importacao desc;

comment on view public.v_conciliacoes_pendentes is 'Transações bancárias importadas que ainda não foram conciliadas ou têm conciliação pendente. Inclui sugestões de lançamentos quando disponíveis.';

-- ----------------------------------------------------------------------------
-- View: v_folhas_pagamento_resumo
-- ----------------------------------------------------------------------------
-- Resumo das folhas de pagamento.

create or replace view public.v_folhas_pagamento_resumo as
select
  f.id,
  f.mes_referencia,
  f.ano_referencia,
  to_char(make_date(f.ano_referencia, f.mes_referencia, 1), 'TMMonth/YYYY') as periodo_formatado,
  f.status,
  f.data_geracao,
  f.data_pagamento,
  f.valor_total,
  (
    select count(*)
    from public.itens_folha_pagamento i
    where i.folha_pagamento_id = f.id
  ) as quantidade_funcionarios,
  (
    select count(*)
    from public.itens_folha_pagamento i
    where i.folha_pagamento_id = f.id
      and i.lancamento_financeiro_id is not null
  ) as lancamentos_gerados,
  f.created_by,
  u.nome_exibicao as criado_por_nome,
  f.created_at
from public.folhas_pagamento f
left join public.usuarios u on f.created_by = u.id
order by f.ano_referencia desc, f.mes_referencia desc;

comment on view public.v_folhas_pagamento_resumo is 'Resumo das folhas de pagamento com contagem de funcionários e lançamentos gerados.';

-- ----------------------------------------------------------------------------
-- View: v_plano_contas_hierarquico
-- ----------------------------------------------------------------------------
-- Plano de contas com hierarquia formatada.

create or replace view public.v_plano_contas_hierarquico as
with recursive hierarquia as (
  -- Contas raiz (sem pai)
  select
    id,
    codigo,
    nome,
    tipo_conta,
    natureza,
    nivel,
    aceita_lancamento,
    conta_pai_id,
    ativo,
    1 as profundidade,
    codigo as caminho,
    nome as caminho_nome
  from public.plano_contas
  where conta_pai_id is null

  union all

  -- Contas filhas
  select
    pc.id,
    pc.codigo,
    pc.nome,
    pc.tipo_conta,
    pc.natureza,
    pc.nivel,
    pc.aceita_lancamento,
    pc.conta_pai_id,
    pc.ativo,
    h.profundidade + 1,
    h.caminho || ' > ' || pc.codigo,
    h.caminho_nome || ' > ' || pc.nome
  from public.plano_contas pc
  join hierarquia h on pc.conta_pai_id = h.id
)
select
  id,
  codigo,
  nome,
  tipo_conta,
  natureza,
  nivel,
  aceita_lancamento,
  conta_pai_id,
  ativo,
  profundidade,
  caminho,
  caminho_nome,
  repeat('  ', profundidade - 1) || nome as nome_indentado
from hierarquia
order by caminho;

comment on view public.v_plano_contas_hierarquico is 'Plano de contas com estrutura hierárquica recursiva. Inclui profundidade, caminho completo e nome indentado para exibição.';

-- ----------------------------------------------------------------------------
-- View Materializada: v_dre
-- ----------------------------------------------------------------------------
-- Demonstração de Resultado do Exercício (DRE) agregando receitas e despesas
-- por período, conta contábil e categoria. Base para relatórios gerenciais.
-- Atualizar periodicamente via REFRESH MATERIALIZED VIEW ou trigger.

create materialized view public.v_dre as
select
  extract(year from l.data_competencia)::integer as ano,
  extract(month from l.data_competencia)::integer as mes,
  to_char(l.data_competencia, 'YYYY-MM') as periodo_completo,
  l.conta_contabil_id,
  pc.codigo as conta_codigo,
  pc.nome as conta_nome,
  pc.tipo_conta,
  coalesce(l.categoria, 'Sem Categoria') as categoria,
  sum(l.valor) as valor_total,
  count(*)::integer as quantidade_lancamentos
from public.lancamentos_financeiros l
join public.plano_contas pc on l.conta_contabil_id = pc.id
where l.status = 'confirmado'
  and l.tipo in ('receita', 'despesa')
  -- Exclui contrapartidas de transferências para não duplicar contagem
  and coalesce((l.dados_adicionais->>'eh_contrapartida')::boolean, false) = false
group by
  extract(year from l.data_competencia),
  extract(month from l.data_competencia),
  to_char(l.data_competencia, 'YYYY-MM'),
  l.conta_contabil_id,
  pc.codigo,
  pc.nome,
  pc.tipo_conta,
  coalesce(l.categoria, 'Sem Categoria')
order by ano desc, mes desc, pc.codigo;

comment on materialized view public.v_dre is 'View materializada para DRE. Agrega receitas e despesas confirmadas por período, conta contábil e categoria. Atualizar via REFRESH MATERIALIZED VIEW ou trigger após confirmação de lançamentos.';

-- Índices na view materializada v_dre
create unique index idx_v_dre_unique on public.v_dre (ano, mes, conta_contabil_id, categoria);
create index idx_v_dre_ano on public.v_dre (ano);
create index idx_v_dre_mes on public.v_dre (mes);
create index idx_v_dre_tipo_conta on public.v_dre (tipo_conta);
create index idx_v_dre_categoria on public.v_dre (categoria);
create index idx_v_dre_periodo on public.v_dre (periodo_completo);

-- ----------------------------------------------------------------------------
-- Função: refresh_v_dre
-- ----------------------------------------------------------------------------
-- Atualiza a view materializada v_dre. Pode ser chamada manualmente
-- ou via trigger/scheduler após confirmação de lançamentos.

create or replace function public.refresh_v_dre()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently public.v_dre;
  raise notice 'View v_dre atualizada com sucesso em %', now();
exception
  when others then
    -- Se refresh concorrente falhar (ex: primeira vez sem índice unique),
    -- tenta refresh normal
    refresh materialized view public.v_dre;
    raise notice 'View v_dre atualizada (modo normal) em %', now();
end;
$$;

comment on function public.refresh_v_dre() is 'Atualiza a view materializada v_dre com dados agregados de DRE. Prefere refresh concorrente para não bloquear leituras.';

-- =====================================================
-- From: 35_financeiro_integracao.sql
-- =====================================================

-- ============================================================================
-- Schema: Integração Financeira
-- Sistema de Gestão Financeira (SGF)
-- ============================================================================
-- Triggers de integração entre o módulo financeiro e outras entidades do
-- sistema (acordos/condenações, folhas de pagamento, etc.).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: criar_lancamento_de_parcela
-- ----------------------------------------------------------------------------
-- Cria automaticamente um lançamento financeiro quando uma parcela de
-- acordo/condenação é marcada como recebida ou paga.

create or replace function public.criar_lancamento_de_parcela()
returns trigger
language plpgsql
security invoker
as $$
declare
  v_acordo public.acordos_condenacoes;
  v_tipo_lancamento public.tipo_lancamento;
  v_descricao text;
  v_conta_contabil_id bigint;
  v_valor_total numeric(15,2);
  v_lancamento_id bigint;
  v_forma_pagamento_fin public.forma_pagamento_financeiro;
begin
  -- Ignora se não houve mudança de status relevante
  if new.status = old.status then
    return new;
  end if;

  -- Só cria lançamento quando status muda para 'recebida' ou 'paga'
  if new.status not in ('recebida', 'paga') then
    return new;
  end if;

  -- Busca dados do acordo
  select * into v_acordo
  from public.acordos_condenacoes
  where id = new.acordo_condenacao_id;

  -- Define tipo de lançamento baseado na direção
  if v_acordo.direcao = 'recebimento' then
    v_tipo_lancamento := 'receita';
  else
    v_tipo_lancamento := 'despesa';
  end if;

  -- Monta descrição do lançamento
  v_descricao := format(
    'Parcela %s/%s - %s (%s)',
    new.numero_parcela,
    v_acordo.numero_parcelas,
    initcap(v_acordo.tipo),
    case when v_acordo.direcao = 'recebimento' then 'Recebimento' else 'Pagamento' end
  );

  -- Calcula valor total (principal + honorários sucumbenciais)
  v_valor_total := new.valor_bruto_credito_principal + coalesce(new.honorarios_sucumbenciais, 0);

  -- Busca conta contábil adequada (primeira conta analítica de honorários ou despesas)
  -- NOTA: Em produção, configurar via tabela de mapeamento
  if v_tipo_lancamento = 'receita' then
    select id into v_conta_contabil_id
    from public.plano_contas
    where tipo_conta = 'receita'
      and aceita_lancamento = true
      and ativo = true
    order by codigo
    limit 1;
  else
    select id into v_conta_contabil_id
    from public.plano_contas
    where tipo_conta = 'despesa'
      and aceita_lancamento = true
      and ativo = true
    order by codigo
    limit 1;
  end if;

  -- Mapeia forma de pagamento
  v_forma_pagamento_fin := case new.forma_pagamento
    when 'transferencia_direta' then 'transferencia_bancaria'::public.forma_pagamento_financeiro
    when 'deposito_judicial' then 'deposito_judicial'::public.forma_pagamento_financeiro
    when 'deposito_recursal' then 'deposito_judicial'::public.forma_pagamento_financeiro
    else 'transferencia_bancaria'::public.forma_pagamento_financeiro
  end;

  -- Cria o lançamento financeiro (apenas se temos conta contábil)
  if v_conta_contabil_id is not null then
    insert into public.lancamentos_financeiros (
      tipo,
      descricao,
      valor,
      data_lancamento,
      data_competencia,
      data_vencimento,
      data_efetivacao,
      status,
      origem,
      forma_pagamento,
      conta_contabil_id,
      acordo_condenacao_id,
      parcela_id,
      created_by,
      dados_adicionais
    ) values (
      v_tipo_lancamento,
      v_descricao,
      v_valor_total,
      current_date,
      new.data_vencimento,
      new.data_vencimento,
      new.data_efetivacao,
      'confirmado',
      'acordo_judicial',
      v_forma_pagamento_fin,
      v_conta_contabil_id,
      new.acordo_condenacao_id,
      new.id,
      -- Busca o usuario.id correspondente ao auth_user_id do criador do acordo
      (select id from public.usuarios where auth_user_id = v_acordo.created_by),
      jsonb_build_object(
        'numero_parcela', new.numero_parcela,
        'total_parcelas', v_acordo.numero_parcelas,
        'valor_principal', new.valor_bruto_credito_principal,
        'honorarios_sucumbenciais', new.honorarios_sucumbenciais,
        'honorarios_contratuais', new.honorarios_contratuais,
        'tipo_acordo', v_acordo.tipo,
        'direcao', v_acordo.direcao
      )
    )
    returning id into v_lancamento_id;

    -- Log para debug (remover em produção)
    raise notice 'Lançamento financeiro % criado para parcela %', v_lancamento_id, new.id;
  else
    raise warning 'Não foi possível criar lançamento financeiro para parcela %: conta contábil não encontrada', new.id;
  end if;

  return new;
end;
$$;

comment on function public.criar_lancamento_de_parcela() is 'Trigger function que cria automaticamente um lançamento financeiro quando uma parcela de acordo/condenação é marcada como recebida ou paga. O tipo de lançamento (receita/despesa) é determinado pela direção do acordo.';

-- Trigger para criar lançamento ao atualizar parcela
create trigger trigger_criar_lancamento_de_parcela
  after update of status on public.parcelas
  for each row
  when (old.status is distinct from new.status and new.status in ('recebida', 'paga'))
  execute function public.criar_lancamento_de_parcela();

-- ----------------------------------------------------------------------------
-- Function: criar_lancamentos_folha_pagamento
-- ----------------------------------------------------------------------------
-- Cria lançamentos financeiros para cada item da folha quando aprovada.

create or replace function public.criar_lancamentos_folha_pagamento()
returns trigger
language plpgsql
security invoker
as $$
declare
  v_item record;
  v_conta_contabil_id bigint;
  v_lancamento_id bigint;
  v_descricao text;
begin
  -- Ignora se não houve mudança de status para 'aprovada'
  if new.status != 'aprovada' or (old is not null and old.status = 'aprovada') then
    return new;
  end if;

  -- Busca conta contábil para salários (primeira conta analítica de despesa com 'Salário' no nome)
  -- NOTA: Em produção, configurar via tabela de mapeamento
  select id into v_conta_contabil_id
  from public.plano_contas
  where tipo_conta = 'despesa'
    and aceita_lancamento = true
    and ativo = true
    and lower(nome) like '%salário%'
  order by codigo
  limit 1;

  -- Fallback: qualquer conta de despesa analítica
  if v_conta_contabil_id is null then
    select id into v_conta_contabil_id
    from public.plano_contas
    where tipo_conta = 'despesa'
      and aceita_lancamento = true
      and ativo = true
    order by codigo
    limit 1;
  end if;

  -- Se não encontrou conta contábil, emite warning e retorna
  if v_conta_contabil_id is null then
    raise warning 'Não foi possível criar lançamentos da folha %: conta contábil não encontrada', new.id;
    return new;
  end if;

  -- Itera sobre cada item da folha
  for v_item in
    select
      i.*,
      u.nome_exibicao as usuario_nome
    from public.itens_folha_pagamento i
    join public.usuarios u on i.usuario_id = u.id
    where i.folha_pagamento_id = new.id
      and i.lancamento_financeiro_id is null
  loop
    -- Monta descrição do lançamento
    v_descricao := format(
      'Salário %s/%s - %s',
      lpad(new.mes_referencia::text, 2, '0'),
      new.ano_referencia,
      v_item.usuario_nome
    );

    -- Cria o lançamento financeiro
    insert into public.lancamentos_financeiros (
      tipo,
      descricao,
      valor,
      data_lancamento,
      data_competencia,
      data_vencimento,
      status,
      origem,
      forma_pagamento,
      conta_contabil_id,
      usuario_id,
      created_by,
      dados_adicionais
    ) values (
      'despesa',
      v_descricao,
      v_item.valor_bruto,
      current_date,
      make_date(new.ano_referencia, new.mes_referencia, 1),
      new.data_pagamento,
      'pendente',
      'folha_pagamento',
      'transferencia_bancaria',
      v_conta_contabil_id,
      v_item.usuario_id,
      new.created_by,
      jsonb_build_object(
        'folha_id', new.id,
        'mes_referencia', new.mes_referencia,
        'ano_referencia', new.ano_referencia,
        'salario_id', v_item.salario_id
      )
    )
    returning id into v_lancamento_id;

    -- Atualiza o item da folha com o ID do lançamento
    update public.itens_folha_pagamento
    set lancamento_financeiro_id = v_lancamento_id
    where id = v_item.id;

    raise notice 'Lançamento financeiro % criado para item da folha % (usuário %)',
      v_lancamento_id, new.id, v_item.usuario_id;
  end loop;

  return new;
end;
$$;

comment on function public.criar_lancamentos_folha_pagamento() is 'Trigger function que cria lançamentos financeiros para cada item da folha de pagamento quando a folha é aprovada. Vincula cada lançamento ao respectivo item da folha.';

-- Trigger para criar lançamentos ao aprovar folha
create trigger trigger_criar_lancamentos_folha_pagamento
  after update of status on public.folhas_pagamento
  for each row
  when (new.status = 'aprovada' and (old.status is null or old.status != 'aprovada'))
  execute function public.criar_lancamentos_folha_pagamento();

-- ----------------------------------------------------------------------------
-- Function: atualizar_lancamento_folha_para_pago
-- ----------------------------------------------------------------------------
-- Atualiza os lançamentos da folha para 'confirmado' quando a folha é paga.

create or replace function public.atualizar_lancamento_folha_para_pago()
returns trigger
language plpgsql
security invoker
as $$
begin
  -- Ignora se não houve mudança de status para 'paga'
  if new.status != 'paga' or (old is not null and old.status = 'paga') then
    return new;
  end if;

  -- Atualiza todos os lançamentos da folha para confirmado
  update public.lancamentos_financeiros
  set
    status = 'confirmado',
    data_efetivacao = now()
  where id in (
    select lancamento_financeiro_id
    from public.itens_folha_pagamento
    where folha_pagamento_id = new.id
      and lancamento_financeiro_id is not null
  );

  return new;
end;
$$;

comment on function public.atualizar_lancamento_folha_para_pago() is 'Trigger function que atualiza os lançamentos da folha para status confirmado quando a folha é marcada como paga.';

-- Trigger para atualizar lançamentos ao pagar folha
create trigger trigger_atualizar_lancamento_folha_para_pago
  after update of status on public.folhas_pagamento
  for each row
  when (new.status = 'paga' and (old.status is null or old.status != 'paga'))
  execute function public.atualizar_lancamento_folha_para_pago();

-- ----------------------------------------------------------------------------
-- Function: cancelar_lancamentos_folha
-- ----------------------------------------------------------------------------
-- Cancela os lançamentos financeiros quando a folha é cancelada.

create or replace function public.cancelar_lancamentos_folha()
returns trigger
language plpgsql
security invoker
as $$
begin
  -- Ignora se não houve mudança de status para 'cancelada'
  if new.status != 'cancelada' or (old is not null and old.status = 'cancelada') then
    return new;
  end if;

  -- Atualiza todos os lançamentos da folha para cancelado
  update public.lancamentos_financeiros
  set status = 'cancelado'
  where id in (
    select lancamento_financeiro_id
    from public.itens_folha_pagamento
    where folha_pagamento_id = new.id
      and lancamento_financeiro_id is not null
  )
  and status != 'confirmado'; -- Não cancela lançamentos já confirmados

  -- Estorna lançamentos já confirmados
  update public.lancamentos_financeiros
  set status = 'estornado'
  where id in (
    select lancamento_financeiro_id
    from public.itens_folha_pagamento
    where folha_pagamento_id = new.id
      and lancamento_financeiro_id is not null
  )
  and status = 'confirmado';

  return new;
end;
$$;

comment on function public.cancelar_lancamentos_folha() is 'Trigger function que cancela ou estorna os lançamentos financeiros quando a folha de pagamento é cancelada.';

-- Trigger para cancelar lançamentos ao cancelar folha
create trigger trigger_cancelar_lancamentos_folha
  after update of status on public.folhas_pagamento
  for each row
  when (new.status = 'cancelada' and (old.status is null or old.status != 'cancelada'))
  execute function public.cancelar_lancamentos_folha();

-- ----------------------------------------------------------------------------
-- Function: sugerir_conciliacao_automatica
-- ----------------------------------------------------------------------------
-- Sugere conciliações automáticas para transações importadas.

create or replace function public.sugerir_conciliacao_automatica(
  p_transacao_id bigint
)
returns table (
  lancamento_id bigint,
  lancamento_descricao text,
  lancamento_valor numeric(15,2),
  lancamento_data date,
  score_similaridade numeric(5,2)
)
language plpgsql
security invoker
as $$
declare
  v_transacao record;
begin
  -- Busca dados da transação
  select * into v_transacao
  from public.transacoes_bancarias_importadas
  where id = p_transacao_id;

  if not found then
    raise exception 'Transação % não encontrada', p_transacao_id;
  end if;

  -- Busca lançamentos similares
  return query
  select
    l.id as lancamento_id,
    l.descricao as lancamento_descricao,
    l.valor as lancamento_valor,
    l.data_lancamento as lancamento_data,
    (
      -- Score baseado em múltiplos critérios
      case when abs(l.valor - abs(v_transacao.valor)) < 0.01 then 40 else 0 end + -- Valor exato
      case when abs(l.valor - abs(v_transacao.valor)) / greatest(l.valor, abs(v_transacao.valor)) < 0.05 then 20 else 0 end + -- Valor similar (5%)
      case when l.data_lancamento = v_transacao.data_transacao then 20 else 0 end + -- Data exata
      case when abs(l.data_lancamento - v_transacao.data_transacao) <= 3 then 10 else 0 end + -- Data próxima
      case when lower(l.descricao) like '%' || lower(substring(v_transacao.descricao from 1 for 10)) || '%' then 10 else 0 end -- Descrição similar
    )::numeric(5,2) as score_similaridade
  from public.lancamentos_financeiros l
  where l.conta_bancaria_id = v_transacao.conta_bancaria_id
    and l.status in ('pendente', 'confirmado')
    and abs(l.data_lancamento - v_transacao.data_transacao) <= 30 -- Máximo 30 dias de diferença
    and (
      -- Receita para créditos, despesa para débitos
      (v_transacao.valor > 0 and l.tipo = 'receita') or
      (v_transacao.valor < 0 and l.tipo in ('despesa', 'transferencia', 'aplicacao'))
    )
    -- Exclui lançamentos já conciliados
    and not exists (
      select 1 from public.conciliacoes_bancarias c
      where c.lancamento_financeiro_id = l.id
        and c.status = 'conciliado'
    )
  order by score_similaridade desc
  limit 5;
end;
$$;

comment on function public.sugerir_conciliacao_automatica(bigint) is 'Sugere lançamentos financeiros para conciliação automática com uma transação bancária importada. Retorna os 5 melhores candidatos com score de similaridade.';

-- ============================================================================
-- Sincronização Reversa: Lançamento → Parcela
-- ============================================================================
-- Mantém a parcela sincronizada quando o lançamento é alterado.
-- Casos tratados:
-- 1. Lançamento cancelado/estornado → Parcela volta para pendente
-- 2. Lançamento confirmado → Parcela mantém status (já efetivada)
-- 3. Lançamento deletado → Parcela volta para pendente
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: sincronizar_parcela_de_lancamento
-- ----------------------------------------------------------------------------
-- Sincroniza o status da parcela quando o lançamento vinculado é alterado.
-- Implementa sincronização bidirecional para manter consistência.

create or replace function public.sincronizar_parcela_de_lancamento()
returns trigger
language plpgsql
security invoker
as $$
declare
  v_parcela_id bigint;
  v_acordo record;
  v_novo_status_parcela text;
begin
  -- Ignora lançamentos que não vieram de acordo judicial
  if new.origem != 'acordo_judicial' or new.parcela_id is null then
    return new;
  end if;

  -- Ignora se não houve mudança de status relevante
  if old is not null and new.status = old.status then
    return new;
  end if;

  v_parcela_id := new.parcela_id;

  -- Busca dados do acordo para determinar o status correto da parcela
  select ac.direcao into v_acordo
  from public.acordos_condenacoes ac
  join public.parcelas p on p.acordo_condenacao_id = ac.id
  where p.id = v_parcela_id;

  -- Determina novo status da parcela baseado no status do lançamento
  case new.status
    when 'cancelado', 'estornado' then
      -- Lançamento cancelado/estornado: parcela volta para pendente
      -- (mantém data_efetivacao e forma_pagamento para histórico)
      v_novo_status_parcela := 'pendente';
    when 'confirmado' then
      -- Lançamento confirmado: parcela deve estar efetivada
      -- Define status baseado na direção do acordo
      if v_acordo.direcao = 'recebimento' then
        v_novo_status_parcela := 'recebida';
      else
        v_novo_status_parcela := 'paga';
      end if;
    when 'pendente' then
      -- Lançamento pendente: parcela também pendente
      v_novo_status_parcela := 'pendente';
    else
      -- Outros status: não altera parcela
      return new;
  end case;

  -- Atualiza a parcela (desabilita trigger para evitar loop)
  update public.parcelas
  set
    status = v_novo_status_parcela,
    updated_at = now()
  where id = v_parcela_id
    and status != v_novo_status_parcela;  -- Só atualiza se realmente mudou

  raise notice 'Parcela % sincronizada: status atualizado para %', v_parcela_id, v_novo_status_parcela;

  return new;
end;
$$;

comment on function public.sincronizar_parcela_de_lancamento() is 'Trigger function que mantém a parcela de acordo sincronizada quando o lançamento financeiro vinculado é alterado. Implementa sincronização bidirecional entre módulos.';

-- Trigger para sincronizar parcela ao atualizar lançamento
drop trigger if exists trigger_sincronizar_parcela_de_lancamento on public.lancamentos_financeiros;

create trigger trigger_sincronizar_parcela_de_lancamento
  after update of status on public.lancamentos_financeiros
  for each row
  when (
    new.origem = 'acordo_judicial'
    and new.parcela_id is not null
    and old.status is distinct from new.status
  )
  execute function public.sincronizar_parcela_de_lancamento();

-- ----------------------------------------------------------------------------
-- Function: sincronizar_parcela_ao_deletar_lancamento
-- ----------------------------------------------------------------------------
-- Volta a parcela para pendente quando o lançamento vinculado é deletado.

create or replace function public.sincronizar_parcela_ao_deletar_lancamento()
returns trigger
language plpgsql
security invoker
as $$
begin
  -- Ignora lançamentos que não vieram de acordo judicial
  if old.origem != 'acordo_judicial' or old.parcela_id is null then
    return old;
  end if;

  -- Volta a parcela para pendente
  update public.parcelas
  set
    status = 'pendente',
    updated_at = now()
  where id = old.parcela_id;

  raise notice 'Parcela % voltou para pendente (lançamento % deletado)',
    old.parcela_id, old.id;

  return old;
end;
$$;

comment on function public.sincronizar_parcela_ao_deletar_lancamento() is 'Trigger function que volta a parcela para status pendente quando o lançamento financeiro vinculado é deletado.';

-- Trigger para sincronizar parcela ao deletar lançamento
drop trigger if exists trigger_sincronizar_parcela_ao_deletar_lancamento on public.lancamentos_financeiros;

create trigger trigger_sincronizar_parcela_ao_deletar_lancamento
  before delete on public.lancamentos_financeiros
  for each row
  when (old.origem = 'acordo_judicial' and old.parcela_id is not null)
  execute function public.sincronizar_parcela_ao_deletar_lancamento();

-- ----------------------------------------------------------------------------
-- Function: verificar_consistencia_parcela_lancamento
-- ----------------------------------------------------------------------------
-- Função para verificar e reportar inconsistências entre parcelas e lançamentos.
-- Pode ser chamada manualmente ou via cron para auditoria.

create or replace function public.verificar_consistencia_parcela_lancamento(
  p_acordo_id bigint default null
)
returns table (
  tipo_inconsistencia text,
  parcela_id bigint,
  lancamento_id bigint,
  parcela_status text,
  lancamento_status text,
  parcela_valor numeric(15,2),
  lancamento_valor numeric(15,2),
  descricao text
)
language plpgsql
security invoker
as $$
begin
  -- Parcelas efetivadas sem lançamento
  return query
  select
    'parcela_sem_lancamento'::text as tipo_inconsistencia,
    p.id as parcela_id,
    null::bigint as lancamento_id,
    p.status as parcela_status,
    null::text as lancamento_status,
    (p.valor_bruto_credito_principal + coalesce(p.honorarios_sucumbenciais, 0))::numeric(15,2) as parcela_valor,
    null::numeric(15,2) as lancamento_valor,
    format('Parcela %s efetivada mas sem lançamento financeiro', p.id) as descricao
  from public.parcelas p
  join public.acordos_condenacoes ac on ac.id = p.acordo_condenacao_id
  where p.status in ('recebida', 'paga')
    and (p_acordo_id is null or ac.id = p_acordo_id)
    and not exists (
      select 1 from public.lancamentos_financeiros l
      where l.parcela_id = p.id
        and l.status not in ('cancelado', 'estornado')
    );

  -- Lançamentos ativos sem parcela correspondente efetivada
  return query
  select
    'lancamento_orfao'::text as tipo_inconsistencia,
    l.parcela_id,
    l.id as lancamento_id,
    p.status as parcela_status,
    l.status as lancamento_status,
    (p.valor_bruto_credito_principal + coalesce(p.honorarios_sucumbenciais, 0))::numeric(15,2) as parcela_valor,
    l.valor as lancamento_valor,
    format('Lançamento %s ativo mas parcela %s não efetivada (status: %s)',
      l.id, l.parcela_id, p.status) as descricao
  from public.lancamentos_financeiros l
  join public.parcelas p on p.id = l.parcela_id
  join public.acordos_condenacoes ac on ac.id = p.acordo_condenacao_id
  where l.origem = 'acordo_judicial'
    and l.status in ('pendente', 'confirmado')
    and (p_acordo_id is null or ac.id = p_acordo_id)
    and p.status not in ('recebida', 'paga');

  -- Valores divergentes entre parcela e lançamento
  return query
  select
    'valor_divergente'::text as tipo_inconsistencia,
    p.id as parcela_id,
    l.id as lancamento_id,
    p.status as parcela_status,
    l.status as lancamento_status,
    (p.valor_bruto_credito_principal + coalesce(p.honorarios_sucumbenciais, 0))::numeric(15,2) as parcela_valor,
    l.valor as lancamento_valor,
    format('Valores divergem: parcela R$ %s, lançamento R$ %s (diferença: R$ %s)',
      to_char(p.valor_bruto_credito_principal + coalesce(p.honorarios_sucumbenciais, 0), 'FM999G999D00'),
      to_char(l.valor, 'FM999G999D00'),
      to_char(abs(l.valor - (p.valor_bruto_credito_principal + coalesce(p.honorarios_sucumbenciais, 0))), 'FM999G999D00')
    ) as descricao
  from public.lancamentos_financeiros l
  join public.parcelas p on p.id = l.parcela_id
  join public.acordos_condenacoes ac on ac.id = p.acordo_condenacao_id
  where l.origem = 'acordo_judicial'
    and l.status not in ('cancelado', 'estornado')
    and (p_acordo_id is null or ac.id = p_acordo_id)
    and abs(l.valor - (p.valor_bruto_credito_principal + coalesce(p.honorarios_sucumbenciais, 0))) > 0.01;

  -- Status divergentes entre parcela e lançamento
  return query
  select
    'status_divergente'::text as tipo_inconsistencia,
    p.id as parcela_id,
    l.id as lancamento_id,
    p.status as parcela_status,
    l.status as lancamento_status,
    (p.valor_bruto_credito_principal + coalesce(p.honorarios_sucumbenciais, 0))::numeric(15,2) as parcela_valor,
    l.valor as lancamento_valor,
    format('Status divergem: parcela "%s", lançamento "%s"', p.status, l.status) as descricao
  from public.lancamentos_financeiros l
  join public.parcelas p on p.id = l.parcela_id
  join public.acordos_condenacoes ac on ac.id = p.acordo_condenacao_id
  where l.origem = 'acordo_judicial'
    and (p_acordo_id is null or ac.id = p_acordo_id)
    and (
      -- Parcela efetivada mas lançamento não confirmado
      (p.status in ('recebida', 'paga') and l.status != 'confirmado')
      or
      -- Parcela pendente mas lançamento confirmado
      (p.status not in ('recebida', 'paga') and l.status = 'confirmado')
    );
end;
$$;

comment on function public.verificar_consistencia_parcela_lancamento(bigint) is 'Verifica e reporta inconsistências entre parcelas de acordos e seus lançamentos financeiros vinculados. Útil para auditoria e correção de dados.';

-- =====================================================
-- From: 36_financeiro_seed.sql
-- =====================================================

-- ============================================================================
-- Schema: Dados Iniciais (Seed) do Módulo Financeiro
-- Sistema de Gestão Financeira (SGF)
-- ============================================================================
-- Dados iniciais para o plano de contas e centros de custo.
-- Execute após criar todas as tabelas do módulo financeiro.
--
-- NOTA: Este script é IDEMPOTENTE - pode ser executado múltiplas vezes sem
-- causar erros ou duplicar dados. Usa ON CONFLICT (codigo) DO NOTHING para
-- ignorar inserções de registros que já existem.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Plano de Contas Básico
-- ----------------------------------------------------------------------------
-- Estrutura hierárquica padrão para escritórios de advocacia.
-- Contas sintéticas (nível 1 e 2) não aceitam lançamentos.
-- Contas analíticas (nível 3+) aceitam lançamentos diretos.

-- 1. ATIVO (Bens e Direitos)
insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('1', 'ATIVO', 'Bens e direitos do escritório', 'ativo', 'devedora', 'sintetica', null, false, 1, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('1.1', 'Ativo Circulante', 'Bens e direitos realizáveis no curto prazo', 'ativo', 'devedora', 'sintetica',
  (select id from public.plano_contas where codigo = '1'), false, 2, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('1.1.01', 'Caixa e Bancos', 'Disponibilidades em caixa e contas bancárias', 'ativo', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '1.1'), true, 3, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('1.1.02', 'Contas a Receber', 'Valores a receber de clientes e outros', 'ativo', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '1.1'), true, 4, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('1.1.03', 'Aplicações Financeiras', 'Investimentos de curto prazo', 'ativo', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '1.1'), true, 5, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('1.1.04', 'Adiantamentos', 'Adiantamentos a fornecedores e funcionários', 'ativo', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '1.1'), true, 6, true)
on conflict (codigo) do nothing;

-- 2. PASSIVO (Obrigações)
insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('2', 'PASSIVO', 'Obrigações do escritório', 'passivo', 'credora', 'sintetica', null, false, 10, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('2.1', 'Passivo Circulante', 'Obrigações de curto prazo', 'passivo', 'credora', 'sintetica',
  (select id from public.plano_contas where codigo = '2'), false, 11, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('2.1.01', 'Contas a Pagar', 'Valores a pagar a fornecedores', 'passivo', 'credora', 'analitica',
  (select id from public.plano_contas where codigo = '2.1'), true, 12, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('2.1.02', 'Salários a Pagar', 'Salários e encargos a pagar', 'passivo', 'credora', 'analitica',
  (select id from public.plano_contas where codigo = '2.1'), true, 13, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('2.1.03', 'Impostos a Pagar', 'Tributos e contribuições a recolher', 'passivo', 'credora', 'analitica',
  (select id from public.plano_contas where codigo = '2.1'), true, 14, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('2.1.04', 'Repasses a Clientes', 'Valores de clientes a repassar', 'passivo', 'credora', 'analitica',
  (select id from public.plano_contas where codigo = '2.1'), true, 15, true)
on conflict (codigo) do nothing;

-- 3. RECEITAS
insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('3', 'RECEITAS', 'Receitas do escritório', 'receita', 'credora', 'sintetica', null, false, 20, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('3.1', 'Receitas Operacionais', 'Receitas da atividade principal', 'receita', 'credora', 'sintetica',
  (select id from public.plano_contas where codigo = '3'), false, 21, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('3.1.01', 'Honorários Advocatícios Contratuais', 'Honorários contratados com clientes', 'receita', 'credora', 'analitica',
  (select id from public.plano_contas where codigo = '3.1'), true, 22, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('3.1.02', 'Honorários Sucumbenciais', 'Honorários de sucumbência', 'receita', 'credora', 'analitica',
  (select id from public.plano_contas where codigo = '3.1'), true, 23, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('3.1.03', 'Consultorias e Pareceres', 'Receitas de consultorias jurídicas', 'receita', 'credora', 'analitica',
  (select id from public.plano_contas where codigo = '3.1'), true, 24, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('3.2', 'Receitas Financeiras', 'Receitas de aplicações e juros', 'receita', 'credora', 'sintetica',
  (select id from public.plano_contas where codigo = '3'), false, 25, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('3.2.01', 'Rendimentos de Aplicações', 'Rendimentos de investimentos financeiros', 'receita', 'credora', 'analitica',
  (select id from public.plano_contas where codigo = '3.2'), true, 26, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('3.2.02', 'Juros e Multas Recebidos', 'Juros e multas de clientes', 'receita', 'credora', 'analitica',
  (select id from public.plano_contas where codigo = '3.2'), true, 27, true)
on conflict (codigo) do nothing;

-- 4. DESPESAS
insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4', 'DESPESAS', 'Despesas do escritório', 'despesa', 'devedora', 'sintetica', null, false, 30, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.1', 'Despesas com Pessoal', 'Despesas com funcionários', 'despesa', 'devedora', 'sintetica',
  (select id from public.plano_contas where codigo = '4'), false, 31, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.1.01', 'Salários e Ordenados', 'Salários dos funcionários', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.1'), true, 32, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.1.02', 'Encargos Sociais', 'INSS, FGTS e outros encargos', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.1'), true, 33, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.1.03', 'Benefícios', 'Vale-transporte, vale-refeição, plano de saúde', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.1'), true, 34, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.1.04', 'Pró-Labore', 'Remuneração dos sócios', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.1'), true, 35, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.2', 'Despesas Operacionais', 'Despesas da operação', 'despesa', 'devedora', 'sintetica',
  (select id from public.plano_contas where codigo = '4'), false, 36, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.2.01', 'Aluguel', 'Aluguel do escritório', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.2'), true, 37, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.2.02', 'Condomínio', 'Taxa de condomínio', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.2'), true, 38, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.2.03', 'Energia Elétrica', 'Conta de luz', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.2'), true, 39, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.2.04', 'Água e Esgoto', 'Conta de água', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.2'), true, 40, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.2.05', 'Telefone e Internet', 'Comunicações', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.2'), true, 41, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.2.06', 'Material de Escritório', 'Papelaria e suprimentos', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.2'), true, 42, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.2.07', 'Limpeza e Conservação', 'Serviços de limpeza', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.2'), true, 43, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.3', 'Despesas Processuais', 'Custas e despesas de processos', 'despesa', 'devedora', 'sintetica',
  (select id from public.plano_contas where codigo = '4'), false, 44, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.3.01', 'Custas Processuais', 'Custas judiciais', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.3'), true, 45, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.3.02', 'Honorários Periciais', 'Pagamento de peritos', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.3'), true, 46, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.3.03', 'Diligências e Deslocamentos', 'Despesas com viagens e deslocamentos processuais', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.3'), true, 47, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.4', 'Despesas Financeiras', 'Despesas com bancos e financeiras', 'despesa', 'devedora', 'sintetica',
  (select id from public.plano_contas where codigo = '4'), false, 48, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.4.01', 'Tarifas Bancárias', 'Taxas e tarifas de bancos', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.4'), true, 49, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.4.02', 'Juros e Multas Pagos', 'Juros e multas por atraso', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.4'), true, 50, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.5', 'Despesas com Tecnologia', 'Sistemas e infraestrutura de TI', 'despesa', 'devedora', 'sintetica',
  (select id from public.plano_contas where codigo = '4'), false, 51, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.5.01', 'Software e Licenças', 'Assinaturas de software', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.5'), true, 52, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.5.02', 'Manutenção de Equipamentos', 'Manutenção de computadores e equipamentos', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.5'), true, 53, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.5.03', 'Hospedagem e Cloud', 'Serviços de nuvem e hospedagem', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.5'), true, 54, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.6', 'Tributos e Contribuições', 'Impostos sobre receita', 'despesa', 'devedora', 'sintetica',
  (select id from public.plano_contas where codigo = '4'), false, 55, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.6.01', 'ISS', 'Imposto Sobre Serviços', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.6'), true, 56, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.6.02', 'PIS/COFINS', 'Contribuições federais', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.6'), true, 57, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('4.6.03', 'IRPJ/CSLL', 'Imposto de Renda e Contribuição Social', 'despesa', 'devedora', 'analitica',
  (select id from public.plano_contas where codigo = '4.6'), true, 58, true)
on conflict (codigo) do nothing;

-- 5. PATRIMÔNIO LÍQUIDO
insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('5', 'PATRIMÔNIO LÍQUIDO', 'Capital próprio do escritório', 'patrimonio_liquido', 'credora', 'sintetica', null, false, 60, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('5.1', 'Capital Social', 'Capital integralizado pelos sócios', 'patrimonio_liquido', 'credora', 'sintetica',
  (select id from public.plano_contas where codigo = '5'), false, 61, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('5.1.01', 'Capital Subscrito', 'Capital subscrito pelos sócios', 'patrimonio_liquido', 'credora', 'analitica',
  (select id from public.plano_contas where codigo = '5.1'), true, 62, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('5.2', 'Reservas', 'Reservas de lucros', 'patrimonio_liquido', 'credora', 'sintetica',
  (select id from public.plano_contas where codigo = '5'), false, 63, true)
on conflict (codigo) do nothing;

insert into public.plano_contas (codigo, nome, descricao, tipo_conta, natureza, nivel, conta_pai_id, aceita_lancamento, ordem_exibicao, ativo)
values ('5.2.01', 'Reserva de Lucros', 'Lucros acumulados', 'patrimonio_liquido', 'credora', 'analitica',
  (select id from public.plano_contas where codigo = '5.2'), true, 64, true)
on conflict (codigo) do nothing;

-- ----------------------------------------------------------------------------
-- Centros de Custo Básicos
-- ----------------------------------------------------------------------------
-- Estrutura para rastreamento de despesas por área do escritório.

insert into public.centros_custo (codigo, nome, descricao, centro_pai_id, ativo)
values ('ADM', 'Administrativo', 'Departamento administrativo e financeiro', null, true)
on conflict (codigo) do nothing;

insert into public.centros_custo (codigo, nome, descricao, centro_pai_id, ativo)
values ('JUD', 'Judicial', 'Área contenciosa e processos judiciais', null, true)
on conflict (codigo) do nothing;

insert into public.centros_custo (codigo, nome, descricao, centro_pai_id, ativo)
values ('CON', 'Consultoria', 'Consultoria jurídica e pareceres', null, true)
on conflict (codigo) do nothing;

insert into public.centros_custo (codigo, nome, descricao, centro_pai_id, ativo)
values ('TI', 'Tecnologia', 'Tecnologia da informação e sistemas', null, true)
on conflict (codigo) do nothing;

insert into public.centros_custo (codigo, nome, descricao, centro_pai_id, ativo)
values ('MKT', 'Marketing', 'Marketing e comunicação', null, true)
on conflict (codigo) do nothing;

-- Subcentros de custo (judicial por área)
insert into public.centros_custo (codigo, nome, descricao, centro_pai_id, ativo)
values ('JUD-TRAB', 'Judicial Trabalhista', 'Processos trabalhistas',
  (select id from public.centros_custo where codigo = 'JUD'), true)
on conflict (codigo) do nothing;

insert into public.centros_custo (codigo, nome, descricao, centro_pai_id, ativo)
values ('JUD-CIV', 'Judicial Cível', 'Processos cíveis',
  (select id from public.centros_custo where codigo = 'JUD'), true)
on conflict (codigo) do nothing;

insert into public.centros_custo (codigo, nome, descricao, centro_pai_id, ativo)
values ('JUD-PREV', 'Judicial Previdenciário', 'Processos previdenciários',
  (select id from public.centros_custo where codigo = 'JUD'), true)
on conflict (codigo) do nothing;

-- ----------------------------------------------------------------------------
-- Refresh da View Materializada
-- ----------------------------------------------------------------------------
-- Garante que a view materializada está atualizada após inserção dos dados.

-- Nota: Executar apenas se a view já existir
-- refresh materialized view public.v_lancamentos_pendentes;

-- =====================================================
-- From: 37_documentos_chat.sql
-- =====================================================

-- ============================================================================
-- Documentos e Sistema de Chat
-- ============================================================================

-- Pastas de documentos
create table if not exists public.pastas (
  id bigint generated always as identity primary key,
  nome text not null,
  tipo text not null check (tipo in ('documentos', 'templates')),
  parent_id bigint references public.pastas(id) on delete cascade,
  criado_por bigint references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.pastas is 'Pastas para organização hierárquica de documentos e templates';
comment on column public.pastas.tipo is 'Tipo da pasta: documentos (arquivos gerais) ou templates (modelos)';

create index if not exists idx_pastas_criado_por on public.pastas(criado_por);
create index if not exists idx_pastas_parent_id on public.pastas(parent_id);
create index if not exists idx_pastas_tipo on public.pastas(tipo);
create index if not exists idx_pastas_nome_trgm on public.pastas using gin(nome gin_trgm_ops);

-- Documentos
create table if not exists public.documentos (
  id bigint generated always as identity primary key,
  titulo text not null,
  conteudo jsonb not null default '[]'::jsonb,
  pasta_id bigint references public.pastas(id) on delete set null,
  criado_por bigint not null references public.usuarios(id) on delete restrict,
  editado_por bigint references public.usuarios(id) on delete set null,
  versao integer not null default 1,
  descricao text,
  tags text[] default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  editado_em timestamptz,
  deleted_at timestamptz
);

comment on table public.documentos is 'Documentos editáveis com controle de versão e soft delete';
comment on column public.documentos.conteudo is 'Conteúdo do documento em formato JSON (ex: Editor.js blocks)';
comment on column public.documentos.versao is 'Número da versão atual do documento';
comment on column public.documentos.deleted_at is 'Timestamp de remoção lógica (soft delete)';

create index if not exists idx_documentos_criado_por on public.documentos(criado_por);
create index if not exists idx_documentos_editado_por on public.documentos(editado_por);
create index if not exists idx_documentos_pasta_id on public.documentos(pasta_id);
create index if not exists idx_documentos_created_at on public.documentos(created_at);
create index if not exists idx_documentos_updated_at on public.documentos(updated_at);
create index if not exists idx_documentos_deleted_at on public.documentos(deleted_at);
create index if not exists idx_documentos_tags on public.documentos using gin(tags);
create index if not exists idx_documentos_titulo_trgm on public.documentos using gin(titulo gin_trgm_ops);
create index if not exists idx_documentos_descricao_trgm on public.documentos using gin(descricao gin_trgm_ops);

-- Versões de documentos (histórico)
create table if not exists public.documentos_versoes (
  id bigint generated always as identity primary key,
  documento_id bigint not null references public.documentos(id) on delete cascade,
  versao integer not null,
  conteudo jsonb not null,
  criado_por bigint references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(documento_id, versao)
);

comment on table public.documentos_versoes is 'Histórico de versões dos documentos';

create index if not exists idx_documentos_versoes_documento_id on public.documentos_versoes(documento_id);
create index if not exists idx_documentos_versoes_criado_por on public.documentos_versoes(criado_por);
create index if not exists idx_documentos_versoes_created_at on public.documentos_versoes(created_at);

-- Uploads anexados a documentos
create table if not exists public.documentos_uploads (
  id bigint generated always as identity primary key,
  documento_id bigint not null references public.documentos(id) on delete cascade,
  arquivo_nome text not null,
  arquivo_url text not null,
  arquivo_tamanho integer,
  tipo_media text,
  criado_por bigint references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.documentos_uploads is 'Uploads (imagens, PDFs, etc.) anexados a documentos';

create index if not exists idx_documentos_uploads_documento_id on public.documentos_uploads(documento_id);
create index if not exists idx_documentos_uploads_criado_por on public.documentos_uploads(criado_por);
create index if not exists idx_documentos_uploads_tipo_media on public.documentos_uploads(tipo_media);

-- Compartilhamento de documentos
create table if not exists public.documentos_compartilhados (
  id bigint generated always as identity primary key,
  documento_id bigint not null references public.documentos(id) on delete cascade,
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  compartilhado_por bigint references public.usuarios(id) on delete set null,
  pode_editar boolean not null default false,
  pode_comentar boolean not null default true,
  pode_deletar boolean not null default false,
  created_at timestamptz not null default now(),
  unique(documento_id, usuario_id)
);

comment on table public.documentos_compartilhados is 'Compartilhamento de documentos com controle de permissões';
comment on column public.documentos_compartilhados.pode_editar is 'Usuário pode editar o documento';
comment on column public.documentos_compartilhados.pode_comentar is 'Usuário pode adicionar comentários';
comment on column public.documentos_compartilhados.pode_deletar is 'Usuário pode deletar o documento';

create index if not exists idx_documentos_compartilhados_documento_id on public.documentos_compartilhados(documento_id);
create index if not exists idx_documentos_compartilhados_usuario_id on public.documentos_compartilhados(usuario_id);
create index if not exists idx_documentos_compartilhados_compartilhado_por on public.documentos_compartilhados(compartilhado_por);
create index if not exists idx_documentos_compartilhados_pode_deletar on public.documentos_compartilhados(pode_deletar);

-- Templates de documentos
create table if not exists public.templates (
  id bigint generated always as identity primary key,
  titulo text not null,
  conteudo jsonb not null,
  categoria text,
  criado_por bigint references public.usuarios(id) on delete set null,
  visibilidade text not null default 'privado' check (visibilidade in ('privado', 'publico')),
  uso_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.templates is 'Templates reutilizáveis de documentos';
comment on column public.templates.visibilidade is 'privado (só criador) ou publico (todos usuários)';
comment on column public.templates.uso_count is 'Contador de quantas vezes o template foi usado';

create index if not exists idx_templates_criado_por on public.templates(criado_por);
create index if not exists idx_templates_visibilidade on public.templates(visibilidade);
create index if not exists idx_templates_categoria on public.templates(categoria);
create index if not exists idx_templates_uso_count on public.templates(uso_count);
create index if not exists idx_templates_titulo_trgm on public.templates using gin(titulo gin_trgm_ops);

-- Salas de chat
create table if not exists public.salas_chat (
  id bigint generated always as identity primary key,
  nome text not null,
  tipo text not null check (tipo in ('geral', 'documento', 'privado', 'grupo')),
  documento_id bigint references public.documentos(id) on delete cascade,
  criado_por bigint not null references public.usuarios(id) on delete restrict,
  participante_id bigint references public.usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint salas_chat_privado_participante check (
    (tipo = 'privado' and participante_id is not null) or
    (tipo != 'privado')
  )
);

comment on table public.salas_chat is 'Salas de chat: Sala Geral, chat de documento, conversas privadas 1-para-1, ou grupos';
comment on column public.salas_chat.tipo is 'geral (sala única do sistema), documento (vinculado a um doc), privado (conversa 1-para-1), grupo (múltiplos usuários)';
comment on column public.salas_chat.documento_id is 'ID do documento vinculado (somente para tipo = documento)';
comment on column public.salas_chat.participante_id is 'ID do segundo participante (somente para tipo = privado)';

create index if not exists idx_salas_chat_criado_por on public.salas_chat(criado_por);
create index if not exists idx_salas_chat_tipo on public.salas_chat(tipo);
create index if not exists idx_salas_chat_documento_id on public.salas_chat(documento_id);
create index if not exists idx_salas_chat_participante_id on public.salas_chat(participante_id);

-- Índice parcial único: apenas uma Sala Geral
create unique index if not exists idx_salas_chat_unico_sala_geral
  on public.salas_chat (tipo, nome)
  where tipo = 'geral';

comment on index idx_salas_chat_unico_sala_geral is 'Garante que existe apenas uma Sala Geral no sistema com nome canônico "Sala Geral"';

-- Índice parcial único: evitar duplicidade de conversas privadas
create unique index if not exists idx_salas_chat_unico_privado
  on public.salas_chat (
    tipo,
    least(criado_por, participante_id),
    greatest(criado_por, participante_id)
  )
  where tipo = 'privado';

comment on index idx_salas_chat_unico_privado is 'Evita duplicidade de conversas privadas 1-para-1 entre os mesmos usuários';

-- Mensagens de chat
create table if not exists public.mensagens_chat (
  id bigint generated always as identity primary key,
  sala_id bigint not null references public.salas_chat(id) on delete cascade,
  usuario_id bigint not null references public.usuarios(id) on delete restrict,
  conteudo text not null,
  tipo text not null check (tipo in ('texto', 'arquivo', 'sistema')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.mensagens_chat is 'Mensagens de chat enviadas em salas';
comment on column public.mensagens_chat.tipo is 'texto (mensagem normal), arquivo (upload), sistema (notificações automáticas)';

create index if not exists idx_mensagens_chat_sala_id on public.mensagens_chat(sala_id);
create index if not exists idx_mensagens_chat_usuario_id on public.mensagens_chat(usuario_id);
create index if not exists idx_mensagens_chat_created_at on public.mensagens_chat(created_at);
create index if not exists idx_mensagens_chat_conteudo_trgm on public.mensagens_chat using gin(conteudo gin_trgm_ops);

-- ============================================================================
-- RLS Policies
-- ============================================================================

alter table public.pastas enable row level security;
alter table public.documentos enable row level security;
alter table public.documentos_versoes enable row level security;
alter table public.documentos_uploads enable row level security;
alter table public.documentos_compartilhados enable row level security;
alter table public.templates enable row level security;
alter table public.salas_chat enable row level security;
alter table public.mensagens_chat enable row level security;

-- service_role: acesso total
create policy "service role full access - pastas"
  on public.pastas for all
  to service_role
  using (true) with check (true);

create policy "service role full access - documentos"
  on public.documentos for all
  to service_role
  using (true) with check (true);

create policy "service role full access - documentos_versoes"
  on public.documentos_versoes for all
  to service_role
  using (true) with check (true);

create policy "service role full access - documentos_uploads"
  on public.documentos_uploads for all
  to service_role
  using (true) with check (true);

create policy "service role full access - documentos_compartilhados"
  on public.documentos_compartilhados for all
  to service_role
  using (true) with check (true);

create policy "service role full access - templates"
  on public.templates for all
  to service_role
  using (true) with check (true);

create policy "service role full access - salas_chat"
  on public.salas_chat for all
  to service_role
  using (true) with check (true);

create policy "service role full access - mensagens_chat"
  on public.mensagens_chat for all
  to service_role
  using (true) with check (true);

-- authenticated: acesso básico (SELECT)
create policy "authenticated select - documentos"
  on public.documentos for select
  to authenticated
  using (
    criado_por = get_current_user_id() or
    id in (
      select documento_id from public.documentos_compartilhados
      where usuario_id = get_current_user_id()
    )
  );

create policy "authenticated select - salas_chat"
  on public.salas_chat for select
  to authenticated
  using (
    tipo = 'geral' or
    criado_por = get_current_user_id() or
    participante_id = get_current_user_id() or
    (tipo = 'documento' and documento_id in (
      select id from public.documentos
      where criado_por = get_current_user_id() or
      id in (
        select documento_id from public.documentos_compartilhados
        where usuario_id = get_current_user_id()
      )
    ))
  );

create policy "authenticated select - mensagens_chat"
  on public.mensagens_chat for select
  to authenticated
  using (
    sala_id in (
      select id from public.salas_chat
      where criado_por = get_current_user_id()
        or participante_id = get_current_user_id()
        or tipo = 'geral'
        or (tipo = 'documento' and documento_id in (
          select id from public.documentos
          where criado_por = get_current_user_id()
        ))
    )
  );

-- =====================================================
-- From: 38_embeddings.sql
-- =====================================================

-- ============================================================================
-- Tabela: embeddings
-- Sistema unificado de embeddings para busca semântica (RAG)
-- ============================================================================

-- Habilitar extensão pgvector
create extension if not exists vector;

-- Tabela unificada de embeddings
create table if not exists public.embeddings (
  id bigint generated always as identity primary key,

  -- Conteúdo e vetor
  content text not null,
  embedding vector(1536),  -- OpenAI text-embedding-3-small

  -- Contexto da entidade
  entity_type text not null check (entity_type in (
    'documento', 'processo_peca', 'processo_andamento',
    'contrato', 'expediente', 'assinatura_digital'
  )),
  entity_id bigint not null,
  parent_id bigint,  -- Ex: processo_id para peças

  -- Metadados flexíveis
  metadata jsonb default '{}'::jsonb,

  -- Auditoria
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  indexed_by bigint references public.usuarios(id) on delete set null
);

-- Índice HNSW para busca vetorial ultra-rápida
create index if not exists idx_embeddings_vector_cosine
  on public.embeddings
  using hnsw (embedding vector_cosine_ops);

-- Índices para filtragem pré-busca (pre-filtering)
create index if not exists idx_embeddings_entity_type_id
  on public.embeddings (entity_type, entity_id);
create index if not exists idx_embeddings_parent_id
  on public.embeddings (parent_id);
create index if not exists idx_embeddings_metadata_gin
  on public.embeddings using gin (metadata);
create index if not exists idx_embeddings_created_at
  on public.embeddings (created_at);

-- RLS
alter table public.embeddings enable row level security;

create policy "service role full access - embeddings"
  on public.embeddings for all
  to service_role
  using (true) with check (true);

-- Função RPC de busca semântica
create or replace function public.match_embeddings (
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5,
  filter_entity_type text default null,
  filter_parent_id bigint default null,
  filter_metadata jsonb default null
)
returns table (
  id bigint,
  content text,
  entity_type text,
  entity_id bigint,
  parent_id bigint,
  metadata jsonb,
  similarity float
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select
    e.id,
    e.content,
    e.entity_type,
    e.entity_id,
    e.parent_id,
    e.metadata,
    1 - (e.embedding <=> query_embedding) as similarity
  from public.embeddings e
  where
    1 - (e.embedding <=> query_embedding) > match_threshold
    and (filter_entity_type is null or e.entity_type = filter_entity_type)
    and (filter_parent_id is null or e.parent_id = filter_parent_id)
    and (filter_metadata is null or e.metadata @> filter_metadata)
  order by e.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Comentários para documentação
comment on table public.embeddings is 'Armazena embeddings vetoriais para busca semântica RAG';
comment on column public.embeddings.embedding is 'Vetor de 1536 dimensões gerado pelo OpenAI text-embedding-3-small';
comment on column public.embeddings.entity_type is 'Tipo da entidade origem: documento, processo_peca, etc';
comment on column public.embeddings.parent_id is 'ID do pai (ex: processo_id para peças de processo)';
comment on function public.match_embeddings is 'Busca semântica usando similaridade de cosseno com filtros opcionais';

-- =====================================================
-- From: 39_chamadas.sql
-- =====================================================

-- CHAT CALLS FEATURE
-- Tabelas para gerenciamento de chamadas de áudio/vídeo e histórico

-- ENUMS já existem ou vamos usar constraints de texto para simplicidade e compatibilidade com domain

-- Tabela de Chamadas
CREATE TABLE IF NOT EXISTS chamadas (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    meeting_id TEXT NOT NULL, -- ID do Dyte ou similar
    sala_id BIGINT NOT NULL REFERENCES salas_chat(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('audio', 'video')),
    iniciado_por BIGINT NOT NULL REFERENCES usuarios(id),
    status TEXT NOT NULL CHECK (status IN ('iniciada', 'em_andamento', 'finalizada', 'cancelada', 'recusada')),
    iniciada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finalizada_em TIMESTAMPTZ,
    duracao_segundos INTEGER,
    transcricao TEXT,
    resumo TEXT,
    gravacao_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Participantes da Chamada
CREATE TABLE IF NOT EXISTS chamadas_participantes (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    chamada_id BIGINT NOT NULL REFERENCES chamadas(id) ON DELETE CASCADE,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    entrou_em TIMESTAMPTZ,
    saiu_em TIMESTAMPTZ,
    duracao_segundos INTEGER,
    aceitou BOOLEAN, -- null = pendente, true = aceitou, false = recusou
    respondeu_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(chamada_id, usuario_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chamadas_sala_id ON chamadas(sala_id);
CREATE INDEX IF NOT EXISTS idx_chamadas_iniciado_por ON chamadas(iniciado_por);
CREATE INDEX IF NOT EXISTS idx_chamadas_status ON chamadas(status);
CREATE INDEX IF NOT EXISTS idx_chamadas_iniciada_em ON chamadas(iniciada_em);
CREATE UNIQUE INDEX IF NOT EXISTS idx_chamadas_meeting_id ON chamadas(meeting_id);

CREATE INDEX IF NOT EXISTS idx_chamadas_participantes_chamada_id ON chamadas_participantes(chamada_id);
CREATE INDEX IF NOT EXISTS idx_chamadas_participantes_usuario_id ON chamadas_participantes(usuario_id);
-- Índice composto para otimizar políticas RLS
CREATE INDEX IF NOT EXISTS idx_chamadas_participantes_usuario_id_chamada_id ON chamadas_participantes(usuario_id, chamada_id);
-- Índice composto para otimizar verificação de iniciador e sala
CREATE INDEX IF NOT EXISTS idx_chamadas_iniciado_por_sala_id ON chamadas(iniciado_por, sala_id);

-- ============================================================================
-- FUNÇÃO HELPER: Verifica se usuário é participante (bypass RLS para evitar recursão)
-- ============================================================================
-- Esta função usa SECURITY DEFINER para executar com privilégios elevados,
-- permitindo consultar chamadas_participantes sem acionar RLS e quebrar ciclos de recursão
CREATE OR REPLACE FUNCTION public.user_is_chamada_participant(
    p_chamada_id BIGINT,
    p_usuario_id BIGINT
)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.chamadas_participantes
        WHERE chamada_id = p_chamada_id
        AND usuario_id = p_usuario_id
    );
$$;

COMMENT ON FUNCTION public.user_is_chamada_participant IS
    'Verifica se um usuário é participante de uma chamada. Usa SECURITY DEFINER para bypass RLS e evitar recursão infinita em políticas RLS.';

-- RLS Policies
ALTER TABLE chamadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE chamadas_participantes ENABLE ROW LEVEL SECURITY;

-- Chamadas Policies
-- NOTA: Usa função helper para evitar recursão infinita com chamadas_participantes
CREATE POLICY "Usuários podem ver chamadas que iniciaram ou participam"
    ON chamadas FOR SELECT
    TO authenticated
    USING (
        (SELECT get_current_user_id()) = iniciado_por OR
        public.user_is_chamada_participant(chamadas.id, (SELECT get_current_user_id())) OR
        -- Também permitir se for membro da sala (para histórico)
        EXISTS (
            SELECT 1 FROM salas_chat sc
            WHERE sc.id = chamadas.sala_id AND (
                sc.criado_por = (SELECT get_current_user_id()) OR 
                sc.participante_id = (SELECT get_current_user_id()) OR
                sc.tipo = 'geral' -- Se for geral, todos veem
            )
        )
    );

CREATE POLICY "Usuários podem criar chamadas"
    ON chamadas FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT get_current_user_id()) = iniciado_por);

CREATE POLICY "Participantes podem atualizar chamadas"
    ON chamadas FOR UPDATE
    TO authenticated
    USING (
        (SELECT get_current_user_id()) = iniciado_por OR
        public.user_is_chamada_participant(chamadas.id, (SELECT get_current_user_id()))
    );

-- Participantes Policies
-- NOTA: Usa verificações diretas sem depender de políticas RLS de chamadas
-- para evitar recursão infinita
CREATE POLICY "Usuários podem ver participantes de chamadas que têm acesso"
    ON chamadas_participantes FOR SELECT
    TO authenticated
    USING (
        -- Se o usuário é o próprio participante, pode ver
        usuario_id = (SELECT get_current_user_id()) OR
        -- Se o usuário iniciou a chamada (verificação direta na tabela, bypass RLS)
        EXISTS (
            SELECT 1 FROM public.chamadas c
            WHERE c.id = chamadas_participantes.chamada_id 
            AND c.iniciado_por = (SELECT get_current_user_id())
        ) OR
        -- Se o usuário é membro da sala (verificação direta, bypass RLS)
        EXISTS (
            SELECT 1 FROM public.chamadas c
            JOIN public.salas_chat sc ON sc.id = c.sala_id
            WHERE c.id = chamadas_participantes.chamada_id
            AND (
                sc.criado_por = (SELECT get_current_user_id()) OR
                sc.participante_id = (SELECT get_current_user_id()) OR
                sc.tipo = 'geral'
            )
        )
    );

CREATE POLICY "Sistema/Iniciador pode adicionar participantes"
    ON chamadas_participantes FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chamadas c
            WHERE c.id = chamada_id AND c.iniciado_por = (SELECT get_current_user_id())
        ) OR usuario_id = (SELECT get_current_user_id()) -- Auto-entrar
    );

CREATE POLICY "Participantes podem atualizar seus próprios status"
    ON chamadas_participantes FOR UPDATE
    TO authenticated
    USING (usuario_id = (SELECT get_current_user_id()));

-- =====================================================
-- From: 40_mcp_audit.sql
-- =====================================================

-- ============================================================================
-- Tabela: mcp_audit_log
-- Registro de auditoria de todas as chamadas ao servidor MCP
-- ============================================================================

create table if not exists public.mcp_audit_log (
  id bigserial primary key,
  tool_name varchar(255) not null,
  usuario_id bigint references public.usuarios(id),
  arguments jsonb,
  result jsonb,
  success boolean not null default true,
  error_message text,
  duration_ms integer,
  ip_address varchar(45),
  user_agent text,
  created_at timestamptz not null default now()
);

comment on table public.mcp_audit_log is 'Registro de auditoria de todas as chamadas ao servidor MCP';
comment on column public.mcp_audit_log.tool_name is 'Nome da ferramenta MCP chamada';
comment on column public.mcp_audit_log.arguments is 'Argumentos passados para a ferramenta';
comment on column public.mcp_audit_log.result is 'Resultado retornado pela ferramenta';
comment on column public.mcp_audit_log.success is 'Indica se a chamada foi bem sucedida';
comment on column public.mcp_audit_log.duration_ms is 'Duração da execução em milissegundos';

-- Índices
create index if not exists idx_mcp_audit_tool_name on public.mcp_audit_log(tool_name);
create index if not exists idx_mcp_audit_usuario on public.mcp_audit_log(usuario_id);
create index if not exists idx_mcp_audit_created_at on public.mcp_audit_log(created_at);
create index if not exists idx_mcp_audit_tool_created on public.mcp_audit_log(tool_name, created_at desc);
create index if not exists idx_mcp_audit_success on public.mcp_audit_log(success) where not success;

-- ============================================================================
-- Tabela: mcp_quotas
-- Quotas e limites de uso do MCP por usuário
-- ============================================================================

create table if not exists public.mcp_quotas (
  id bigserial primary key,
  usuario_id bigint references public.usuarios(id),
  tier varchar(50) not null default 'authenticated',
  calls_today integer not null default 0,
  calls_month integer not null default 0,
  last_call_at timestamptz,
  quota_reset_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(usuario_id)
);

comment on table public.mcp_quotas is 'Quotas e limites de uso do MCP por usuário';
comment on column public.mcp_quotas.tier is 'Tier do usuário: anonymous, authenticated, service';
comment on column public.mcp_quotas.calls_today is 'Número de chamadas realizadas hoje';
comment on column public.mcp_quotas.calls_month is 'Número de chamadas realizadas no mês';

-- Índices
create index if not exists idx_mcp_quotas_tier on public.mcp_quotas(tier);

-- ============================================================================
-- Funções auxiliares
-- ============================================================================

-- Função para atualizar updated_at automaticamente
create or replace function public.update_mcp_quotas_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger para atualizar updated_at
drop trigger if exists trigger_update_mcp_quotas_updated_at on public.mcp_quotas;
create trigger trigger_update_mcp_quotas_updated_at
  before update on public.mcp_quotas
  for each row
  execute function public.update_mcp_quotas_updated_at();

-- Função para limpar registros antigos de auditoria (manter últimos 90 dias)
create or replace function public.cleanup_old_mcp_audit_logs()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  delete from public.mcp_audit_log
  where created_at < now() - interval '90 days';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

-- Habilitar RLS
alter table public.mcp_audit_log enable row level security;
alter table public.mcp_quotas enable row level security;

-- Políticas para mcp_audit_log (apenas super admin pode ver)
create policy "mcp_audit_log_admin_select" on public.mcp_audit_log
  for select
  to authenticated
  using (
    exists (
      select 1 from public.usuarios u
      where u.auth_user_id = (select auth.uid())
      and u.is_super_admin = true
    )
  );

-- Políticas para mcp_quotas (usuário vê próprias quotas, super admin vê todas)
create policy "mcp_quotas_user_select" on public.mcp_quotas
  for select
  to authenticated
  using (
    usuario_id in (
      select id from public.usuarios where auth_user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.usuarios u
      where u.auth_user_id = (select auth.uid())
      and u.is_super_admin = true
    )
  );

-- Service role pode fazer tudo (para operações internas)
-- Nota: Service role não precisa de RLS, mas mantemos para consistência
create policy "mcp_audit_log_service_all" on public.mcp_audit_log
  for all
  to service_role
  using (true)
  with check (true);

create policy "mcp_quotas_service_all" on public.mcp_quotas
  for all
  to service_role
  using (true)
  with check (true);


-- =====================================================
-- From: 41_tags.sql
-- =====================================================

-- Tabela de tags (sistema unificado de tags)

create table if not exists public.tags (
  id bigint generated always as identity primary key,
  nome text not null,
  slug text not null,
  cor text null,
  created_at timestamptz not null default now(),
  unique (slug)
);

alter table public.tags enable row level security;

-- =====================================================
-- From: 42_contrato_partes.sql
-- =====================================================

-- Partes do contrato (modelo relacional)

create table if not exists public.contrato_partes (
  id bigint generated always as identity primary key,
  contrato_id bigint not null references public.contratos(id) on delete cascade,
  tipo_entidade text not null check (tipo_entidade in ('cliente', 'parte_contraria')),
  entidade_id bigint not null,
  papel_contratual public.papel_contratual not null,
  ordem integer not null default 0 check (ordem >= 0),
  nome_snapshot text null,
  cpf_cnpj_snapshot text null,
  created_at timestamptz not null default now(),
  unique (contrato_id, tipo_entidade, entidade_id, papel_contratual)
);

create index if not exists idx_contrato_partes_contrato_id on public.contrato_partes using btree (contrato_id);
create index if not exists idx_contrato_partes_entidade on public.contrato_partes using btree (tipo_entidade, entidade_id);
create index if not exists idx_contrato_partes_papel on public.contrato_partes using btree (papel_contratual);

alter table public.contrato_partes enable row level security;

-- =====================================================
-- From: 43_contrato_status_historico.sql
-- =====================================================

-- Histórico de mudanças de status do contrato

create table if not exists public.contrato_status_historico (
  id bigint generated always as identity primary key,
  contrato_id bigint not null references public.contratos(id) on delete cascade,
  from_status public.status_contrato null,
  to_status public.status_contrato not null,
  changed_at timestamptz not null default now(),
  changed_by bigint null references public.usuarios(id) on delete set null,
  reason text null,
  metadata jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists idx_contrato_status_historico_contrato_id on public.contrato_status_historico using btree (contrato_id);
create index if not exists idx_contrato_status_historico_changed_at on public.contrato_status_historico using btree (changed_at);

alter table public.contrato_status_historico enable row level security;

-- =====================================================
-- From: 44_contrato_tags.sql
-- =====================================================

-- Relação N:N entre contratos e tags

create table if not exists public.contrato_tags (
  id bigint generated always as identity primary key,
  contrato_id bigint not null references public.contratos(id) on delete cascade,
  tag_id bigint not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (contrato_id, tag_id)
);

create index if not exists idx_contrato_tags_contrato_id on public.contrato_tags using btree (contrato_id);
create index if not exists idx_contrato_tags_tag_id on public.contrato_tags using btree (tag_id);

alter table public.contrato_tags enable row level security;

-- =====================================================
-- From: 45_processo_tags.sql
-- =====================================================

-- Relação N:N entre processos (acervo) e tags

create table if not exists public.processo_tags (
  id bigint generated always as identity primary key,
  processo_id bigint not null references public.acervo(id) on delete cascade,
  tag_id bigint not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (processo_id, tag_id)
);

create index if not exists idx_processo_tags_processo_id on public.processo_tags using btree (processo_id);
create index if not exists idx_processo_tags_tag_id on public.processo_tags using btree (tag_id);

alter table public.processo_tags enable row level security;

-- =====================================================
-- From: 46_contrato_tags_propagacao.sql
-- =====================================================

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

-- =====================================================
-- From: 47_pericias.sql
-- =====================================================

-- ============================================================================
-- Tabela: especialidades_pericia
-- Especialidades de perícia disponíveis no PJE
-- ============================================================================

create table public.especialidades_pericia (
  id bigint generated always as identity primary key,
  id_pje bigint not null,
  trt public.codigo_tribunal not null,
  grau public.grau_tribunal not null,
  descricao text not null,
  ativo boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  -- Garantir unicidade por ID do PJE, TRT e grau
  unique (id_pje, trt, grau)
);

comment on table public.especialidades_pericia is 'Especialidades de perícia disponíveis no PJE (ex: Insalubridade, Medicina do Trabalho, Psiquiatria)';
comment on column public.especialidades_pericia.id_pje is 'ID da especialidade no sistema PJE';
comment on column public.especialidades_pericia.trt is 'Código do TRT onde a especialidade está cadastrada';
comment on column public.especialidades_pericia.grau is 'Grau do processo (primeiro_grau ou segundo_grau)';
comment on column public.especialidades_pericia.descricao is 'Descrição da especialidade (ex: Perícia de Insalubridade, Medicina do Trabalho)';
comment on column public.especialidades_pericia.ativo is 'Indica se a especialidade está ativa no sistema';

-- Índices
create index idx_especialidades_pericia_id_pje on public.especialidades_pericia using btree (id_pje);
create index idx_especialidades_pericia_trt on public.especialidades_pericia using btree (trt);
create index idx_especialidades_pericia_grau on public.especialidades_pericia using btree (grau);
create index idx_especialidades_pericia_trt_grau on public.especialidades_pericia using btree (trt, grau);
create index idx_especialidades_pericia_descricao on public.especialidades_pericia using btree (descricao);

-- Trigger para atualizar updated_at
create trigger update_especialidades_pericia_updated_at
before update on public.especialidades_pericia
for each row
execute function public.update_updated_at_column();

-- RLS
alter table public.especialidades_pericia enable row level security;

-- ============================================================================
-- Tabela: pericias
-- Perícias designadas nos processos
-- ============================================================================

create table public.pericias (
  id bigint generated always as identity primary key,
  id_pje bigint not null,
  advogado_id bigint not null references public.advogados(id) on delete cascade,
  processo_id bigint not null references public.acervo(id) on delete cascade,
  orgao_julgador_id bigint references public.orgao_julgador(id) on delete set null,
  trt public.codigo_tribunal not null,
  grau public.grau_tribunal not null,
  numero_processo text not null,
  
  -- Datas
  prazo_entrega timestamptz,
  data_aceite timestamptz,
  data_criacao timestamptz not null,
  
  -- Situação
  situacao_codigo public.situacao_pericia not null,
  situacao_descricao text,
  situacao_pericia text,  -- Versão em maiúsculas da descrição (ex: FINALIZADA)
  
  -- Laudo
  id_documento_laudo bigint,
  laudo_juntado boolean not null default false,
  
  -- Especialidade e Perito
  especialidade_id bigint references public.especialidades_pericia(id) on delete set null,
  perito_id bigint references public.terceiros(id) on delete set null,
  
  -- Processo
  classe_judicial_sigla text,
  data_proxima_audiencia timestamptz,
  segredo_justica boolean not null default false,
  juizo_digital boolean not null default false,
  arquivado boolean not null default false,
  prioridade_processual boolean not null default false,
  
  -- Permissões (armazenadas como JSONB)
  permissoes_pericia jsonb,
  
  -- Editor
  funcionalidade_editor text,
  
  -- Controle
  responsavel_id bigint references public.usuarios(id) on delete set null,
  observacoes text,
  dados_anteriores jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  -- Garantir unicidade da perícia
  unique (id_pje, trt, grau, numero_processo)
);

comment on table public.pericias is 'Perícias designadas nos processos capturados do PJE. A unicidade é garantida por (id_pje, trt, grau, numero_processo), permitindo que múltiplos advogados vejam a mesma perícia sem duplicação';
comment on column public.pericias.id_pje is 'ID da perícia no sistema PJE';
comment on column public.pericias.advogado_id is 'Referência ao advogado que capturou a perícia (não faz parte da unicidade)';
comment on column public.pericias.processo_id is 'Referência ao processo na tabela acervo';
comment on column public.pericias.orgao_julgador_id is 'Referência ao órgão julgador da perícia';
comment on column public.pericias.trt is 'Código do TRT onde a perícia está designada';
comment on column public.pericias.grau is 'Grau do processo (primeiro_grau ou segundo_grau)';
comment on column public.pericias.numero_processo is 'Número do processo no formato CNJ';
comment on column public.pericias.prazo_entrega is 'Prazo para entrega do laudo pericial';
comment on column public.pericias.data_aceite is 'Data em que o perito aceitou a perícia';
comment on column public.pericias.data_criacao is 'Data de criação da perícia no PJE';
comment on column public.pericias.situacao_codigo is 'Código da situação (S, L, C, F, P, R)';
comment on column public.pericias.situacao_descricao is 'Descrição da situação (ex: Finalizada, Cancelada)';
comment on column public.pericias.situacao_pericia is 'Situação em maiúsculas (ex: FINALIZADA, CANCELADA)';
comment on column public.pericias.id_documento_laudo is 'ID do documento do laudo pericial no PJE';
comment on column public.pericias.laudo_juntado is 'Indica se o laudo foi juntado aos autos';
comment on column public.pericias.especialidade_id is 'FK para especialidades_pericia';
comment on column public.pericias.perito_id is 'FK para terceiros (tipo_parte=PERITO)';
comment on column public.pericias.classe_judicial_sigla is 'Sigla da classe judicial do processo (ex: ATOrd, ATSum)';
comment on column public.pericias.data_proxima_audiencia is 'Data da próxima audiência do processo';
comment on column public.pericias.segredo_justica is 'Indica se o processo está em segredo de justiça';
comment on column public.pericias.juizo_digital is 'Indica se o processo está em juízo digital';
comment on column public.pericias.arquivado is 'Indica se o processo está arquivado';
comment on column public.pericias.prioridade_processual is 'Indica se o processo tem prioridade processual';
comment on column public.pericias.permissoes_pericia is 'Objeto JSON com permissões da perícia (permitidoPeticionar, permitidoJuntarLaudo, etc)';
comment on column public.pericias.funcionalidade_editor is 'Código da funcionalidade do editor (ex: Z)';
comment on column public.pericias.responsavel_id is 'Usuário responsável pela perícia. Pode ser atribuído, transferido ou desatribuído';
comment on column public.pericias.observacoes is 'Observações sobre a perícia';
comment on column public.pericias.dados_anteriores is 'Armazena o estado anterior do registro antes da última atualização';

-- Índices para melhor performance
create index idx_pericias_advogado_id on public.pericias using btree (advogado_id);
create index idx_pericias_processo_id on public.pericias using btree (processo_id);
create index idx_pericias_orgao_julgador_id on public.pericias using btree (orgao_julgador_id);
create index idx_pericias_trt on public.pericias using btree (trt);
create index idx_pericias_grau on public.pericias using btree (grau);
create index idx_pericias_id_pje on public.pericias using btree (id_pje);
create index idx_pericias_numero_processo on public.pericias using btree (numero_processo);
create index idx_pericias_situacao_codigo on public.pericias using btree (situacao_codigo);
create index idx_pericias_prazo_entrega on public.pericias using btree (prazo_entrega);
create index idx_pericias_data_criacao on public.pericias using btree (data_criacao);
create index idx_pericias_responsavel_id on public.pericias using btree (responsavel_id);
create index idx_pericias_especialidade_id on public.pericias using btree (especialidade_id);
create index idx_pericias_perito_id on public.pericias using btree (perito_id);
create index idx_pericias_laudo_juntado on public.pericias using btree (laudo_juntado);
create index idx_pericias_advogado_trt_grau on public.pericias using btree (advogado_id, trt, grau);
create index idx_pericias_processo_data on public.pericias using btree (processo_id, data_criacao);

-- Trigger para atualizar updated_at automaticamente
create trigger update_pericias_updated_at
before update on public.pericias
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.pericias enable row level security;


-- =====================================================
-- From: 48_fornecedores.sql
-- =====================================================

-- ============================================================================
-- Tabela: fornecedores
-- Fornecedores do escritório - Tabela global para gestão financeira
-- CPF/CNPJ são as chaves únicas para deduplicação.
-- Utilizada pelo módulo financeiro para contas a pagar.
-- ============================================================================

create table public.fornecedores (
  id bigint generated always as identity primary key,
  
  -- Tipo e identificação
  tipo_pessoa public.tipo_pessoa not null,
  nome text not null,
  nome_social_fantasia text, -- Nome social (PF) ou Nome fantasia (PJ)
  cpf text unique,
  cnpj text unique,
  
  -- Documentação e dados básicos
  rg text,
  data_nascimento date, -- Data de nascimento (PF) ou data de fundação (PJ)
  genero public.genero_usuario,
  estado_civil public.estado_civil,
  nacionalidade text,
  inscricao_estadual text,
  
  -- Contatos
  emails jsonb, -- Array de emails: ["email1@...", "email2@..."]
  ddd_celular text,
  numero_celular text,
  ddd_residencial text,
  numero_residencial text,
  ddd_comercial text,
  numero_comercial text,
  
  -- Dados PF
  sexo text,
  nome_genitora text,
  
  -- Dados PJ
  data_abertura date,
  data_fim_atividade date,
  ramo_atividade text,
  porte_codigo integer,
  porte_descricao text,
  situacao_cnpj_receita_id integer,
  situacao_cnpj_receita_descricao text,
  cpf_responsavel text,
  
  -- Endereço e controle
  endereco_id bigint references public.enderecos(id),
  observacoes text,
  created_by bigint references public.usuarios(id) on delete set null,
  dados_anteriores jsonb,
  ativo boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.fornecedores is 'Fornecedores do escritório - Tabela global para gestão financeira. Utilizada pelo módulo financeiro para contas a pagar.';

-- Comentários dos campos principais
comment on column public.fornecedores.tipo_pessoa is 'Tipo de pessoa: física (pf) ou jurídica (pj)';
comment on column public.fornecedores.nome is 'Nome completo (PF) ou Razão Social (PJ)';
comment on column public.fornecedores.nome_social_fantasia is 'Nome social (para PF) ou nome fantasia (para PJ). Coluna única que serve para ambos os tipos de pessoa.';
comment on column public.fornecedores.cpf is 'CPF do fornecedor (obrigatório para PF, único)';
comment on column public.fornecedores.cnpj is 'CNPJ do fornecedor (obrigatório para PJ, único)';
comment on column public.fornecedores.emails is 'Array de emails em formato JSONB: ["email1@...", "email2@..."]';
comment on column public.fornecedores.data_nascimento is 'Data de nascimento (PF) ou data de fundação/constituição (PJ)';
comment on column public.fornecedores.ramo_atividade is 'Ramo de atividade da pessoa jurídica';
comment on column public.fornecedores.porte_descricao is 'Descrição do porte da empresa (Micro, Pequeno, Médio, Grande)';
comment on column public.fornecedores.situacao_cnpj_receita_descricao is 'Situação do CNPJ na Receita Federal (ATIVA, BAIXADA, etc)';
comment on column public.fornecedores.endereco_id is 'FK para endereços.id - Endereço principal do fornecedor';
comment on column public.fornecedores.dados_anteriores is 'Armazena o estado anterior do registro antes da última atualização. Null quando o registro foi inserido ou quando não houve mudanças.';

-- Índices para melhor performance
create index idx_fornecedores_tipo_pessoa on public.fornecedores using btree (tipo_pessoa);
create index idx_fornecedores_cpf on public.fornecedores using btree (cpf) where cpf is not null;
create index idx_fornecedores_cnpj on public.fornecedores using btree (cnpj) where cnpj is not null;
create index idx_fornecedores_nome on public.fornecedores using btree (nome);
create index idx_fornecedores_ativo on public.fornecedores using btree (ativo);
create index idx_fornecedores_created_by on public.fornecedores using btree (created_by);
create index idx_fornecedores_endereco_id on public.fornecedores using btree (endereco_id);

-- Trigger para atualizar updated_at automaticamente
create trigger update_fornecedores_updated_at
before update on public.fornecedores
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.fornecedores enable row level security;

-- Políticas RLS
create policy "Service role tem acesso total aos fornecedores"
on public.fornecedores for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler fornecedores"
on public.fornecedores for select
to authenticated
using (true);

create policy "Usuários autenticados podem inserir fornecedores"
on public.fornecedores for insert
to authenticated
with check (true);

create policy "Usuários autenticados podem atualizar fornecedores"
on public.fornecedores for update
to authenticated
using (true)
with check (true);

create policy "Usuários autenticados podem deletar fornecedores"
on public.fornecedores for delete
to authenticated
using (true);


-- =====================================================
-- From: 49_todo.sql
-- =====================================================

-- ============================================================================
-- todo (template)
-- ============================================================================
--
-- objetivo:
-- - persistir o template "todo-list-app" (to-dos, subtarefas, comentários, anexos e atribuições)
-- - alinhar o comportamento do front-end com dados do banco (sem json local)
--
-- segurança:
-- - rls habilitado em todas as tabelas
-- - policies permissive para service_role (acesso total)
-- - policies para authenticated (somente linhas do próprio usuário via public.usuarios.auth_user_id)
--

-- ----------------------------------------------------------------------------
-- sequence: todo_items_seq (para ids TD-0001)
-- ----------------------------------------------------------------------------
create sequence if not exists public.todo_items_seq;

-- ----------------------------------------------------------------------------
-- table: todo_items
-- ----------------------------------------------------------------------------
create table if not exists public.todo_items (
  id text primary key default (
    'TD-' || lpad(nextval('public.todo_items_seq')::text, 4, '0')
  ),
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending',
  priority text not null default 'medium',
  due_date date,
  reminder_at timestamp with time zone,
  starred boolean not null default false,
  position integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint todo_items_status_check check (status in ('pending', 'in-progress', 'completed')),
  constraint todo_items_priority_check check (priority in ('low', 'medium', 'high')),
  constraint todo_items_position_check check (position >= 0)
);

comment on table public.todo_items is 'Itens de to-do do usuário (template todo-list-app).';
comment on column public.todo_items.id is 'Identificador do to-do no formato TD-0001.';
comment on column public.todo_items.usuario_id is 'ID do usuário dono do to-do.';
comment on column public.todo_items.title is 'Título do to-do.';
comment on column public.todo_items.description is 'Descrição (opcional).';
comment on column public.todo_items.status is 'Status: pending, in-progress, completed.';
comment on column public.todo_items.priority is 'Prioridade: low, medium, high.';
comment on column public.todo_items.due_date is 'Data prevista (opcional).';
comment on column public.todo_items.reminder_at is 'Data/hora de lembrete (opcional).';
comment on column public.todo_items.starred is 'Indica se o item está marcado como favorito.';
comment on column public.todo_items.position is 'Ordenação do item na lista (0..n).';

create index if not exists idx_todo_items_usuario on public.todo_items(usuario_id);
create index if not exists idx_todo_items_usuario_position on public.todo_items(usuario_id, position);
create index if not exists idx_todo_items_usuario_status on public.todo_items(usuario_id, status);
create index if not exists idx_todo_items_usuario_priority on public.todo_items(usuario_id, priority);
create index if not exists idx_todo_items_usuario_starred on public.todo_items(usuario_id, starred);

alter table public.todo_items enable row level security;

create policy "Service role full access todo_items"
on public.todo_items
for all
to service_role
using (true)
with check (true);

create policy "Authenticated manage own todo_items"
on public.todo_items
for all
to authenticated
using ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id))
with check ((select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id));

-- ----------------------------------------------------------------------------
-- sequence: todo_subtasks_seq (para ids TDS-0001)
-- ----------------------------------------------------------------------------
create sequence if not exists public.todo_subtasks_seq;

-- ----------------------------------------------------------------------------
-- table: todo_subtasks
-- ----------------------------------------------------------------------------
create table if not exists public.todo_subtasks (
  id text primary key default (
    'TDS-' || lpad(nextval('public.todo_subtasks_seq')::text, 4, '0')
  ),
  todo_id text not null references public.todo_items(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  position integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint todo_subtasks_position_check check (position >= 0)
);

comment on table public.todo_subtasks is 'Subtarefas vinculadas a um item de to-do.';
comment on column public.todo_subtasks.todo_id is 'ID do item de to-do (public.todo_items.id).';

create index if not exists idx_todo_subtasks_todo on public.todo_subtasks(todo_id);
create index if not exists idx_todo_subtasks_todo_position on public.todo_subtasks(todo_id, position);

alter table public.todo_subtasks enable row level security;

create policy "Service role full access todo_subtasks"
on public.todo_subtasks
for all
to service_role
using (true)
with check (true);

create policy "Authenticated manage own todo_subtasks"
on public.todo_subtasks
for all
to authenticated
using (
  exists (
    select 1
    from public.todo_items
    join public.usuarios on public.usuarios.id = public.todo_items.usuario_id
    where public.todo_items.id = todo_id
    and public.usuarios.auth_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.todo_items
    join public.usuarios on public.usuarios.id = public.todo_items.usuario_id
    where public.todo_items.id = todo_id
    and public.usuarios.auth_user_id = (select auth.uid())
  )
);

-- ----------------------------------------------------------------------------
-- sequence: todo_comments_seq (para ids TDC-0001)
-- ----------------------------------------------------------------------------
create sequence if not exists public.todo_comments_seq;

-- ----------------------------------------------------------------------------
-- table: todo_comments
-- ----------------------------------------------------------------------------
create table if not exists public.todo_comments (
  id text primary key default (
    'TDC-' || lpad(nextval('public.todo_comments_seq')::text, 4, '0')
  ),
  todo_id text not null references public.todo_items(id) on delete cascade,
  body text not null,
  created_at timestamp with time zone not null default now()
);

comment on table public.todo_comments is 'Comentários vinculados a um item de to-do.';
comment on column public.todo_comments.todo_id is 'ID do item de to-do (public.todo_items.id).';
comment on column public.todo_comments.body is 'Conteúdo do comentário.';

create index if not exists idx_todo_comments_todo on public.todo_comments(todo_id);
create index if not exists idx_todo_comments_todo_created_at on public.todo_comments(todo_id, created_at);

alter table public.todo_comments enable row level security;

create policy "Service role full access todo_comments"
on public.todo_comments
for all
to service_role
using (true)
with check (true);

create policy "Authenticated manage own todo_comments"
on public.todo_comments
for all
to authenticated
using (
  exists (
    select 1
    from public.todo_items
    join public.usuarios on public.usuarios.id = public.todo_items.usuario_id
    where public.todo_items.id = todo_id
    and public.usuarios.auth_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.todo_items
    join public.usuarios on public.usuarios.id = public.todo_items.usuario_id
    where public.todo_items.id = todo_id
    and public.usuarios.auth_user_id = (select auth.uid())
  )
);

-- ----------------------------------------------------------------------------
-- sequence: todo_files_seq (para ids TDF-0001)
-- ----------------------------------------------------------------------------
create sequence if not exists public.todo_files_seq;

-- ----------------------------------------------------------------------------
-- table: todo_files
-- ----------------------------------------------------------------------------
create table if not exists public.todo_files (
  id text primary key default (
    'TDF-' || lpad(nextval('public.todo_files_seq')::text, 4, '0')
  ),
  todo_id text not null references public.todo_items(id) on delete cascade,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  url text not null,
  created_at timestamp with time zone not null default now()
);

comment on table public.todo_files is 'Anexos (metadados + url) vinculados a um item de to-do.';
comment on column public.todo_files.todo_id is 'ID do item de to-do (public.todo_items.id).';
comment on column public.todo_files.url is 'URL do anexo (no v1 pode ser data-url/base64; futuramente storage path).';

create index if not exists idx_todo_files_todo on public.todo_files(todo_id);

alter table public.todo_files enable row level security;

create policy "Service role full access todo_files"
on public.todo_files
for all
to service_role
using (true)
with check (true);

create policy "Authenticated manage own todo_files"
on public.todo_files
for all
to authenticated
using (
  exists (
    select 1
    from public.todo_items
    join public.usuarios on public.usuarios.id = public.todo_items.usuario_id
    where public.todo_items.id = todo_id
    and public.usuarios.auth_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.todo_items
    join public.usuarios on public.usuarios.id = public.todo_items.usuario_id
    where public.todo_items.id = todo_id
    and public.usuarios.auth_user_id = (select auth.uid())
  )
);

-- ----------------------------------------------------------------------------
-- table: todo_assignees (integração com public.usuarios)
-- ----------------------------------------------------------------------------
create table if not exists public.todo_assignees (
  todo_id text not null references public.todo_items(id) on delete cascade,
  usuario_id bigint not null references public.usuarios(id) on delete restrict,
  created_at timestamp with time zone not null default now(),
  constraint todo_assignees_pkey primary key (todo_id, usuario_id)
);

comment on table public.todo_assignees is 'Tabela de junção (N:N) entre todo_items e usuarios (atribuídos).';
comment on column public.todo_assignees.todo_id is 'ID do item de to-do.';
comment on column public.todo_assignees.usuario_id is 'ID do usuário atribuído ao to-do.';

create index if not exists idx_todo_assignees_todo on public.todo_assignees(todo_id);
create index if not exists idx_todo_assignees_usuario on public.todo_assignees(usuario_id);

alter table public.todo_assignees enable row level security;

create policy "Service role full access todo_assignees"
on public.todo_assignees
for all
to service_role
using (true)
with check (true);

create policy "Authenticated manage own todo_assignees"
on public.todo_assignees
for all
to authenticated
using (
  exists (
    select 1
    from public.todo_items
    join public.usuarios on public.usuarios.id = public.todo_items.usuario_id
    where public.todo_items.id = todo_id
    and public.usuarios.auth_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.todo_items
    join public.usuarios on public.usuarios.id = public.todo_items.usuario_id
    where public.todo_items.id = todo_id
    and public.usuarios.auth_user_id = (select auth.uid())
  )
);



-- =====================================================
-- From: 50_notificacoes.sql
-- =====================================================

-- ============================================================================
-- Tabela: notificacoes
-- Notificações para usuários sobre eventos importantes
-- ============================================================================

create table if not exists public.notificacoes (
  id bigint generated always as identity primary key,
  usuario_id bigint not null references public.usuarios(id) on delete cascade,
  tipo public.tipo_notificacao_usuario not null,
  titulo text not null,
  descricao text not null,
  entidade_tipo text not null check (entidade_tipo in ('processo', 'audiencia', 'expediente', 'pericia')),
  entidade_id bigint not null,
  lida boolean not null default false,
  lida_em timestamp with time zone,
  dados_adicionais jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

comment on table public.notificacoes is 'Notificações para usuários sobre eventos importantes relacionados a processos, audiências, expedientes e outras entidades atribuídas a eles.';
comment on column public.notificacoes.usuario_id is 'ID do usuário destinatário da notificação';
comment on column public.notificacoes.tipo is 'Tipo da notificação (processo_atribuido, audiencia_atribuida, etc)';
comment on column public.notificacoes.titulo is 'Título da notificação';
comment on column public.notificacoes.descricao is 'Descrição detalhada da notificação';
comment on column public.notificacoes.entidade_tipo is 'Tipo da entidade relacionada (processo, audiencia, expediente, pericia)';
comment on column public.notificacoes.entidade_id is 'ID da entidade relacionada na tabela correspondente';
comment on column public.notificacoes.lida is 'Indica se a notificação foi lida pelo usuário';
comment on column public.notificacoes.lida_em is 'Timestamp de quando a notificação foi marcada como lida';
comment on column public.notificacoes.dados_adicionais is 'Dados adicionais em formato JSONB (ex: link para a entidade, metadados)';

-- Índices para performance
create index if not exists idx_notificacoes_usuario on public.notificacoes(usuario_id);
create index if not exists idx_notificacoes_lida on public.notificacoes(usuario_id, lida) where lida = false;
create index if not exists idx_notificacoes_created_at on public.notificacoes(usuario_id, created_at desc);
create index if not exists idx_notificacoes_entidade on public.notificacoes(entidade_tipo, entidade_id);

-- RLS
alter table public.notificacoes enable row level security;

create policy "Service role tem acesso total a notificacoes"
on public.notificacoes for all
to service_role
using (true)
with check (true);

create policy "Usuários podem ler suas próprias notificações"
on public.notificacoes for select
to authenticated
using (
  (select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id)
);

create policy "Usuários podem atualizar suas próprias notificações"
on public.notificacoes for update
to authenticated
using (
  (select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id)
)
with check (
  (select auth.uid()) = (select auth_user_id from public.usuarios where id = usuario_id)
);

-- Trigger para atualizar updated_at
create trigger update_notificacoes_updated_at
before update on public.notificacoes
for each row
execute function public.update_updated_at_column();


-- =====================================================
-- From: 50_notificacoes_functions.sql
-- =====================================================

-- ============================================================================
-- Funções e Triggers para Geração Automática de Notificações
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: criar_notificacao
-- ----------------------------------------------------------------------------
-- Função auxiliar para criar notificações de forma padronizada
-- Usada por triggers e outras funções do sistema
--
-- Parâmetros:
--   p_usuario_id: ID do usuário destinatário
--   p_tipo: Tipo da notificação (tipo_notificacao_usuario)
--   p_titulo: Título da notificação
--   p_descricao: Descrição da notificação
--   p_entidade_tipo: Tipo da entidade (processo, audiencia, expediente, pericia)
--   p_entidade_id: ID da entidade relacionada
--   p_dados_adicionais: Dados adicionais em JSONB (opcional)
-- ----------------------------------------------------------------------------

create or replace function public.criar_notificacao(
  p_usuario_id bigint,
  p_tipo public.tipo_notificacao_usuario,
  p_titulo text,
  p_descricao text,
  p_entidade_tipo text,
  p_entidade_id bigint,
  p_dados_adicionais jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_notificacao_id bigint;
begin
  -- Validar que o usuário existe e está ativo
  if not exists (
    select 1
    from public.usuarios
    where id = p_usuario_id
    and ativo = true
  ) then
    return null;
  end if;

  -- Inserir notificação
  insert into public.notificacoes (
    usuario_id,
    tipo,
    titulo,
    descricao,
    entidade_tipo,
    entidade_id,
    dados_adicionais
  ) values (
    p_usuario_id,
    p_tipo,
    p_titulo,
    p_descricao,
    p_entidade_tipo,
    p_entidade_id,
    p_dados_adicionais
  )
  returning id into v_notificacao_id;

  -- Broadcast via Realtime para notificação em tempo real
  perform realtime.send(
    'user:' || p_usuario_id::text || ':notifications',
    'notification_created',
    jsonb_build_object(
      'id', v_notificacao_id,
      'tipo', p_tipo,
      'titulo', p_titulo,
      'entidade_tipo', p_entidade_tipo,
      'entidade_id', p_entidade_id
    ),
    false
  );

  return v_notificacao_id;
end;
$$;

comment on function public.criar_notificacao(bigint, public.tipo_notificacao_usuario, text, text, text, bigint, jsonb) is 'Cria uma notificação para um usuário e envia evento via Realtime';

-- ----------------------------------------------------------------------------
-- Trigger: notificar_processo_atribuido
-- ----------------------------------------------------------------------------
-- Cria notificação quando um processo é atribuído a um usuário
-- ----------------------------------------------------------------------------

create or replace function public.notificar_processo_atribuido()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_numero_processo text;
  v_titulo text;
  v_descricao text;
begin
  -- Só criar notificação se responsavel_id foi definido ou alterado
  if new.responsavel_id is not null
    and (old.responsavel_id is distinct from new.responsavel_id)
  then
    -- Buscar número do processo
    v_numero_processo := new.numero_processo;

    -- Criar título e descrição
    v_titulo := 'Processo atribuído';
    v_descricao := format(
      'O processo %s foi atribuído a você',
      v_numero_processo
    );

    -- Criar notificação
    perform public.criar_notificacao(
      new.responsavel_id,
      'processo_atribuido',
      v_titulo,
      v_descricao,
      'processo',
      new.id,
      jsonb_build_object(
        'numero_processo', v_numero_processo,
        'trt', new.trt,
        'grau', new.grau
      )
    );
  end if;

  return new;
end;
$$;

comment on function public.notificar_processo_atribuido() is 'Cria notificação quando processo é atribuído a um usuário';

-- Criar trigger na tabela acervo
drop trigger if exists trigger_notificar_processo_atribuido on public.acervo;
create trigger trigger_notificar_processo_atribuido
after insert or update of responsavel_id
on public.acervo
for each row
execute function public.notificar_processo_atribuido();

-- ----------------------------------------------------------------------------
-- Trigger: notificar_processo_movimentacao
-- ----------------------------------------------------------------------------
-- Cria notificação quando há movimentação em um processo atribuído
-- ----------------------------------------------------------------------------

create or replace function public.notificar_processo_movimentacao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_numero_processo text;
  v_titulo text;
  v_descricao text;
  v_total_movimentos_anterior integer;
  v_total_movimentos_novo integer;
begin
  -- Só criar notificação se processo está atribuído e timeline_jsonb foi alterado
  if new.responsavel_id is not null
    and old.timeline_jsonb is distinct from new.timeline_jsonb
    and new.timeline_jsonb is not null
  then
    v_numero_processo := new.numero_processo;

    -- Extrair total de movimentos do timeline_jsonb
    v_total_movimentos_anterior := coalesce(
      (old.timeline_jsonb->'metadata'->>'totalMovimentos')::integer,
      0
    );
    v_total_movimentos_novo := coalesce(
      (new.timeline_jsonb->'metadata'->>'totalMovimentos')::integer,
      0
    );

    -- Só notificar se houve aumento no número de movimentos
    if v_total_movimentos_novo > v_total_movimentos_anterior then
      v_titulo := 'Nova movimentação no processo';
      v_descricao := format(
        'O processo %s teve %s nova(s) movimentação(ões)',
        v_numero_processo,
        v_total_movimentos_novo - v_total_movimentos_anterior
      );

      perform public.criar_notificacao(
        new.responsavel_id,
        'processo_movimentacao',
        v_titulo,
        v_descricao,
        'processo',
        new.id,
        jsonb_build_object(
          'numero_processo', v_numero_processo,
          'total_movimentos', v_total_movimentos_novo,
          'novos_movimentos', v_total_movimentos_novo - v_total_movimentos_anterior
        )
      );
    end if;
  end if;

  return new;
end;
$$;

comment on function public.notificar_processo_movimentacao() is 'Cria notificação quando há movimentação em processo atribuído';

-- Criar trigger na tabela acervo
drop trigger if exists trigger_notificar_processo_movimentacao on public.acervo;
create trigger trigger_notificar_processo_movimentacao
after update of timeline_jsonb
on public.acervo
for each row
execute function public.notificar_processo_movimentacao();

-- ----------------------------------------------------------------------------
-- Trigger: notificar_audiencia_atribuida
-- ----------------------------------------------------------------------------
-- Cria notificação quando uma audiência é atribuída a um usuário
-- ----------------------------------------------------------------------------

create or replace function public.notificar_audiencia_atribuida()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_numero_processo text;
  v_data_inicio timestamp with time zone;
  v_titulo text;
  v_descricao text;
begin
  -- Só criar notificação se responsavel_id foi definido ou alterado
  if new.responsavel_id is not null
    and (old.responsavel_id is distinct from new.responsavel_id)
  then
    v_numero_processo := new.numero_processo;
    v_data_inicio := new.data_inicio;

    v_titulo := 'Audiência atribuída';
    v_descricao := format(
      'Uma audiência do processo %s foi atribuída a você',
      v_numero_processo
    );

    if v_data_inicio is not null then
      v_descricao := v_descricao || format(' para %s', to_char(v_data_inicio, 'DD/MM/YYYY HH24:MI'));
    end if;

    perform public.criar_notificacao(
      new.responsavel_id,
      'audiencia_atribuida',
      v_titulo,
      v_descricao,
      'audiencia',
      new.id,
      jsonb_build_object(
        'numero_processo', v_numero_processo,
        'data_inicio', v_data_inicio,
        'trt', new.trt,
        'grau', new.grau
      )
    );
  end if;

  return new;
end;
$$;

comment on function public.notificar_audiencia_atribuida() is 'Cria notificação quando audiência é atribuída a um usuário';

-- Criar trigger na tabela audiencias
drop trigger if exists trigger_notificar_audiencia_atribuida on public.audiencias;
create trigger trigger_notificar_audiencia_atribuida
after insert or update of responsavel_id
on public.audiencias
for each row
execute function public.notificar_audiencia_atribuida();

-- ----------------------------------------------------------------------------
-- Trigger: notificar_audiencia_alterada
-- ----------------------------------------------------------------------------
-- Cria notificação quando uma audiência atribuída tem alterações importantes
-- ----------------------------------------------------------------------------

create or replace function public.notificar_audiencia_alterada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_numero_processo text;
  v_titulo text;
  v_descricao text;
  v_alteracoes text[] := array[]::text[];
begin
  -- Só criar notificação se audiência está atribuída e houve alterações relevantes
  if new.responsavel_id is not null then
    v_numero_processo := new.numero_processo;

    -- Detectar alterações relevantes
    if old.data_inicio is distinct from new.data_inicio then
      v_alteracoes := array_append(
        v_alteracoes,
        format('Data alterada para %s', to_char(new.data_inicio, 'DD/MM/YYYY HH24:MI'))
      );
    end if;

    if old.status is distinct from new.status then
      v_alteracoes := array_append(
        v_alteracoes,
        format('Status alterado para %s', new.status_descricao)
      );
    end if;

    if old.modalidade is distinct from new.modalidade then
      v_alteracoes := array_append(
        v_alteracoes,
        format('Modalidade alterada para %s', new.modalidade)
      );
    end if;

    -- Criar notificação se houver alterações
    if array_length(v_alteracoes, 1) > 0 then
      v_titulo := 'Audiência alterada';
      v_descricao := format(
        'A audiência do processo %s foi alterada: %s',
        v_numero_processo,
        array_to_string(v_alteracoes, ', ')
      );

      perform public.criar_notificacao(
        new.responsavel_id,
        'audiencia_alterada',
        v_titulo,
        v_descricao,
        'audiencia',
        new.id,
        jsonb_build_object(
          'numero_processo', v_numero_processo,
          'alteracoes', v_alteracoes
        )
      );
    end if;
  end if;

  return new;
end;
$$;

comment on function public.notificar_audiencia_alterada() is 'Cria notificação quando audiência atribuída tem alterações importantes';

-- Criar trigger na tabela audiencias
drop trigger if exists trigger_notificar_audiencia_alterada on public.audiencias;
create trigger trigger_notificar_audiencia_alterada
after update of data_inicio, status, modalidade
on public.audiencias
for each row
execute function public.notificar_audiencia_alterada();

-- ----------------------------------------------------------------------------
-- Trigger: notificar_expediente_atribuido
-- ----------------------------------------------------------------------------
-- Cria notificação quando um expediente é atribuído a um usuário
-- ----------------------------------------------------------------------------

create or replace function public.notificar_expediente_atribuido()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_numero_processo text;
  v_tipo_expediente text;
  v_data_prazo timestamp with time zone;
  v_titulo text;
  v_descricao text;
begin
  -- Só criar notificação se responsavel_id foi definido ou alterado
  if new.responsavel_id is not null
    and (old.responsavel_id is distinct from new.responsavel_id)
  then
    v_numero_processo := new.numero_processo;
    v_data_prazo := new.data_prazo_legal_parte;

    -- Buscar tipo de expediente se disponível
    if new.tipo_expediente_id is not null then
      select tipo_expediente into v_tipo_expediente
      from public.tipos_expedientes
      where id = new.tipo_expediente_id;
    end if;

    v_titulo := 'Expediente atribuído';
    v_descricao := format(
      'Um expediente do processo %s foi atribuído a você',
      v_numero_processo
    );

    if v_tipo_expediente is not null then
      v_descricao := v_descricao || format(' (%s)', v_tipo_expediente);
    end if;

    if v_data_prazo is not null then
      v_descricao := v_descricao || format(' com prazo até %s', to_char(v_data_prazo, 'DD/MM/YYYY'));
    end if;

    perform public.criar_notificacao(
      new.responsavel_id,
      'expediente_atribuido',
      v_titulo,
      v_descricao,
      'expediente',
      new.id,
      jsonb_build_object(
        'numero_processo', v_numero_processo,
        'tipo_expediente', v_tipo_expediente,
        'data_prazo', v_data_prazo,
        'prazo_vencido', new.prazo_vencido
      )
    );
  end if;

  return new;
end;
$$;

comment on function public.notificar_expediente_atribuido() is 'Cria notificação quando expediente é atribuído a um usuário';

-- Criar trigger na tabela expedientes
drop trigger if exists trigger_notificar_expediente_atribuido on public.expedientes;
create trigger trigger_notificar_expediente_atribuido
after insert or update of responsavel_id
on public.expedientes
for each row
execute function public.notificar_expediente_atribuido();

-- ----------------------------------------------------------------------------
-- Trigger: notificar_expediente_alterado
-- ----------------------------------------------------------------------------
-- Cria notificação quando um expediente atribuído tem alterações importantes
-- ----------------------------------------------------------------------------

create or replace function public.notificar_expediente_alterado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_numero_processo text;
  v_titulo text;
  v_descricao text;
  v_alteracoes text[] := array[]::text[];
begin
  -- Só criar notificação se expediente está atribuído e houve alterações relevantes
  if new.responsavel_id is not null then
    v_numero_processo := new.numero_processo;

    -- Detectar alterações relevantes
    if old.data_prazo_legal_parte is distinct from new.data_prazo_legal_parte then
      v_alteracoes := array_append(
        v_alteracoes,
        format('Prazo alterado para %s', to_char(new.data_prazo_legal_parte, 'DD/MM/YYYY'))
      );
    end if;

    if old.prazo_vencido is distinct from new.prazo_vencido and new.prazo_vencido = true then
      v_alteracoes := array_append(v_alteracoes, 'Prazo vencido');
    end if;

    if old.baixado_em is distinct from new.baixado_em and new.baixado_em is not null then
      v_alteracoes := array_append(v_alteracoes, 'Expediente baixado');
    end if;

    -- Criar notificação se houver alterações
    if array_length(v_alteracoes, 1) > 0 then
      v_titulo := 'Expediente alterado';
      v_descricao := format(
        'O expediente do processo %s foi alterado: %s',
        v_numero_processo,
        array_to_string(v_alteracoes, ', ')
      );

      perform public.criar_notificacao(
        new.responsavel_id,
        'expediente_alterado',
        v_titulo,
        v_descricao,
        'expediente',
        new.id,
        jsonb_build_object(
          'numero_processo', v_numero_processo,
          'alteracoes', v_alteracoes
        )
      );
    end if;
  end if;

  return new;
end;
$$;

comment on function public.notificar_expediente_alterado() is 'Cria notificação quando expediente atribuído tem alterações importantes';

-- Criar trigger na tabela expedientes
drop trigger if exists trigger_notificar_expediente_alterado on public.expedientes;
create trigger trigger_notificar_expediente_alterado
after update of data_prazo_legal_parte, prazo_vencido, baixado_em
on public.expedientes
for each row
execute function public.notificar_expediente_alterado();

-- ============================================================================
-- RLS Policies para Realtime
-- ============================================================================
-- Políticas para permitir que usuários leiam suas próprias notificações via Realtime

-- Política para ler mensagens Realtime de notificações
create policy if not exists "users_can_read_own_notifications_realtime"
on realtime.messages
for select
to authenticated
using (
  topic like 'user:%:notifications' and
  exists (
    select 1
    from public.usuarios
    where id = split_part(topic, ':', 2)::bigint
    and auth_user_id = (select auth.uid())
  )
);

-- Índice para performance da política RLS
create index if not exists idx_realtime_messages_topic_user
on realtime.messages(topic)
where topic like 'user:%:notifications';

-- ============================================================================
-- Função: Verificar e Notificar Prazos Vencendo/Vencidos
-- ============================================================================
-- Esta função verifica expedientes com prazos próximos ou vencidos
-- e cria notificações para os responsáveis.
-- Deve ser executada periodicamente via pg_cron (ex: a cada hora)
-- ----------------------------------------------------------------------------

create or replace function public.verificar_e_notificar_prazos()
returns table (
  notificacoes_criadas bigint,
  prazos_vencendo bigint,
  prazos_vencidos bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_notificacoes_criadas bigint := 0;
  v_prazos_vencendo bigint := 0;
  v_prazos_vencidos bigint := 0;
  v_expediente record;
  v_dias_para_vencer integer;
  v_titulo text;
  v_descricao text;
  v_notificacao_id bigint;
begin
  -- Buscar expedientes com responsável atribuído e prazo definido
  -- que ainda não foram baixados
  for v_expediente in
    select
      e.id,
      e.responsavel_id,
      e.numero_processo,
      e.data_prazo_legal_parte,
      e.prazo_vencido,
      e.tipo_expediente_id,
      te.tipo_expediente
    from public.expedientes e
    left join public.tipos_expedientes te on e.tipo_expediente_id = te.id
    where e.responsavel_id is not null
      and e.data_prazo_legal_parte is not null
      and e.baixado_em is null
      and (
        -- Prazo vencido (não notificado ainda)
        (e.prazo_vencido = true and not exists (
          select 1
          from public.notificacoes n
          where n.entidade_tipo = 'expediente'
            and n.entidade_id = e.id
            and n.tipo = 'prazo_vencido'
            and n.created_at > e.updated_at
        ))
        or
        -- Prazo vencendo (3 dias ou menos, não notificado nos últimos 24h)
        (e.prazo_vencido = false
          and e.data_prazo_legal_parte <= (now() + interval '3 days')
          and e.data_prazo_legal_parte > now()
          and not exists (
            select 1
            from public.notificacoes n
            where n.entidade_tipo = 'expediente'
              and n.entidade_id = e.id
              and n.tipo = 'prazo_vencendo'
              and n.created_at > (now() - interval '24 hours')
          ))
      )
  loop
    -- Calcular dias para vencer
    v_dias_para_vencer := extract(day from (v_expediente.data_prazo_legal_parte - now()))::integer;

    -- Determinar tipo de notificação e criar mensagem
    if v_expediente.prazo_vencido then
      -- Prazo já vencido
      v_prazos_vencidos := v_prazos_vencidos + 1;
      v_titulo := 'Prazo vencido';
      v_descricao := format(
        'O prazo do expediente do processo %s venceu',
        v_expediente.numero_processo
      );

      if v_expediente.tipo_expediente is not null then
        v_descricao := v_descricao || format(' (%s)', v_expediente.tipo_expediente);
      end if;

      -- Criar notificação
      v_notificacao_id := public.criar_notificacao(
        v_expediente.responsavel_id,
        'prazo_vencido',
        v_titulo,
        v_descricao,
        'expediente',
        v_expediente.id,
        jsonb_build_object(
          'numero_processo', v_expediente.numero_processo,
          'data_prazo', v_expediente.data_prazo_legal_parte,
          'tipo_expediente', v_expediente.tipo_expediente
        )
      );

      if v_notificacao_id is not null then
        v_notificacoes_criadas := v_notificacoes_criadas + 1;
      end if;
    else
      -- Prazo vencendo (3 dias ou menos)
      v_prazos_vencendo := v_prazos_vencendo + 1;
      v_titulo := 'Prazo vencendo';
      v_descricao := format(
        'O prazo do expediente do processo %s vence em %s dia(s)',
        v_expediente.numero_processo,
        v_dias_para_vencer
      );

      if v_expediente.tipo_expediente is not null then
        v_descricao := v_descricao || format(' (%s)', v_expediente.tipo_expediente);
      end if;

      -- Criar notificação
      v_notificacao_id := public.criar_notificacao(
        v_expediente.responsavel_id,
        'prazo_vencendo',
        v_titulo,
        v_descricao,
        'expediente',
        v_expediente.id,
        jsonb_build_object(
          'numero_processo', v_expediente.numero_processo,
          'data_prazo', v_expediente.data_prazo_legal_parte,
          'dias_para_vencer', v_dias_para_vencer,
          'tipo_expediente', v_expediente.tipo_expediente
        )
      );

      if v_notificacao_id is not null then
        v_notificacoes_criadas := v_notificacoes_criadas + 1;
      end if;
    end if;
  end loop;

  -- Retornar estatísticas
  return query select
    v_notificacoes_criadas,
    v_prazos_vencendo,
    v_prazos_vencidos;
end;
$$;

comment on function public.verificar_e_notificar_prazos() is 'Verifica expedientes com prazos próximos ou vencidos e cria notificações. Deve ser executada periodicamente via pg_cron.';

-- Criar job agendado para verificar prazos (executa a cada hora)
-- Nota: pg_cron precisa estar habilitado no Supabase
-- Descomente a linha abaixo após confirmar que pg_cron está disponível
-- select cron.schedule(
--   'verificar-prazos-expedientes',
--   '0 * * * *', -- A cada hora
--   $$select public.verificar_e_notificar_prazos()$$
-- );

