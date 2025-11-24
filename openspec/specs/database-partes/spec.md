# database-partes Specification

## Purpose
TBD - created by archiving change refatoracao-sistema-partes. Update Purpose after archive.
## Requirements
### Requirement: Tabela enderecos normalizada
The system SHALL provide a `enderecos` armazena endereços de clientes, partes contrárias e terceiros de forma normalizada, permitindo múltiplos endereços por entidade.

#### Scenario: Criar endereço para cliente
**Given** um cliente existe no banco
**When** um novo endereço é inserido com `entidade_tipo='cliente'` e `entidade_id=cliente.id`
**Then** o endereço é salvo com todos os campos do PJE
**And** o relacionamento polimórfico está correto
**And** índices permitem busca eficiente por entidade

#### Scenario: Múltiplos endereços com classificações
**Given** um cliente existe
**When** são criados múltiplos endereços com `classificacoes_endereco=['R']`, `['C']`, `['A']`
**Then** todos os endereços são armazenados separadamente
**And** queries podem filtrar por classificação
**And** campo `correspondencia` indica endereço de correspondência

---

### Requirement: Tabela clientes reestruturada com campos PJE
The system SHALL provide a `clientes` foi reestruturada para seguir fielmente a estrutura do PJE, com 60 campos totais.

#### Scenario: Criar cliente PF com dados completos
**Given** dados de uma pessoa física do PJE
**When** cliente é criado com CPF, nome, sexo, data_nascimento, nome_genitora, uf_nascimento, naturalidade
**Then** todos os campos são salvos corretamente
**And** campo `tipo_pessoa='pf'` identifica pessoa física
**And** campo `id_pessoa_pje` é único no banco

#### Scenario: Criar cliente PJ com dados empresariais
**Given** dados de uma pessoa jurídica do PJE
**When** cliente é criado com CNPJ, razão social, nome fantasia, data_abertura, porte, ramo_atividade
**Then** todos os campos PJ são salvos
**And** campo `tipo_pessoa='pj'` identifica pessoa jurídica
**And** situação CNPJ na Receita é armazenada

#### Scenario: Múltiplos emails em JSONB
**Given** um cliente com vários emails no PJE
**When** cliente é criado com `emails=['email1@...', 'email2@...', 'email3@...']`
**Then** array de emails é armazenado em JSONB
**And** queries podem buscar por email específico usando operadores JSONB

---

### Requirement: Tabela partes_contrarias com estrutura idêntica a clientes
The system SHALL provide a `partes_contrarias` tem a mesma estrutura de `clientes` para manter consistência.

#### Scenario: CRUD de parte contrária
**Given** a estrutura de clientes
**When** uma parte contrária é criada, lida, atualizada ou deletada
**Then** operações funcionam de forma idêntica a clientes
**And** mesmos campos, índices e validações aplicam

---

### Requirement: Tabela terceiros para terceiros interessados
The system SHALL provide a `terceiros` armazena peritos, ministério público, assistentes e outros terceiros interessados em processos.

#### Scenario: Criar terceiro tipo PERITO
**Given** dados de um perito do PJE
**When** terceiro é criado com `tipo_parte='PERITO'`, CPF, nome, especialidade
**Then** registro é salvo na tabela `terceiros`
**And** campo `tipo_parte` permite filtrar por tipo
**And** relacionamento com processo via `processo_id`

#### Scenario: Criar terceiro tipo MINISTERIO_PUBLICO
**Given** dados do MP do PJE
**When** terceiro é criado com `tipo_parte='MINISTERIO_PUBLICO'` e dados da instituição
**Then** terceiro é salvo como PJ
**And** campo `orgao_publico=true` identifica como órgão público

---

### Requirement: Tabela processo_partes para relacionamento N:N
The system SHALL provide a `processo_partes` relaciona processos com suas partes (clientes, partes contrárias, terceiros), armazenando dados específicos da participação.

#### Scenario: Vincular cliente a processo como AUTOR
**Given** um cliente e um processo existem
**When** relacionamento é criado com `tipo_entidade='cliente'`, `polo='ativo'`, `tipo_parte='AUTOR'`, `principal=true`, `ordem=1`
**Then** registro é criado em `processo_partes`
**And** constraint UNIQUE impede duplicação
**And** FK garante integridade referencial

#### Scenario: Mesmo cliente em múltiplos processos
**Given** um cliente existe
**When** cliente é vinculado a processo A como AUTOR e processo B como RÉU
**Then** dois registros são criados em `processo_partes`
**And** cada registro tem polo e tipo_parte específicos
**And** `dados_pje_completo` JSONB armazena JSON original

#### Scenario: Query de todas as partes de um processo
**Given** um processo com cliente, parte contrária e terceiro
**When** query é executada com JOINs para buscar todas as partes
**Then** retorna array com dados completos (nome, cpf, polo, tipo_parte)
**And** índices otimizam performance da query

---

### Requirement: Índices otimizados para queries comuns
Indexes SHALL garantem performance em queries frequentes.

#### Scenario: Busca por id_pessoa_pje
**Given** índice único em `id_pessoa_pje` em cada tabela
**When** query busca por `id_pessoa_pje`
**Then** busca é instantânea (index scan)
**And** garante deduplicação de pessoas do PJE

#### Scenario: Busca de endereços por entidade
**Given** índice composto em `enderecos(entidade_tipo, entidade_id)`
**When** query busca todos os endereços de um cliente
**Then** busca usa índice composto
**And** performance é otimizada mesmo com muitos endereços

#### Scenario: Busca de partes por processo
**Given** índice em `processo_partes(processo_id)`
**When** query busca todas as partes de um processo
**Then** busca usa índice
**And** JOIN com tabelas de entidades é eficiente

---

