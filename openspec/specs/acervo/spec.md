# Capability: Gestão de Acervo Processual

## Purpose
API REST para gerenciamento do acervo de processos jurídicos capturados do PJE-TRT. Fornece listagem com paginação, filtros avançados, busca textual e atribuição de responsáveis. Integra dados capturados do PJE com gestão interna do escritório.
## Requirements
### Requirement: Listagem de Processos do Acervo
O sistema MUST fornecer endpoint para listar processos do acervo com suporte a paginação, ordenação, filtros e unificação de multi-instâncias.

#### Scenario: GET /api/acervo com paginação
- **WHEN** uma requisição GET é enviada com parâmetros page e limit
- **THEN** o sistema deve retornar página de processos solicitada
- **AND** incluir total de registros e total de páginas
- **AND** limitar resultados ao valor de limit
- **AND** se `unified=true`, total reflete processos únicos (não instâncias)

#### Scenario: Listagem com ordenação
- **WHEN** parâmetros orderBy e orderDirection são fornecidos
- **THEN** o sistema deve ordenar resultados pela coluna especificada
- **AND** aplicar direção ascendente ou descendente conforme solicitado
- **AND** se `unified=true`, usar valor da instância principal para ordenação

#### Scenario: Primeira página sem parâmetros
- **WHEN** nenhum parâmetro é fornecido
- **THEN** o sistema deve retornar primeira página com 10 registros
- **AND** ordenar por data de atualização descendente
- **AND** aplicar `unified=true` como default

#### Scenario: Parâmetro unified explícito
- **WHEN** parâmetro `unified` é fornecido
- **THEN** o sistema deve respeitar o valor fornecido
- **AND** retornar processos agrupados (`true`) ou instâncias separadas (`false`)

### Requirement: Filtros Avançados
O sistema MUST permitir filtragem de processos por múltiplos critérios combinados, aplicados a processos unificados quando apropriado.

#### Scenario: Filtro por tribunal (TRT)
- **WHEN** parâmetro trt é fornecido
- **THEN** o sistema deve retornar apenas processos do tribunal especificado
- **AND** se `unified=true`, incluir processo se qualquer instância pertence ao TRT

#### Scenario: Filtro por grau
- **WHEN** parâmetro grau é fornecido (primeiro_grau ou segundo_grau)
- **THEN** o sistema deve retornar apenas processos do grau especificado
- **AND** se `unified=true`, incluir processo se possui instância no grau especificado

#### Scenario: Filtro por status
- **WHEN** parâmetro status é fornecido
- **THEN** o sistema deve retornar apenas processos com o status especificado
- **AND** se `unified=true`, aplicar filtro à instância principal

#### Scenario: Filtro por responsável
- **WHEN** parâmetro responsavel_id é fornecido
- **THEN** o sistema deve retornar apenas processos atribuídos ao usuário especificado
- **AND** se `unified=true`, incluir processo se qualquer instância tem o responsável

#### Scenario: Filtros combinados
- **WHEN** múltiplos filtros são aplicados simultaneamente
- **THEN** o sistema deve aplicar lógica AND entre todos os filtros
- **AND** retornar apenas processos que atendem todos os critérios
- **AND** respeitar lógica de unificação para cada filtro individual

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
Todos os endpoints MUST retornar respostas no formato JSON padronizado, incluindo metadados de unificação quando aplicável.

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
- **AND** se `unified=true`, cada item deve conter campo `instances`

#### Scenario: Processo unificado individual
- **WHEN** endpoint retorna processo unificado único
- **THEN** resposta deve incluir campo `instances` com array de metadados de instâncias
- **AND** campo `id` raiz deve ser ID da instância principal

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

### Requirement: Agrupamento de Processos Multi-Instância
O sistema MUST permitir visualização unificada de processos que possuem o mesmo número mas existem em graus diferentes (primeiro grau, segundo grau, TST).

#### Scenario: Processos com mesmo número em graus diferentes
- **WHEN** existem múltiplos registros com o mesmo `numero_processo` mas diferentes `grau`
- **THEN** o sistema deve identificá-los como instâncias do mesmo processo jurídico

#### Scenario: Agrupamento ativado por parâmetro
- **WHEN** parâmetro `unified=true` é fornecido (ou omitido, sendo o default)
- **THEN** o sistema deve retornar processos agrupados por `numero_processo`
- **AND** cada processo agrupado deve conter metadados sobre todas as suas instâncias

#### Scenario: Agrupamento desativado
- **WHEN** parâmetro `unified=false` é fornecido
- **THEN** o sistema deve retornar todos os registros separadamente (comportamento legado)
- **AND** manter compatibilidade com consumidores existentes da API

#### Scenario: Contagem de processos unificados
- **WHEN** `unified=true` está ativo
- **THEN** o campo `total` deve refletir número de processos únicos (por `numero_processo`)
- **AND** não contar múltiplas instâncias do mesmo processo como processos distintos

### Requirement: Metadados de Instâncias
O sistema MUST fornecer informações sobre todas as instâncias de um processo unificado.

#### Scenario: Estrutura de resposta unificada
- **WHEN** processo unificado é retornado
- **THEN** deve incluir campo `instances` contendo array de objetos
- **AND** cada objeto deve conter: `{ id, grau, origem, updated_at }`

#### Scenario: Identificação da instância principal
- **WHEN** processo possui múltiplas instâncias
- **THEN** o sistema deve usar a instância com maior `updated_at` como principal
- **AND** o campo `id` raiz do processo deve ser o ID da instância principal

#### Scenario: Processo com única instância
- **WHEN** processo existe em apenas um grau
- **THEN** o campo `instances` deve conter array com um único elemento
- **AND** comportamento deve ser consistente com processos multi-instância

### Requirement: Timeline Unificada e Deduplicada
O sistema MUST fornecer timeline consolidada para processos multi-instância, eliminando eventos duplicados.

#### Scenario: Busca de timeline unificada
- **WHEN** timeline de processo multi-instância é solicitada
- **THEN** o sistema deve buscar timeline de todas as instâncias
- **AND** agregar em uma única coleção de eventos

#### Scenario: Deduplicação de eventos
- **WHEN** eventos com mesmo conteúdo existem em múltiplas instâncias
- **THEN** o sistema deve identificá-los como duplicados usando hash de `(data, tipo, descricao)`
- **AND** manter apenas uma ocorrência de cada evento

#### Scenario: Ordenação cronológica
- **WHEN** timeline unificada é retornada
- **THEN** eventos devem estar ordenados por data (ascendente ou descendente conforme solicitado)
- **AND** eventos duplicados devem ser filtrados antes da ordenação

#### Scenario: Preservação de origem do evento
- **WHEN** evento é incluído na timeline unificada
- **THEN** deve incluir metadado sobre grau/instância de origem
- **AND** permitir rastreabilidade até a instância original

### Requirement: Índice de Performance para Agrupamento
O sistema MUST ter índice composto para otimizar queries de agrupamento por número de processo.

#### Scenario: Índice em numero_processo e updated_at
- **WHEN** banco de dados é configurado
- **THEN** deve existir índice composto `(numero_processo, updated_at DESC)`
- **AND** otimizar tanto agrupamento quanto seleção de instância principal

#### Scenario: Performance de agrupamento
- **WHEN** query de agrupamento é executada com índice
- **THEN** performance deve ser aceitável mesmo com milhares de registros
- **AND** não impactar significativamente tempo de resposta da API

### Requirement: Cache de Processos Unificados
O sistema MUST cachear resultados de queries unificadas separadamente de queries não-unificadas.

#### Scenario: Chave de cache incluindo parâmetro unified
- **WHEN** resultado é cacheado no Redis
- **THEN** chave deve incluir valor do parâmetro `unified`
- **AND** evitar retornar dados em formato incorreto

#### Scenario: Invalidação de cache ao atualizar processo
- **WHEN** qualquer instância de um processo é atualizada
- **THEN** cache de todas as variações (`unified=true` e `unified=false`) deve ser invalidado
- **AND** incluir invalidação de cache de timeline unificada

### Requirement: Atribuição de Responsável Unificado
O sistema MUST atribuir responsável ao processo unificado (por `numero_processo`), propagando para todas as instâncias.

#### Scenario: Atribuir responsável a processo unificado
- **WHEN** responsável é atribuído via `PUT /api/acervo/[id]/responsavel`
- **THEN** o sistema deve atualizar `responsavel_id` em **todas as instâncias** do mesmo `numero_processo`
- **AND** não permitir responsáveis diferentes para instâncias do mesmo processo

#### Scenario: Remover responsável de processo unificado
- **WHEN** responsável é removido (responsavel_id = null)
- **THEN** o sistema deve remover de todas as instâncias do mesmo `numero_processo`
- **AND** registrar a remoção no log de auditoria

#### Scenario: Buscar processo com responsável unificado
- **WHEN** processo unificado é retornado
- **THEN** campo `responsavel_id` deve ser o mesmo em todas as instâncias
- **AND** UI deve exibir um único responsável por processo

### Requirement: Identificação de Grau Atual
O sistema MUST identificar o grau atual do processo baseado na instância com maior data de autuação.

#### Scenario: Determinar grau atual
- **WHEN** processo possui múltiplas instâncias
- **THEN** o sistema deve identificar instância com maior `data_autuacao` como grau atual
- **AND** usar `updated_at` como critério de desempate se necessário

#### Scenario: Filtro por grau atual
- **WHEN** usuário filtra por grau específico
- **THEN** o sistema deve retornar processos cujo grau atual corresponde ao filtro
- **AND** não incluir processos que apenas transitaram pelo grau

#### Scenario: Badge de grau atual
- **WHEN** processo unificado é retornado
- **THEN** metadados devem incluir identificação de qual instância é o grau atual
- **AND** permitir UI destacar o grau atual visualmente

### Requirement: Agregação de Audiências e Pendências
O sistema MUST agregar audiências e pendências de todas as instâncias do processo unificado.

#### Scenario: Buscar audiências de processo unificado
- **WHEN** audiências de processo são solicitadas
- **THEN** o sistema deve buscar audiências de todas as instâncias do `numero_processo`
- **AND** ordenar por data da audiência

#### Scenario: Buscar expedientes de processo unificado
- **WHEN** expedientes (pendentes de manifestação) de processo são solicitados
- **THEN** o sistema deve buscar de todas as instâncias do `numero_processo`
- **AND** ordenar por data de criação descendente

#### Scenario: Indicar grau de origem
- **WHEN** audiência ou expediente é retornado
- **THEN** deve incluir metadado sobre qual instância/grau originou o item
- **AND** permitir UI exibir badge de grau ao lado de cada item

