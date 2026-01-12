## ADDED Requirements

### Requirement: Página de Detalhes do Contrato
O sistema MUST fornecer página dedicada para visualização completa de detalhes do contrato em `/app/contratos/[id]`.

#### Scenario: Acessar página de detalhes
- **WHEN** o usuário acessa `/app/contratos/[id]` com ID válido
- **THEN** o sistema MUST carregar dados completos do contrato
- **AND** exibir header com identificação do contrato e status
- **AND** exibir tabs de navegação (Resumo, Financeiro, Documentos, Histórico)
- **AND** tab Resumo MUST ser selecionada por padrão

#### Scenario: Contrato não encontrado
- **WHEN** o usuário acessa `/app/contratos/[id]` com ID inválido
- **THEN** o sistema MUST exibir página 404 customizada
- **AND** fornecer link para voltar à listagem de contratos

#### Scenario: Erro ao carregar contrato
- **WHEN** ocorre erro ao buscar dados do contrato
- **THEN** o sistema MUST exibir error boundary com mensagem amigável
- **AND** permitir tentar novamente

### Requirement: Tab Resumo do Contrato
O sistema MUST exibir resumo do contrato com layout de 3 colunas na tab Resumo.

#### Scenario: Exibir card de resumo do contrato
- **WHEN** o usuário visualiza tab Resumo
- **THEN** o sistema MUST exibir ContratoResumoCard com:
- **AND** nome do cliente
- **AND** badge de status do contrato
- **AND** estatísticas: total de partes, processos vinculados, documentos
- **AND** informações de contato do cliente (email, telefone)
- **AND** nome do responsável pelo contrato

#### Scenario: Exibir progresso do contrato
- **WHEN** o usuário visualiza tab Resumo
- **THEN** o sistema MUST exibir ContratoProgressCard com:
- **AND** barra de progresso baseada no status atual
- **AND** status em_contratacao = 25%, contratado = 50%, distribuido = 75%, finalizado = 100%

#### Scenario: Exibir tags do contrato
- **WHEN** o usuário visualiza tab Resumo
- **THEN** o sistema MUST exibir ContratoTagsCard com badges para:
- **AND** tipo de contrato (Ajuizamento, Defesa, etc.)
- **AND** tipo de cobrança (Pró-Êxito, Pró-Labore)
- **AND** segmento/área de direito
- **AND** papel do cliente no contrato (Autora, Ré)

### Requirement: Listagem de Partes do Contrato
O sistema MUST exibir lista de partes do contrato na tab Resumo.

#### Scenario: Exibir partes do contrato
- **WHEN** o usuário visualiza tab Resumo
- **THEN** o sistema MUST exibir ContratoPartesCard com lista de partes
- **AND** cada parte MUST mostrar: avatar, nome, CPF/CNPJ, papel contratual
- **AND** distinguir visualmente cliente de partes contrárias

#### Scenario: Visualizar detalhes de uma parte
- **WHEN** o usuário clica em uma parte da lista
- **THEN** o sistema MUST abrir ParteViewSheet com detalhes completos
- **AND** exibir dados pessoais (nome, documento)
- **AND** exibir informações de contato (email, telefone)
- **AND** exibir endereço quando disponível
- **AND** permitir fechar sheet sem navegar para outra página

### Requirement: Listagem de Processos Vinculados
O sistema MUST exibir processos vinculados ao contrato na tab Resumo.

#### Scenario: Exibir processos vinculados
- **WHEN** o usuário visualiza tab Resumo
- **THEN** o sistema MUST exibir ContratoProcessosCard com lista de processos
- **AND** cada processo MUST mostrar: número do processo, TRT, grau
- **AND** exibir data de autuação quando disponível
- **AND** permitir clicar para navegar ao processo

#### Scenario: Contrato sem processos vinculados
- **WHEN** o contrato não possui processos vinculados
- **THEN** o sistema MUST exibir estado vazio com mensagem apropriada
- **AND** informar que nenhum processo está vinculado

### Requirement: Tab Financeiro do Contrato
O sistema MUST exibir lançamentos financeiros do contrato na tab Financeiro.

#### Scenario: Exibir lançamentos financeiros
- **WHEN** o usuário seleciona tab Financeiro
- **THEN** o sistema MUST exibir ContratoFinanceiroCard com tabela de lançamentos
- **AND** filtrar lançamentos por contrato_id
- **AND** exibir colunas: descrição, valor, status, data vencimento
- **AND** aplicar formatação de moeda brasileira (R$)
- **AND** aplicar badges coloridas por status (pendente, pago, etc.)

#### Scenario: Contrato sem lançamentos
- **WHEN** o contrato não possui lançamentos financeiros
- **THEN** o sistema MUST exibir estado vazio com mensagem apropriada
- **AND** sugerir criar novo lançamento

### Requirement: Tab Documentos do Contrato
O sistema MUST exibir peças jurídicas/documentos do contrato na tab Documentos.

#### Scenario: Exibir documentos do contrato
- **WHEN** o usuário seleciona tab Documentos
- **THEN** o sistema MUST exibir ContratoDocumentosCard
- **AND** reutilizar componente ContratoDocumentosList existente
- **AND** permitir gerar nova peça jurídica
- **AND** permitir desvincular documento do contrato

#### Scenario: Contrato sem documentos
- **WHEN** o contrato não possui documentos vinculados
- **THEN** o sistema MUST exibir estado vazio
- **AND** fornecer botão para gerar primeira peça

### Requirement: Tab Histórico do Contrato
O sistema MUST exibir timeline de mudanças de status na tab Histórico.

#### Scenario: Exibir timeline de status
- **WHEN** o usuário seleciona tab Histórico
- **THEN** o sistema MUST exibir ContratoTimeline
- **AND** listar todas as mudanças de status em ordem cronológica reversa
- **AND** cada item MUST mostrar: status anterior, status novo, data/hora da mudança
- **AND** exibir usuário responsável pela mudança quando disponível
- **AND** exibir motivo da mudança quando disponível

#### Scenario: Contrato recém-criado
- **WHEN** o contrato possui apenas status inicial
- **THEN** o sistema MUST exibir entrada inicial de criação
- **AND** indicar que é o primeiro registro do contrato

### Requirement: Filtro de Lançamentos por Contrato
O sistema MUST permitir filtrar lançamentos financeiros por contrato_id.

#### Scenario: Filtrar lançamentos por contrato
- **WHEN** ListarLancamentosParams inclui contratoId
- **THEN** o sistema MUST retornar apenas lançamentos do contrato especificado
- **AND** aplicar filtro via query `contrato_id = ?`

#### Scenario: Combinar filtro de contrato com outros filtros
- **WHEN** ListarLancamentosParams inclui contratoId e outros filtros
- **THEN** o sistema MUST combinar todos os filtros com lógica AND
- **AND** respeitar paginação e ordenação
