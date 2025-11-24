# api-routes Specification

## Purpose
TBD - created by archiving change captura-partes-pje. Update Purpose after archive.
## Requirements
### Requirement: Endpoint POST para Captura de Partes
O sistema MUST fornecer endpoint REST para iniciar captura de partes de processos.

#### Scenario: Capturar partes de processos específicos
- **WHEN** requisição POST é enviada para `/api/captura/trt/partes` com body:
  ```json
  {
    "advogado_id": 1,
    "credencial_ids": [5, 6],
    "processo_ids": [100, 101, 102]
  }
  ```
- **THEN** o sistema deve autenticar usuário via `authenticateRequest()`
- **AND** deve validar que `advogado_id` existe
- **AND** deve buscar credenciais pelos IDs fornecidos
- **AND** deve buscar processos pelos IDs fornecidos
- **AND** deve capturar partes de cada processo usando primeira credencial ativa
- **AND** deve retornar resposta 200 com resultado:
  ```json
  {
    "success": true,
    "data": {
      "total_processos": 3,
      "total_partes": 8,
      "clientes": 3,
      "partes_contrarias": 3,
      "terceiros": 2,
      "representantes": 15,
      "vinculos": 8,
      "erros": [],
      "duracao_ms": 12500
    }
  }
  ```

#### Scenario: Capturar partes de todos os processos do advogado
- **WHEN** requisição POST é enviada sem `processo_ids`:
  ```json
  {
    "advogado_id": 1,
    "credencial_ids": [5]
  }
  ```
- **THEN** o sistema deve buscar todos os processos do advogado no banco
- **AND** deve capturar partes de todos os processos
- **AND** deve retornar total de processos processados

#### Scenario: Capturar com múltiplas credenciais
- **WHEN** requisição inclui múltiplas `credencial_ids`
- **THEN** o sistema deve usar primeira credencial ativa da lista
- **AND** se primeira falhar, deve tentar próxima credencial
- **AND** deve logar qual credencial foi usada

### Requirement: Validação de Parâmetros
O sistema MUST validar todos os parâmetros de entrada e retornar erros apropriados.

#### Scenario: Parâmetros obrigatórios ausentes
- **WHEN** requisição não inclui `advogado_id`
- **THEN** o sistema deve retornar status 400 com erro:
  ```json
  {
    "success": false,
    "error": "Parâmetro obrigatório ausente: advogado_id"
  }
  ```

#### Scenario: Credencial não encontrada
- **WHEN** `credencial_ids` não correspondem a credenciais existentes
- **THEN** o sistema deve retornar status 404 com erro:
  ```json
  {
    "success": false,
    "error": "Credenciais não encontradas: [5, 6]"
  }
  ```

#### Scenario: Processo não encontrado
- **WHEN** `processo_ids` incluem ID que não existe no banco
- **THEN** o sistema deve logar warning
- **AND** deve pular esse processo
- **AND** deve continuar com demais processos
- **AND** deve incluir no resultado: `{ processos_nao_encontrados: [999] }`

#### Scenario: Advogado não encontrado
- **WHEN** `advogado_id` não existe no banco
- **THEN** o sistema deve retornar status 404 com erro:
  ```json
  {
    "success": false,
    "error": "Advogado não encontrado: ID 99"
  }
  ```

### Requirement: Autenticação e Autorização
O sistema MUST verificar autenticação e autorização antes de processar captura.

#### Scenario: Usuário não autenticado
- **WHEN** requisição não possui token de autenticação válido
- **THEN** o sistema deve retornar status 401 com erro:
  ```json
  {
    "success": false,
    "error": "Unauthorized: Token de autenticação ausente ou inválido"
  }
  ```

#### Scenario: Usuário autenticado mas sem permissão
- **WHEN** usuário autenticado não possui permissão para capturar dados
- **THEN** o sistema deve retornar status 403 com erro:
  ```json
  {
    "success": false,
    "error": "Forbidden: Usuário não possui permissão para capturar dados"
  }
  ```

#### Scenario: Verificar propriedade de credenciais
- **WHEN** credencial não pertence ao advogado especificado
- **THEN** o sistema deve retornar status 403 com erro:
  ```json
  {
    "success": false,
    "error": "Credencial não pertence ao advogado especificado"
  }
  ```

### Requirement: Tratamento de Erros de Captura
O sistema MUST tratar adequadamente erros durante captura e retornar informações úteis.

#### Scenario: Erro de autenticação no PJE
- **WHEN** autenticação no PJE falha (credencial inválida)
- **THEN** o sistema deve retornar status 500 com erro:
  ```json
  {
    "success": false,
    "error": "Erro ao autenticar no PJE: Credencial inválida",
    "detalhes": {
      "credencial_id": 5,
      "trt": "TRT3",
      "grau": "1"
    }
  }
  ```

#### Scenario: Timeout de captura
- **WHEN** captura excede tempo limite configurado
- **THEN** o sistema deve retornar status 504 com erro:
  ```json
  {
    "success": false,
    "error": "Timeout: Captura excedeu tempo limite de 5 minutos",
    "data": {
      "processos_concluidos": 50,
      "processos_pendentes": 10
    }
  }
  ```

#### Scenario: Erro parcial com alguns sucessos
- **WHEN** alguns processos falham mas outros têm sucesso
- **THEN** o sistema deve retornar status 200 (sucesso parcial)
- **AND** deve incluir array de erros:
  ```json
  {
    "success": true,
    "data": {
      "total_processos": 5,
      "total_partes": 8,
      "clientes": 3,
      "partes_contrarias": 3,
      "terceiros": 2,
      "erros": [
        {
          "processo_id": 102,
          "erro": "Processo não encontrado no PJE"
        }
      ]
    }
  }
  ```

### Requirement: Documentação Swagger/OpenAPI
O sistema MUST fornecer documentação completa do endpoint via anotações Swagger.

#### Scenario: Documentação JSDoc completa
- **WHEN** endpoint é documentado
- **THEN** deve incluir anotações JSDoc com:
  - `@swagger` tag
  - Sumário: "Capturar partes de processos"
  - Descrição detalhada
  - Tag: "Captura"
  - Security: bearerAuth, sessionAuth, serviceApiKey
  - Parâmetros do body com tipos e descrições
  - Respostas: 200, 400, 401, 403, 404, 500, 504
  - Exemplos de request e response

#### Scenario: Schema de request body
- **WHEN** documentação é gerada
- **THEN** deve incluir schema:
  ```yaml
  requestBody:
    required: true
    content:
      application/json:
        schema:
          type: object
          required: [advogado_id, credencial_ids]
          properties:
            advogado_id:
              type: integer
              description: ID do advogado proprietário das credenciais
            credencial_ids:
              type: array
              items:
                type: integer
              description: IDs das credenciais para usar na autenticação
            processo_ids:
              type: array
              items:
                type: integer
              description: IDs dos processos para capturar (opcional, padrão todos)
  ```

### Requirement: Registro em Histórico de Capturas
O sistema MUST registrar cada captura no histórico (`capturas_log`) para auditoria.

#### Scenario: Registrar início de captura
- **WHEN** captura é iniciada
- **THEN** o sistema deve criar registro em `capturas_log` com:
  - `tipo_captura: 'partes'`
  - `status: 'in_progress'`
  - `advogado_id`
  - `credencial_ids` (JSONB array)
  - `iniciado_em: NOW()`
- **AND** deve retornar `captura_log_id` para rastreamento

#### Scenario: Atualizar histórico ao concluir
- **WHEN** captura é concluída com sucesso
- **THEN** o sistema deve atualizar registro com:
  - `status: 'completed'`
  - `concluido_em: NOW()`
  - `resultado` (JSONB):
    ```json
    {
      "total_processos": 10,
      "total_partes": 25,
      "clientes": 10,
      "partes_contrarias": 10,
      "terceiros": 5,
      "representantes": 40,
      "vinculos": 25
    }
    ```

#### Scenario: Atualizar histórico em caso de erro
- **WHEN** captura falha
- **THEN** o sistema deve atualizar registro com:
  - `status: 'failed'`
  - `concluido_em: NOW()`
  - `erro: string` (mensagem de erro)

### Requirement: Response Headers
O sistema MUST incluir headers apropriados na resposta.

#### Scenario: Headers de resposta bem-sucedida
- **WHEN** captura é concluída
- **THEN** resposta deve incluir headers:
  - `Content-Type: application/json`
  - `X-Captura-Log-ID: {id}` (ID do registro de histórico)
  - `X-Duration-MS: {duration}` (duração da captura em ms)

#### Scenario: Headers CORS (se aplicável)
- **WHEN** requisição vem de origem permitida
- **THEN** resposta deve incluir headers CORS apropriados

