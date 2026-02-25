## ADDED Requirements

### Requirement: Página Kanban de Contratos
O sistema SHALL fornecer página de visualização Kanban para contratos, organizada por estágios do pipeline de um segmento, acessível em `/app/assinatura-digital/contratos/kanban`.

#### Scenario: Renderizar board Kanban
- **WHEN** usuário acessa a página Kanban
- **THEN** o sistema exibe colunas representando os estágios do pipeline do segmento selecionado
- **AND** cada coluna mostra cards dos contratos naquele estágio, ordenados por data de cadastro (mais recentes primeiro)
- **AND** cada coluna exibe badge com contagem de contratos

#### Scenario: Carregar contratos por pipeline
- **WHEN** a página carrega com um segmento selecionado
- **THEN** o sistema busca o pipeline do segmento e seus estágios ordenados
- **AND** busca contratos agrupados por estagio_id
- **AND** exibe loading skeleton durante carregamento

#### Scenario: Segmento sem pipeline
- **WHEN** o segmento selecionado não possui pipeline configurado
- **THEN** o sistema exibe mensagem informativa com link para configurar pipeline no admin

### Requirement: Card de Contrato no Kanban
O sistema SHALL exibir cards informativos para cada contrato dentro das colunas do Kanban.

#### Scenario: Renderizar card de contrato
- **WHEN** um contrato é exibido no board
- **THEN** o card mostra: nome do cliente, tipo de contrato, tipo de cobrança, data de cadastro formatada (DD/MM/YYYY)
- **AND** aplica a cor do estágio como borda lateral do card

#### Scenario: Clicar no card
- **WHEN** usuário clica em um card de contrato
- **THEN** o sistema abre sheet/modal com detalhes completos do contrato (mesmo comportamento da tabela de contratos)

### Requirement: Drag-and-drop entre estágios
O sistema SHALL permitir mover contratos entre estágios do pipeline via drag-and-drop.

#### Scenario: Mover contrato para outro estágio
- **WHEN** usuário arrasta card de contrato para outra coluna
- **THEN** o sistema faz PATCH `/api/contratos/[id]/estagio` com novo estagio_id
- **AND** atualiza o board otimisticamente (move o card imediatamente)
- **AND** em caso de erro na API, reverte o card para a posição original e exibe toast de erro

#### Scenario: Reordenar dentro do mesmo estágio
- **WHEN** usuário arrasta card dentro da mesma coluna
- **THEN** o sistema não faz chamada à API (ordenação visual apenas, sem persistência)

#### Scenario: Drag cancelado
- **WHEN** usuário cancela o drag (ESC ou soltar fora de coluna válida)
- **THEN** o card retorna à posição original sem chamada à API

### Requirement: Filtro por segmento no Kanban
O sistema SHALL permitir filtrar o Kanban por segmento, determinando qual pipeline e seus contratos são exibidos.

#### Scenario: Selecionar segmento
- **WHEN** usuário seleciona um segmento no filtro
- **THEN** o sistema carrega o pipeline do segmento selecionado
- **AND** exibe os estágios desse pipeline como colunas
- **AND** carrega contratos do segmento agrupados por estágio

#### Scenario: Segmento padrão
- **WHEN** a página carrega sem segmento pré-selecionado
- **THEN** o sistema seleciona automaticamente o primeiro segmento ativo que possui pipeline

### Requirement: Acesso ao Kanban via botão na toolbar
O sistema SHALL adicionar botão de acesso ao Kanban na DataTableToolbar da página de formulários de assinatura digital.

#### Scenario: Botão de acesso renderizado
- **WHEN** a página de formulários é exibida
- **THEN** o sistema renderiza botão com ícone Eye ao lado do botão de exportar, alinhados à direita na toolbar

#### Scenario: Clicar no botão de acesso
- **WHEN** usuário clica no botão com ícone Eye
- **THEN** o sistema navega para `/app/assinatura-digital/contratos/kanban`

### Requirement: API de movimentação de estágio
O sistema SHALL expor endpoint para atualizar o estágio de um contrato.

#### Scenario: Mover contrato de estágio com sucesso
- **WHEN** PATCH `/api/contratos/[id]/estagio` é chamado com `{ estagio_id: number }`
- **THEN** o sistema valida que o estágio pertence ao mesmo pipeline do segmento do contrato
- **AND** atualiza `contratos.estagio_id` para o novo valor
- **AND** retorna 200 com contrato atualizado

#### Scenario: Estágio de pipeline diferente
- **WHEN** PATCH é chamado com estagio_id que pertence a pipeline de outro segmento
- **THEN** o sistema retorna erro 422 indicando incompatibilidade de pipeline
- **AND** não atualiza o contrato
