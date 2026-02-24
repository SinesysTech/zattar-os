## ADDED Requirements

### Requirement: Timeline de Atividades Recentes na Página de Detalhes
O sistema SHALL exibir uma timeline de atividades de negócio recentes do usuário na tab "Visão Geral" e na tab "Atividades" da página de detalhes do usuário.

#### Scenario: Exibir atividades recentes com dados disponíveis
- **WHEN** a página de detalhes do usuário é carregada e existem registros em `logs_alteracao` para o usuário
- **THEN** o componente `AtividadesRecentes` MUST exibir uma timeline com as últimas 20 atividades
- **AND** cada item MUST mostrar ícone colorido por tipo de evento, descrição humanizada, e timestamp relativo (ex: "há 2 horas")
- **AND** o padrão visual MUST ser consistente com o `AuthLogsTimeline` existente na tab "Segurança"

#### Scenario: Exibir estado vazio quando não há atividades
- **WHEN** não existem registros de atividade para o usuário
- **THEN** o componente MUST exibir empty state com mensagem "Nenhuma atividade registrada"
- **AND** MUST usar o componente `Empty` do design system

#### Scenario: Loading state durante carregamento
- **WHEN** os dados de atividades estão sendo carregados
- **THEN** o componente MUST exibir skeleton loading consistente com o padrão do `AuthLogsTimeline`

#### Scenario: Carregar mais atividades
- **WHEN** existem mais atividades além das 20 exibidas e o usuário clica em "Carregar mais"
- **THEN** o componente MUST carregar as próximas 20 atividades e adicioná-las à timeline
- **AND** o botão "Carregar mais" MUST desaparecer quando não houver mais registros

#### Scenario: Identificação visual por tipo de entidade
- **WHEN** um item da timeline é exibido
- **THEN** o componente MUST indicar visualmente a qual entidade o evento se refere (processo, audiência, expediente, contrato)
- **AND** MUST usar badge ou texto com o tipo da entidade
