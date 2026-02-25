## ADDED Requirements

### Requirement: CRUD de Pipelines de Contrato
O sistema SHALL permitir criar, listar, atualizar e deletar pipelines de contrato vinculados a segmentos, com relação 1:1 (um pipeline por segmento).

#### Scenario: Criar pipeline para segmento
- **WHEN** admin cria um pipeline informando segmento_id, nome e descrição
- **THEN** o sistema persiste o pipeline na tabela `contrato_pipelines`
- **AND** retorna o pipeline criado com id e timestamps

#### Scenario: Rejeitar pipeline duplicado por segmento
- **WHEN** admin tenta criar pipeline para segmento que já possui pipeline
- **THEN** o sistema retorna erro 409 (Conflict) com mensagem explicativa
- **AND** não cria o registro

#### Scenario: Listar pipelines
- **WHEN** admin lista pipelines com filtros opcionais (ativo, segmento_id)
- **THEN** o sistema retorna pipelines com seus estágios inclusos, ordenados por nome

#### Scenario: Atualizar pipeline
- **WHEN** admin atualiza nome, descrição ou status ativo de um pipeline
- **THEN** o sistema persiste as alterações e retorna o pipeline atualizado

#### Scenario: Deletar pipeline sem contratos vinculados
- **WHEN** admin deleta um pipeline cujos estágios não possuem contratos associados
- **THEN** o sistema remove o pipeline e seus estágios em cascata

#### Scenario: Impedir deleção de pipeline com contratos
- **WHEN** admin tenta deletar pipeline cujos estágios possuem contratos associados
- **THEN** o sistema retorna erro 409 indicando que há contratos vinculados
- **AND** não remove o pipeline

### Requirement: CRUD de Estágios de Pipeline
O sistema SHALL permitir criar, atualizar, reordenar e remover estágios dentro de um pipeline, garantindo que exatamente um estágio seja marcado como default.

#### Scenario: Criar estágio em pipeline existente
- **WHEN** admin cria estágio informando pipeline_id, nome, slug, cor e ordem
- **THEN** o sistema persiste o estágio na tabela `contrato_pipeline_estagios`
- **AND** se for o primeiro estágio do pipeline, marca automaticamente como `is_default = true`

#### Scenario: Reordenar estágios via drag-and-drop
- **WHEN** admin envia array de estágio IDs na nova ordem
- **THEN** o sistema atualiza o campo `ordem` de cada estágio sequencialmente
- **AND** retorna os estágios na nova ordem

#### Scenario: Alterar estágio default
- **WHEN** admin marca um estágio como default
- **THEN** o sistema desmarca o estágio default anterior
- **AND** marca o novo estágio como `is_default = true`
- **AND** garante que exatamente um estágio por pipeline tenha `is_default = true`

#### Scenario: Impedir remoção de estágio com contratos
- **WHEN** admin tenta remover estágio que possui contratos associados
- **THEN** o sistema retorna erro 409 indicando que há contratos no estágio
- **AND** sugere mover os contratos antes de remover

#### Scenario: Impedir remoção do último estágio default
- **WHEN** admin tenta remover o único estágio com `is_default = true`
- **THEN** o sistema retorna erro 422 indicando que o pipeline precisa de um estágio default

### Requirement: Seed automático de pipelines
O sistema SHALL criar automaticamente um pipeline default com 4 estágios para cada segmento ativo que não possua pipeline, durante a migration.

#### Scenario: Migration seed de pipelines
- **WHEN** a migration é executada
- **THEN** o sistema cria um pipeline para cada segmento ativo sem pipeline
- **AND** cada pipeline recebe 4 estágios: "Em Contratação" (default, cor azul, ordem 0), "Contratado" (cor verde, ordem 1), "Distribuído" (cor amarela, ordem 2), "Desistência" (cor vermelha, ordem 3)

### Requirement: Schema de banco de dados para pipelines
O sistema SHALL manter as tabelas `contrato_pipelines` e `contrato_pipeline_estagios` com as constraints definidas.

#### Scenario: Estrutura da tabela contrato_pipelines
- **WHEN** a tabela é criada
- **THEN** SHALL conter: id (PK identity), segmento_id (FK UNIQUE para segmentos), nome (text NOT NULL), descricao (text), ativo (boolean default true), created_at, updated_at
- **AND** RLS habilitado com policy service_role full access e authenticated select

#### Scenario: Estrutura da tabela contrato_pipeline_estagios
- **WHEN** a tabela é criada
- **THEN** SHALL conter: id (PK identity), pipeline_id (FK para contrato_pipelines ON DELETE CASCADE), nome (text NOT NULL), slug (text NOT NULL), cor (text NOT NULL default '#6B7280'), ordem (integer NOT NULL default 0), is_default (boolean NOT NULL default false), created_at, updated_at
- **AND** índice em (pipeline_id, ordem) para ordenação eficiente
- **AND** RLS habilitado com policy service_role full access e authenticated select
