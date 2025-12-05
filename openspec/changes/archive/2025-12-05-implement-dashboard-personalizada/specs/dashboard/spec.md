## ADDED Requirements

### Requirement: Dashboard Contextual por Role

O sistema SHALL exibir dashboard personalizada baseada no perfil do usuário autenticado, diferenciando visualização para usuários comuns e superadmins.

#### Scenario: Usuário comum acessa dashboard
- **WHEN** usuário comum (não superadmin) acessa `/dashboard`
- **THEN** exibe dashboard com foco em itens atribuídos ao usuário
- **AND** mostra status cards: Processos Ativos, Audiências Hoje, Expedientes Vencendo, Expedientes Vencidos
- **AND** mostra widgets: Distribuição de Processos, Audiências Próximas, Expedientes Urgentes, Produtividade

#### Scenario: Superadmin acessa dashboard
- **WHEN** superadmin acessa `/dashboard`
- **THEN** exibe dashboard com visão gerencial do escritório
- **AND** mostra status cards: Total Processos, Total Audiências, Expedientes Pendentes, Usuários Ativos
- **AND** mostra widgets: Métricas do Escritório, Carga por Usuário, Status de Capturas, Performance de Advogados

---

### Requirement: Status Cards de Resumo

O sistema SHALL exibir cards de status no topo da dashboard para visão rápida das métricas principais, com links para as páginas correspondentes.

#### Scenario: Status cards de usuário
- **WHEN** dashboard de usuário é carregada
- **THEN** exibe card "Processos Ativos" com contagem e link para `/processos`
- **AND** exibe card "Audiências Hoje" com contagem do dia e próximos 7 dias
- **AND** exibe card "Expedientes Vencendo" com contagem de hoje + amanhã
- **AND** exibe card "Expedientes Vencidos" com destaque visual se > 0

#### Scenario: Status cards de admin
- **WHEN** dashboard de admin é carregada
- **THEN** exibe card "Total Processos" com ativos e comparativo mensal
- **AND** exibe card "Total Audiências" do mês com comparativo
- **AND** exibe card "Expedientes Pendentes" com destaque para vencidos
- **AND** exibe card "Usuários Ativos" com contagem de advogados/assistentes

---

### Requirement: Widget de Distribuição de Processos

O sistema SHALL exibir widget compacto com distribuição de processos do usuário, incluindo gráfico de proporção e breakdown por categorias.

#### Scenario: Exibir distribuição de processos
- **WHEN** widget de processos é renderizado
- **THEN** exibe donut chart com proporção ativos/arquivados
- **AND** exibe badges com contagem por grau (1º Grau, 2º Grau)
- **AND** exibe top 3 TRTs com maior número de processos
- **AND** link para página de processos

#### Scenario: Usuário sem processos
- **WHEN** usuário não possui processos atribuídos
- **THEN** exibe estado vazio com mensagem "Nenhum processo atribuído"

---

### Requirement: Widget de Audiências Próximas

O sistema SHALL exibir widget com audiências agendadas ordenadas por proximidade temporal, destacando as mais urgentes.

#### Scenario: Listar audiências próximas
- **WHEN** widget de audiências é renderizado
- **THEN** exibe lista das próximas 5 audiências
- **AND** cada item mostra: data/hora, número do processo, tipo, local/sala
- **AND** destaca audiências do dia atual
- **AND** mostra countdown para audiências em até 24h

#### Scenario: Audiência com URL virtual
- **WHEN** audiência possui URL de sala virtual
- **THEN** exibe botão/link para acessar sala virtual

---

### Requirement: Widget de Expedientes Urgentes

O sistema SHALL exibir widget com expedientes pendentes ordenados por urgência, priorizando vencidos e próximos do prazo.

#### Scenario: Listar expedientes urgentes
- **WHEN** widget de expedientes é renderizado
- **THEN** exibe lista dos 5 expedientes mais urgentes
- **AND** ordena por: vencidos primeiro, depois por prazo_fatal
- **AND** cada item mostra: tipo, processo, prazo, status
- **AND** destaca visualmente expedientes vencidos

#### Scenario: Expediente vencido
- **WHEN** expediente possui prazo_fatal anterior a hoje
- **THEN** exibe badge "Vencido" em vermelho
- **AND** mostra há quantos dias está vencido

---

### Requirement: Widget de Produtividade

O sistema SHALL exibir widget com métricas de produtividade do usuário, mostrando evolução temporal das baixas realizadas.

#### Scenario: Exibir produtividade semanal
- **WHEN** widget de produtividade é renderizado
- **THEN** exibe gráfico de barras com baixas por dia (últimos 7 dias)
- **AND** mostra total de baixas no período
- **AND** mostra comparativo com período anterior

---

### Requirement: Widget de Métricas do Escritório (Admin)

O sistema SHALL exibir widget com métricas consolidadas do escritório para superadmin, incluindo tendências e comparativos.

#### Scenario: Exibir métricas do escritório
- **WHEN** widget de métricas é renderizado para admin
- **THEN** exibe gráfico de linha com evolução mensal
- **AND** mostra: total processos, total audiências, total expedientes
- **AND** mostra taxa de resolução de expedientes

---

### Requirement: Widget de Carga por Usuário (Admin)

O sistema SHALL exibir widget com distribuição de carga de trabalho entre usuários para permitir balanceamento.

#### Scenario: Exibir carga por usuário
- **WHEN** widget de carga é renderizado
- **THEN** exibe gráfico de barras horizontais com carga por usuário
- **AND** ordena por maior carga
- **AND** mostra: processos ativos, expedientes pendentes, audiências próximas

---

### Requirement: Widget de Status de Capturas (Admin)

O sistema SHALL exibir widget com status das capturas automatizadas do PJE para monitoramento operacional.

#### Scenario: Exibir status de capturas
- **WHEN** widget de capturas é renderizado
- **THEN** exibe status por TRT (sucesso/erro/pendente)
- **AND** mostra última execução de cada TRT
- **AND** destaca TRTs com erro recente

---

### Requirement: Widget de Performance de Advogados (Admin)

O sistema SHALL exibir widget com ranking de performance dos advogados baseado em produtividade e cumprimento de prazos.

#### Scenario: Exibir ranking de performance
- **WHEN** widget de performance é renderizado
- **THEN** exibe lista ordenada por baixas no período
- **AND** mostra: nome, baixas, taxa de cumprimento de prazo
- **AND** permite filtrar por período (semana/mês)

---

### Requirement: Componentes de Gráficos Reutilizáveis

O sistema SHALL fornecer componentes wrapper para Recharts padronizados que sigam o design system do projeto.

#### Scenario: Usar componente MiniDonutChart
- **WHEN** desenvolvedor usa MiniDonutChart
- **THEN** renderiza gráfico de rosca com cores do tema
- **AND** aceita props: data, height, thickness, centerContent

#### Scenario: Usar componente MiniBarChart
- **WHEN** desenvolvedor usa MiniBarChart
- **THEN** renderiza gráfico de barras responsivo
- **AND** aceita props: data, height, layout (vertical/horizontal)

#### Scenario: Usar componente MiniLineChart
- **WHEN** desenvolvedor usa MiniLineChart
- **THEN** renderiza gráfico de linha com área opcional
- **AND** aceita props: data, height, showArea, showDots

---

### Requirement: Cache de Dados da Dashboard

O sistema SHALL implementar cache Redis para dados da dashboard visando performance e redução de carga no banco.

#### Scenario: Cache de dados de usuário
- **WHEN** dados de dashboard de usuário são solicitados
- **THEN** verifica cache Redis com chave `dashboard:user:{userId}`
- **AND** se cache válido (< 5 min), retorna dados cacheados
- **AND** se cache inválido, consulta banco e atualiza cache

#### Scenario: Invalidação de cache
- **WHEN** expediente é criado, baixado ou alterado
- **THEN** invalida cache da dashboard do usuário responsável
- **AND** invalida cache de métricas globais (admin)
