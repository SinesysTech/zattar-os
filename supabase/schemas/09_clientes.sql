-- Tabela de clientes do sistema
-- Clientes podem ser pessoas físicas (PF) ou pessoas jurídicas (PJ)

create table public.clientes (
  id bigint generated always as identity primary key,
  
  -- Tipo e identificação
  tipo_pessoa public.tipo_pessoa not null,
  nome text not null, -- Nome completo (PF) ou Razão Social (PJ)
  nome_fantasia text, -- Nome social (PF) ou Nome fantasia (PJ)
  cpf text unique, -- Obrigatório se tipo_pessoa = 'pf'
  cnpj text unique, -- Obrigatório se tipo_pessoa = 'pj'
  
  -- Dados específicos de Pessoa Física
  rg text,
  data_nascimento date,
  genero public.genero_usuario,
  estado_civil public.estado_civil,
  nacionalidade text,
  naturalidade text,
  
  -- Dados específicos de Pessoa Jurídica
  inscricao_estadual text,
  
  -- Dados de contato (comuns)
  email text,
  telefone_primario text,
  telefone_secundario text,
  
  -- Endereço (JSONB)
  endereco jsonb,
  
  -- Controle
  observacoes text,
  created_by bigint references public.usuarios(id) on delete set null,
  dados_anteriores jsonb,
  ativo boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.clientes is 'Cadastro de clientes do escritório de advocacia (pessoas físicas e jurídicas)';

-- Comentários dos campos
comment on column public.clientes.tipo_pessoa is 'Tipo de pessoa: física (pf) ou jurídica (pj)';
comment on column public.clientes.nome is 'Nome completo (PF) ou Razão Social (PJ)';
comment on column public.clientes.nome_fantasia is 'Nome social (PF) ou Nome fantasia (PJ)';
comment on column public.clientes.cpf is 'CPF do cliente (obrigatório para PF, único)';
comment on column public.clientes.cnpj is 'CNPJ do cliente (obrigatório para PJ, único)';
comment on column public.clientes.rg is 'RG do cliente (apenas para PF)';
comment on column public.clientes.data_nascimento is 'Data de nascimento (apenas para PF)';
comment on column public.clientes.genero is 'Gênero do cliente (apenas para PF)';
comment on column public.clientes.estado_civil is 'Estado civil do cliente (apenas para PF)';
comment on column public.clientes.nacionalidade is 'Nacionalidade do cliente (apenas para PF)';
comment on column public.clientes.naturalidade is 'Naturalidade do cliente - cidade/estado de nascimento (apenas para PF)';
comment on column public.clientes.inscricao_estadual is 'Inscrição estadual (apenas para PJ)';
comment on column public.clientes.email is 'E-mail do cliente';
comment on column public.clientes.telefone_primario is 'Telefone primário do cliente';
comment on column public.clientes.telefone_secundario is 'Telefone secundário do cliente';
comment on column public.clientes.endereco is 'Endereço completo do cliente em formato JSONB com campos: logradouro, numero, complemento, bairro, cidade, estado, pais, cep';
comment on column public.clientes.observacoes is 'Observações gerais sobre o cliente';
comment on column public.clientes.created_by is 'ID do usuário que criou o registro';
comment on column public.clientes.dados_anteriores is 'Armazena o estado anterior do registro antes da última atualização. Null quando o registro foi inserido ou quando não houve mudanças.';
comment on column public.clientes.ativo is 'Indica se o cliente está ativo no sistema';

-- Índices para melhor performance
create index idx_clientes_tipo_pessoa on public.clientes using btree (tipo_pessoa);
create index idx_clientes_cpf on public.clientes using btree (cpf) where cpf is not null;
create index idx_clientes_cnpj on public.clientes using btree (cnpj) where cnpj is not null;
create index idx_clientes_nome on public.clientes using btree (nome);
create index idx_clientes_ativo on public.clientes using btree (ativo);
create index idx_clientes_created_by on public.clientes using btree (created_by);

-- Índice GIN para busca em endereço JSONB
create index idx_clientes_endereco on public.clientes using gin (endereco);

-- Trigger para atualizar updated_at automaticamente
create trigger update_clientes_updated_at
before update on public.clientes
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.clientes enable row level security;

