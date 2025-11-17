-- Tabela de partes contrárias do sistema
-- Partes contrárias podem ser pessoas físicas (PF) ou pessoas jurídicas (PJ)

create table public.partes_contrarias (
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

comment on table public.partes_contrarias is 'Cadastro de partes contrárias nos contratos do escritório de advocacia (pessoas físicas e jurídicas)';

-- Comentários dos campos
comment on column public.partes_contrarias.tipo_pessoa is 'Tipo de pessoa: física (pf) ou jurídica (pj)';
comment on column public.partes_contrarias.nome is 'Nome completo (PF) ou Razão Social (PJ)';
comment on column public.partes_contrarias.nome_fantasia is 'Nome social (PF) ou Nome fantasia (PJ)';
comment on column public.partes_contrarias.cpf is 'CPF da parte contrária (obrigatório para PF, único)';
comment on column public.partes_contrarias.cnpj is 'CNPJ da parte contrária (obrigatório para PJ, único)';
comment on column public.partes_contrarias.rg is 'RG da parte contrária (apenas para PF)';
comment on column public.partes_contrarias.data_nascimento is 'Data de nascimento (PF) ou data de fundação/constituição (PJ)';
comment on column public.partes_contrarias.genero is 'Gênero da parte contrária (apenas para PF)';
comment on column public.partes_contrarias.estado_civil is 'Estado civil da parte contrária (apenas para PF)';
comment on column public.partes_contrarias.nacionalidade is 'Nacionalidade da parte contrária (apenas para PF)';
comment on column public.partes_contrarias.inscricao_estadual is 'Inscrição estadual (pode ser usado tanto para PF quanto para PJ)';
comment on column public.partes_contrarias.email is 'E-mail da parte contrária';
comment on column public.partes_contrarias.telefone_primario is 'Telefone primário da parte contrária';
comment on column public.partes_contrarias.telefone_secundario is 'Telefone secundário da parte contrária';
comment on column public.partes_contrarias.endereco is 'Endereço completo da parte contrária em formato JSONB com campos: logradouro, numero, complemento, bairro, cidade, estado, pais, cep';
comment on column public.partes_contrarias.observacoes is 'Observações gerais sobre a parte contrária';
comment on column public.partes_contrarias.created_by is 'ID do usuário que criou o registro';
comment on column public.partes_contrarias.dados_anteriores is 'Armazena o estado anterior do registro antes da última atualização. Null quando o registro foi inserido ou quando não houve mudanças.';
comment on column public.partes_contrarias.ativo is 'Indica se a parte contrária está ativa no sistema';

-- Índices para melhor performance
create index idx_partes_contrarias_tipo_pessoa on public.partes_contrarias using btree (tipo_pessoa);
create index idx_partes_contrarias_cpf on public.partes_contrarias using btree (cpf) where cpf is not null;
create index idx_partes_contrarias_cnpj on public.partes_contrarias using btree (cnpj) where cnpj is not null;
create index idx_partes_contrarias_nome on public.partes_contrarias using btree (nome);
create index idx_partes_contrarias_ativo on public.partes_contrarias using btree (ativo);
create index idx_partes_contrarias_created_by on public.partes_contrarias using btree (created_by);

-- Índice GIN para busca em endereço JSONB
create index idx_partes_contrarias_endereco on public.partes_contrarias using gin (endereco);

-- Trigger para atualizar updated_at automaticamente
create trigger update_partes_contrarias_updated_at
before update on public.partes_contrarias
for each row
execute function public.update_updated_at_column();

-- Habilitar RLS
alter table public.partes_contrarias enable row level security;

