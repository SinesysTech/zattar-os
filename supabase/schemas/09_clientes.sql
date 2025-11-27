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
