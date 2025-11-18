# clientes-frontend Specification

## Purpose
TBD - created by archiving change add-clientes-page. Update Purpose after archive.
## Requirements
### Requirement: Listagem de Clientes
O sistema SHALL exibir uma tabela paginada de clientes com capacidade de busca, filtros e ordenação.

#### Scenario: Usuário visualiza lista de clientes
- **WHEN** o usuário acessa a página de clientes
- **THEN** a tabela exibe clientes paginados com colunas: Nome/Razão Social, Tipo de Pessoa, CPF/CNPJ, Email, Telefone, Status, Ações
- **AND** a tabela mostra estado de loading durante carregamento
- **AND** a tabela mostra mensagem apropriada quando não há clientes

#### Scenario: Usuário busca clientes
- **WHEN** o usuário digita na barra de busca
- **THEN** a busca é executada com debounce de 500ms
- **AND** a busca filtra por nome, nome fantasia, CPF, CNPJ ou email
- **AND** a página é resetada para a primeira página

#### Scenario: Usuário ordena colunas
- **WHEN** o usuário clica no header de uma coluna ordenável
- **THEN** a tabela é reordenada pela coluna selecionada
- **AND** a direção da ordenação alterna entre ascendente e descendente
- **AND** o indicador visual de ordenação é exibido

#### Scenario: Usuário aplica filtros
- **WHEN** o usuário aplica filtros avançados (tipo pessoa, status)
- **THEN** a tabela é filtrada conforme os critérios selecionados
- **AND** a página é resetada para a primeira página

#### Scenario: Usuário navega entre páginas
- **WHEN** o usuário altera a página ou o limite de itens por página
- **THEN** uma nova requisição é feita à API com os parâmetros atualizados
- **AND** a tabela exibe os dados da nova página

### Requirement: Visualização de Cliente
O sistema SHALL permitir visualizar detalhes completos de um cliente em um diálogo ou drawer.

#### Scenario: Usuário visualiza detalhes do cliente
- **WHEN** o usuário clica no botão de visualizar na coluna de ações
- **THEN** um diálogo ou drawer é aberto exibindo todas as informações do cliente
- **AND** os dados são formatados apropriadamente (CPF/CNPJ, telefones, endereço)
- **AND** campos vazios são exibidos como "-" ou não exibidos
- **AND** o diálogo pode ser fechado pelo usuário

#### Scenario: Visualização de pessoa física
- **WHEN** o cliente é uma pessoa física (PF)
- **THEN** são exibidos campos específicos: CPF, RG, data de nascimento, gênero, estado civil, nacionalidade, naturalidade
- **AND** campos específicos de PJ não são exibidos

#### Scenario: Visualização de pessoa jurídica
- **WHEN** o cliente é uma pessoa jurídica (PJ)
- **THEN** são exibidos campos específicos: CNPJ, nome fantasia, inscrição estadual
- **AND** campos específicos de PF não são exibidos

### Requirement: Edição de Cliente
O sistema SHALL permitir editar informações de um cliente através de um formulário em diálogo ou drawer.

#### Scenario: Usuário edita cliente
- **WHEN** o usuário clica no botão de editar na coluna de ações
- **THEN** um diálogo ou drawer é aberto com formulário pré-preenchido
- **AND** o formulário permite editar campos editáveis do cliente
- **AND** validação client-side é aplicada antes do envio
- **AND** ao salvar com sucesso, a lista é atualizada e o diálogo é fechado
- **AND** erros de validação são exibidos apropriadamente

#### Scenario: Edição de pessoa física
- **WHEN** o cliente editado é pessoa física
- **THEN** o formulário exibe campos específicos de PF
- **AND** CPF é obrigatório e validado
- **AND** campos específicos de PJ são ocultos

#### Scenario: Edição de pessoa jurídica
- **WHEN** o cliente editado é pessoa jurídica
- **THEN** o formulário exibe campos específicos de PJ
- **AND** CNPJ é obrigatório e validado
- **AND** campos específicos de PF são ocultos

### Requirement: Formatação de Dados
O sistema SHALL exibir dados de clientes formatados de forma legível e consistente.

#### Scenario: Formatação de CPF/CNPJ
- **WHEN** CPF ou CNPJ são exibidos na tabela ou visualização
- **THEN** são formatados com máscara apropriada (XXX.XXX.XXX-XX para CPF, XX.XXX.XXX/XXXX-XX para CNPJ)

#### Scenario: Formatação de telefones
- **WHEN** telefones são exibidos
- **THEN** são formatados com máscara (XX) XXXXX-XXXX ou (XX) XXXX-XXXX conforme número de dígitos

#### Scenario: Formatação de endereço
- **WHEN** endereço completo é exibido
- **THEN** é formatado em formato legível: logradouro, número, complemento, bairro, cidade - estado, CEP

#### Scenario: Formatação de datas
- **WHEN** datas são exibidas
- **THEN** são formatadas no padrão brasileiro (DD/MM/YYYY)

### Requirement: Estados e Feedback Visual
O sistema SHALL fornecer feedback visual apropriado para diferentes estados da interface.

#### Scenario: Estado de loading
- **WHEN** dados estão sendo carregados
- **THEN** indicador de loading é exibido na tabela
- **AND** ações são desabilitadas durante o carregamento

#### Scenario: Estado de erro
- **WHEN** ocorre erro ao carregar dados
- **THEN** mensagem de erro é exibida de forma clara
- **AND** usuário pode tentar novamente

#### Scenario: Estado vazio
- **WHEN** não há clientes para exibir
- **THEN** mensagem apropriada é exibida ("Nenhum cliente encontrado")
- **AND** sugestões de ação são fornecidas quando aplicável

### Requirement: Consistência Visual
O sistema SHALL manter consistência visual com outras páginas do sistema, especialmente a página de processos.

#### Scenario: Layout consistente
- **WHEN** usuário navega entre páginas
- **THEN** layout, espaçamento e componentes seguem o mesmo padrão
- **AND** tabela utiliza os mesmos componentes base (DataTable, DataTableColumnHeader)
- **AND** badges e indicadores visuais seguem o mesmo padrão de cores

#### Scenario: Navegação consistente
- **WHEN** usuário interage com a página
- **THEN** padrões de navegação são consistentes com outras páginas
- **AND** ações seguem o mesmo padrão de comportamento

