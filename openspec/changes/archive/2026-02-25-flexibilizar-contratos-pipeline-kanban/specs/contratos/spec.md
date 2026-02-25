## MODIFIED Requirements

### Requirement: Filtros Avançados de Contratos
O sistema MUST permitir filtrar contratos por múltiplos critérios simultaneamente.

#### Scenario: Filtro por área de direito
- **WHEN** o usuário seleciona área de direito no filtro
- **THEN** o sistema deve mostrar apenas contratos da área selecionada
- **AND** aceitar valores: trabalhista, civil, previdenciario, criminal, empresarial, administrativo

#### Scenario: Filtro por tipo de contrato
- **WHEN** o usuário seleciona tipo de contrato no filtro
- **THEN** o sistema deve mostrar apenas contratos do tipo selecionado
- **AND** popular o select a partir da tabela `contrato_tipos` (registros ativos)

#### Scenario: Filtro por tipo de cobrança
- **WHEN** o usuário seleciona tipo de cobrança no filtro
- **THEN** o sistema deve mostrar apenas contratos com cobrança selecionada
- **AND** popular o select a partir da tabela `contrato_tipos_cobranca` (registros ativos)

#### Scenario: Filtro por estágio do pipeline
- **WHEN** o usuário seleciona estágio no filtro
- **THEN** o sistema deve mostrar apenas contratos no estágio selecionado
- **AND** popular o select a partir dos estágios do pipeline do segmento filtrado

#### Scenario: Filtro por cliente
- **WHEN** o usuário seleciona cliente no filtro
- **THEN** o sistema deve mostrar apenas contratos do cliente selecionado
- **AND** filtrar por cliente_id

#### Scenario: Filtro por responsável
- **WHEN** o usuário seleciona responsável no filtro
- **THEN** o sistema deve mostrar apenas contratos do responsável selecionado
- **AND** permitir filtrar contratos sem responsável

#### Scenario: Múltiplos filtros aplicados
- **WHEN** o usuário aplica múltiplos filtros simultaneamente
- **THEN** o sistema deve combinar todos os filtros com lógica AND
- **AND** mostrar indicador visual de filtros ativos
- **AND** permitir limpar todos os filtros de uma vez

### Requirement: Formatação de Dados de Contratos
O sistema MUST formatar dados de contratos para exibição consistente.

#### Scenario: Formatar área de direito
- **WHEN** o sistema exibe área de direito
- **THEN** deve converter: trabalhista → Trabalhista, civil → Civil, previdenciario → Previdenciário, criminal → Criminal, empresarial → Empresarial, administrativo → Administrativo

#### Scenario: Formatar tipo de contrato
- **WHEN** o sistema exibe tipo de contrato
- **THEN** deve exibir o campo `nome` do registro correspondente na tabela `contrato_tipos`

#### Scenario: Formatar tipo de cobrança
- **WHEN** o sistema exibe tipo de cobrança
- **THEN** deve exibir o campo `nome` do registro correspondente na tabela `contrato_tipos_cobranca`

#### Scenario: Formatar estágio do contrato
- **WHEN** o sistema exibe o estágio do contrato
- **THEN** deve exibir o campo `nome` do estágio correspondente na tabela `contrato_pipeline_estagios`
- **AND** aplicar badge com a cor definida no estágio

#### Scenario: Formatar polo processual
- **WHEN** o sistema exibe polo do cliente
- **THEN** deve converter: autora → Autora, re → Ré

#### Scenario: Formatar datas
- **WHEN** o sistema exibe datas
- **THEN** deve converter ISO para formato brasileiro DD/MM/YYYY
- **AND** exibir "-" quando data é nula

### Requirement: Criação de Contrato
O sistema MUST permitir criar novos contratos através de formulário modal.

#### Scenario: Abrir formulário de criação
- **WHEN** o usuário clica em "Novo Contrato"
- **THEN** o sistema deve abrir sheet com formulário vazio
- **AND** exibir campos obrigatórios: área de direito, tipo de contrato (select da tabela contrato_tipos), tipo de cobrança (select da tabela contrato_tipos_cobranca), cliente, polo do cliente

#### Scenario: Criar contrato com sucesso
- **WHEN** o usuário preenche campos obrigatórios e submete
- **THEN** o sistema deve criar contrato com `tipo_contrato_id`, `tipo_cobranca_id` e `estagio_id` (estágio default do pipeline do segmento)
- **AND** fechar sheet após sucesso
- **AND** recarregar listagem de contratos
- **AND** exibir mensagem de sucesso

#### Scenario: Validação de campos obrigatórios
- **WHEN** o usuário tenta submeter com campos obrigatórios vazios
- **THEN** o sistema deve exibir mensagens de erro
- **AND** destacar campos inválidos
- **AND** não submeter formulário

#### Scenario: Erro ao criar contrato
- **WHEN** a API retorna erro
- **THEN** o sistema deve exibir mensagem de erro
- **AND** manter formulário aberto
- **AND** permitir correção e nova tentativa

## ADDED Requirements

### Requirement: Colunas FK para tipos configuráveis e estágio
O sistema SHALL adicionar colunas `tipo_contrato_id`, `tipo_cobranca_id` e `estagio_id` na tabela `contratos` como referências para as novas tabelas configuráveis.

#### Scenario: Estrutura das novas colunas
- **WHEN** a migration é executada
- **THEN** a tabela `contratos` recebe:
  - `tipo_contrato_id` bigint nullable FK para `contrato_tipos(id)`
  - `tipo_cobranca_id` bigint nullable FK para `contrato_tipos_cobranca(id)`
  - `estagio_id` bigint nullable FK para `contrato_pipeline_estagios(id)`
- **AND** índices criados para cada nova coluna FK

#### Scenario: Backfill de contratos existentes
- **WHEN** a migration de backfill é executada
- **THEN** o sistema popula `tipo_contrato_id` baseado no valor da coluna enum `tipo_contrato` → registro correspondente em `contrato_tipos`
- **AND** popula `tipo_cobranca_id` baseado no valor da coluna enum `tipo_cobranca` → registro correspondente em `contrato_tipos_cobranca`
- **AND** popula `estagio_id` baseado no valor da coluna `status` → estágio correspondente no pipeline default do segmento do contrato
