# Spec: Frontend - Página Unificada de Partes

## ADDED Requirements

### Requirement: Página /partes com navegação por tabs
A página `/partes` unifica gestão de clientes, partes contrárias e terceiros em uma interface única com tabs.

#### Scenario: Acessar página de partes
**Given** usuário autenticado
**When** usuário acessa `/partes`
**Then** página renderiza com 3 tabs: "Clientes", "Partes Contrárias", "Terceiros"
**And** tab "Clientes" é selecionada por padrão
**And** URL é `/partes?tab=clientes`

#### Scenario: Navegar entre tabs
**Given** usuário está na tab "Clientes"
**When** usuário clica na tab "Partes Contrárias"
**Then** conteúdo muda para listagem de partes contrárias
**And** URL atualiza para `/partes?tab=partes-contrarias`
**And** estado local da tab anterior é preservado
**And** não há reload da página

#### Scenario: Usar ClientOnlyTabs para evitar hydration mismatch
**Given** React 19 com Radix UI
**When** componente de tabs renderiza
**Then** usa `ClientOnlyTabs` wrapper
**And** não ocorre erro de hydration mismatch
**And** tabs funcionam corretamente no client-side

---

### Requirement: Tab Clientes com CRUD completo
A tab "Clientes" permite criar, visualizar, editar e deletar clientes com todos os campos do PJE.

#### Scenario: Listar clientes com filtros
**Given** existem clientes no banco
**When** tab "Clientes" é aberta
**Then** tabela exibe clientes com colunas: Nome, CPF/CNPJ, Tipo, Telefone, Emails
**And** filtros disponíveis: tipo_pessoa (PF/PJ), busca por nome/documento
**And** paginação funcional
**And** ordenação por colunas

#### Scenario: Criar cliente PF com formulário
**Given** usuário clica em "Novo Cliente"
**When** modal/sheet abre com formulário
**Then** campos obrigatórios: tipo_pessoa (PF), nome, CPF
**And** campos opcionais organizados em seções: Dados Pessoais, Contatos, Dados Adicionais
**And** validação de CPF em tempo real
**And** campo emails aceita múltiplos valores (array)
**And** seção "Endereços" permite adicionar múltiplos endereços

#### Scenario: Adicionar endereço ao criar cliente
**Given** formulário de criação de cliente aberto
**When** usuário clica em "Adicionar Endereço"
**Then** formulário de endereço expande
**And** campos: logradouro, número, complemento, bairro, cidade, estado, CEP
**And** checkbox "Endereço de correspondência"
**And** select "Classificação" (Residencial, Comercial, Atual)
**And** validação de CEP

#### Scenario: Editar cliente existente
**Given** cliente selecionado na tabela
**When** usuário clica em "Editar"
**Then** modal abre com dados pre-populados
**And** todos os campos editáveis
**And** endereços existentes listados
**And** botão "Salvar" atualiza cliente

#### Scenario: Gerenciar endereços de cliente existente
**Given** cliente com múltiplos endereços
**When** usuário visualiza detalhes do cliente
**Then** lista de endereços é exibida
**And** botões "Adicionar", "Editar", "Remover" por endereço
**And** badge indica endereço principal/correspondência

#### Scenario: Deletar cliente com confirmação
**Given** cliente selecionado
**When** usuário clica em "Deletar"
**Then** modal de confirmação aparece
**And** mensagem "Tem certeza que deseja deletar [Nome]?"
**When** usuário confirma
**Then** cliente é deletado
**And** tabela atualiza
**And** toast de sucesso aparece

---

### Requirement: Tab Partes Contrárias com CRUD completo
A tab "Partes Contrárias" tem funcionalidade idêntica a Clientes.

#### Scenario: CRUD de parte contrária
**Given** tab "Partes Contrárias" aberta
**When** usuário realiza operações de criar, editar, deletar
**Then** comportamento é idêntico a tab "Clientes"
**And** formulários têm mesmos campos
**And** validações são as mesmas

---

### Requirement: Tab Terceiros (estrutura básica)
A tab "Terceiros" exibe mensagem informativa e estrutura pronta para futuro desenvolvimento.

#### Scenario: Visualizar tab Terceiros vazia
**Given** não existem terceiros cadastrados
**When** usuário acessa tab "Terceiros"
**Then** componente `Empty` é exibido
**And** mensagem "Nenhum terceiro cadastrado"
**And** descrição "Terceiros serão capturados automaticamente do PJE"

#### Scenario: Estrutura pronta para desenvolvimento futuro
**Given** tab "Terceiros" implementada
**When** backend de terceiros for implementado
**Then** estrutura de tabela e formulários está pronta
**And** apenas conectar com API e adicionar lógica

---

### Requirement: Responsividade e UX consistente
Todos os componentes são responsivos e seguem padrão shadcn/ui.

#### Scenario: Layout responsivo em mobile
**Given** usuário acessa em dispositivo mobile
**When** página `/partes` carrega
**Then** tabs se ajustam para tela pequena
**And** tabelas usam scroll horizontal ou cards
**And** formulários se adaptam verticalmente

#### Scenario: Loading states durante operações
**Given** operação assíncrona (criar, editar, deletar)
**When** requisição está em andamento
**Then** botões mostram spinner e ficam disabled
**And** skeleton loaders aparecem em listas
**And** usuário não pode submeter múltiplas vezes

#### Scenario: Feedback de sucesso e erro
**Given** operação concluída
**When** requisição retorna sucesso
**Then** toast verde com mensagem "Cliente criado com sucesso"
**When** requisição retorna erro
**Then** toast vermelho com mensagem de erro legível

---

### Requirement: Validação de formulários com feedback visual
Campos obrigatórios e validações são indicados claramente.

#### Scenario: Campo obrigatório não preenchido
**Given** formulário de criação aberto
**When** usuário tenta salvar sem preencher campo obrigatório
**Then** campo é destacado com borda vermelha
**And** mensagem de erro aparece abaixo do campo
**And** formulário não é submetido

#### Scenario: Validação de CPF inválido
**Given** campo CPF preenchido
**When** CPF não é válido (dígitos verificadores incorretos)
**Then** mensagem "CPF inválido" aparece
**And** botão "Salvar" fica disabled

#### Scenario: Validação de CNPJ inválido
**Given** campo CNPJ preenchido
**When** CNPJ não é válido
**Then** mensagem "CNPJ inválido" aparece

---

### Requirement: Navegação no menu atualizada
Menu lateral reflete nova estrutura de partes.

#### Scenario: Item de menu "Partes"
**Given** menu lateral do dashboard
**When** usuário visualiza menu
**Then** item "Clientes" foi renomeado para "Partes"
**And** ícone apropriado (Users ou similar)
**And** link aponta para `/partes`

#### Scenario: Active state do menu
**Given** usuário está em `/partes`
**When** menu renderiza
**Then** item "Partes" está highlighted
**And** cor de destaque aplicada

---

## MODIFIED Requirements

_(Nenhum requirement existente foi modificado diretamente. A página /clientes foi renomeada para /partes, mas a funcionalidade é expandida, não modificada)_

---

## REMOVED Requirements

### Requirement: Página /clientes standalone (REMOVIDO)
A página `/clientes` foi substituída pela página `/partes` com tabs.

**Rationale**: Unificação de UX para todas as partes processuais em uma interface única.

---

## Cross-References

- **Depends on**: `database-partes` (tabelas criadas)
- **Depends on**: API routes de clientes, partes_contrarias, enderecos
- **Related**: `ui-components` (usa componentes shadcn/ui)
- **Related**: `clientes-frontend` (spec antigo, será deprecated)
