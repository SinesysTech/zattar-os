-- Migration: Criar tabela transitória para partes contrárias com cadastro incompleto
-- Data: 2026-04-22 14:00:00
-- Descrição: Permite que clientes preenchendo o formulário público registrem uma
--            parte contrária com apenas o nome (quando a parte ainda não existe
--            na base e o cliente não tem todos os dados). O cadastro fica
--            "pendente" até que um usuário autenticado da firma complete os
--            dados e promova o registro para `partes_contrarias` definitivo.
--
-- Decisões de design (confirmadas pelo usuário):
-- - Único dado obrigatório é `nome` (o cliente pode não saber CPF/CNPJ).
-- - Status só tem 'pendente' e 'promovido' — não existe descarte (uma parte
--   contrária existe no mundo real e precisa ser completada, não eliminada).
-- - Duplicatas são resolvidas no momento da promoção (fuzzy match + merge),
--   não via descarte.
-- - Promoção não exige RBAC novo: quem já tem permissão `partes_contrarias.criar`
--   ou `.editar` pode promover.
-- - Relacionamento com contratos via polimorfismo existente em `contrato_partes`
--   (novo valor de enum: `parte_contraria_transitoria`).

-- ============================================================================
-- 1. Tabela partes_contrarias_transitorias
-- ============================================================================

create table if not exists public.partes_contrarias_transitorias (
  id bigint generated always as identity primary key,

  -- Dado mínimo exigido
  nome text not null check (char_length(trim(nome)) between 2 and 200),

  -- Dados opcionais que o cliente pode digitar se souber
  tipo_pessoa public.tipo_pessoa,
  cpf_ou_cnpj text,
  email text,
  telefone text,
  observacoes text,

  -- Rastreamento de origem (auditoria)
  criado_via text not null check (criado_via in ('formulario_publico', 'painel_interno')),
  criado_em_contrato_id bigint references public.contratos(id) on delete set null,
  criado_por bigint references public.usuarios(id) on delete set null,
  sessao_formulario_uuid uuid,

  -- Ciclo de vida: pendente → promovido (não existe descarte)
  status text not null default 'pendente'
    check (status in ('pendente', 'promovido')),
  promovido_para_id bigint references public.partes_contrarias(id) on delete set null,
  promovido_por bigint references public.usuarios(id) on delete set null,
  promovido_em timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.partes_contrarias_transitorias is
  'Partes contrárias em cadastro incompleto. Criadas pelo cliente no formulário público quando a parte ainda não existe em partes_contrarias. Promovidas por usuários da firma após completar os dados.';

comment on column public.partes_contrarias_transitorias.nome is
  'Único dado obrigatório. O cliente pode criar uma transitória sabendo apenas o nome.';
comment on column public.partes_contrarias_transitorias.criado_via is
  'Origem do registro: formulario_publico (cliente final) ou painel_interno (usuário da firma).';
comment on column public.partes_contrarias_transitorias.criado_em_contrato_id is
  'Contrato em que essa transitória apareceu pela primeira vez. Usado para exibir alerta "cadastro pendente" no contrato.';
comment on column public.partes_contrarias_transitorias.sessao_formulario_uuid is
  'Para transitórias criadas via formulário público (criado_por pode ser NULL), rastreia a sessão do wizard para auditoria.';
comment on column public.partes_contrarias_transitorias.status is
  'pendente = aguardando completar cadastro; promovido = já vinculada a uma parte_contraria oficial.';
comment on column public.partes_contrarias_transitorias.promovido_para_id is
  'FK para partes_contrarias.id quando a transitória é promovida. NULL enquanto pendente.';

create index if not exists idx_partes_contrarias_transitorias_status_pendente
  on public.partes_contrarias_transitorias (status)
  where status = 'pendente';

create index if not exists idx_partes_contrarias_transitorias_contrato
  on public.partes_contrarias_transitorias (criado_em_contrato_id)
  where criado_em_contrato_id is not null;

create index if not exists idx_partes_contrarias_transitorias_nome
  on public.partes_contrarias_transitorias using gin (nome gin_trgm_ops);

-- Trigger para atualizar updated_at
create trigger update_partes_contrarias_transitorias_updated_at
  before update on public.partes_contrarias_transitorias
  for each row execute function public.update_updated_at_column();

-- ============================================================================
-- 2. Row Level Security
-- ============================================================================

alter table public.partes_contrarias_transitorias enable row level security;

-- Cliente anônimo (formulário público) pode criar transitória, mas só via
-- criado_via = 'formulario_publico'. Validações adicionais (rate limit, token
-- de sessão) são feitas no endpoint backend via publicTokenAction.
create policy "anon insert transitoria via formulario publico"
  on public.partes_contrarias_transitorias
  for insert
  to anon
  with check (criado_via = 'formulario_publico');

-- Usuários autenticados podem ler (backend filtra por permissão granular).
create policy "authenticated read transitorias"
  on public.partes_contrarias_transitorias
  for select
  to authenticated
  using (true);

-- Usuários autenticados podem criar via painel interno.
create policy "authenticated insert transitorias"
  on public.partes_contrarias_transitorias
  for insert
  to authenticated
  with check (true);

-- Usuários autenticados podem atualizar (backend valida permissão granular).
create policy "authenticated update transitorias"
  on public.partes_contrarias_transitorias
  for update
  to authenticated
  using (true)
  with check (true);

-- ============================================================================
-- 3. Expandir enum de contrato_partes.tipo_entidade
-- ============================================================================

-- O constraint atual aceita apenas ('cliente', 'parte_contraria'). Precisamos
-- adicionar 'parte_contraria_transitoria' para permitir vincular transitórias
-- a contratos usando a mesma tabela polimórfica.
alter table public.contrato_partes drop constraint if exists contrato_partes_tipo_entidade_check;

alter table public.contrato_partes add constraint contrato_partes_tipo_entidade_check
  check (tipo_entidade in ('cliente', 'parte_contraria', 'parte_contraria_transitoria'));

comment on column public.contrato_partes.tipo_entidade is
  'Tipo polimórfico da entidade vinculada ao contrato. parte_contraria_transitoria referencia partes_contrarias_transitorias.id (cadastro pendente); quando promovida, o registro é atualizado para parte_contraria com entidade_id apontando para partes_contrarias.id.';
