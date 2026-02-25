## ADDED Requirements

### Requirement: CRUD de Tipos de Contrato
O sistema SHALL permitir criar, listar, atualizar e deletar tipos de contrato configuráveis pelo admin, substituindo o enum fixo `tipo_contrato`.

#### Scenario: Criar tipo de contrato
- **WHEN** admin cria tipo de contrato informando nome, slug e descrição opcional
- **THEN** o sistema persiste na tabela `contrato_tipos` e retorna o registro criado

#### Scenario: Rejeitar slug duplicado
- **WHEN** admin tenta criar tipo de contrato com slug já existente
- **THEN** o sistema retorna erro 409 (Conflict)

#### Scenario: Listar tipos de contrato
- **WHEN** admin lista tipos de contrato com filtros opcionais (ativo, search)
- **THEN** o sistema retorna tipos ordenados por ordem e nome

#### Scenario: Atualizar tipo de contrato
- **WHEN** admin atualiza nome, descrição, ativo ou ordem de um tipo
- **THEN** o sistema persiste as alterações e retorna o registro atualizado

#### Scenario: Impedir deleção de tipo em uso
- **WHEN** admin tenta deletar tipo de contrato referenciado por contratos existentes
- **THEN** o sistema retorna erro 409 indicando que há contratos usando este tipo

### Requirement: CRUD de Tipos de Cobrança
O sistema SHALL permitir criar, listar, atualizar e deletar tipos de cobrança configuráveis pelo admin, substituindo o enum fixo `tipo_cobranca`.

#### Scenario: Criar tipo de cobrança
- **WHEN** admin cria tipo de cobrança informando nome, slug e descrição opcional
- **THEN** o sistema persiste na tabela `contrato_tipos_cobranca` e retorna o registro criado

#### Scenario: Listar tipos de cobrança
- **WHEN** admin lista tipos de cobrança com filtros opcionais (ativo, search)
- **THEN** o sistema retorna tipos ordenados por ordem e nome

#### Scenario: Atualizar tipo de cobrança
- **WHEN** admin atualiza nome, descrição, ativo ou ordem
- **THEN** o sistema persiste as alterações e retorna o registro atualizado

#### Scenario: Impedir deleção de tipo de cobrança em uso
- **WHEN** admin tenta deletar tipo de cobrança referenciado por contratos existentes
- **THEN** o sistema retorna erro 409 indicando que há contratos usando este tipo

### Requirement: Seed de tipos a partir dos enums existentes
O sistema SHALL popular as tabelas `contrato_tipos` e `contrato_tipos_cobranca` com registros correspondentes aos valores atuais dos enums PostgreSQL durante a migration.

#### Scenario: Migration seed de tipos de contrato
- **WHEN** a migration é executada
- **THEN** o sistema insere registros para: ajuizamento, defesa, ato_processual, assessoria, consultoria, extrajudicial, parecer
- **AND** cada registro recebe nome formatado (ex: "Ato Processual"), slug do enum e ativo = true

#### Scenario: Migration seed de tipos de cobrança
- **WHEN** a migration é executada
- **THEN** o sistema insere registros para: pro_exito ("Pró-Êxito"), pro_labore ("Pró-Labore")
- **AND** cada registro recebe ativo = true

### Requirement: Schema de banco de dados para tipos configuráveis
O sistema SHALL manter as tabelas `contrato_tipos` e `contrato_tipos_cobranca` com as constraints definidas.

#### Scenario: Estrutura da tabela contrato_tipos
- **WHEN** a tabela é criada
- **THEN** SHALL conter: id (PK identity), nome (text NOT NULL), slug (text NOT NULL UNIQUE), descricao (text), ativo (boolean default true), ordem (integer default 0), created_at, updated_at
- **AND** RLS habilitado com policy service_role full access e authenticated select

#### Scenario: Estrutura da tabela contrato_tipos_cobranca
- **WHEN** a tabela é criada
- **THEN** SHALL conter: id (PK identity), nome (text NOT NULL), slug (text NOT NULL UNIQUE), descricao (text), ativo (boolean default true), ordem (integer default 0), created_at, updated_at
- **AND** RLS habilitado com policy service_role full access e authenticated select
