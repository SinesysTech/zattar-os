# Esquemas SQL

<cite>
**Arquivos Referenciados neste Documento**  
- [01_enums.sql](file://supabase/schemas/01_enums.sql)
- [04_acervo.sql](file://supabase/schemas/04_acervo.sql)
- [06_pendentes_manifestacao.sql](file://supabase/schemas/06_pendentes_manifestacao.sql)
- [07_audiencias.sql](file://supabase/schemas/07_audiencias.sql)
- [08_usuarios.sql](file://supabase/schemas/08_usuarios.sql)
- [09_clientes.sql](file://supabase/schemas/09_clientes.sql)
- [11_contratos.sql](file://supabase/schemas/11_contratos.sql)
- [12_contrato_processos.sql](file://supabase/schemas/12_contrato_processos.sql)
- [contrato-persistence.service.ts](file://backend/contratos/services/persistence/contrato-persistence.service.ts)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Tabela acervo](#tabela-acervo)
3. [Tabela contratos](#tabela-contratos)
4. [Tabela clientes](#tabela-clientes)
5. [Tabela usuarios](#tabela-usuarios)
6. [Tabela pendentes_manifestacao](#tabela-pendentes_manifestacao)
7. [Tabela audiencias](#tabela-audiencias)
8. [Tabela contrato_processos](#tabela-contrato_processos)
9. [Tipos ENUM](#tipos-enum)
10. [Serviços de Persistência](#serviços-de-persistência)
11. [Exemplos de Consultas](#exemplos-de-consultas)

## Introdução
Este documento detalha os esquemas SQL utilizados no sistema sinesys, uma aplicação jurídica para gestão processual. Os esquemas foram projetados para suportar a captura, armazenamento e relacionamento de dados processuais, contratuais e de clientes, com foco em integração com o sistema PJE (Processo Judicial Eletrônico) dos Tribunais Regionais do Trabalho (TRTs). O modelo relacional permite o acompanhamento de processos judiciais, audiências, pendências de manifestação e a gestão de contratos jurídicos associados a esses processos.

## Tabela acervo
A tabela `acervo` armazena todos os processos judiciais capturados do sistema PJE, tanto do acervo geral quanto de processos arquivados. Ela serve como repositório central de dados processuais, permitindo o acompanhamento de múltiplos processos por advogado.

**Campos da tabela acervo**
| Campo | Tipo de Dados | Chave Primária | Comentário |
|-------|---------------|----------------|----------|
| id | bigint | Sim | Identificador único gerado automaticamente |
| id_pje | bigint | Não | ID do processo no sistema PJE |
| advogado_id | bigint | Não | Referência ao advogado que capturou o processo |
| origem | text | Não | Origem do processo: 'acervo_geral' ou 'arquivado' |
| trt | public.codigo_tribunal | Não | Código do TRT onde o processo está tramitando |
| grau | public.grau_tribunal | Não | Grau do processo (primeiro_grau ou segundo_grau) |
| numero_processo | text | Não | Número do processo no formato CNJ |
| numero | bigint | Não | Número sequencial do processo |
| descricao_orgao_julgador | text | Não | Descrição completa do órgão julgador |
| classe_judicial | text | Não | Classe judicial do processo (ex: ATOrd, ATSum) |
| segredo_justica | boolean | Não | Indica se o processo está em segredo de justiça |
| codigo_status_processo | text | Não | Código do status do processo (ex: DISTRIBUIDO) |
| prioridade_processual | integer | Não | Prioridade processual do processo |
| nome_parte_autora | text | Não | Nome da parte autora |
| qtde_parte_autora | integer | Não | Quantidade de partes autoras |
| nome_parte_re | text | Não | Nome da parte ré |
| qtde_parte_re | integer | Não | Quantidade de partes rés |
| data_autuacao | timestamptz | Não | Data de autuação do processo |
| juizo_digital | boolean | Não | Indica se o processo é de juízo digital |
| data_arquivamento | timestamptz | Não | Data de arquivamento do processo |
| data_proxima_audiencia | timestamptz | Não | Data da próxima audiência agendada |
| tem_associacao | boolean | Não | Indica se o processo possui processos associados |
| created_at | timestamptz | Não | Data de criação do registro |
| updated_at | timestamptz | Não | Data da última atualização do registro |

**Propósito no Domínio Jurídico**
A tabela `acervo` é fundamental para a gestão processual, pois centraliza todos os processos judiciais sob acompanhamento do escritório. A unicidade do processo é garantida pela combinação `(id_pje, trt, grau, numero_processo)`, permitindo que múltiplos advogados do mesmo escritório acessem o mesmo processo sem duplicação de registros.

**Exemplo de DDL**
```sql
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
  unique (id_pje, trt, grau, numero_processo)
);
```

**Section sources**
- [04_acervo.sql](file://supabase/schemas/04_acervo.sql)

## Tabela contratos
A tabela `contratos` armazena os contratos jurídicos firmados pelo escritório de advocacia. Cada contrato representa um acordo com um cliente para prestação de serviços jurídicos, podendo estar em diferentes status como em contratação, contratado ou distribuído.

**Campos da tabela contratos**
| Campo | Tipo de Dados | Chave Primária | Comentário |
|-------|---------------|----------------|----------|
| id | bigint | Sim | Identificador único gerado automaticamente |
| area_direito | public.area_direito | Não | Área de direito do contrato |
| tipo_contrato | public.tipo_contrato | Não | Tipo de contrato jurídico |
| tipo_cobranca | public.tipo_cobranca | Não | Tipo de cobrança (pró-exito ou pró-labore) |
| cliente_id | bigint | Não | ID do cliente principal do contrato |
| polo_cliente | public.polo_processual | Não | Polo processual que o cliente principal ocupa (autor ou ré) |
| parte_contraria_id | bigint | Não | ID da parte contrária principal (opcional) |
| parte_autora | jsonb | Não | Array de partes autoras em formato JSONB |
| parte_re | jsonb | Não | Array de partes rés em formato JSONB |
| qtde_parte_autora | integer | Não | Quantidade de partes autoras |
| qtde_parte_re | integer | Não | Quantidade de partes rés |
| status | public.status_contrato | Não | Status do contrato no sistema |
| data_contratacao | timestamptz | Não | Data de contratação (início do processo de contratação) |
| data_assinatura | date | Não | Data de assinatura do contrato |
| data_distribuicao | date | Não | Data de distribuição do processo |
| data_desistencia | date | Não | Data de desistência do contrato |
| responsavel_id | bigint | Não | ID do usuário responsável pelo contrato |
| created_by | bigint | Não | ID do usuário que criou o registro |
| observacoes | text | Não | Observações gerais sobre o contrato |
| dados_anteriores | jsonb | Não | Armazena o estado anterior do registro antes da última atualização |
| created_at | timestamptz | Não | Data de criação do registro |
| updated_at | timestamptz | Não | Data da última atualização do registro |

**Propósito no Domínio Jurídico**
A tabela `contratos` é essencial para a gestão de relacionamentos com clientes e para o controle de serviços jurídicos prestados. Ela permite rastrear o status de cada contrato, desde a contratação até a distribuição do processo judicial, e armazena informações cruciais sobre as partes envolvidas.

**Exemplo de DDL**
```sql
create table public.contratos (
  id bigint generated always as identity primary key,
  area_direito public.area_direito not null,
  tipo_contrato public.tipo_contrato not null,
  tipo_cobranca public.tipo_cobranca not null,
  cliente_id bigint not null references public.clientes(id) on delete restrict,
  polo_cliente public.polo_processual not null,
  parte_contraria_id bigint references public.partes_contrarias(id) on delete set null,
  parte_autora jsonb,
  parte_re jsonb,
  qtde_parte_autora integer not null default 1,
  qtde_parte_re integer not null default 1,
  status public.status_contrato not null default 'em_contratacao',
  data_contratacao timestamptz default now() not null,
  data_assinatura date,
  data_distribuicao date,
  data_desistencia date,
  responsavel_id bigint references public.usuarios(id) on delete set null,
  created_by bigint references public.usuarios(id) on delete set null,
  observacoes text,
  dados_anteriores jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
```

**Section sources**
- [11_contratos.sql](file://supabase/schemas/11_contratos.sql)

## Tabela clientes
A tabela `clientes` armazena o cadastro de clientes do escritório de advocacia, podendo ser pessoas físicas (PF) ou pessoas jurídicas (PJ). Ela contém informações de identificação, contato e dados pessoais relevantes para a atuação jurídica.

**Campos da tabela clientes**
| Campo | Tipo de Dados | Chave Primária | Comentário |
|-------|---------------|----------------|----------|
| id | bigint | Sim | Identificador único gerado automaticamente |
| tipo_pessoa | public.tipo_pessoa | Não | Tipo de pessoa: física (pf) ou jurídica (pj) |
| nome | text | Não | Nome completo (PF) ou Razão Social (PJ) |
| nome_fantasia | text | Não | Nome social (PF) ou Nome fantasia (PJ) |
| cpf | text | Não | CPF do cliente (obrigatório para PF, único) |
| cnpj | text | Não | CNPJ do cliente (obrigatório para PJ, único) |
| rg | text | Não | RG do cliente (apenas para PF) |
| data_nascimento | date | Não | Data de nascimento (apenas para PF) |
| genero | public.genero_usuario | Não | Gênero do cliente (apenas para PF) |
| estado_civil | public.estado_civil | Não | Estado civil do cliente (apenas para PF) |
| nacionalidade | text | Não | Nacionalidade do cliente (apenas para PF) |
| naturalidade | text | Não | Naturalidade do cliente - cidade/estado de nascimento (apenas para PF) |
| inscricao_estadual | text | Não | Inscrição estadual (apenas para PJ) |
| email | text | Não | E-mail do cliente |
| telefone_primario | text | Não | Telefone primário do cliente |
| telefone_secundario | text | Não | Telefone secundário do cliente |
| endereco | jsonb | Não | Endereço completo do cliente em formato JSONB |
| observacoes | text | Não | Observações gerais sobre o cliente |
| created_by | bigint | Não | ID do usuário que criou o registro |
| dados_anteriores | jsonb | Não | Armazena o estado anterior do registro antes da última atualização |
| ativo | boolean | Não | Indica se o cliente está ativo no sistema |
| created_at | timestamptz | Não | Data de criação do registro |
| updated_at | timestamptz | Não | Data da última atualização do registro |

**Propósito no Domínio Jurídico**
A tabela `clientes` é fundamental para a gestão de relacionamentos com clientes, armazenando todas as informações necessárias para a atuação jurídica. A distinção entre pessoas físicas e jurídicas permite a coleta de dados específicos para cada tipo de cliente, enquanto o campo `endereco` em formato JSONB oferece flexibilidade para armazenar endereços complexos.

**Exemplo de DDL**
```sql
create table public.clientes (
  id bigint generated always as identity primary key,
  tipo_pessoa public.tipo_pessoa not null,
  nome text not null,
  nome_fantasia text,
  cpf text unique,
  cnpj text unique,
  rg text,
  data_nascimento date,
  genero public.genero_usuario,
  estado_civil public.estado_civil,
  nacionalidade text,
  naturalidade text,
  inscricao_estadual text,
  email text,
  telefone_primario text,
  telefone_secundario text,
  endereco jsonb,
  observacoes text,
  created_by bigint references public.usuarios(id) on delete set null,
  dados_anteriores jsonb,
  ativo boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
```

**Section sources**
- [09_clientes.sql](file://supabase/schemas/09_clientes.sql)

## Tabela usuarios
A tabela `usuarios` armazena o cadastro de usuários do sistema, que são funcionários ou colaboradores do escritório de advocacia. Ela contém dados pessoais, profissionais e de contato dos usuários.

**Campos da tabela usuarios**
| Campo | Tipo de Dados | Chave Primária | Comentário |
|-------|---------------|----------------|----------|
| id | bigint | Sim | Identificador único gerado automaticamente |
| nome_completo | text | Não | Nome completo do usuário |
| nome_exibicao | text | Não | Nome para exibição no sistema |
| cpf | text | Não | CPF do usuário (único, sem formatação) |
| rg | text | Não | RG do usuário |
| data_nascimento | date | Não | Data de nascimento do usuário |
| genero | public.genero_usuario | Não | Gênero do usuário |
| oab | text | Não | Número da OAB (se o usuário for advogado) |
| uf_oab | text | Não | UF onde a OAB foi emitida |
| email_pessoal | text | Não | E-mail pessoal do usuário |
| email_corporativo | text | Não | E-mail corporativo do usuário (único) |
| telefone | text | Não | Telefone do usuário |
| ramal | text | Não | Ramal do telefone |
| endereco | jsonb | Não | Endereço completo do usuário em formato JSONB |
| auth_user_id | uuid | Não | Referência ao usuário no Supabase Auth (opcional) |
| ativo | boolean | Não | Indica se o usuário está ativo no sistema |
| created_at | timestamptz | Não | Data de criação do registro |
| updated_at | timestamptz | Não | Data da última atualização do registro |

**Propósito no Domínio Jurídico**
A tabela `usuarios` é essencial para a gestão de acesso e responsabilidades dentro do escritório. Ela permite identificar os responsáveis por diferentes ações no sistema, como a criação de contratos ou a atribuição de responsabilidades em processos. O campo `oab` é particularmente importante para advogados, pois armazena sua inscrição na Ordem dos Advogados do Brasil.

**Exemplo de DDL**
```sql
create table public.usuarios (
  id bigint generated always as identity primary key,
  nome_completo text not null,
  nome_exibicao text not null,
  cpf text not null unique,
  rg text,
  data_nascimento date,
  genero public.genero_usuario,
  oab text,
  uf_oab text,
  email_pessoal text,
  email_corporativo text not null unique,
  telefone text,
  ramal text,
  endereco jsonb,
  auth_user_id uuid references auth.users(id) on delete cascade,
  ativo boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
```

**Section sources**
- [08_usuarios.sql](file://supabase/schemas/08_usuarios.sql)

## Tabela pendentes_manifestacao
A tabela `pendentes_manifestacao` armazena os processos que aguardam manifestação do advogado no sistema PJE. Esses são expedientes que requerem resposta ou ação por parte do advogado dentro de um prazo legal.

**Campos da tabela pendentes_manifestacao**
| Campo | Tipo de Dados | Chave Primária | Comentário |
|-------|---------------|----------------|----------|
| id | bigint | Sim | Identificador único gerado automaticamente |
| id_pje | bigint | Não | ID do expediente no sistema PJE (não é o ID do processo) |
| advogado_id | bigint | Não | Referência ao advogado que capturou o expediente |
| processo_id | bigint | Não | Referência ao processo na tabela acervo |
| trt | public.codigo_tribunal | Não | Código do TRT onde o processo está tramitando |
| grau | public.grau_tribunal | Não | Grau do processo (primeiro_grau ou segundo_grau) |
| numero_processo | text | Não | Número do processo no formato CNJ |
| descricao_orgao_julgador | text | Não | Descrição completa do órgão julgador |
| classe_judicial | text | Não | Classe judicial do processo (ex: ATOrd, ATSum) |
| numero | bigint | Não | Número sequencial do processo |
| segredo_justica | boolean | Não | Indica se o processo está em segredo de justiça |
| codigo_status_processo | text | Não | Código do status do processo (ex: DISTRIBUIDO) |
| prioridade_processual | integer | Não | Prioridade processual do processo |
| nome_parte_autora | text | Não | Nome da parte autora |
| qtde_parte_autora | integer | Não | Quantidade de partes autoras |
| nome_parte_re | text | Não | Nome da parte ré |
| qtde_parte_re | integer | Não | Quantidade de partes rés |
| data_autuacao | timestamptz | Não | Data de autuação do processo |
| juizo_digital | boolean | Não | Indica se o processo é de juízo digital |
| data_arquivamento | timestamptz | Não | Data de arquivamento do processo |
| id_documento | bigint | Não | ID do documento/expediente pendente |
| data_ciencia_parte | timestamptz | Não | Data em que a parte tomou ciência do expediente |
| data_prazo_legal_parte | timestamptz | Não | Data limite para manifestação da parte |
| data_criacao_expediente | timestamptz | Não | Data de criação do expediente |
| prazo_vencido | boolean | Não | Indica se o prazo para manifestação já venceu |
| sigla_orgao_julgador | text | Não | Sigla do órgão julgador (ex: VT33RJ) |
| created_at | timestamptz | Não | Data de criação do registro |
| updated_at | timestamptz | Não | Data da última atualização do registro |

**Propósito no Domínio Jurídico**
A tabela `pendentes_manifestacao` é crucial para o controle de prazos processuais, alertando os advogados sobre expedientes que exigem resposta imediata. O campo `prazo_vencido` permite identificar rapidamente pendências com risco de preclusão, enquanto o campo `data_prazo_legal_parte` define o limite final para manifestação.

**Exemplo de DDL**
```sql
create table public.pendentes_manifestacao (
  id bigint generated always as identity primary key,
  id_pje bigint not null,
  advogado_id bigint not null references public.advogados(id) on delete cascade,
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
  data_autuacao timestamptz not null,
  juizo_digital boolean not null default false,
  data_arquivamento timestamptz,
  id_documento bigint,
  data_ciencia_parte timestamptz,
  data_prazo_legal_parte timestamptz,
  data_criacao_expediente timestamptz,
  prazo_vencido boolean not null default false,
  sigla_orgao_julgador text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (id_pje, trt, grau, numero_processo)
);
```

**Section sources**
- [06_pendentes_manifestacao.sql](file://supabase/schemas/06_pendentes_manifestacao.sql)

## Tabela audiencias
A tabela `audiencias` armazena as audiências agendadas dos processos judiciais. Ela contém informações sobre a data, hora, local e status das audiências, permitindo o planejamento e acompanhamento das atividades processuais.

**Campos da tabela audiencias**
| Campo | Tipo de Dados | Chave Primária | Comentário |
|-------|---------------|----------------|----------|
| id | bigint | Sim | Identificador único gerado automaticamente |
| id_pje | bigint | Não | ID da audiência no sistema PJE |
| advogado_id | bigint | Não | Referência ao advogado que capturou a audiência |
| processo_id | bigint | Não | Referência ao processo na tabela acervo |
| orgao_julgador_id | bigint | Não | Referência ao órgão julgador da audiência |
| trt | public.codigo_tribunal | Não | Código do TRT onde a audiência está agendada |
| grau | public.grau_tribunal | Não | Grau do processo (primeiro_grau ou segundo_grau) |
| numero_processo | text | Não | Número do processo no formato CNJ |
| data_inicio | timestamptz | Não | Data e hora de início da audiência |
| data_fim | timestamptz | Não | Data e hora de fim da audiência |
| sala_audiencia_nome | text | Não | Nome da sala de audiência |
| sala_audiencia_id | bigint | Não | ID da sala de audiência no PJE |
| status | text | Não | Status da audiência (M=Marcada, R=Realizada, C=Cancelada) |
| status_descricao | text | Não | Descrição do status da audiência |
| tipo_id | bigint | Não | ID do tipo de audiência no PJE |
| tipo_descricao | text | Não | Descrição do tipo de audiência (ex: Una, Instrução) |
| tipo_codigo | text | Não | Código do tipo de audiência |
| tipo_is_virtual | boolean | Não | Indica se a audiência é virtual |
| designada | boolean | Não | Indica se a audiência está designada |
| em_andamento | boolean | Não | Indica se a audiência está em andamento |
| documento_ativo | boolean | Não | Indica se há documento ativo relacionado |
| polo_ativo_nome | text | Não | Nome da parte autora |
| polo_ativo_cpf | text | Não | CPF da parte autora |
| polo_passivo_nome | text | Não | Nome da parte ré |
| polo_passivo_cnpj | text | Não | CNPJ da parte ré |
| url_audiencia_virtual | text | Não | URL para audiências virtuais (Zoom, Google Meet, etc) |
| hora_inicial | time | Não | Hora inicial da audiência |
| hora_final | time | Não | Hora final da audiência |
| created_at | timestamptz | Não | Data de criação do registro |
| updated_at | timestamptz | Não | Data da última atualização do registro |

**Propósito no Domínio Jurídico**
A tabela `audiencias` é vital para o planejamento e gestão de audiências judiciais, especialmente com o aumento de audiências virtuais. O campo `url_audiencia_virtual` facilita o acesso a audiências online, enquanto os campos `data_inicio` e `data_fim` permitem a integração com calendários e sistemas de agendamento.

**Exemplo de DDL**
```sql
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
  sala_audiencia_nome text,
  sala_audiencia_id bigint,
  status text not null,
  status_descricao text,
  tipo_id bigint,
  tipo_descricao text,
  tipo_codigo text,
  tipo_is_virtual boolean default false,
  designada boolean not null default false,
  em_andamento boolean not null default false,
  documento_ativo boolean not null default false,
  polo_ativo_nome text,
  polo_ativo_cpf text,
  polo_passivo_nome text,
  polo_passivo_cnpj text,
  url_audiencia_virtual text,
  hora_inicial time,
  hora_final time,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (id_pje, trt, grau, numero_processo)
);
```

**Section sources**
- [07_audiencias.sql](file://supabase/schemas/07_audiencias.sql)

## Tabela contrato_processos
A tabela `contrato_processos` estabelece o relacionamento entre contratos e processos judiciais. Um contrato pode ter múltiplos processos associados, refletindo a realidade de que um mesmo contrato de prestação de serviços pode dar origem a vários processos judiciais.

**Campos da tabela contrato_processos**
| Campo | Tipo de Dados | Chave Primária | Comentário |
|-------|---------------|----------------|----------|
| id | bigint | Sim | Identificador único gerado automaticamente |
| contrato_id | bigint | Não | ID do contrato |
| processo_id | bigint | Não | ID do processo na tabela acervo |
| created_at | timestamptz | Não | Data de criação do relacionamento |

**Propósito no Domínio Jurídico**
A tabela `contrato_processos` é essencial para vincular contratos jurídicos a processos judiciais específicos, permitindo o rastreamento de quais processos foram originados por cada contrato. Isso é crucial para a gestão financeira e de desempenho, pois permite associar resultados processuais a contratos específicos.

**Exemplo de DDL**
```sql
create table public.contrato_processos (
  id bigint generated always as identity primary key,
  contrato_id bigint not null references public.contratos(id) on delete cascade,
  processo_id bigint not null references public.acervo(id) on delete cascade,
  created_at timestamptz default now() not null,
  unique (contrato_id, processo_id)
);
```

**Section sources**
- [12_contrato_processos.sql](file://supabase/schemas/12_contrato_processos.sql)

## Tipos ENUM
O sistema define diversos tipos ENUM para garantir consistência e integridade dos dados. Esses tipos são definidos no arquivo `01_enums.sql` e são utilizados em várias tabelas do sistema.

**Tipos ENUM definidos**
| Tipo | Valores | Comentário |
|------|--------|----------|
| grau_tribunal | 'primeiro_grau', 'segundo_grau' | Grau do processo no tribunal (primeiro ou segundo grau) |
| codigo_tribunal | 'TRT1' a 'TRT24' | Código do Tribunal Regional do Trabalho (TRT1 a TRT24) |
| genero_usuario | 'masculino', 'feminino', 'outro', 'prefiro_nao_informar' | Gênero do usuário do sistema |
| tipo_pessoa | 'pf', 'pj' | Tipo de pessoa: física (pf) ou jurídica (pj) |
| estado_civil | 'solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel', 'outro' | Estado civil da pessoa física |
| area_direito | 'trabalhista', 'civil', 'previdenciario', 'criminal', 'empresarial', 'administrativo' | Área de direito do contrato |
| tipo_contrato | 'ajuizamento', 'defesa', 'ato_processual', 'assessoria', 'consultoria', 'extrajudicial', 'parecer' | Tipo de contrato jurídico |
| tipo_cobranca | 'pro_exito', 'pro_labore' | Tipo de cobrança do contrato |
| status_contrato | 'em_contratacao', 'contratado', 'distribuido', 'desistencia' | Status do contrato no sistema |
| polo_processual | 'autor', 're' | Polo processual (autor ou ré) |

**Exemplo de DDL para ENUM**
```sql
-- Enum para grau do processo no TRT
create type public.grau_tribunal as enum (
  'primeiro_grau',
  'segundo_grau'
);
comment on type public.grau_tribunal is 'Grau do processo no tribunal (primeiro ou segundo grau)';

-- Enum para código do tribunal TRT
create type public.codigo_tribunal as enum (
  'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9',
  'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17',
  'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24'
);
comment on type public.codigo_tribunal is 'Código do Tribunal Regional do Trabalho (TRT1 a TRT24)';
```

**Section sources**
- [01_enums.sql](file://supabase/schemas/01_enums.sql)

## Serviços de Persistência
Os serviços de persistência no backend implementam as operações CRUD para as tabelas do banco de dados. O serviço `contrato-persistence.service.ts` é um exemplo de como esses serviços são implementados para a tabela `contratos`.

**Principais Funções do Serviço contrato-persistence.service.ts**
- `criarContrato`: Cadastra um novo contrato no sistema
- `atualizarContrato`: Atualiza um contrato existente
- `buscarContratoPorId`: Busca um contrato por ID
- `listarContratos`: Lista contratos com filtros e paginação

Esses serviços utilizam o cliente Supabase para interagir com o banco de dados, aplicando validações e tratando erros de forma adequada. Eles são consumidos pelos serviços de negócio que implementam a lógica de negócio específica do domínio jurídico.

**Section sources**
- [contrato-persistence.service.ts](file://backend/contratos/services/persistence/contrato-persistence.service.ts)

## Exemplos de Consultas
Esta seção apresenta exemplos de consultas comuns para recuperação e manipulação de dados no sistema sinesys.

**Listar contratos com seus clientes**
```sql
select 
  c.id,
  c.area_direito,
  c.tipo_contrato,
  c.status,
  cli.nome as cliente_nome,
  u.nome_completo as responsavel_nome
from contratos c
join clientes cli on c.cliente_id = cli.id
left join usuarios u on c.responsavel_id = u.id
where c.status = 'contratado'
order by c.created_at desc;
```

**Buscar processos pendentes de manifestação por advogado**
```sql
select 
  p.id,
  p.numero_processo,
  p.nome_parte_autora,
  p.nome_parte_re,
  p.data_prazo_legal_parte,
  p.prazo_vencido
from pendentes_manifestacao p
where p.advogado_id = 123
  and p.prazo_vencido = false
order by p.data_prazo_legal_parte asc;
```

**Encontrar audiências futuras de um processo**
```sql
select 
  a.id,
  a.numero_processo,
  a.data_inicio,
  a.data_fim,
  a.sala_audiencia_nome,
  a.tipo_descricao,
  a.url_audiencia_virtual
from audiencias a
where a.processo_id = 456
  and a.data_inicio > now()
order by a.data_inicio asc;
```

**Contar processos por TRT e grau**
```sql
select 
  trt,
  grau,
  count(*) as total_processos
from acervo
group by trt, grau
order by trt, grau;
```

**Atualizar status de um contrato**
```sql
update contratos 
set status = 'distribuido',
    data_distribuicao = '2025-01-15',
    updated_at = now()
where id = 789;
```

**Section sources**
- [11_contratos.sql](file://supabase/schemas/11_contratos.sql)
- [04_acervo.sql](file://supabase/schemas/04_acervo.sql)
- [06_pendentes_manifestacao.sql](file://supabase/schemas/06_pendentes_manifestacao.sql)
- [07_audiencias.sql](file://supabase/schemas/07_audiencias.sql)