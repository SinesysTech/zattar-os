# frontend-partes Specification

## Purpose
TBD - created by archiving change refatoracao-sistema-partes. Update Purpose after archive.
## Requirements
### Requirement: Página /partes com navegação por tabs
The page SHALL `/partes` unifica gestão de clientes, partes contrárias e terceiros em uma interface única com tabs.

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
The tab SHALL "Clientes" permite criar, visualizar, editar e deletar clientes com todos os campos do PJE.

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
The tab SHALL "Partes Contrárias" tem funcionalidade idêntica a Clientes.

#### Scenario: CRUD de parte contrária
**Given** tab "Partes Contrárias" aberta
**When** usuário realiza operações de criar, editar, deletar
**Then** comportamento é idêntico a tab "Clientes"
**And** formulários têm mesmos campos
**And** validações são as mesmas

---

### Requirement: Tab Terceiros (estrutura básica)
The tab SHALL "Terceiros" exibe mensagem informativa e estrutura pronta para futuro desenvolvimento.

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
All components SHALL be responsive and follow shadcn/ui patterns.

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
Forms SHALL provide visual feedback for required fields and validations.

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
The menu SHALL lateral reflete nova estrutura de partes.

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

### Requirement: Arquitetura de Componentes de Partes

O modulo de partes MUST seguir a arquitetura Feature-Sliced Design (FSD), com todos os componentes, hooks, utils e tipos centralizados em `src/features/partes/`.

#### Scenario: Estrutura de diretorios FSD
- **WHEN** um desenvolvedor precisa modificar funcionalidade de partes
- **THEN** todo o codigo relevante MUST estar em `src/features/partes/`
- **AND** a estrutura MUST seguir o padrao:
  ```
  src/features/partes/
  ├── components/
  │   ├── clientes/
  │   ├── partes-contrarias/
  │   ├── terceiros/
  │   ├── representantes/
  │   └── shared/
  ├── hooks/
  ├── utils/
  ├── types/
  └── index.ts
  ```

#### Scenario: Importacao de componentes nas pages
- **WHEN** uma page de partes precisa de um componente
- **THEN** MUST importar de `@/features/partes`
- **AND** MUST NOT importar de `@/app/(dashboard)/partes/components/`
- **AND** MUST NOT importar de `@/components/modules/partes/`

#### Scenario: Colocacao de hooks
- **WHEN** um hook eh especifico do modulo de partes
- **THEN** MUST residir em `src/features/partes/hooks/`
- **AND** MUST ser exportado via `@/features/partes`

#### Scenario: Colocacao de utils
- **WHEN** uma funcao utilitaria eh especifica de partes (formatacao de documentos, nomes, etc)
- **THEN** MUST residir em `src/features/partes/utils/`
- **AND** MUST ser exportada via `@/features/partes`

### Requirement: Pages como Entrypoints Simples

As pages em `src/app/(dashboard)/partes/` MUST ser entrypoints simples que:
1. Importam componentes de `@/features/partes`
2. Fazem data fetching server-side quando necessario
3. Renderizam layout com PageShell

#### Scenario: Page de listagem de clientes
- **WHEN** usuario acessa `/partes/clientes`
- **THEN** a page MUST importar `ClientesTableWrapper` de `@/features/partes`
- **AND** MUST fazer fetch inicial no servidor
- **AND** MUST renderizar dentro de `PageShell`

#### Scenario: Page de listagem de partes contrarias
- **WHEN** usuario acessa `/partes/partes-contrarias`
- **THEN** a page MUST importar `PartesContrariasTableWrapper` de `@/features/partes`
- **AND** MUST renderizar com Suspense para loading state

#### Scenario: Page de listagem de terceiros
- **WHEN** usuario acessa `/partes/terceiros`
- **THEN** a page MUST importar `TerceirosTableWrapper` de `@/features/partes`
- **AND** MUST renderizar com Suspense para loading state

#### Scenario: Page de listagem de representantes
- **WHEN** usuario acessa `/partes/representantes`
- **THEN** a page MUST importar `RepresentantesTableWrapper` de `@/features/partes`
- **AND** MUST renderizar com Suspense para loading state

### Requirement: Barrel Exports

O modulo MUST ter um arquivo `index.ts` na raiz que exporta todos os componentes, hooks e utils publicos.

#### Scenario: Importacao simplificada
- **WHEN** codigo externo precisa de multiplos itens do modulo
- **THEN** MUST poder importar tudo de `@/features/partes`
- **AND** MUST NOT precisar conhecer a estrutura interna de diretorios

