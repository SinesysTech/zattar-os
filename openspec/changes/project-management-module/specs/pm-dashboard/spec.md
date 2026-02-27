## ADDED Requirements

### Requirement: Summary Cards com KPIs
O sistema SHALL exibir cards de métricas resumidas no topo do dashboard de projetos.

#### Scenario: Exibir KPIs
- **WHEN** um usuário acessa `/app/project-management`
- **THEN** 4 summary cards são exibidos:
  - **Projetos Ativos**: contagem de projetos com status `ativo`
  - **Tarefas Pendentes**: contagem de tarefas com status `a_fazer` ou `em_progresso` em projetos do usuário
  - **Horas Registradas**: soma de `horas_registradas` de todas as tarefas em projetos do usuário no mês atual
  - **Taxa de Conclusão**: percentual de projetos `concluido` sobre total de projetos no último trimestre
- **AND** cada card exibe variação percentual em relação ao período anterior

### Requirement: Gráfico de visão geral de projetos
O sistema SHALL exibir um gráfico de área mostrando a evolução de projetos ao longo do tempo.

#### Scenario: Exibir gráfico com toggle de período
- **WHEN** o dashboard é carregado
- **THEN** um gráfico de área é exibido com duas séries: "Projetos Criados" e "Projetos Concluídos" por período
- **AND** o usuário pode alternar entre últimos 7 dias, 30 dias e 3 meses

### Requirement: Gráfico de eficiência/distribuição
O sistema SHALL exibir um gráfico de pizza interativo mostrando distribuição de projetos por status.

#### Scenario: Exibir distribuição por status
- **WHEN** o dashboard é carregado
- **THEN** um pie chart interativo exibe a distribuição de projetos por status (planejamento, ativo, pausado, concluído, cancelado)
- **AND** o usuário pode selecionar um segmento para ver o número exato

### Requirement: Tabela de projetos recentes
O sistema SHALL exibir uma tabela com os projetos mais recentes no dashboard.

#### Scenario: Exibir projetos recentes
- **WHEN** o dashboard é carregado
- **THEN** uma tabela exibe os 6 projetos mais recentemente atualizados
- **AND** cada linha mostra: nome, cliente (avatar + nome), data início, prazo, status (badge), progresso (barra)
- **AND** a tabela suporta filtro por nome e paginação

### Requirement: Métricas de equipe
O sistema SHALL exibir métricas da equipe no dashboard.

#### Scenario: Exibir profissionais e highlights
- **WHEN** o dashboard é carregado
- **THEN** um card exibe:
  - Total de membros ativos em projetos
  - Avatars dos membros mais ativos ("Today's Heroes")
  - Highlights: taxa média de conclusão no prazo, média de tarefas por membro, projetos por membro

### Requirement: Comparativo por período
O sistema SHALL exibir comparativo de projetos concluídos por ano.

#### Scenario: Exibir barras comparativas
- **WHEN** o dashboard é carregado
- **THEN** barras horizontais exibem total de projetos concluídos nos últimos 3 anos para comparação

### Requirement: Lembretes no dashboard
O sistema SHALL exibir lembretes próximos no dashboard.

#### Scenario: Exibir lembretes pendentes
- **WHEN** o dashboard é carregado
- **THEN** os 3 lembretes mais próximos (não concluídos) do usuário são exibidos como cards
- **AND** cada card mostra prioridade (cor), data/hora, texto e tipo/categoria
- **AND** um link "mostrar mais" redireciona para a lista completa

### Requirement: Tabs do dashboard
O sistema SHALL organizar o dashboard em tabs.

#### Scenario: Navegar entre tabs
- **WHEN** o usuário acessa o dashboard
- **THEN** 3 tabs são disponíveis: "Visão Geral" (overview com todos os widgets), "Relatórios" (tabela completa de projetos com filtros avançados), "Atividades" (timeline de ações recentes)
- **AND** "Visão Geral" é a tab ativa por padrão
