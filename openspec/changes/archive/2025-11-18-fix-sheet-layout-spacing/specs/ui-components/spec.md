# Capability Delta: UI Components

## ADDED Requirements

### Requirement: Sheet Component Layout Padrão
O sistema MUST implementar layout padronizado e acessível para todos os componentes Sheet (lateral slides).

#### Scenario: Sheet com título e conteúdo
- **WHEN** um componente Sheet é renderizado
- **THEN** deve aplicar padding lateral de 24px (p-6)
- **AND** título deve usar `text-xl font-semibold`
- **AND** header deve ter padding vertical de 20px (py-5)

#### Scenario: Subtítulos redundantes
- **WHEN** Sheet contém subtítulo que repete informação óbvia
- **THEN** subtítulo deve ser removido
- **AND** hierarquia visual deve ser criada apenas com tamanho de fonte do título

#### Scenario: Organização de campos de formulário
- **WHEN** Sheet contém formulário
- **THEN** campos devem ter espaçamento de 16px entre si (space-y-4)
- **AND** seções devem ter espaçamento de 24px (space-y-6)
- **AND** labels devem usar `text-sm`

#### Scenario: Footer com botões de ação
- **WHEN** Sheet possui footer com botões
- **THEN** footer deve ter padding superior de 24px (pt-6)
- **AND** botões devem estar alinhados à direita ou distribuídos conforme contexto

### Requirement: Hierarquia Visual em Sheets
O sistema MUST implementar hierarquia tipográfica consistente em todos os Sheets.

#### Scenario: Títulos principais
- **WHEN** Sheet é aberto
- **THEN** título principal deve usar `text-xl font-semibold` (20px)
- **AND** deve ter contraste adequado com fundo

#### Scenario: Seções e grupos de campos
- **WHEN** formulário possui seções
- **THEN** títulos de seção devem usar `text-sm font-medium` (14px)
- **AND** deve haver espaçamento visual entre seções

#### Scenario: Labels de campos
- **WHEN** campos de formulário são exibidos
- **THEN** labels devem usar `text-sm` (14px)
- **AND** devem estar associados aos inputs via htmlFor

#### Scenario: Textos auxiliares
- **WHEN** há textos de ajuda ou descrição
- **THEN** devem usar `text-xs text-muted-foreground` (12px)
- **AND** devem estar abaixo do campo relacionado

### Requirement: Espaçamento Consistente
O sistema MUST aplicar espaçamento consistente em todos os componentes Sheet.

#### Scenario: Padding interno do Sheet
- **WHEN** SheetContent é renderizado
- **THEN** deve ter padding lateral de 24px
- **AND** permitir scroll vertical quando conteúdo excede altura

#### Scenario: Espaçamento entre elementos
- **WHEN** múltiplos elementos são empilhados verticalmente
- **THEN** campos de formulário devem ter gap de 16px (space-y-4)
- **AND** seções devem ter gap de 24px (space-y-6)

#### Scenario: Margens de separação
- **WHEN** há separação lógica entre grupos
- **THEN** deve usar espaçamento de 24px
- **AND** opcionalmente usar separador visual (Separator component)

### Requirement: Largura Responsiva de Sheets
O sistema MUST definir larguras apropriadas para Sheets em diferentes resoluções.

#### Scenario: Sheet em desktop
- **WHEN** Sheet é aberto em tela desktop (>640px)
- **THEN** largura deve ser 540px (w-[540px])
- **AND** deve deslizar suavemente da direita

#### Scenario: Sheet em mobile
- **WHEN** Sheet é aberto em tela mobile (<640px)
- **THEN** largura deve ser 400px (w-[400px])
- **AND** deve ocupar maior parte da tela sem cobrir totalmente

#### Scenario: Conteúdo excede altura
- **WHEN** conteúdo do Sheet é maior que viewport
- **THEN** deve permitir scroll vertical (overflow-y-auto)
- **AND** header deve permanecer visível ao scrollar (sticky opcional)

### Requirement: Remoção de Elementos Redundantes
O sistema MUST remover elementos de UI que não agregam valor informacional.

#### Scenario: Subtítulo descritivo óbvio
- **WHEN** Sheet possui subtítulo do tipo "Preencha os dados para..."
- **THEN** subtítulo deve ser removido
- **AND** contexto deve ser comunicado pelo título e labels dos campos

#### Scenario: Textos de placeholder redundantes
- **WHEN** placeholder repete exatamente o label
- **THEN** usar placeholder mais útil (ex: formato esperado)
- **OR** remover placeholder se não adiciona informação

### Requirement: Padronização de Filtros Avançados
O sistema MUST padronizar layout de Sheets de filtros avançados.

#### Scenario: Sheet de filtros avançados
- **WHEN** usuário abre filtros avançados
- **THEN** título deve ser "Filtros Avançados"
- **AND** campos de filtro devem estar agrupados logicamente
- **AND** deve ter botões "Limpar Filtros" e "Aplicar"

#### Scenario: Agrupamento de filtros
- **WHEN** há múltiplos tipos de filtro
- **THEN** devem ser agrupados por categoria (ex: Data, Status, Responsável)
- **AND** cada grupo deve ter título de seção

#### Scenario: Aplicação de filtros
- **WHEN** usuário clica em "Aplicar"
- **THEN** Sheet deve fechar automaticamente
- **AND** filtros devem ser aplicados à listagem

### Requirement: Acessibilidade em Sheets
O sistema MUST garantir acessibilidade adequada em todos os Sheets.

#### Scenario: Navegação por teclado
- **WHEN** usuário navega por teclado
- **THEN** foco deve ser visível em todos os elementos interativos
- **AND** ordem de foco deve ser lógica (top-down)
- **AND** ESC deve fechar o Sheet

#### Scenario: Labels e descrições
- **WHEN** campos de formulário são renderizados
- **THEN** todos devem ter label associado via htmlFor
- **AND** campos obrigatórios devem indicar visualmente (asterisco)

#### Scenario: Mensagens de erro
- **WHEN** validação falha
- **THEN** mensagens de erro devem estar próximas ao campo
- **AND** devem ser anunciadas para leitores de tela (aria-live)

### Requirement: Consistência entre Implementações
O sistema MUST manter consistência de layout entre todos os Sheets do sistema.

#### Scenario: Múltiplos Sheets de criação
- **WHEN** há Sheets para criar usuário, cliente, etc.
- **THEN** todos devem seguir mesmo padrão de layout
- **AND** usar mesmas classes Tailwind para espaçamento

#### Scenario: Múltiplos Sheets de filtros
- **WHEN** há Sheets de filtros em diferentes páginas
- **THEN** todos devem ter mesma estrutura
- **AND** botões de ação devem estar na mesma posição

#### Scenario: Reutilização de componentes
- **WHEN** padrão de Sheet é estabelecido
- **THEN** novos Sheets devem seguir template definido
- **AND** deve haver exemplo de referência no código
