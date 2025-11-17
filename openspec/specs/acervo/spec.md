# Capability: Gestão de Acervo Processual

## Purpose
API REST para gerenciamento do acervo de processos jurídicos capturados do PJE-TRT. Fornece listagem com paginação, filtros avançados, busca textual e atribuição de responsáveis. Integra dados capturados do PJE com gestão interna do escritório.

## Requirements

### Requirement: Listagem de Processos do Acervo
O sistema MUST fornecer endpoint para listar processos do acervo com suporte a paginação, ordenação e filtros.

#### Scenario: GET /api/acervo com paginação
- **WHEN** uma requisição GET é enviada com parâmetros page e limit
- **THEN** o sistema deve retornar página de processos solicitada
- **AND** incluir total de registros e total de páginas
- **AND** limitar resultados ao valor de limit

#### Scenario: Listagem com ordenação
- **WHEN** parâmetros orderBy e orderDirection são fornecidos
- **THEN** o sistema deve ordenar resultados pela coluna especificada
- **AND** aplicar direção ascendente ou descendente conforme solicitado

#### Scenario: Primeira página sem parâmetros
- **WHEN** nenhum parâmetro é fornecido
- **THEN** o sistema deve retornar primeira página com 10 registros
- **AND** ordenar por data de atualização descendente

### Requirement: Filtros Avançados
O sistema MUST permitir filtragem de processos por múltiplos critérios combinados.

#### Scenario: Filtro por tribunal (TRT)
- **WHEN** parâmetro trt é fornecido
- **THEN** o sistema deve retornar apenas processos do tribunal especificado

#### Scenario: Filtro por grau
- **WHEN** parâmetro grau é fornecido (primeiro_grau ou segundo_grau)
- **THEN** o sistema deve retornar apenas processos do grau especificado

#### Scenario: Filtro por status
- **WHEN** parâmetro status é fornecido
- **THEN** o sistema deve retornar apenas processos com o status especificado

#### Scenario: Filtro por responsável
- **WHEN** parâmetro responsavel_id é fornecido
- **THEN** o sistema deve retornar apenas processos atribuídos ao usuário especificado

#### Scenario: Filtros combinados
- **WHEN** múltiplos filtros são aplicados simultaneamente
- **THEN** o sistema deve aplicar lógica AND entre todos os filtros
- **AND** retornar apenas processos que atendem todos os critérios

### Requirement: Busca Textual
O sistema MUST permitir busca textual em campos relevantes dos processos.

#### Scenario: Busca por número do processo
- **WHEN** parâmetro search contém número de processo
- **THEN** o sistema deve retornar processos cujo número corresponde parcial ou totalmente

#### Scenario: Busca por classe judicial
- **WHEN** parâmetro search contém nome de classe judicial
- **THEN** o sistema deve buscar na coluna classe_judicial

#### Scenario: Busca em múltiplos campos
- **WHEN** parâmetro search é fornecido
- **THEN** o sistema deve buscar em: numero_processo, classe_judicial, assunto, orgao_julgador
- **AND** aplicar lógica OR entre os campos

### Requirement: Atribuição de Responsável
O sistema MUST permitir atribuir ou alterar o responsável de um processo.

#### Scenario: PUT /api/acervo/[id]/responsavel com usuário válido
- **WHEN** uma requisição PUT é enviada com responsavel_id válido
- **THEN** o sistema deve atualizar o campo responsavel_id do processo
- **AND** registrar timestamp da atribuição
- **AND** registrar quem fez a atribuição no log de auditoria

#### Scenario: Remoção de responsável
- **WHEN** uma requisição PUT é enviada com responsavel_id null
- **THEN** o sistema deve remover o responsável do processo
- **AND** registrar a remoção no log

#### Scenario: Responsável inexistente
- **WHEN** responsavel_id fornecido não existe
- **THEN** o sistema deve retornar erro 404 Not Found
- **AND** não alterar o processo

### Requirement: Visualização de Processo Individual
O sistema MUST fornecer endpoint para buscar detalhes de um processo específico.

#### Scenario: GET /api/acervo/[id] com ID válido
- **WHEN** uma requisição GET é enviada com ID de processo existente
- **THEN** o sistema deve retornar todos os dados do processo
- **AND** incluir informações do responsável (se atribuído)
- **AND** incluir dados de auditoria (created_at, updated_at)

#### Scenario: Processo não encontrado
- **WHEN** ID fornecido não existe
- **THEN** o sistema deve retornar erro 404 Not Found
- **AND** incluir mensagem descritiva

### Requirement: Autenticação Obrigatória
Todos os endpoints MUST exigir autenticação válida via Supabase Auth.

#### Scenario: Requisição sem autenticação
- **WHEN** uma requisição é feita sem token de autenticação
- **THEN** o sistema deve retornar erro 401 Unauthorized
- **AND** não processar a requisição

#### Scenario: Token expirado
- **WHEN** uma requisição é feita com token expirado
- **THEN** o sistema deve retornar erro 401 Unauthorized
- **AND** solicitar nova autenticação

### Requirement: Resposta Padronizada
Todos os endpoints MUST retornar respostas no formato JSON padronizado.

#### Scenario: Resposta de sucesso
- **WHEN** operação é bem-sucedida
- **THEN** resposta deve conter: { success: true, data: {...} }
- **AND** código HTTP 200 ou 201

#### Scenario: Resposta de erro
- **WHEN** operação falha
- **THEN** resposta deve conter: { success: false, error: "mensagem" }
- **AND** código HTTP apropriado (400, 401, 404, 500)

#### Scenario: Lista paginada
- **WHEN** endpoint retorna lista paginada
- **THEN** resposta deve incluir: data (array), total, totalPages, currentPage
- **AND** permitir navegação entre páginas

### Requirement: Documentação OpenAPI
A API MUST ser documentada usando padrão OpenAPI/Swagger com anotações JSDoc.

#### Scenario: Documentação de endpoint
- **WHEN** endpoint é criado
- **THEN** deve incluir anotações JSDoc com @swagger
- **AND** descrever parâmetros, respostas e exemplos
- **AND** ser acessível via /api/docs

### Requirement: Sincronização com Dados Capturados
O sistema MUST manter sincronização com dados capturados do PJE-TRT.

#### Scenario: Atualização de processo existente
- **WHEN** captura do PJE atualiza processo existente
- **THEN** dados devem ser atualizados no acervo
- **AND** manter campos de gestão interna (responsavel_id)

#### Scenario: Novo processo capturado
- **WHEN** novo processo é capturado do PJE
- **THEN** deve ser adicionado ao acervo automaticamente
- **AND** ficar disponível para listagem imediatamente
