## MODIFIED Requirements

### Requirement: API REST para Captura
O sistema MUST fornecer endpoints REST para iniciar capturas de dados do PJE-TRT usando credenciais identificadas por ID.

#### Scenario: Endpoint POST /api/captura/trt/acervo-geral com credencial_id
- **WHEN** uma requisição POST é enviada com `advogado_id` e `credencial_ids[]`
- **THEN** o sistema deve buscar credenciais pelos IDs fornecidos
- **AND** extrair tribunal e grau de cada credencial
- **AND** iniciar captura de acervo geral para cada credencial
- **AND** retornar status da operação com identificador de captura
- **AND** registrar captura no histórico com status "in_progress"

#### Scenario: Endpoint POST /api/captura/trt/arquivados com credencial_id
- **WHEN** uma requisição POST é enviada com `advogado_id` e `credencial_ids[]`
- **THEN** o sistema deve buscar credenciais pelos IDs fornecidos
- **AND** iniciar captura de processos arquivados para cada credencial
- **AND** retornar resultado da operação

#### Scenario: Endpoint POST /api/captura/trt/audiencias com credencial_id
- **WHEN** uma requisição POST é enviada com `advogado_id` e `credencial_ids[]`
- **THEN** o sistema deve buscar credenciais pelos IDs fornecidos
- **AND** iniciar captura de audiências para cada credencial
- **AND** retornar lista de audiências capturadas

#### Scenario: Endpoint POST /api/captura/trt/pendentes-manifestacao com credencial_id
- **WHEN** uma requisição POST é enviada com `advogado_id` e `credencial_ids[]`
- **THEN** o sistema deve buscar credenciais pelos IDs fornecidos
- **AND** iniciar captura de pendências para cada credencial
- **AND** retornar lista de pendências capturadas

#### Scenario: Resposta assíncrona para capturas longas
- **WHEN** uma captura é iniciada e pode levar vários minutos
- **THEN** o sistema deve retornar resposta imediata com status "in_progress"
- **AND** incluir identificador de captura para consulta posterior
- **AND** registrar captura no histórico para acompanhamento

## ADDED Requirements

### Requirement: Histórico de Capturas
O sistema MUST manter histórico de todas as capturas realizadas para consulta e auditoria.

#### Scenario: Listar histórico de capturas
- **WHEN** um usuário acessa o endpoint GET /api/captura/historico
- **THEN** o sistema deve retornar lista de capturas realizadas
- **AND** incluir status, tipo de captura, advogado, credenciais utilizadas
- **AND** incluir resultado ou erro se disponível
- **AND** ordenar por data de início (mais recentes primeiro)

#### Scenario: Consultar status de captura específica
- **WHEN** um usuário consulta uma captura pelo ID
- **THEN** o sistema deve retornar status atual (pending, in_progress, completed, failed)
- **AND** incluir resultado completo se concluída
- **AND** incluir mensagem de erro se falhou

