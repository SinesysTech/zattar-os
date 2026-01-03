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

