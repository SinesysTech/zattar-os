# Especificação: Front-end de Usuários

## ADDED Requirements

### Requirement: Página de Listagem de Usuários
O sistema SHALL fornecer uma página para listar, visualizar e gerenciar usuários do sistema com suporte a busca, filtros e paginação.

#### Scenario: Usuário acessa página de usuários
- **WHEN** o usuário navega para a página de usuários
- **THEN** a página exibe uma lista de usuários com busca e filtros disponíveis
- **AND** a página suporta paginação para grandes volumes de dados

#### Scenario: Busca de usuários
- **WHEN** o usuário digita no campo de busca
- **THEN** a lista é filtrada por nome completo, nome de exibição, CPF ou e-mail corporativo
- **AND** a busca é debounced para evitar requisições excessivas

### Requirement: Visualização em Cards
O sistema SHALL fornecer uma visualização em cards para exibir usuários de forma visual e compacta.

#### Scenario: Alternar para visualização em cards
- **WHEN** o usuário seleciona a visualização em cards
- **THEN** os usuários são exibidos em um grid responsivo de cards
- **AND** cada card exibe informações principais do usuário (nome, e-mail, status, OAB se disponível)
- **AND** a preferência de visualização é salva no localStorage

#### Scenario: Card de usuário
- **WHEN** um card de usuário é exibido
- **THEN** o card mostra nome de exibição, e-mail corporativo, status (ativo/inativo)
- **AND** o card mostra número da OAB e UF se o usuário for advogado
- **AND** o card possui ações para visualizar e editar o usuário

### Requirement: Visualização em Tabela
O sistema SHALL fornecer uma visualização em tabela para exibir usuários em formato tabular com ordenação e colunas configuráveis.

#### Scenario: Alternar para visualização em tabela
- **WHEN** o usuário seleciona a visualização em tabela
- **THEN** os usuários são exibidos em uma tabela com colunas configuráveis
- **AND** a tabela suporta ordenação por colunas
- **AND** a preferência de visualização é salva no localStorage

#### Scenario: Colunas da tabela
- **WHEN** a tabela é exibida
- **THEN** as colunas incluem: Nome, E-mail Corporativo, CPF, OAB/UF OAB, Telefone, Status
- **AND** cada linha possui ações para visualizar e editar o usuário

### Requirement: Filtros Avançados
O sistema SHALL fornecer filtros avançados para refinar a listagem de usuários.

#### Scenario: Filtrar por status
- **WHEN** o usuário aplica filtro por status (ativo/inativo)
- **THEN** apenas usuários com o status selecionado são exibidos
- **AND** o filtro é aplicado junto com outros filtros ativos

#### Scenario: Filtrar por OAB
- **WHEN** o usuário aplica filtro por número da OAB
- **THEN** apenas usuários com o número da OAB especificado são exibidos

#### Scenario: Filtrar por UF da OAB
- **WHEN** o usuário aplica filtro por UF da OAB
- **THEN** apenas usuários com OAB da UF especificada são exibidos

### Requirement: Visualização Detalhada de Usuário
O sistema SHALL fornecer uma interface para visualizar detalhes completos de um usuário.

#### Scenario: Visualizar usuário
- **WHEN** o usuário clica em visualizar um usuário
- **THEN** um Sheet é aberto exibindo todos os dados do usuário
- **AND** o Sheet inclui informações pessoais, profissionais, de contato e endereço
- **AND** o Sheet possui ação para editar o usuário

### Requirement: Edição de Usuário
O sistema SHALL fornecer uma interface para editar dados de um usuário.

#### Scenario: Editar usuário
- **WHEN** o usuário clica em editar um usuário
- **THEN** um Sheet é aberto com formulário pré-preenchido
- **AND** o formulário permite editar todos os campos editáveis do usuário
- **AND** após salvar, a lista é atualizada automaticamente

