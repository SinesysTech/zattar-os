# database-partes Specification Delta

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Tabela clientes reestruturada com campos PJE
The system SHALL provide a `clientes` table restructured to use CPF/CNPJ as the unique identifier instead of `id_pessoa_pje`. The `id_pessoa_pje` column is moved to `cadastros_pje` table since the same person can have different IDs in different courts.

#### Scenario: Criar cliente PF com dados completos
**Given** dados de uma pessoa física do PJE
**When** cliente é criado com CPF, nome, sexo, data_nascimento, nome_genitora, uf_nascimento, naturalidade
**Then** todos os campos são salvos corretamente
**And** campo `tipo_pessoa='pf'` identifica pessoa física
**And** constraint UNIQUE em CPF garante unicidade (parcial, onde CPF não é null)
**And** `id_pessoa_pje` é registrado em `cadastros_pje` (não mais na tabela clientes)

#### Scenario: Upsert de cliente por CPF
**Given** um cliente com CPF "12345678900" já existe
**When** captura do PJE traz mesma pessoa com dados atualizados
**Then** cliente existente é ATUALIZADO (não duplicado)
**And** upsert usa CPF como chave de deduplicação
**And** registro em cadastros_pje é criado/atualizado para o TRT específico

---

### Requirement: Tabela partes_contrarias com estrutura idêntica a clientes
The system SHALL provide a `partes_contrarias` table with the same structure as `clientes`, using CPF/CNPJ as unique identifier. The `id_pessoa_pje` column is moved to `cadastros_pje` table.

#### Scenario: CRUD de parte contrária
**Given** a estrutura de clientes
**When** uma parte contrária é criada, lida, atualizada ou deletada
**Then** operações funcionam de forma idêntica a clientes
**And** mesmos campos, índices e validações aplicam
**And** constraint UNIQUE em CPF/CNPJ (parcial) garante unicidade
**And** `id_pessoa_pje` é registrado em `cadastros_pje` (não mais na tabela)

---

### Requirement: Tabela terceiros para terceiros interessados
The system SHALL provide a `terceiros` table for storing experts, public prosecutors, assistants and other third parties in lawsuits. Uses CPF/CNPJ as unique identifier, with `id_pessoa_pje` stored in `cadastros_pje` table.

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

### Requirement: Tabela representantes redesenhada
The system SHALL provide a `representantes` table with ONE record per person (unique by CPF), instead of one record per process. Fields `trt`, `grau`, `numero_processo` are removed. All `id_pessoa_pje` values are stored in `cadastros_pje` table.

#### Scenario: Representante único por CPF
**Given** um advogado representa clientes em múltiplos processos
**When** advogado é capturado do PJE
**Then** existe apenas UM registro na tabela `representantes` por CPF
**And** campos `trt`, `grau`, `numero_processo` NÃO existem na tabela representantes
**And** todos os id_pessoa_pje do advogado ficam em cadastros_pje
**And** vínculo representante-parte é mantido via processo_partes

#### Scenario: Representante em múltiplos TRTs
**Given** advogado atua no TRT03 (id_pessoa_pje=100) e TRT05 (id_pessoa_pje=500)
**When** captura processa ambos os TRTs
**Then** existe apenas 1 registro em `representantes` (por CPF)
**And** existem 2 registros em `cadastros_pje` (um por TRT)
**And** cada cadastros_pje tem o id_pessoa_pje correto do tribunal

---

### Requirement: Índices otimizados para queries comuns
The system SHALL provide optimized indexes for common queries, with id_pessoa_pje lookup now happening via cadastros_pje table instead of entity tables directly.

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

---

## REMOVED Requirements

### Requirement: id_pessoa_pje como identificador único global em tabelas de entidade
The system SHALL NO LONGER use `id_pessoa_pje` as a globally unique identifier in entity tables. This field is NOT globally unique - the same person has different IDs in each court/grade. The `id_pessoa_pje` column is removed from `clientes`, `partes_contrarias`, `terceiros`, and `representantes` tables.

#### Scenario: Migração de id_pessoa_pje existentes
**Given** tabelas de entidade têm coluna `id_pessoa_pje` populada
**When** migração é executada
**Then** valores de `id_pessoa_pje` são movidos para `cadastros_pje`
**And** coluna `id_pessoa_pje` é removida das tabelas de entidade
**And** lookup por `id_pessoa_pje` agora usa `cadastros_pje` com JOIN
