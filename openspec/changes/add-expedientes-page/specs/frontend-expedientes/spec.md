## ADDED Requirements

### Requirement: Hook usePendentes
O sistema SHALL fornecer um hook `usePendentes` para buscar expedientes pendentes de manifestação da API `/api/pendentes-manifestacao`.

#### Scenario: Buscar expedientes com parâmetros
- **WHEN** o hook é chamado com parâmetros de paginação, filtros e ordenação
- **THEN** uma requisição GET é feita para `/api/pendentes-manifestacao` com os parâmetros apropriados na query string

#### Scenario: Estado de loading
- **WHEN** uma requisição está em andamento
- **THEN** o hook retorna `isLoading: true`

#### Scenario: Tratamento de erros
- **WHEN** a API retorna um erro
- **THEN** o hook retorna `error` com a mensagem de erro apropriada

#### Scenario: Atualização automática
- **WHEN** os parâmetros do hook mudam
- **THEN** uma nova requisição é feita automaticamente

#### Scenario: Função refetch
- **WHEN** a função `refetch` é chamada
- **THEN** uma nova requisição é feita com os mesmos parâmetros

### Requirement: Tipos TypeScript para Expedientes
O sistema SHALL fornecer tipos TypeScript para expedientes, incluindo campos de baixa.

#### Scenario: Interface PendenteManifestacao atualizada
- **WHEN** o tipo `PendenteManifestacao` é usado
- **THEN** ele inclui os campos: `baixado_em`, `protocolo_id`, `justificativa_baixa`

#### Scenario: Tipos de filtros
- **WHEN** filtros são aplicados
- **THEN** o tipo `ExpedientesFilters` suporta todos os filtros disponíveis na API

### Requirement: Componente ExpedientesFiltrosAvancados
O sistema SHALL fornecer um componente de filtros avançados para expedientes seguindo o padrão visual de `ProcessosFiltrosAvancados`.

#### Scenario: Exibir filtros em sheet
- **WHEN** o usuário clica no botão de filtros
- **THEN** um sheet lateral é aberto com todos os filtros disponíveis

#### Scenario: Filtros específicos de expedientes
- **WHEN** o componente é renderizado
- **THEN** os seguintes filtros estão disponíveis:
  - TRT (select)
  - Grau (primeiro_grau, segundo_grau)
  - Responsável (select com opção "sem responsável")
  - Prazo vencido (checkbox)
  - Data do prazo legal (range de datas)
  - Data de ciência da parte (range de datas)
  - Data de criação do expediente (range de datas)
  - Classe judicial (input texto)
  - Status do processo (input texto)
  - Segredo de justiça (checkbox)
  - Juízo digital (checkbox)

#### Scenario: Aplicar filtros
- **WHEN** o usuário preenche filtros e clica em "Aplicar"
- **THEN** a função `onFiltersChange` é chamada com os filtros preenchidos
- **THEN** o sheet é fechado

#### Scenario: Resetar filtros
- **WHEN** o usuário clica em "Limpar filtros"
- **THEN** todos os filtros são resetados
- **THEN** a função `onReset` é chamada

#### Scenario: Sincronização de estado
- **WHEN** o sheet é aberto
- **THEN** os filtros locais são sincronizados com os filtros recebidos via props
- **WHEN** o sheet é fechado sem aplicar
- **THEN** as alterações locais são descartadas

### Requirement: Página de Expedientes
O sistema SHALL fornecer uma página que lista expedientes pendentes de manifestação utilizando o componente DataTable genérico.

#### Scenario: Exibir lista de expedientes
- **WHEN** o usuário acessa a página de expedientes
- **THEN** a lista de expedientes é exibida em uma tabela com paginação

#### Scenario: Colunas da tabela
- **WHEN** a página de expedientes é carregada
- **THEN** as seguintes colunas são exibidas:
  - Número do processo (ordenável)
  - Parte autora (ordenável)
  - Parte ré (ordenável)
  - Órgão julgador
  - Classe judicial
  - Data de ciência da parte
  - Data do prazo legal (ordenável, padrão)
  - Prazo vencido (badge colorido)
  - Status de baixa (indicador visual se baixado_em não é null)
  - Data de baixa (se aplicável)
  - Responsável

#### Scenario: Busca em expedientes
- **WHEN** o usuário digita no campo de busca
- **THEN** após um delay de 500ms (debounce), a busca é realizada nos campos: número do processo, parte autora, parte ré, órgão julgador, classe judicial e sigla do órgão julgador

#### Scenario: Filtros de expedientes
- **WHEN** o usuário aplica filtros através do componente `ExpedientesFiltrosAvancados`
- **THEN** os filtros são enviados para a API e a lista é atualizada

#### Scenario: Ordenação de expedientes
- **WHEN** a página é carregada pela primeira vez
- **THEN** a ordenação padrão é por `data_prazo_legal_parte` ascendente (mais urgentes primeiro)
- **WHEN** o usuário clica em uma coluna ordenável
- **THEN** a lista é reordenada pelo campo selecionado (ascendente ou descendente)

#### Scenario: Paginação de expedientes
- **WHEN** o usuário navega entre páginas
- **THEN** os expedientes da página selecionada são carregados da API
- **WHEN** o usuário altera o tamanho da página
- **THEN** uma nova requisição é feita com o novo limite

#### Scenario: Formatação de dados
- **WHEN** os dados são exibidos na tabela
- **THEN** as datas são formatadas em formato brasileiro (DD/MM/YYYY ou DD/MM/YYYY HH:mm)
- **THEN** o campo `prazo_vencido` é exibido como badge vermelho quando `true` e verde quando `false`
- **THEN** expedientes baixados são indicados visualmente (badge ou ícone)
- **THEN** campos nulos são exibidos como "-"

#### Scenario: Indicadores visuais de urgência
- **WHEN** um expediente tem `prazo_vencido: true`
- **THEN** o badge de prazo vencido é exibido em vermelho
- **WHEN** um expediente tem `data_prazo_legal_parte` próxima (ex: menos de 3 dias)
- **THEN** pode ser destacado visualmente (opcional, para implementação futura)

#### Scenario: Estado de loading
- **WHEN** uma requisição está em andamento
- **THEN** um indicador de loading é exibido na tabela

#### Scenario: Estado de erro
- **WHEN** uma requisição falha
- **THEN** uma mensagem de erro é exibida ao usuário

#### Scenario: Lista vazia
- **WHEN** não há expedientes para exibir
- **THEN** a mensagem "Nenhum expediente encontrado." é exibida

### Requirement: Integração com API de Pendentes de Manifestação
O sistema SHALL integrar com a API `/api/pendentes-manifestacao` para buscar dados de expedientes.

#### Scenario: Buscar expedientes
- **WHEN** a página de expedientes é carregada ou filtros são alterados
- **THEN** uma requisição GET é feita para `/api/pendentes-manifestacao` com os parâmetros apropriados

#### Scenario: Tratamento de erros da API
- **WHEN** a API retorna um erro
- **THEN** uma mensagem de erro apropriada é exibida ao usuário

#### Scenario: Autenticação
- **WHEN** uma requisição é feita à API
- **THEN** as credenciais de autenticação são incluídas automaticamente

#### Scenario: Parâmetros de query string
- **WHEN** uma requisição é feita
- **THEN** os parâmetros são convertidos corretamente para query string:
  - Paginação: `pagina`, `limite`
  - Busca: `busca`
  - Ordenação: `ordenar_por`, `ordem`
  - Filtros: todos os filtros aplicados são incluídos na query string
  - Valores booleanos são convertidos para strings "true"/"false"
  - Valores nulos são omitidos

### Requirement: Consistência Visual e Arquitetural
O sistema SHALL manter consistência visual e arquitetural com as páginas de processos e audiências.

#### Scenario: Layout consistente
- **WHEN** a página de expedientes é renderizada
- **THEN** ela segue o mesmo layout das páginas de processos e audiências:
  - Barra de busca no topo
  - Botão de filtros avançados ao lado da busca
  - Tabela abaixo com paginação

#### Scenario: Componentes reutilizáveis
- **WHEN** a página de expedientes é implementada
- **THEN** ela utiliza o componente `DataTable` genérico já existente
- **THEN** ela utiliza componentes shadcn/ui para UI (Input, Badge, Sheet, etc.)

#### Scenario: Padrão de código
- **WHEN** o código é implementado
- **THEN** ele segue os mesmos padrões das páginas existentes:
  - Uso de hooks customizados para busca de dados
  - Gerenciamento de estado local para filtros e paginação
  - Funções de formatação de dados separadas
  - Callbacks para handlers de eventos


