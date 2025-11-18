# Capability: Gestão de Audiências

## Purpose
API REST para gerenciamento de audiências judiciais capturadas do PJE-TRT. Fornece listagem com paginação, filtros por data/status/tribunal, atribuição de responsáveis e vinculação com processos do acervo.
## Requirements
### Requirement: Listagem de Audiências
O sistema MUST fornecer endpoint para listar audiências com suporte a paginação, ordenação, filtros e incluir dados relacionados de órgão julgador e classe judicial.

#### Scenario: GET /api/audiencias com paginação
- **WHEN** uma requisição GET é enviada com parâmetros page e limit
- **THEN** o sistema deve retornar página de audiências solicitada
- **AND** incluir total de registros e total de páginas
- **AND** limitar resultados ao valor de limit

#### Scenario: Ordenação por data
- **WHEN** parâmetros orderBy=data_hora e orderDirection são fornecidos
- **THEN** o sistema deve ordenar audiências pela data e hora
- **AND** aplicar direção ascendente ou descendente

#### Scenario: Listagem padrão
- **WHEN** nenhum parâmetro é fornecido
- **THEN** o sistema deve retornar primeira página com 10 registros
- **AND** ordenar por data_hora ascendente (próximas audiências primeiro)

#### Scenario: Inclusão de dados relacionados
- **WHEN** audiências são listadas
- **THEN** sistema deve incluir via JOIN:
  - Descrição do órgão julgador (tabela orgao_julgador)
  - Classe judicial (tabela acervo via processo_id)
- **AND** campos devem estar disponíveis em cada registro de audiência

### Requirement: Filtros de Data
O sistema MUST permitir filtragem de audiências por período de data.

#### Scenario: Filtro por data inicial
- **WHEN** parâmetro data_inicio é fornecido
- **THEN** o sistema deve retornar apenas audiências a partir desta data

#### Scenario: Filtro por data final
- **WHEN** parâmetro data_fim é fornecido
- **THEN** o sistema deve retornar apenas audiências até esta data

#### Scenario: Filtro por período
- **WHEN** data_inicio e data_fim são fornecidos
- **THEN** o sistema deve retornar audiências no intervalo especificado
- **AND** incluir audiências nas datas limites

#### Scenario: Audiências futuras
- **WHEN** parâmetro futuras=true é fornecido
- **THEN** o sistema deve retornar apenas audiências com data posterior a hoje

#### Scenario: Audiências passadas
- **WHEN** parâmetro passadas=true é fornecido
- **THEN** o sistema deve retornar apenas audiências com data anterior a hoje

### Requirement: Filtros por Tribunal e Grau
O sistema MUST permitir filtragem por tribunal (TRT) e grau processual.

#### Scenario: Filtro por tribunal
- **WHEN** parâmetro trt é fornecido
- **THEN** o sistema deve retornar apenas audiências de processos do tribunal especificado

#### Scenario: Filtro por grau
- **WHEN** parâmetro grau é fornecido (primeiro_grau ou segundo_grau)
- **THEN** o sistema deve retornar apenas audiências de processos do grau especificado

#### Scenario: Filtros combinados de tribunal e grau
- **WHEN** trt e grau são fornecidos
- **THEN** o sistema deve aplicar ambos os filtros com lógica AND

### Requirement: Filtro por Responsável
O sistema MUST permitir filtrar audiências por responsável atribuído.

#### Scenario: Filtro por responsável específico
- **WHEN** parâmetro responsavel_id é fornecido
- **THEN** o sistema deve retornar apenas audiências atribuídas ao usuário

#### Scenario: Audiências sem responsável
- **WHEN** parâmetro sem_responsavel=true é fornecido
- **THEN** o sistema deve retornar apenas audiências sem responsável atribuído

### Requirement: Busca Textual
O sistema MUST permitir busca textual em campos relevantes das audiências.

#### Scenario: Busca por número do processo
- **WHEN** parâmetro search contém número de processo
- **THEN** o sistema deve retornar audiências de processos cujo número corresponde

#### Scenario: Busca por tipo de audiência
- **WHEN** parâmetro search contém tipo de audiência
- **THEN** o sistema deve buscar no campo tipo

#### Scenario: Busca em múltiplos campos
- **WHEN** parâmetro search é fornecido
- **THEN** o sistema deve buscar em: numero_processo, tipo, local
- **AND** aplicar lógica OR entre os campos

### Requirement: Atribuição de Responsável
O sistema MUST permitir atribuir ou alterar o responsável de uma audiência.

#### Scenario: PUT /api/audiencias/[id]/responsavel com usuário válido
- **WHEN** uma requisição PUT é enviada com responsavel_id válido
- **THEN** o sistema deve atualizar o campo responsavel_id da audiência
- **AND** registrar timestamp da atribuição
- **AND** registrar quem fez a atribuição no log de auditoria

#### Scenario: Remoção de responsável
- **WHEN** uma requisição PUT é enviada com responsavel_id null
- **THEN** o sistema deve remover o responsável da audiência
- **AND** registrar a remoção no log

#### Scenario: Audiência inexistente
- **WHEN** ID da audiência não existe
- **THEN** o sistema deve retornar erro 404 Not Found
- **AND** não processar a atribuição

### Requirement: Vinculação com Processos
O sistema MUST vincular audiências aos processos do acervo correspondentes.

#### Scenario: Audiência com processo existente
- **WHEN** audiência é capturada e processo existe no acervo
- **THEN** sistema deve vincular audiência ao processo via acervo_id

#### Scenario: Dados do processo na listagem
- **WHEN** audiências são listadas
- **THEN** sistema deve incluir dados básicos do processo vinculado
- **AND** incluir: numero_processo, classe_judicial, status

#### Scenario: Audiência sem processo vinculado
- **WHEN** audiência não possui processo correspondente
- **THEN** campo acervo_id deve ser null
- **AND** dados do processo devem ser exibidos como não disponíveis

### Requirement: Cálculo de Status
O sistema MUST calcular automaticamente status da audiência baseado na data.

#### Scenario: Audiência pendente
- **WHEN** data_hora da audiência é futura
- **THEN** status calculado deve ser "pendente"

#### Scenario: Audiência realizada
- **WHEN** data_hora da audiência é passada
- **THEN** status calculado deve ser "realizada"

#### Scenario: Audiência próxima (alerta)
- **WHEN** audiência está a menos de 24 horas
- **THEN** sistema deve incluir indicador de urgência
- **AND** destacar na interface

### Requirement: Autenticação Obrigatória
Todos os endpoints MUST exigir autenticação válida via Supabase Auth.

#### Scenario: Requisição sem autenticação
- **WHEN** uma requisição é feita sem token de autenticação
- **THEN** o sistema deve retornar erro 401 Unauthorized

#### Scenario: Acesso a audiência específica
- **WHEN** usuário autenticado acessa audiência
- **THEN** sistema deve permitir acesso conforme RLS do Supabase

### Requirement: Resposta Padronizada
Todos os endpoints MUST retornar respostas no formato JSON padronizado.

#### Scenario: Lista de audiências
- **WHEN** GET /api/audiencias retorna com sucesso
- **THEN** resposta deve conter: { success: true, data: [...], total, totalPages, currentPage }

#### Scenario: Atribuição de responsável
- **WHEN** PUT /api/audiencias/[id]/responsavel é bem-sucedida
- **THEN** resposta deve conter: { success: true, data: { audiencia atualizada } }

#### Scenario: Erro de validação
- **WHEN** parâmetros inválidos são fornecidos
- **THEN** resposta deve conter: { success: false, error: "mensagem descritiva" }
- **AND** código HTTP 400 Bad Request

### Requirement: Sincronização com Captura PJE
O sistema MUST manter sincronização com audiências capturadas do PJE-TRT.

#### Scenario: Nova audiência capturada
- **WHEN** captura do PJE identifica nova audiência
- **THEN** audiência deve ser inserida no banco de dados
- **AND** ficar disponível para listagem imediatamente

#### Scenario: Atualização de audiência existente
- **WHEN** captura atualiza audiência já existente
- **THEN** dados devem ser atualizados mantendo campos de gestão
- **AND** preservar responsavel_id atribuído manualmente

#### Scenario: Audiência cancelada no PJE
- **WHEN** audiência é removida/cancelada no PJE
- **THEN** sistema deve marcar como cancelada
- **AND** não remover do banco de dados (manter histórico)

### Requirement: Documentação OpenAPI
A API MUST ser documentada usando padrão OpenAPI/Swagger com anotações JSDoc.

#### Scenario: Documentação completa
- **WHEN** endpoints são acessados via /api/docs
- **THEN** documentação deve descrever todos os parâmetros
- **AND** incluir exemplos de requisições e respostas
- **AND** descrever códigos de erro possíveis

### Requirement: Múltiplas Visualizações de Audiências
O sistema MUST fornecer múltiplas formas de visualizar as audiências agendadas, permitindo ao usuário escolher entre visualização de tabela, semana, mês ou ano.

#### Scenario: Seleção de visualização
- **WHEN** usuário acessa a página de audiências
- **THEN** sistema deve exibir controle para alternar entre visualizações
- **AND** visualizações disponíveis: Atual (tabela), Semana, Mês, Ano
- **AND** preservar visualização selecionada durante a sessão

#### Scenario: Visualização por semana
- **WHEN** usuário seleciona visualização por semana
- **THEN** sistema deve exibir tabs para Segunda, Terça, Quarta, Quinta e Sexta
- **AND** cada tab deve mostrar tabela de audiências do dia correspondente
- **AND** permitir navegação entre semanas

#### Scenario: Visualização por mês
- **WHEN** usuário seleciona visualização por mês
- **THEN** sistema deve exibir calendário mensal tamanho da página
- **AND** mostrar audiências nos dias correspondentes
- **AND** permitir navegação entre meses

#### Scenario: Visualização por ano
- **WHEN** usuário seleciona visualização por ano
- **THEN** sistema deve exibir grid com 12 meses pequenos
- **AND** marcar dias que possuem audiências
- **AND** permitir navegação entre anos
- **AND** permitir clicar em mês para abrir visualização mensal

### Requirement: Reorganização de Colunas da Tabela
O sistema MUST reorganizar as colunas da tabela de audiências para melhor exibir informações relevantes em formato composto.

#### Scenario: Coluna de Hora
- **WHEN** tabela de audiências é exibida
- **THEN** primeira coluna deve mostrar apenas hora inicial
- **AND** formato: HH:mm
- **AND** não mostrar data

#### Scenario: Coluna composta de Processo
- **WHEN** tabela de audiências é exibida
- **THEN** coluna "Processo" deve conter:
  - Classe processual + número do processo (sem separação)
  - Badge com TRT
  - Badge com grau (1º Grau ou 2º Grau)
  - Órgão julgador
- **AND** informações devem ser organizadas verticalmente

#### Scenario: Coluna composta de Tipo/Local
- **WHEN** tabela de audiências é exibida
- **THEN** coluna deve conter tipo de audiência e sala
- **AND** informações devem ser organizadas verticalmente

#### Scenario: Remoção de colunas desnecessárias
- **WHEN** tabela de audiências é exibida
- **THEN** não deve exibir coluna "Fim" (hora final)
- **AND** não deve exibir coluna "Status"

### Requirement: Filtro de Status como Dropdown
O sistema MUST mover o filtro de status da tabela para um dropdown separado após filtros avançados.

#### Scenario: Posicionamento do filtro
- **WHEN** página de audiências é carregada
- **THEN** dropdown de status deve aparecer após botão de filtros avançados
- **AND** antes da tabela

#### Scenario: Opções de status
- **WHEN** usuário clica no dropdown de status
- **THEN** sistema deve mostrar opções: Marcada, Realizada, Cancelada
- **AND** permitir seleção de uma opção

#### Scenario: Status default
- **WHEN** página é carregada pela primeira vez
- **THEN** dropdown deve estar com "Marcada" selecionado
- **AND** tabela deve mostrar apenas audiências marcadas

#### Scenario: Aplicação do filtro
- **WHEN** usuário seleciona status diferente
- **THEN** sistema deve recarregar audiências com novo filtro
- **AND** resetar para primeira página
- **AND** manter outros filtros ativos

