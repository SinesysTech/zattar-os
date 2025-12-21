## MODIFIED Requirements

### Requirement: Página de Audiências
O sistema SHALL fornecer uma página que lista audiências utilizando o padrão de layout de Expedientes com tabs Chrome-style, carrosséis temporais integrados e barra de filtros inline.

#### Scenario: Exibir lista de audiências
- **WHEN** o usuário acessa a página de audiências
- **THEN** a lista de audiências é exibida em uma tabela com paginação
- **AND** tabs para alternar entre visualizações (Dia, Mês, Ano, Lista) são exibidas

#### Scenario: Navegação por tabs Chrome-style
- **WHEN** o usuário visualiza a página de audiências
- **THEN** tabs com ícones são exibidas (CalendarDays para "Dia", CalendarRange para "Mês", Calendar para "Ano", List para "Lista")
- **AND** carrosséis temporais são integrados nas tabs (DaysCarousel, MonthsCarousel, YearsCarousel)
- **AND** a seleção no carrossel atualiza automaticamente a visualização correspondente

#### Scenario: Visualização por dia
- **WHEN** o usuário seleciona a tab "Dia"
- **THEN** o DaysCarousel permite navegação entre dias da semana
- **AND** a lista de audiências do dia selecionado é exibida em formato tabela (DataShell + DataTable)
- **AND** filtros de status, responsável e tipo são disponibilizados

#### Scenario: Visualização por mês
- **WHEN** o usuário seleciona a tab "Mês"
- **THEN** o MonthsCarousel permite navegação entre meses
- **AND** um calendário mensal exibe audiências nos dias correspondentes como mini-cards
- **AND** cada mini-card mostra classe judicial + número do processo
- **AND** badge "+X mais" aparece se houver mais de 3 audiências no dia

#### Scenario: Visualização por ano
- **WHEN** o usuário seleciona a tab "Ano"
- **THEN** o YearsCarousel permite navegação entre anos
- **AND** 12 mini-calendários (um por mês) são exibidos em grid responsivo
- **AND** dias com audiências são destacados com cor primary
- **AND** clicar em um dia abre dialog com audiências do dia

#### Scenario: Visualização em lista
- **WHEN** o usuário seleciona a tab "Lista"
- **THEN** uma tabela completa de audiências é exibida
- **AND** todas as colunas e filtros avançados estão disponíveis
- **AND** paginação é suportada

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
- **THEN** os status são exibidos com badges coloridos usando design system
- **THEN** campos opcionais são exibidos como "-" quando ausentes

### Requirement: Barra de Filtros Inline para Audiências
O sistema SHALL fornecer uma barra de filtros inline integrada na área de tabs, seguindo o padrão de Expedientes.

#### Scenario: Posicionamento dos filtros
- **WHEN** a página de audiências é carregada
- **THEN** os filtros aparecem como Select components inline na área de tabs
- **AND** são exibidos após os carrosséis temporais
- **AND** antes do conteúdo principal da visualização

#### Scenario: Filtros disponíveis
- **WHEN** o usuário visualiza a barra de filtros
- **THEN** os seguintes filtros Select estão disponíveis:
  - TRT (dropdown com tribunais)
  - Grau (1º Grau, 2º Grau)
  - Status (Todas, Marcadas, Realizadas, Canceladas)
  - Modalidade (Todas, Virtual, Presencial, Híbrida)
  - Responsável (dropdown com usuários)
  - Tipo de Audiência (dropdown com tipos)

#### Scenario: Aplicação de filtros
- **WHEN** o usuário seleciona um valor em qualquer filtro
- **THEN** a visualização é atualizada automaticamente
- **AND** outros filtros ativos são mantidos
- **AND** a paginação é resetada para primeira página

#### Scenario: Campo de busca integrado
- **WHEN** o usuário visualiza a barra de filtros
- **THEN** um campo de busca com ícone de lupa está disponível
- **AND** a busca tem debounce de 300ms
- **AND** busca por número do processo, partes e órgão julgador

#### Scenario: Botão de configurações
- **WHEN** o usuário visualiza a barra de filtros
- **THEN** um botão Settings abre modal de configuração de tipos de audiência

### Requirement: Componente de Visualização de Dia (AudienciasTableWrapper)
O sistema SHALL fornecer um componente para exibir audiências do dia selecionado em formato de tabela.

#### Scenario: Exibição de audiências do dia
- **WHEN** o componente recebe uma data fixa (fixedDate)
- **THEN** apenas audiências do dia especificado são exibidas
- **AND** a tabela usa DataShell + DataTable do design system

#### Scenario: Botão de nova audiência
- **WHEN** o componente é exibido
- **THEN** um botão "Nova Audiência" está disponível na toolbar
- **AND** clicar no botão abre o dialog de criação

#### Scenario: Detalhes da audiência
- **WHEN** o usuário clica em uma linha da tabela
- **THEN** o Sheet de detalhes da audiência é aberto
- **AND** informações completas são exibidas

#### Scenario: Ordenação por hora
- **WHEN** audiências do dia são exibidas
- **THEN** a ordenação padrão é por hora de início (ascendente)
- **AND** audiências mais próximas aparecem primeiro

### Requirement: Componente de Calendário Mensal (AudienciasCalendarMonthView)
O sistema SHALL fornecer um componente de calendário mensal que recebe a data atual como prop e exibe audiências nos dias correspondentes.

#### Scenario: Recebimento de data via prop
- **WHEN** o componente recebe currentDate como prop
- **THEN** o mês correspondente à data é renderizado
- **AND** não há carrossel interno (gerenciado pelo parent)

#### Scenario: Grid de dias
- **WHEN** o calendário mensal é renderizado
- **THEN** um grid de 7 colunas (dias da semana) é exibido
- **AND** células têm altura mínima para acomodar mini-cards
- **AND** dias do mês anterior/posterior são esmaecidos

#### Scenario: Mini-cards de audiências
- **WHEN** um dia tem audiências agendadas
- **THEN** mini-cards são exibidos na célula do dia
- **AND** cada mini-card mostra classe judicial + número do processo
- **AND** cor do mini-card indica status (azul=marcada, verde=realizada, vermelho=cancelada)

#### Scenario: Overflow de audiências
- **WHEN** um dia tem mais de 3 audiências
- **THEN** apenas 3 mini-cards são exibidos
- **AND** badge "+X mais" indica quantidade adicional
- **AND** clicar no badge abre popover com todas as audiências

#### Scenario: Interação com audiência
- **WHEN** o usuário clica em um mini-card
- **THEN** o Sheet de detalhes da audiência é aberto

### Requirement: Componente de Calendário Anual (AudienciasCalendarYearView)
O sistema SHALL fornecer um componente de calendário anual que recebe a data atual como prop e exibe 12 mini-calendários.

#### Scenario: Recebimento de data via prop
- **WHEN** o componente recebe currentDate como prop
- **THEN** os 12 meses do ano correspondente são renderizados
- **AND** não há carrossel interno (gerenciado pelo parent)

#### Scenario: Grid de meses
- **WHEN** o calendário anual é renderizado
- **THEN** um grid responsivo exibe 12 mini-calendários
- **AND** em mobile: 1 coluna; tablet: 2-3 colunas; desktop: 4 colunas
- **AND** cada mini-calendário mostra nome do mês e grid de dias

#### Scenario: Indicadores de audiências
- **WHEN** um dia tem audiências agendadas
- **THEN** o número do dia é destacado com cor primary
- **AND** tooltip mostra quantidade de audiências ao hover

#### Scenario: Navegação para mês
- **WHEN** o usuário clica em um mini-calendário
- **THEN** a visualização muda para "Mês"
- **AND** o mês clicado é selecionado no carrossel

#### Scenario: Detalhes do dia
- **WHEN** o usuário clica em um dia específico
- **THEN** um dialog/popover abre com lista de audiências do dia
- **AND** cada audiência mostra hora, processo e status

## REMOVED Requirements

### Requirement: Componente de Filtros Avançados para Audiências
**Reason:** Substituído por Barra de Filtros Inline (audiencias-toolbar-filters.tsx) seguindo padrão Expedientes.
**Migration:** Usar AudienciasToolbarFilters com filtros inline ao invés de componente de filtros separado em dialog/drawer.
