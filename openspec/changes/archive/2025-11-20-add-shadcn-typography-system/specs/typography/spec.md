# typography Specification Delta

## ADDED Requirements

### Requirement: Classes de Tipografia Base
O sistema MUST fornecer classes CSS reutilizáveis para todos os elementos tipográficos comuns, baseadas na especificação shadcn/ui.

#### Scenario: Uso de heading h1
- **WHEN** desenvolvedor precisa renderizar um título principal de página
- **THEN** deve aplicar classe `.typography-h1` ou usar componente `<Typography.H1>`
- **AND** classe deve aplicar: `scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance`
- **AND** resultado deve ter hierarquia visual clara como elemento mais importante

#### Scenario: Uso de heading h2
- **WHEN** desenvolvedor precisa renderizar um título de seção principal
- **THEN** deve aplicar classe `.typography-h2` ou usar componente `<Typography.H2>`
- **AND** classe deve aplicar: `scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0`
- **AND** deve incluir borda inferior para separação visual

#### Scenario: Uso de heading h3
- **WHEN** desenvolvedor precisa renderizar um título de subseção
- **THEN** deve aplicar classe `.typography-h3` ou usar componente `<Typography.H3>`
- **AND** classe deve aplicar: `scroll-m-20 text-2xl font-semibold tracking-tight`

#### Scenario: Uso de heading h4
- **WHEN** desenvolvedor precisa renderizar um título menor
- **THEN** deve aplicar classe `.typography-h4` ou usar componente `<Typography.H4>`
- **AND** classe deve aplicar: `scroll-m-20 text-xl font-semibold tracking-tight`

#### Scenario: Uso de parágrafo
- **WHEN** desenvolvedor precisa renderizar texto de corpo/parágrafo
- **THEN** deve aplicar classe `.typography-p` ou usar componente `<Typography.P>`
- **AND** classe deve aplicar: `leading-7 [&:not(:first-child)]:mt-6`
- **AND** parágrafos devem ter espaçamento vertical adequado entre si

#### Scenario: Uso de blockquote
- **WHEN** desenvolvedor precisa renderizar uma citação
- **THEN** deve aplicar classe `.typography-blockquote` ou usar componente `<Typography.Blockquote>`
- **AND** classe deve aplicar: `mt-6 border-l-2 pl-6 italic`
- **AND** deve ter borda lateral e estilo itálico para diferenciação visual

#### Scenario: Uso de lista
- **WHEN** desenvolvedor precisa renderizar uma lista não ordenada
- **THEN** deve aplicar classe `.typography-list` ou usar componente `<Typography.List>`
- **AND** classe deve aplicar: `my-6 ml-6 list-disc [&>li]:mt-2`
- **AND** itens devem ter espaçamento vertical de 8px (mt-2)

#### Scenario: Uso de inline code
- **WHEN** desenvolvedor precisa renderizar código inline
- **THEN** deve aplicar classe `.typography-inline-code` ou usar componente `<Typography.InlineCode>`
- **AND** classe deve aplicar: `bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold`
- **AND** deve ter fundo diferenciado e fonte monoespaçada

#### Scenario: Uso de texto lead
- **WHEN** desenvolvedor precisa renderizar um parágrafo introdutório destacado
- **THEN** deve aplicar classe `.typography-lead` ou usar componente `<Typography.Lead>`
- **AND** classe deve aplicar: `text-muted-foreground text-xl`
- **AND** deve ter tamanho maior que parágrafo normal

#### Scenario: Uso de texto large
- **WHEN** desenvolvedor precisa renderizar texto grande para ênfase
- **THEN** deve aplicar classe `.typography-large` ou usar componente `<Typography.Large>`
- **AND** classe deve aplicar: `text-lg font-semibold`

#### Scenario: Uso de texto small
- **WHEN** desenvolvedor precisa renderizar texto pequeno ou nota de rodapé
- **THEN** deve aplicar classe `.typography-small` ou usar componente `<Typography.Small>`
- **AND** classe deve aplicar: `text-sm leading-none font-medium`

#### Scenario: Uso de texto muted
- **WHEN** desenvolvedor precisa renderizar texto secundário ou menos importante
- **THEN** deve aplicar classe `.typography-muted` ou usar componente `<Typography.Muted>`
- **AND** classe deve aplicar: `text-muted-foreground text-sm`
- **AND** deve usar cor de foreground secundária para menos destaque

### Requirement: Componente Typography React
O sistema MUST fornecer componente React opcional para uso semântico de tipografia com type-safety.

#### Scenario: Importação e uso básico
- **WHEN** desenvolvedor importa componente Typography
- **THEN** deve ter acesso a subcomponentes: `Typography.H1`, `Typography.H2`, `Typography.H3`, `Typography.H4`, `Typography.P`, `Typography.Lead`, `Typography.Large`, `Typography.Small`, `Typography.Muted`, `Typography.Blockquote`, `Typography.List`, `Typography.InlineCode`
- **AND** todos devem ter tipos TypeScript adequados

#### Scenario: Composição de classes
- **WHEN** desenvolvedor passa prop `className` para componente Typography
- **THEN** classes customizadas devem ser mescladas com classes base
- **AND** não deve sobrescrever classes essenciais da tipografia
- **AND** deve usar biblioteca de composição como `clsx` ou `cn`

#### Scenario: Polimorfismo de elemento
- **WHEN** desenvolvedor passa prop `as` para componente Typography
- **THEN** deve renderizar elemento HTML customizado mantendo estilos
- **EXAMPLE**: `<Typography.H2 as="h1">` renderiza h1 com estilos de h2

#### Scenario: Props HTML padrão
- **WHEN** desenvolvedor passa props HTML (id, data-*, aria-*)
- **THEN** todas as props devem ser repassadas ao elemento renderizado
- **AND** componente deve ter tipos corretos para elemento correspondente

### Requirement: Hierarquia Tipográfica Consistente
O sistema MUST estabelecer e documentar hierarquia visual clara entre elementos tipográficos.

#### Scenario: Ordem de importância visual
- **WHEN** página possui múltiplos níveis de título
- **THEN** h1 deve ter maior peso visual (text-4xl, font-extrabold)
- **AND** h2 deve ser visualmente menor que h1 (text-3xl, font-semibold)
- **AND** h3 deve ser visualmente menor que h2 (text-2xl, font-semibold)
- **AND** h4 deve ser visualmente menor que h3 (text-xl, font-semibold)
- **AND** progressão deve ser clara e óbvia

#### Scenario: Uso de h1 único por página
- **WHEN** página é renderizada
- **THEN** deve ter idealmente apenas um h1 (título principal)
- **AND** guidelines devem recomendar estrutura semântica correta

#### Scenario: Contraste de parágrafos
- **WHEN** parágrafos são exibidos
- **THEN** devem ter leading-7 (line-height 1.75) para legibilidade
- **AND** espaçamento vertical de 24px entre parágrafos consecutivos
- **AND** texto deve ser menor e menos pesado que títulos

### Requirement: Estilos de Tabela Tipográfica
O sistema MUST fornecer classes para estilização consistente de tabelas com boa legibilidade.

#### Scenario: Wrapper de tabela
- **WHEN** tabela é renderizada
- **THEN** deve ter classe `.typography-table-wrapper` com: `my-6 w-full overflow-y-auto`
- **AND** deve permitir scroll horizontal em telas pequenas

#### Scenario: Elemento table
- **WHEN** elemento `<table>` é renderizado dentro de wrapper
- **THEN** deve ter classe `.typography-table` com: `w-full`
- **AND** deve ocupar largura total disponível

#### Scenario: Células de cabeçalho
- **WHEN** células de cabeçalho `<th>` são renderizadas
- **THEN** devem ter classe com: `border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right`
- **AND** deve suportar alinhamento via atributo HTML align

#### Scenario: Células de corpo
- **WHEN** células de corpo `<td>` são renderizadas
- **THEN** devem ter classe com: `border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right`
- **AND** deve ter peso de fonte normal (não bold)

#### Scenario: Linhas zebradas
- **WHEN** linhas de tabela são renderizadas
- **THEN** pode aplicar `even:bg-muted` para efeito zebrado
- **AND** deve melhorar legibilidade de tabelas longas

### Requirement: Acessibilidade Tipográfica
O sistema MUST garantir que toda tipografia atenda padrões de acessibilidade WCAG 2.1 AA.

#### Scenario: Contraste de cores
- **WHEN** texto é renderizado em qualquer tema (light/dark)
- **THEN** contraste entre texto e fundo deve ser mínimo 4.5:1 para texto normal
- **AND** contraste deve ser mínimo 3:1 para texto grande (18pt+ ou 14pt+ bold)
- **AND** texto muted deve manter contraste mínimo de 4.5:1

#### Scenario: Tamanhos de fonte mínimos
- **WHEN** texto é renderizado
- **THEN** tamanho mínimo deve ser 14px (text-sm) para corpo de texto
- **AND** texto menor (12px) só deve ser usado para metadados e não essencial
- **AND** deve ser legível em dispositivos móveis sem zoom

#### Scenario: Line height para legibilidade
- **WHEN** parágrafos são exibidos
- **THEN** line-height deve ser mínimo 1.5 (preferir 1.75 = leading-7)
- **AND** deve facilitar leitura para usuários com dislexia ou baixa visão

#### Scenario: Hierarquia semântica
- **WHEN** elementos tipográficos são usados
- **THEN** deve usar tags HTML semânticas corretas (h1, h2, p, etc.)
- **AND** não deve usar divs com estilos de heading sem semântica apropriada
- **AND** leitores de tela devem conseguir navegar por estrutura de headings

### Requirement: Responsividade Tipográfica
O sistema MUST garantir que tipografia seja legível e bem proporcionada em todos os tamanhos de tela.

#### Scenario: Tipografia em mobile (< 640px)
- **WHEN** página é visualizada em dispositivo móvel
- **THEN** h1 deve permanecer legível (pode reduzir para text-3xl em mobile)
- **AND** parágrafos devem ter largura confortável para leitura (45-75 caracteres)
- **AND** não deve haver overflow horizontal

#### Scenario: Tipografia em tablet (640px - 1024px)
- **WHEN** página é visualizada em tablet
- **THEN** tamanhos de fonte devem escalar proporcionalmente
- **AND** deve manter hierarquia visual clara

#### Scenario: Tipografia em desktop (> 1024px)
- **WHEN** página é visualizada em desktop
- **THEN** deve usar tamanhos de fonte base conforme especificação
- **AND** linhas de texto não devem ser excessivamente longas (usar max-width em containers)

#### Scenario: Uso de text-balance em títulos
- **WHEN** títulos longos são renderizados
- **THEN** h1 deve usar `text-balance` para quebras de linha equilibradas
- **AND** deve evitar linhas órfãs (uma palavra sozinha na última linha)

### Requirement: Documentação e Guidelines
O sistema MUST fornecer documentação completa e exemplos de uso para todos os elementos tipográficos.

#### Scenario: Página de exemplos
- **WHEN** desenvolvedor acessa documentação de tipografia
- **THEN** deve ver exemplos visuais de todas as variantes
- **AND** deve ter código copiável para cada exemplo
- **AND** deve mostrar comparação lado a lado de variantes

#### Scenario: Guidelines de uso
- **WHEN** desenvolvedor consulta guidelines
- **THEN** deve encontrar recomendações de quando usar cada variante
- **EXAMPLE**: "Use h1 para título principal da página, apenas uma vez por página"
- **EXAMPLE**: "Use Typography.Lead para parágrafo introdutório de artigos"
- **EXAMPLE**: "Use Typography.Muted para metadados e informações secundárias"

#### Scenario: Migração de código existente
- **WHEN** desenvolvedor precisa migrar componente existente
- **THEN** documentação deve fornecer mapeamento de classes antigas para novas
- **EXAMPLE**: Substituir `text-2xl font-bold` por `.typography-h3`
- **AND** deve indicar quais mudanças são breaking vs. recomendadas

#### Scenario: Exemplos de composição
- **WHEN** desenvolvedor precisa combinar tipografia com outros componentes
- **THEN** documentação deve mostrar padrões comuns
- **EXAMPLE**: Tipografia dentro de Cards
- **EXAMPLE**: Tipografia em Dialogs e Sheets
- **EXAMPLE**: Tipografia com ícones (Lucide)
