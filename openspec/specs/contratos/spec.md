# contratos Specification

## Purpose
TBD - created by archiving change add-contratos-page. Update Purpose after archive.
## Requirements
### Requirement: Listagem de Contratos na Interface
O sistema MUST fornecer interface web para listar contratos com suporte a paginação, ordenação, busca e filtros avançados.

#### Scenario: Página de listagem carrega contratos
- **WHEN** o usuário acessa a página de contratos
- **THEN** o sistema deve exibir tabela com contratos paginados
- **AND** mostrar colunas: data de contratação, área de direito, tipo, tipo de cobrança, cliente, status e ações
- **AND** carregar primeira página com 50 registros por padrão

#### Scenario: Busca textual em contratos
- **WHEN** o usuário digita no campo de busca
- **THEN** o sistema deve filtrar contratos por observações
- **AND** aplicar debounce de 500ms
- **AND** resetar para primeira página

#### Scenario: Paginação de contratos
- **WHEN** o usuário navega entre páginas
- **THEN** o sistema deve carregar página solicitada
- **AND** manter filtros aplicados
- **AND** atualizar contador de registros

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

### Requirement: Visualização de Detalhes do Contrato
O sistema MUST permitir visualizar detalhes completos de um contrato em modal/sheet.

#### Scenario: Abrir visualização de contrato
- **WHEN** o usuário clica no botão de visualizar
- **THEN** o sistema deve abrir sheet com detalhes do contrato
- **AND** mostrar informações básicas: área de direito, tipo, cobrança, status
- **AND** mostrar informações do cliente e parte contrária
- **AND** mostrar partes processuais (parte autora e parte ré)
- **AND** mostrar datas relevantes (contratação, assinatura, distribuição, desistência)
- **AND** mostrar responsável atribuído
- **AND** mostrar observações

#### Scenario: Fechar visualização
- **WHEN** o usuário clica em fechar ou fora do sheet
- **THEN** o sistema deve fechar sheet
- **AND** manter estado da listagem

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

### Requirement: Edição de Contrato
O sistema MUST permitir editar contratos existentes através de formulário modal.

#### Scenario: Abrir formulário de edição
- **WHEN** o usuário clica no botão de editar
- **THEN** o sistema deve abrir sheet com formulário preenchido
- **AND** carregar dados atuais do contrato
- **AND** permitir editar campos modificáveis

#### Scenario: Atualizar contrato com sucesso
- **WHEN** o usuário modifica campos e submete
- **THEN** o sistema deve chamar PUT /api/contratos/[id]
- **AND** fechar sheet após sucesso
- **AND** recarregar listagem de contratos
- **AND** exibir mensagem de sucesso

#### Scenario: Cancelar edição
- **WHEN** o usuário fecha sheet sem salvar
- **THEN** o sistema deve descartar alterações
- **AND** não atualizar contrato

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

### Requirement: Estados de Carregamento e Erro
O sistema MUST fornecer feedback visual durante operações assíncronas.

#### Scenario: Estado de loading na listagem
- **WHEN** contratos estão sendo carregados
- **THEN** o sistema deve exibir indicador de loading
- **AND** desabilitar interações durante carregamento

#### Scenario: Erro ao carregar contratos
- **WHEN** a API retorna erro
- **THEN** o sistema deve exibir mensagem de erro
- **AND** permitir tentar novamente

#### Scenario: Lista vazia
- **WHEN** não há contratos para exibir
- **THEN** o sistema deve exibir mensagem "Nenhum contrato encontrado."
- **AND** sugerir ajustar filtros ou criar novo contrato

### Requirement: Integração com API de Contratos
O sistema MUST integrar com endpoints REST de contratos do backend.

#### Scenario: Hook useContratos carrega dados
- **WHEN** o hook useContratos é chamado com parâmetros
- **THEN** deve fazer GET /api/contratos com query params
- **AND** retornar contratos, paginação, loading, error e refetch
- **AND** aplicar debounce na busca

#### Scenario: Recarregar contratos após mutação
- **WHEN** contrato é criado ou editado
- **THEN** o sistema deve chamar refetch()
- **AND** atualizar listagem com dados mais recentes

### Requirement: Responsividade e Acessibilidade
O sistema MUST ser responsivo e acessível.

#### Scenario: Tabela responsiva
- **WHEN** visualizado em dispositivos pequenos
- **THEN** a tabela deve adaptar layout
- **AND** manter usabilidade em telas estreitas

#### Scenario: Navegação por teclado
- **WHEN** usuário navega com teclado
- **THEN** todos os controles devem ser acessíveis
- **AND** focus visível deve ser claro

#### Scenario: Labels e ARIA
- **WHEN** leitor de tela está ativo
- **THEN** todos os elementos devem ter labels apropriados
- **AND** estados devem ser anunciados corretamente

### Requirement: Consistência Visual com Outras Páginas
O sistema MUST manter consistência visual com páginas de clientes, processos e audiências.

#### Scenario: Layout sem títulos
- **WHEN** a página de contratos é renderizada
- **THEN** não deve exibir elementos h1 ou subtítulos
- **AND** seguir padrão de layout das outras páginas

#### Scenario: Estilo de tabela consistente
- **WHEN** a tabela é exibida
- **THEN** deve usar mesmo componente DataTable
- **AND** aplicar mesmos estilos de colunas e células
- **AND** usar mesmas badges e ícones

#### Scenario: Barra de busca e filtros posicionados
- **WHEN** controles de busca e filtros são renderizados
- **THEN** devem estar alinhados horizontalmente
- **AND** busca à esquerda, filtros e botão de criar à direita
- **AND** usar mesmos componentes de UI (Input, Button, Popover)

### Requirement: Contratos Feature Module Architecture

O módulo de Contratos SHALL seguir a arquitetura Feature-Sliced Design, consolidando toda a lógica relacionada a contratos em um único diretório de feature.

#### Scenario: Import from feature module
- **WHEN** um componente precisa usar funcionalidades de contratos
- **THEN** MUST importar de `@/features/contratos`
- **AND** MUST NOT importar de caminhos legados (`@/core/contratos`, `@/components/modules/contratos`, etc.)

#### Scenario: Feature module structure
- **WHEN** o módulo de contratos é acessado
- **THEN** SHALL expor via `index.ts`:
  - Types e schemas (Contrato, CreateContratoInput, etc.)
  - Service functions (criarContrato, listarContratos, etc.)
  - Server Actions (actionCriarContrato, etc.)
  - React hooks (useContratos)
  - Componentes (ContratosTableWrapper, ContratosTable, etc.)
  - Utilitários (formatarData, getStatusVariant, etc.)

#### Scenario: Internal organization
- **WHEN** o código da feature é organizado
- **THEN** SHALL seguir a estrutura:
  - `types.ts` - Tipos, schemas Zod, constantes
  - `utils.ts` - Funções de formatação e helpers
  - `hooks.ts` - React hooks
  - `actions.ts` - Server Actions
  - `service.ts` - Lógica de negócio
  - `repository.ts` - Acesso ao banco de dados
  - `components/` - Componentes React específicos da feature

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

