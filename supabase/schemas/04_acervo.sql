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

