## ADDED Requirements

### Requirement: Layout do Editor de Documento para Assinatura
O sistema MUST implementar layout consistente para o editor de configuração de documento com canvas à esquerda e sidebar à direita.

#### Scenario: Estrutura base do editor
- **WHEN** usuário acessa página de edição de documento
- **THEN** deve exibir canvas do PDF ocupando área principal (flex-1)
- **AND** sidebar fixa à direita com largura de 320px (w-80)
- **AND** header com contexto do documento (nome, última edição)

#### Scenario: Responsividade do editor
- **WHEN** usuário acessa em viewport mobile (<1024px)
- **THEN** sidebar deve ser exibida como Sheet (drawer)
- **AND** deve haver FAB para abrir sidebar
- **AND** canvas deve ocupar tela inteira

### Requirement: Sidebar de Configuração de Documento
O sistema MUST implementar sidebar com seções claramente delimitadas para configuração de signatários e campos.

#### Scenario: Header da sidebar
- **WHEN** sidebar é renderizada
- **THEN** deve exibir título "Document Setup" com text-lg font-semibold
- **AND** subtítulo "Configure signers and fields" com text-sm text-muted-foreground

#### Scenario: Seção de signatários
- **WHEN** seção de signatários é renderizada
- **THEN** deve ter header "WHO IS SIGNING?" em uppercase text-xs font-medium tracking-wide
- **AND** deve ter botão "+ Add" alinhado à direita
- **AND** deve listar SignerCards com scroll se necessário

#### Scenario: Seção de campos
- **WHEN** seção de campos é renderizada
- **THEN** deve ter header "DRAG & DROP FIELDS" em uppercase text-xs font-medium tracking-wide
- **AND** deve exibir campos em grid 2x2 com gap de 12px (gap-3)
- **AND** cada campo deve ser arrastável para o canvas

#### Scenario: Footer da sidebar
- **WHEN** footer da sidebar é renderizado
- **THEN** deve ter posição fixa no bottom
- **AND** deve ter botão "Review & Send" full-width com variante primary
- **AND** botão deve ter ícone de seta à direita

### Requirement: SignerCard Component
O sistema MUST implementar cards de signatário com visual padronizado e interações hover.

#### Scenario: Estrutura do SignerCard
- **WHEN** SignerCard é renderizado
- **THEN** deve exibir avatar circular com iniciais e cor do signatário
- **AND** deve exibir nome (truncado se longo) e email
- **AND** deve indicar "(You)" se for o usuário atual

#### Scenario: Estados do SignerCard
- **WHEN** signatário está selecionado/ativo
- **THEN** deve exibir borda esquerda colorida (border-l-4)
- **AND** deve ter background levemente destacado

#### Scenario: Interações do SignerCard
- **WHEN** mouse hover sobre SignerCard
- **THEN** deve exibir botões de ação (editar, remover)
- **AND** botão remover deve estar desabilitado para usuário atual

### Requirement: FieldPaletteCard Component
O sistema MUST implementar cards de campo arrastável em formato compacto para grid.

#### Scenario: Estrutura do FieldPaletteCard
- **WHEN** FieldPaletteCard é renderizado
- **THEN** deve exibir ícone identificador do tipo de campo
- **AND** deve exibir label do campo (Signature, Initials, Date, Textbox)
- **AND** deve ter cursor grab para indicar draggable

#### Scenario: Cores por tipo de campo
- **WHEN** campo do tipo Signature é renderizado
- **THEN** deve usar cor roxa (violet-500)
- **WHEN** campo do tipo Initials é renderizado
- **THEN** deve usar cor rosa (pink-500)

#### Scenario: Drag do FieldPaletteCard
- **WHEN** usuário inicia drag de um campo
- **THEN** deve criar ghost element seguindo cursor
- **AND** deve indicar zona válida de drop no canvas

### Requirement: ProTip Component
O sistema MUST implementar componente para exibir dicas contextuais ao usuário.

#### Scenario: Estrutura do ProTip
- **WHEN** ProTip é renderizado
- **THEN** deve ter background bg-orange-50 (light) ou bg-orange-950/30 (dark)
- **AND** deve ter borda esquerda de 4px em orange-400
- **AND** deve ter ícone de círculo laranja no início

#### Scenario: Conteúdo do ProTip
- **WHEN** ProTip contém texto com shortcuts de teclado
- **THEN** deve destacar teclas com elemento kbd
- **AND** texto deve usar text-sm text-muted-foreground

### Requirement: Header de Contexto do Documento
O sistema MUST exibir informações contextuais do documento no topo do canvas.

#### Scenario: Informações exibidas
- **WHEN** header de contexto é renderizado
- **THEN** deve exibir nome do arquivo PDF
- **AND** deve exibir timestamp relativo da última edição (ex: "Editado há 2 minutos")

## MODIFIED Requirements

### Requirement: Sheet Component Layout Padrão
O sistema MUST implementar layout padronizado e acessível para todos os componentes Sheet (lateral slides).

#### Scenario: Sheet com título e conteúdo
- **WHEN** um componente Sheet é renderizado
- **THEN** deve aplicar padding lateral de 24px (p-6)
- **AND** título deve usar `text-xl font-semibold`
- **AND** header deve ter padding vertical de 20px (py-5)

#### Scenario: Subtítulos descritivos
- **WHEN** Sheet contém subtítulo que adiciona contexto útil
- **THEN** subtítulo deve usar text-sm text-muted-foreground
- **AND** deve estar posicionado abaixo do título principal

#### Scenario: Organização de campos de formulário
- **WHEN** Sheet contém formulário
- **THEN** campos devem ter espaçamento de 16px entre si (space-y-4)
- **AND** seções devem ter espaçamento de 24px (space-y-6)
- **AND** labels devem usar `text-sm`

#### Scenario: Footer com botões de ação
- **WHEN** Sheet possui footer com botões
- **THEN** footer deve ter padding superior de 24px (pt-6)
- **AND** botões devem estar alinhados à direita ou distribuídos conforme contexto

#### Scenario: Seções com headers uppercase
- **WHEN** Sheet possui seções distintas
- **THEN** headers de seção devem usar text-xs font-medium uppercase tracking-wide
- **AND** headers devem ter cor text-muted-foreground
