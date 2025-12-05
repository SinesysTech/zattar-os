# frontend-processos Specification

## Purpose
TBD - created by archiving change add-processos-page. Update Purpose after archive.
## Requirements
### Requirement: Componente DataTable Genérico
O sistema SHALL fornecer um componente DataTable genérico e reutilizável que suporte listagem de dados com paginação, ordenação, filtros, busca e visualização de processos unificados.

#### Scenario: Renderizar tabela com dados
- **WHEN** o componente DataTable recebe dados e configuração de colunas
- **THEN** a tabela é renderizada com os dados nas colunas especificadas
- **AND** suportar renderização customizada de células (ex: badges de grau)

#### Scenario: Paginação server-side
- **WHEN** o usuário navega para outra página
- **THEN** uma nova requisição é feita à API com os parâmetros de paginação atualizados
- **AND** total de páginas é calculado usando total de processos únicos

#### Scenario: Ordenação server-side
- **WHEN** o usuário clica em uma coluna ordenável
- **THEN** uma nova requisição é feita à API com os parâmetros de ordenação atualizados

#### Scenario: Busca textual
- **WHEN** o usuário digita no campo de busca
- **THEN** após um delay (debounce), uma nova requisição é feita à API com o termo de busca

#### Scenario: Filtros avançados
- **WHEN** o usuário aplica filtros (origem, TRT, grau, etc.)
- **THEN** uma nova requisição é feita à API com os filtros aplicados
- **AND** filtros consideram lógica de unificação (ex: grau filtra qualquer instância)

#### Scenario: Estado de loading
- **WHEN** uma requisição está em andamento
- **THEN** um indicador de loading é exibido na tabela

#### Scenario: Estado de erro
- **WHEN** uma requisição falha
- **THEN** uma mensagem de erro é exibida ao usuário

#### Scenario: Customização de renderização de célula
- **WHEN** coluna requer renderização customizada (ex: badges de grau)
- **THEN** componente deve aceitar função de renderização customizada
- **AND** aplicar renderização sem quebrar layout da tabela

### Requirement: Página de Processos
O sistema SHALL fornecer uma página que lista processos do acervo utilizando o componente DataTable genérico, exibindo processos unificados.

#### Scenario: Exibir lista de processos
- **WHEN** o usuário acessa a página de processos
- **THEN** a lista de processos é exibida em uma tabela com paginação
- **AND** processos com mesmo número aparecem como item único

#### Scenario: Colunas da tabela
- **WHEN** a página de processos é carregada
- **THEN** as seguintes colunas são exibidas:
  - Número do processo
  - Graus ativos (badges indicando primeiro grau, segundo grau, TST)
  - Parte autora
  - Parte ré
  - Órgão julgador (da instância principal)
  - Classe judicial (da instância principal)
  - Status (da instância principal)
  - Data de autuação (da instância mais antiga)
  - Data de arquivamento (se houver, da instância principal)
  - Próxima audiência (agregada de todas as instâncias)

#### Scenario: Busca em processos
- **WHEN** o usuário digita no campo de busca
- **THEN** a busca é realizada nos campos: número do processo, parte autora, parte ré, órgão julgador e classe judicial
- **AND** busca aplica-se a todas as instâncias do processo

#### Scenario: Filtros de processos
- **WHEN** o usuário aplica filtros
- **THEN** os seguintes filtros estão disponíveis:
  - Origem (acervo_geral, arquivado)
  - TRT
  - Grau (primeiro_grau, segundo_grau, TST) - inclui processo se possui instância no grau
  - Responsável - inclui processo se qualquer instância tem o responsável
  - Status do processo
  - Segredo de justiça
  - Juízo digital
  - Processos com associação
  - Processos com próxima audiência

#### Scenario: Ordenação de processos
- **WHEN** o usuário clica em uma coluna ordenável
- **THEN** a lista é reordenada pelo campo selecionado (ascendente ou descendente)
- **AND** ordenação usa valor da instância principal para processos multi-instância

#### Scenario: Paginação de processos
- **WHEN** o usuário navega entre páginas
- **THEN** os processos da página selecionada são carregados da API
- **AND** paginação reflete total de processos únicos (não instâncias)

#### Scenario: Formatação de dados
- **WHEN** os dados são exibidos na tabela
- **THEN** as datas são formatadas em formato brasileiro (DD/MM/YYYY)
- **THEN** os status são exibidos com badges coloridos
- **THEN** campos booleanos são exibidos de forma clara (sim/não ou ícones)
- **THEN** badges de grau são exibidos de forma destacada e compreensível

### Requirement: Integração com API de Acervo
O sistema SHALL integrar com a API `/api/acervo` para buscar dados de processos, utilizando parâmetro `unified=true` para obter processos agrupados.

#### Scenario: Buscar processos
- **WHEN** a página de processos é carregada ou filtros são alterados
- **THEN** uma requisição GET é feita para `/api/acervo` com os parâmetros apropriados
- **AND** parâmetro `unified=true` deve ser incluído por padrão

#### Scenario: Tratamento de erros da API
- **WHEN** a API retorna um erro
- **THEN** uma mensagem de erro apropriada é exibida ao usuário
- **AND** não exibir dados inconsistentes ou parcialmente carregados

#### Scenario: Autenticação
- **WHEN** uma requisição é feita à API
- **THEN** as credenciais de autenticação são incluídas automaticamente

#### Scenario: Parsing de resposta unificada
- **WHEN** API retorna processos no formato unificado
- **THEN** frontend deve parsear campo `instances` corretamente
- **AND** renderizar badges de grau baseado em `instances`

#### Scenario: Fallback para modo legado (opcional)
- **WHEN** API não suporta agrupamento ou `unified=false` é usado
- **THEN** frontend deve detectar formato de resposta
- **AND** adaptar renderização para exibir instâncias separadas (modo compatibilidade)

### Requirement: Visualização de Processos Unificados
O sistema SHALL exibir processos com mesmo número como uma única linha na tabela, independente de quantas instâncias (graus) existam.

#### Scenario: Renderizar processo multi-instância como único item
- **WHEN** API retorna processo com múltiplas instâncias no campo `instances`
- **THEN** deve ser renderizado como uma única linha na tabela
- **AND** não duplicar visualmente o processo

#### Scenario: Indicadores visuais de graus ativos
- **WHEN** processo possui instâncias em múltiplos graus
- **THEN** devem ser exibidos badges/ícones indicando cada grau ativo
- **AND** badges devem ser claramente visíveis e compreensíveis (ex: "1º Grau", "2º Grau", "TST")

#### Scenario: Processo com única instância
- **WHEN** processo existe em apenas um grau
- **THEN** deve exibir badge único do grau correspondente
- **AND** comportamento deve ser visualmente consistente com processos multi-instância

### Requirement: Contagem Precisa de Processos
O sistema SHALL exibir contagem de processos únicos, não de instâncias separadas.

#### Scenario: Contador total de processos
- **WHEN** tabela de processos é renderizada
- **THEN** contador "X de Y processos" deve refletir processos únicos
- **AND** não inflar contagem com múltiplas instâncias

#### Scenario: Paginação baseada em processos únicos
- **WHEN** usuário navega entre páginas
- **THEN** paginação deve ser calculada usando total de processos únicos
- **AND** cada página deve conter número correto de processos (não instâncias)

#### Scenario: Mensagem de estado vazio
- **WHEN** não há processos para exibir
- **THEN** mensagem deve indicar "Nenhum processo encontrado"
- **AND** não confundir com "nenhuma instância"

### Requirement: Timeline Unificada e Deduplicada
O sistema SHALL exibir timeline consolidada de processo multi-instância sem eventos duplicados.

#### Scenario: Carregar timeline unificada
- **WHEN** usuário visualiza detalhes de processo multi-instância
- **THEN** timeline deve ser carregada de todas as instâncias e deduplicada
- **AND** eventos duplicados devem aparecer apenas uma vez

#### Scenario: Ordenação cronológica de timeline
- **WHEN** timeline unificada é exibida
- **THEN** eventos devem estar ordenados cronologicamente (mais recentes primeiro ou por configuração)
- **AND** deduplicação não deve afetar ordenação

#### Scenario: Indicação de origem de evento (opcional)
- **WHEN** evento na timeline é exibido
- **THEN** pode incluir indicador discreto do grau de origem
- **AND** não poluir visualmente a interface

### Requirement: Detalhes de Instâncias
O sistema SHALL fornecer forma de visualizar metadados de cada instância de um processo multi-instância.

#### Scenario: Seção de instâncias na visualização detalhada
- **WHEN** usuário visualiza detalhes de processo
- **THEN** deve haver seção listando todas as instâncias (graus)
- **AND** cada instância deve mostrar: grau, origem, data de última atualização, ID

#### Scenario: Tooltip/Popover com detalhes de instâncias
- **WHEN** usuário passa mouse sobre badges de grau na tabela
- **THEN** tooltip deve exibir informações resumidas de cada instância
- **AND** incluir data de última atualização e origem

#### Scenario: Link para instância específica (opcional)
- **WHEN** usuário clica em badge ou item de instância
- **THEN** pode ser direcionado para visualização específica daquela instância
- **AND** permitir drill-down granular se necessário

