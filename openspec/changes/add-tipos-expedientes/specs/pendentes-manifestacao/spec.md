## MODIFIED Requirements

### Requirement: Estrutura de Dados de Expedientes Pendentes
O sistema SHALL armazenar expedientes pendentes de manifestação com todos os campos necessários, incluindo tipo de expediente e descrição de arquivos.

#### Scenario: Expediente com tipo e descrição
- **WHEN** um expediente pendente possui tipo de expediente e descrição atribuídos
- **THEN** o sistema armazena e retorna `tipo_expediente_id` e `descricao_arquivos` junto com os demais campos do expediente

#### Scenario: Expediente sem tipo e descrição
- **WHEN** um expediente pendente não possui tipo ou descrição atribuídos
- **THEN** o sistema armazena `null` nos campos `tipo_expediente_id` e `descricao_arquivos` sem erro

#### Scenario: Listar expedientes com tipo
- **WHEN** um usuário lista expedientes pendentes
- **THEN** o sistema retorna expedientes incluindo informações do tipo de expediente quando disponível (via JOIN com `tipos_expedientes`)

### Requirement: Filtros de Expedientes Pendentes
O sistema SHALL permitir filtrar expedientes pendentes por diversos critérios, incluindo tipo de expediente.

#### Scenario: Filtrar por tipo de expediente
- **WHEN** um usuário filtra expedientes por tipo de expediente específico
- **THEN** o sistema retorna apenas expedientes com o tipo especificado

#### Scenario: Filtrar por expedientes sem tipo
- **WHEN** um usuário filtra expedientes sem tipo atribuído
- **THEN** o sistema retorna apenas expedientes onde `tipo_expediente_id` é null

