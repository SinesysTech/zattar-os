## ADDED Requirements

### Requirement: API de Listagem de Audiências
O sistema SHALL fornecer um endpoint GET `/api/audiencias` que retorna uma lista paginada de audiências com suporte a filtros, ordenação e busca.

#### Scenario: Listar audiências com paginação
- **WHEN** uma requisição GET é feita para `/api/audiencias` com parâmetros de paginação
- **THEN** a API retorna uma lista paginada de audiências com informações de paginação (página atual, limite, total, total de páginas)

#### Scenario: Filtrar audiências por data
- **WHEN** uma requisição GET é feita com parâmetros `data_inicio` e `data_fim`
- **THEN** apenas audiências no período especificado são retornadas

#### Scenario: Filtrar audiências por status
- **WHEN** uma requisição GET é feita com parâmetro `status`
- **THEN** apenas audiências com o status especificado são retornadas

#### Scenario: Filtrar audiências por TRT e grau
- **WHEN** uma requisição GET é feita com parâmetros `trt` e `grau`
- **THEN** apenas audiências do TRT e grau especificados são retornadas

#### Scenario: Filtrar audiências por responsável
- **WHEN** uma requisição GET é feita com parâmetro `responsavel_id`
- **THEN** apenas audiências atribuídas ao responsável especificado são retornadas
- **WHEN** o parâmetro `sem_responsavel` é `true`
- **THEN** apenas audiências sem responsável atribuído são retornadas

#### Scenario: Buscar audiências por número do processo
- **WHEN** uma requisição GET é feita com parâmetro `busca` contendo número do processo
- **THEN** audiências cujo número do processo corresponde à busca são retornadas

#### Scenario: Ordenar audiências
- **WHEN** uma requisição GET é feita com parâmetros `ordenar_por` e `ordem`
- **THEN** as audiências são retornadas ordenadas pelo campo especificado na direção especificada

#### Scenario: Autenticação obrigatória
- **WHEN** uma requisição GET é feita sem autenticação
- **THEN** a API retorna erro 401 (Unauthorized)

### Requirement: Serviço de Backend para Listar Audiências
O sistema SHALL fornecer um serviço de backend que lista audiências do banco de dados com filtros, paginação e ordenação.

#### Scenario: Listar audiências do banco
- **WHEN** o serviço é chamado com parâmetros de filtro
- **THEN** as audiências são buscadas do banco de dados aplicando os filtros especificados

#### Scenario: Aplicar paginação
- **WHEN** o serviço é chamado com parâmetros de paginação
- **THEN** apenas os registros da página solicitada são retornados

#### Scenario: Aplicar ordenação
- **WHEN** o serviço é chamado com parâmetros de ordenação
- **THEN** os registros são ordenados conforme especificado

### Requirement: Hook useAudiencias
O sistema SHALL fornecer um hook React `useAudiencias` que gerencia o estado e a busca de audiências da API.

#### Scenario: Buscar audiências
- **WHEN** o hook é usado com parâmetros de busca
- **THEN** uma requisição é feita à API `/api/audiencias` com os parâmetros especificados

#### Scenario: Gerenciar estado de loading
- **WHEN** uma requisição está em andamento
- **THEN** o hook retorna `isLoading: true`

#### Scenario: Gerenciar estado de erro
- **WHEN** uma requisição falha
- **THEN** o hook retorna `error` com a mensagem de erro apropriada

#### Scenario: Atualizar dados automaticamente
- **WHEN** os parâmetros de busca mudam
- **THEN** uma nova requisição é feita automaticamente

### Requirement: Página de Audiências
O sistema SHALL fornecer uma página que lista audiências utilizando o componente DataTable genérico.

#### Scenario: Exibir lista de audiências
- **WHEN** o usuário acessa a página de audiências
- **THEN** a lista de audiências é exibida em uma tabela com paginação

#### Scenario: Colunas da tabela
- **WHEN** a página de audiências é carregada
- **THEN** as seguintes colunas são exibidas:
  - Data e hora de início
  - Número do processo
  - Parte autora
  - Parte ré
  - Órgão julgador
  - Sala de audiência
  - Status
  - Tipo de audiência
  - Responsável (se atribuído)

#### Scenario: Busca em audiências
- **WHEN** o usuário digita no campo de busca
- **THEN** a busca é realizada no número do processo, parte autora, parte ré e órgão julgador

#### Scenario: Filtros de audiências
- **WHEN** o usuário aplica filtros
- **THEN** os seguintes filtros estão disponíveis:
  - Data início e data fim
  - Status (Marcada, Realizada, Cancelada)
  - TRT
  - Grau (primeiro_grau, segundo_grau)
  - Responsável
  - Número do processo
  - Tipo de audiência

#### Scenario: Ordenação de audiências
- **WHEN** o usuário clica em uma coluna ordenável
- **THEN** a lista é reordenada pelo campo selecionado (ascendente ou descendente)

#### Scenario: Paginação de audiências
- **WHEN** o usuário navega entre páginas
- **THEN** as audiências da página selecionada são carregadas da API

#### Scenario: Formatação de dados
- **WHEN** os dados são exibidos na tabela
- **THEN** as datas são formatadas em formato brasileiro (DD/MM/YYYY HH:mm)
- **THEN** os status são exibidos com badges coloridos
- **THEN** campos opcionais são exibidos como "-" quando ausentes

### Requirement: Componente de Filtros Avançados para Audiências
O sistema SHALL fornecer um componente de filtros avançados específico para audiências.

#### Scenario: Exibir filtros
- **WHEN** o componente é renderizado
- **THEN** os seguintes filtros são exibidos:
  - Data início e data fim (date pickers)
  - Status (select dropdown)
  - TRT (select dropdown)
  - Grau (select dropdown)
  - Responsável (select dropdown ou busca)
  - Número do processo (input text)

#### Scenario: Aplicar filtros
- **WHEN** o usuário preenche e aplica os filtros
- **THEN** os filtros são passados para o componente pai via callback

#### Scenario: Resetar filtros
- **WHEN** o usuário clica no botão de reset
- **THEN** todos os filtros são limpos e o callback é chamado com filtros vazios

### Requirement: Integração com API de Audiências
O sistema SHALL integrar com a API `/api/audiencias` para buscar dados de audiências.

#### Scenario: Buscar audiências
- **WHEN** a página de audiências é carregada ou filtros são alterados
- **THEN** uma requisição GET é feita para `/api/audiencias` com os parâmetros apropriados

#### Scenario: Tratamento de erros da API
- **WHEN** a API retorna um erro
- **THEN** uma mensagem de erro apropriada é exibida ao usuário

#### Scenario: Autenticação
- **WHEN** uma requisição é feita à API
- **THEN** as credenciais de autenticação são incluídas automaticamente

