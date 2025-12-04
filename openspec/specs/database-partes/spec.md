# database-partes Specification

## Purpose
Define the database schema for parties involved in judicial processes: clients, opposing parties, third parties, and legal representatives. All entities use CPF/CNPJ as unique identifiers, with PJE system IDs stored separately in `cadastros_pje` table to handle multiple court/grade combinations.

## Requirements

### Requirement: Tabela cadastros_pje para mapeamento de IDs PJE
The system SHALL provide a `cadastros_pje` table that maps entities (clientes, partes_contrarias, terceiros, representantes) to their multiple IDs in judicial systems. The same person can have different `id_pessoa_pje` values in each court/grade combination.

#### Scenario: Registrar id_pessoa_pje de cliente em TRT específico
**Given** um cliente existe no banco com CPF único
**When** o cliente é capturado do PJE do TRT03 primeiro grau
**Then** um registro é criado em `cadastros_pje` com:
  - `tipo_entidade='cliente'`
  - `entidade_id=cliente.id`
  - `id_pessoa_pje` do PJE
  - `tribunal='TRT03'`
  - `grau='primeiro_grau'`
**And** constraint UNIQUE `(tipo_entidade, id_pessoa_pje, sistema, tribunal, grau)` previne duplicatas

#### Scenario: Mesmo cliente com IDs diferentes em TRTs diferentes
**Given** um cliente com CPF "12345678900" existe
**And** cliente tem `id_pessoa_pje=100` no TRT03
**When** cliente é capturado do TRT05 com `id_pessoa_pje=500`
**Then** NÃO é criado novo cliente (CPF já existe)
**And** novo registro é criado em `cadastros_pje` com:
  - `tipo_entidade='cliente'`
  - `entidade_id=cliente.id` (mesmo cliente)
  - `id_pessoa_pje=500`
  - `tribunal='TRT05'`
**And** cliente agora tem 2 registros em cadastros_pje

#### Scenario: Buscar cliente por id_pessoa_pje de TRT específico
**Given** cliente tem registros em cadastros_pje para TRT03 e TRT05
**When** query busca por `id_pessoa_pje=500, tribunal='TRT05', grau='primeiro_grau'`
**Then** retorna o cliente correto via JOIN com cadastros_pje
**And** busca usa índice `idx_cadastros_pje_id_pessoa`

#### Scenario: Listar todos os IDs PJE de uma pessoa
**Given** um representante atua em processos de 3 TRTs diferentes
**When** query busca todos os cadastros_pje do representante
**Then** retorna 3 registros com seus respectivos id_pessoa_pje
**And** cada registro tem tribunal e grau corretos
**And** busca usa índice `idx_cadastros_pje_entidade`

---

### Requirement: Tabela enderecos normalizada
The system SHALL provide a `enderecos` table that stores addresses for clients, opposing parties, and third parties in a normalized format, allowing multiple addresses per entity.

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

### Requirement: Tabela clientes com CPF/CNPJ como identificador único
The system SHALL provide a `clientes` table using CPF/CNPJ as the unique identifier. The `id_pessoa_pje` is stored in `cadastros_pje` table since the same person can have different IDs in different courts.

#### Scenario: Criar cliente PF com dados completos
**Given** dados de uma pessoa física do PJE
**When** cliente é criado com CPF, nome, sexo, data_nascimento, nome_genitora, uf_nascimento, naturalidade
**Then** todos os campos são salvos corretamente
**And** campo `tipo_pessoa='pf'` identifica pessoa física
**And** constraint UNIQUE parcial em CPF garante unicidade (onde CPF não é null)
**And** `id_pessoa_pje` é registrado em `cadastros_pje` (não na tabela clientes)

#### Scenario: Criar cliente PJ com dados empresariais
**Given** dados de uma pessoa jurídica do PJE
**When** cliente é criado com CNPJ, razão social, nome fantasia, data_abertura, porte, ramo_atividade
**Then** todos os campos PJ são salvos
**And** campo `tipo_pessoa='pj'` identifica pessoa jurídica
**And** constraint UNIQUE parcial em CNPJ garante unicidade

#### Scenario: Upsert de cliente por CPF
**Given** um cliente com CPF "12345678900" já existe
**When** captura do PJE traz mesma pessoa com dados atualizados
**Then** cliente existente é ATUALIZADO (não duplicado)
**And** upsert usa CPF como chave de deduplicação
**And** registro em cadastros_pje é criado/atualizado para o TRT específico

#### Scenario: Múltiplos emails em JSONB
**Given** um cliente com vários emails no PJE
**When** cliente é criado com `emails=['email1@...', 'email2@...', 'email3@...']`
**Then** array de emails é armazenado em JSONB
**And** queries podem buscar por email específico usando operadores JSONB

---

### Requirement: Tabela partes_contrarias com estrutura idêntica a clientes
The system SHALL provide a `partes_contrarias` table with the same structure as `clientes`, using CPF/CNPJ as unique identifier.

#### Scenario: CRUD de parte contrária
**Given** a estrutura de clientes
**When** uma parte contrária é criada, lida, atualizada ou deletada
**Then** operações funcionam de forma idêntica a clientes
**And** mesmos campos, índices e validações aplicam
**And** constraint UNIQUE parcial em CPF/CNPJ garante unicidade
**And** `id_pessoa_pje` é registrado em `cadastros_pje`

---

### Requirement: Tabela terceiros para terceiros interessados
The system SHALL provide a `terceiros` table for storing experts, public prosecutors, assistants and other third parties in lawsuits. Uses CPF/CNPJ as unique identifier.

#### Scenario: Criar terceiro tipo PERITO
**Given** dados de um perito do PJE
**When** terceiro é criado com `tipo_parte='PERITO'`, CPF, nome, especialidade
**Then** registro é salvo na tabela `terceiros`
**And** campo `tipo_parte` permite filtrar por tipo
**And** relacionamento com processo via `processo_partes` (tabela de junção)
**And** constraint UNIQUE em CPF/CNPJ garante unicidade
**And** registro em cadastros_pje vincula terceiro ao id_pessoa_pje do TRT

#### Scenario: Criar terceiro tipo MINISTERIO_PUBLICO
**Given** dados do MP do PJE
**When** terceiro é criado com `tipo_parte='MINISTERIO_PUBLICO'` e dados da instituição
**Then** terceiro é salvo como PJ
**And** campo `orgao_publico=true` identifica como órgão público

---

### Requirement: Tabela representantes com um registro por pessoa
The system SHALL provide a `representantes` table with ONE record per person (unique by CPF). Fields `trt`, `grau`, `numero_processo` do not exist. All `id_pessoa_pje` values are stored in `cadastros_pje` table. OAB registrations are stored in a JSONB array to support lawyers practicing in multiple states.

#### Scenario: Representante único por CPF
**Given** um advogado representa clientes em múltiplos processos
**When** advogado é capturado do PJE
**Then** existe apenas UM registro na tabela `representantes` por CPF
**And** campos `trt`, `grau`, `numero_processo` NÃO existem na tabela
**And** todos os id_pessoa_pje do advogado ficam em cadastros_pje
**And** vínculo representante-parte é mantido via processo_partes

#### Scenario: Representante em múltiplos TRTs
**Given** advogado atua no TRT03 (id_pessoa_pje=100) e TRT05 (id_pessoa_pje=500)
**When** captura processa ambos os TRTs
**Then** existe apenas 1 registro em `representantes` (por CPF)
**And** existem 2 registros em `cadastros_pje` (um por TRT)
**And** cada cadastros_pje tem o id_pessoa_pje correto do tribunal

#### Scenario: Representante com múltiplas OABs
**Given** advogado inscrito na OAB de MG e SP
**When** dados são capturados do PJE
**Then** campo `oabs` contém array JSONB: `[{"numero": "MG128404", "uf": "MG", "situacao": "REGULAR"}, {"numero": "SP999999", "uf": "SP", "situacao": "REGULAR"}]`
**And** busca por OAB usa índice GIN
**And** cada inscrição tem numero, uf e situacao

---

### Requirement: Tabela processo_partes para relacionamento N:N
The system SHALL provide a `processo_partes` table that relates processes to their parties (clientes, partes_contrarias, terceiros, representantes), storing participation-specific data.

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

#### Scenario: Vincular representante a parte em processo
**Given** um representante e uma parte existem em um processo
**When** relacionamento é criado com `tipo_entidade='representante'`, `entidade_id=representante.id`
**Then** registro é criado em `processo_partes`
**And** índice `idx_processo_partes_representante_entidade` otimiza buscas
**And** representante pode ser vinculado a múltiplas partes do mesmo processo

#### Scenario: Query de todas as partes de um processo
**Given** um processo com cliente, parte contrária e terceiro
**When** query é executada com JOINs para buscar todas as partes
**Then** retorna array com dados completos (nome, cpf, polo, tipo_parte)
**And** índices otimizam performance da query

---

### Requirement: Índices otimizados para queries comuns
The system SHALL provide optimized indexes for common queries, with id_pessoa_pje lookup via cadastros_pje table.

#### Scenario: Busca por id_pessoa_pje
**Given** índice em `cadastros_pje(id_pessoa_pje, sistema, tribunal, grau)`
**When** query busca por `id_pessoa_pje` + `tribunal` + `grau`
**Then** busca usa índice `idx_cadastros_pje_id_pessoa`
**And** JOIN com tabela de entidade retorna dados completos
**And** garante deduplicação de pessoas do PJE por tribunal/grau

#### Scenario: Busca por CPF/CNPJ
**Given** índice em CPF/CNPJ em cada tabela de entidade
**When** query busca por CPF exato
**Then** busca é instantânea (index scan)
**And** constraint UNIQUE garante uma pessoa por documento

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
