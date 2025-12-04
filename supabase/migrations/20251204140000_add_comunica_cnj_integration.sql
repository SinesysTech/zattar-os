-- =============================================================================
-- Migration: Integração Comunica CNJ
-- Descrição: Renomeia pendentes_manifestacao para expedientes, cria tabela
--            comunica_cnj e adiciona novo tipo de captura
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CRIAR ENUMS
-- -----------------------------------------------------------------------------

create type origem_expediente as enum ('captura', 'manual', 'comunica_cnj');
comment on type origem_expediente is 'Origem do expediente: captura (PJE), manual (criado pelo usuário), comunica_cnj (criado a partir de comunicação CNJ)';

create type meio_comunicacao as enum ('E', 'D');
comment on type meio_comunicacao is 'Meio de comunicação CNJ: E (Edital), D (Diário Eletrônico)';

-- -----------------------------------------------------------------------------
-- 2. RENOMEAR TABELA pendentes_manifestacao PARA expedientes
-- -----------------------------------------------------------------------------

alter table pendentes_manifestacao rename to expedientes;

alter table expedientes rename constraint pendentes_manifestacao_advogado_id_fkey to expedientes_advogado_id_fkey;
alter table expedientes rename constraint pendentes_manifestacao_processo_id_fkey to expedientes_processo_id_fkey;
alter table expedientes rename constraint pendentes_manifestacao_responsavel_id_fkey to expedientes_responsavel_id_fkey;
alter table expedientes rename constraint pendentes_manifestacao_tipo_expediente_id_fkey to expedientes_tipo_expediente_id_fkey;
alter table expedientes rename constraint pendentes_manifestacao_id_pje_trt_grau_numero_processo_key to expedientes_id_pje_trt_grau_numero_processo_key;

comment on table expedientes is 'Expedientes processuais unificados. Inclui expedientes capturados do PJE (origem=captura), criados manualmente (origem=manual) e criados a partir de comunicações do CNJ (origem=comunica_cnj). RLS: Service role tem acesso total. Usuários autenticados podem ler.';

-- -----------------------------------------------------------------------------
-- 3. TORNAR advogado_id NULLABLE (para suportar expedientes manuais e CNJ)
-- -----------------------------------------------------------------------------

alter table expedientes alter column advogado_id drop not null;
comment on column expedientes.advogado_id is 'Advogado que capturou o expediente. Pode ser NULL para expedientes manuais ou criados via CNJ.';

-- -----------------------------------------------------------------------------
-- 4. ADICIONAR COLUNA ORIGEM
-- -----------------------------------------------------------------------------

alter table expedientes add column origem origem_expediente not null default 'captura';
comment on column expedientes.origem is 'Origem do expediente: captura (PJE), manual (criado pelo usuário), comunica_cnj (criado a partir de comunicação CNJ)';

create index idx_expedientes_origem on expedientes(origem);

-- -----------------------------------------------------------------------------
-- 5. MIGRAR DADOS DE expedientes_manuais (usando id_pje negativo único)
-- -----------------------------------------------------------------------------

insert into expedientes (
    id_pje, advogado_id, processo_id, trt, grau, numero_processo,
    descricao_orgao_julgador, classe_judicial, numero, segredo_justica,
    codigo_status_processo, prioridade_processual, nome_parte_autora,
    qtde_parte_autora, nome_parte_re, qtde_parte_re, data_autuacao,
    juizo_digital, data_arquivamento, id_documento, data_ciencia_parte,
    data_prazo_legal_parte, data_criacao_expediente, prazo_vencido,
    sigla_orgao_julgador, dados_anteriores, responsavel_id, baixado_em,
    protocolo_id, justificativa_baixa, tipo_expediente_id, descricao_arquivos,
    arquivo_nome, arquivo_url, arquivo_bucket, arquivo_key, observacoes,
    origem, created_at, updated_at
)
select
    -em.id as id_pje,  -- Usar ID negativo para garantir unicidade
    null as advogado_id,
    em.processo_id, em.trt, em.grau, em.numero_processo,
    coalesce((select a.descricao_orgao_julgador from acervo a where a.id = em.processo_id), 'Não especificado'),
    coalesce((select a.classe_judicial from acervo a where a.id = em.processo_id), 'Não especificado'),
    coalesce((select a.numero from acervo a where a.id = em.processo_id), 0),
    false, 'DISTRIBUIDO', 0,
    coalesce((select a.nome_parte_autora from acervo a where a.id = em.processo_id), 'Não especificado'),
    1,
    coalesce((select a.nome_parte_re from acervo a where a.id = em.processo_id), 'Não especificado'),
    1,
    coalesce((select a.data_autuacao from acervo a where a.id = em.processo_id), now()),
    false, null, null, null,
    em.data_prazo_legal, em.created_at, em.prazo_vencido,
    null, null, em.responsavel_id, em.baixado_em,
    em.protocolo_id, em.justificativa_baixa, em.tipo_expediente_id, em.descricao,
    null, null, null, null, null,
    'manual'::origem_expediente, em.created_at, em.updated_at
from expedientes_manuais em;

-- -----------------------------------------------------------------------------
-- 6. REMOVER TABELA expedientes_manuais
-- -----------------------------------------------------------------------------

drop table expedientes_manuais;

-- -----------------------------------------------------------------------------
-- 7. ADICIONAR comunica_cnj AO ENUM tipo_captura
-- -----------------------------------------------------------------------------

alter type tipo_captura add value 'comunica_cnj';

-- -----------------------------------------------------------------------------
-- 8. CRIAR TABELA comunica_cnj
-- -----------------------------------------------------------------------------

create table comunica_cnj (
    id bigint generated always as identity primary key,
    id_cnj bigint not null,
    hash text not null,
    numero_comunicacao integer,
    numero_processo text not null,
    numero_processo_mascara text,
    sigla_tribunal text not null,
    orgao_id integer,
    nome_orgao text,
    tipo_comunicacao text,
    tipo_documento text,
    nome_classe text,
    codigo_classe text,
    meio meio_comunicacao not null,
    meio_completo text,
    texto text,
    link text,
    data_disponibilizacao date not null,
    ativo boolean default true,
    status text,
    motivo_cancelamento text,
    data_cancelamento timestamp with time zone,
    destinatarios jsonb,
    destinatarios_advogados jsonb,
    expediente_id bigint references expedientes(id) on delete set null,
    advogado_id bigint references advogados(id) on delete set null,
    metadados jsonb,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    constraint uk_comunica_cnj_hash unique (hash),
    constraint uk_comunica_cnj_expediente unique (expediente_id)
);

comment on table comunica_cnj is 'Comunicações capturadas da API do CNJ (Comunica CNJ). Cada registro está vinculado 1:1 a um expediente.';
comment on column comunica_cnj.id_cnj is 'ID da comunicação na API do CNJ';
comment on column comunica_cnj.hash is 'Hash único da certidão (usado para download do PDF)';
comment on column comunica_cnj.numero_comunicacao is 'Número sequencial da comunicação no CNJ';
comment on column comunica_cnj.numero_processo is 'Número do processo sem máscara';
comment on column comunica_cnj.numero_processo_mascara is 'Número do processo no formato CNJ';
comment on column comunica_cnj.sigla_tribunal is 'Sigla do tribunal (TRT1, TJSP, etc.)';
comment on column comunica_cnj.orgao_id is 'ID do órgão julgador no CNJ';
comment on column comunica_cnj.nome_orgao is 'Nome do órgão julgador';
comment on column comunica_cnj.tipo_comunicacao is 'Tipo da comunicação (Intimação, Citação, etc.)';
comment on column comunica_cnj.tipo_documento is 'Tipo do documento';
comment on column comunica_cnj.nome_classe is 'Nome da classe judicial';
comment on column comunica_cnj.codigo_classe is 'Código da classe judicial';
comment on column comunica_cnj.meio is 'Meio: E (Edital), D (Diário Eletrônico)';
comment on column comunica_cnj.meio_completo is 'Descrição completa do meio';
comment on column comunica_cnj.texto is 'Texto completo da comunicação';
comment on column comunica_cnj.link is 'Link de validação';
comment on column comunica_cnj.data_disponibilizacao is 'Data de publicação no diário';
comment on column comunica_cnj.ativo is 'Indica se a comunicação está ativa';
comment on column comunica_cnj.status is 'Status (P = Pendente)';
comment on column comunica_cnj.destinatarios is 'Array de destinatários em JSONB';
comment on column comunica_cnj.destinatarios_advogados is 'Array de advogados destinatários em JSONB';
comment on column comunica_cnj.expediente_id is 'FK para expediente vinculado (1:1)';
comment on column comunica_cnj.advogado_id is 'FK para advogado que capturou';
comment on column comunica_cnj.metadados is 'JSON completo da API';

create index idx_comunica_cnj_numero_processo on comunica_cnj(numero_processo);
create index idx_comunica_cnj_sigla_tribunal on comunica_cnj(sigla_tribunal);
create index idx_comunica_cnj_data_disponibilizacao on comunica_cnj(data_disponibilizacao);
create index idx_comunica_cnj_expediente_id on comunica_cnj(expediente_id);
create index idx_comunica_cnj_advogado_id on comunica_cnj(advogado_id);
create index idx_comunica_cnj_id_cnj on comunica_cnj(id_cnj);

-- -----------------------------------------------------------------------------
-- 9. RLS
-- -----------------------------------------------------------------------------

alter table comunica_cnj enable row level security;

create policy "Service role has full access to comunica_cnj"
on comunica_cnj for all to service_role
using (true) with check (true);

create policy "Authenticated users can read comunica_cnj"
on comunica_cnj for select to authenticated
using (true);

create policy "Authenticated users can insert comunica_cnj"
on comunica_cnj for insert to authenticated
with check (true);

create policy "Authenticated users can update comunica_cnj"
on comunica_cnj for update to authenticated
using (true) with check (true);

-- -----------------------------------------------------------------------------
-- 10. TRIGGER updated_at
-- -----------------------------------------------------------------------------

create or replace function update_comunica_cnj_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_comunica_cnj_updated_at
before update on comunica_cnj
for each row execute function update_comunica_cnj_updated_at();

-- -----------------------------------------------------------------------------
-- 11. ATUALIZAR LOGS_ALTERACAO
-- -----------------------------------------------------------------------------

alter table logs_alteracao drop constraint if exists logs_alteracao_tipo_entidade_check;

alter table logs_alteracao add constraint logs_alteracao_tipo_entidade_check
check (tipo_entidade = any (array[
    'acervo', 'audiencias', 'pendentes_manifestacao', 'expedientes',
    'usuarios', 'advogados', 'clientes', 'partes_contrarias', 'contratos', 'comunica_cnj'
]));
