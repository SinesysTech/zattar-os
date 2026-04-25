# ZattarOS Design System Master

> **Lógica de uso:** ao construir uma página específica, verifique primeiro `design-system/zattaros/pages/[page-name].md`.
> Se esse arquivo existir, ele **sobrescreve** este Master. Se não existir, siga este arquivo como fonte global da verdade.

---

**Projeto:** ZattarOS  
**Produto:** sistema corporativo de gestão jurídica com automação e IA  
**Stack base:** Next.js 16, React 19, TypeScript estrito, Tailwind CSS 4, shadcn/ui, Supabase  
**Tom de marca:** jurídico corporativo, confiável, técnico, moderno, institucional

---

## Princípios Globais

- **Autoridade antes de exuberância**: a interface deve transmitir confiança operacional, clareza e governança.
- **Semântica antes de estética local**: cores, badges e destaques devem nascer do domínio jurídico, não de decisões isoladas por componente.
- **Consistência via tokens**: usar sempre tokens existentes e componentes canônicos do projeto.
- **Leitura operacional primeiro**: tabelas, status, timelines, detalhes e filtros precisam ser escaneáveis rapidamente.
- **Profundidade sutil**: usar glass, blur e bordas translúcidas com moderação e função clara.

---

## Regras Obrigatórias

- **Não usar cores hardcoded** em React ou classes Tailwind arbitrárias para estados de negócio.
- **Não usar OKLCH/HSL crus** no código. Use variáveis CSS e tokens semânticos.
- **Não criar mapeamentos locais de cor para status**. Use o sistema central de variantes semânticas.
- **Não usar deep imports cross-módulo**. Respeitar a arquitetura FSD e as barreiras `index.ts`.
- **Não usar `Sheet` como padrão de detalhe**. Usar `DialogDetailShell`.
- **Não usar subtítulo em página autenticada como padrão**. A estrutura principal deve seguir `PageShell` + `DataShell`.

---

## Fundação Visual

### Marca

- **Brand principal:** Zattar Purple
- **Base institucional:** escala fria slate/navy para reforçar confiança e densidade corporativa
- **Accent de ação:** laranja/âmbar para chamar atenção sem perder sobriedade
- **Mood visual:** enterprise legal interface, premium discreto, alta legibilidade, sem estética “AI genérica”

### Cores Semânticas

Usar os tokens definidos no projeto e nunca equivalentes improvisados.

- **Primary**: ações principais, links críticos, foco, seleção ativa
- **Secondary**: apoio visual e superfícies auxiliares
- **Success**: estados positivos, concluído, válido, saudável
- **Info**: estados informativos, em análise, neutro positivo
- **Warning**: pendência, atenção, risco moderado
- **Destructive**: erro, cancelamento, atraso crítico, ação irreversível
- **Neutral**: arquivado, encerrado, inativo, sem significado forte
- **Accent**: destaque complementar e indicadores especiais

### Paleta Operacional

A paleta configurável do sistema deve ser usada para:

- tags
- categorias
- eventos de calendário
- visualizações analíticas
- agrupamentos configuráveis pelo usuário

### Referências Canônicas

- `src/app/globals.css`
- `src/lib/design-system/tokens.ts`
- `src/lib/design-system/variants.ts`

---

## Tipografia

### Famílias Oficiais

- **Heading / Display:** Montserrat
- **Body / Label / UI:** Inter
- **Headline especial:** Manrope
- **Mono / números / timestamps:** Geist Mono

### Diretrizes

- Títulos de página devem soar institucionais, diretos e curtos.
- Conteúdo operacional deve priorizar legibilidade e densidade controlada.
- Métricas, IDs, números jurídicos e timestamps podem usar variações mono quando necessário.
- Evitar combinações tipográficas externas ao sistema.

### Hierarquia de Uso

- **Página:** título principal forte
- **Seção:** título intermediário, claro e estável
- **Card/KPI:** label discreta + valor de alto contraste
- **Meta informação:** texto secundário, nunca competir com heading

---

## Espaçamento e Densidade

### Grid Base

- O sistema usa **grid de 4px**.
- Todos os espaçamentos devem respeitar os tokens semânticos do projeto.

### Padrões de Espaçamento

- **Página:** `p-4 sm:p-6 lg:p-8`
- **Card:** `p-4 sm:p-6`
- **Dialog:** `p-6`
- **Gap padrão entre blocos:** 16px a 24px
- **Gap de seção:** 24px

### Densidade

Usar o eixo `data-density` já suportado pelos shells.

- **comfortable**: leitura, detalhe, páginas com maior respiro
- **compact**: formulários longos, telas densas, operação estilo SaaS enterprise

---

## Sistema de Superfícies

### Glass Depth

Usar a hierarquia de profundidade já existente no projeto.

- **Depth 1 / widget:** superfície leve para containers auxiliares
- **Depth 2 / KPI:** camada mais perceptível para indicadores e blocos de resumo
- **Depth 3 / destaque:** foco máximo com tint leve da cor primária

### Regras de Uso

- Glass deve ajudar a hierarquia, não virar efeito decorativo gratuito.
- Em light mode, transparência deve preservar contraste e legibilidade.
- Em overlays e diálogos, o blur deve ser controlado e elegante.

---

## Arquitetura de Interface

### Shells Canônicos

Toda interface autenticada deve priorizar a composição abaixo:

- **PageShell**: wrapper principal da página
- **DataShell**: shell para listagens, tabelas e superfícies operacionais
- **DialogFormShell**: criação/edição
- **DialogDetailShell**: detalhe/visualização
- **DetailSection / DetailSectionCard**: organização de páginas e diálogos de detalhe

### Composição Recomendada

1. `page.tsx` server component carrega dados iniciais
2. wrapper client gerencia estado da tabela e interações
3. `PageShell` estrutura a página
4. `DataShell` organiza header, conteúdo e footer
5. diálogos ficam fora da shell principal

### Regras de Página

- Não usar subtítulos longos como padrão em páginas autenticadas.
- Título e ação principal devem ficar no header operacional.
- KPIs e filtros aparecem como apoio, não como distração.

---

## Sistema de Badges e Semântica de Domínio

### Regra Principal

Qualquer badge de domínio deve usar:

- `SemanticBadge`
- ou `getSemanticBadgeVariant()` + `getSemanticBadgeTone()`

### Categorias de Domínio

O design system deve refletir semântica visual para categorias como:

- tribunal
- status processual
- status de audiência
- modalidade de audiência
- status de captura
- tipo de parte
- prioridade
- contratos
- obrigações
- financeiro
- indicadores especiais

### Intenção Visual

- **soft**: status, tipos, estados que exigem leitura densa e recorrente
- **solid**: categorias de identificação forte ou agrupamento visual primário

### Nunca Fazer

- usar `bg-red-500`, `text-yellow-700` e equivalentes para status de negócio
- criar helpers locais de cor como `getStatusColorClass()`
- divergir do mapa semântico central

---

## Componentes e Comportamentos

### Botões

- ação principal: variante primária
- ação secundária: outline ou secondary
- ação destrutiva: destructive
- hover curto, estável e sem causar shift visual relevante
- foco sempre visível

### Inputs e Formulários

- seguir alturas e fontes controladas por densidade
- labels explícitos
- estados de erro e foco visíveis
- formulários longos devem preferir densidade compacta

### Tabelas

- leitura rápida é prioridade
- usar badges semânticas para status e categorias
- filtros precisam ser escaneáveis
- evitar excesso de ornamento visual nas linhas

### Cards

- devem parecer institucionais e operacionais
- podem usar glass leve ou superfície neutra dependendo do contexto
- hover deve reforçar clique sem parecer lúdico

### Dialogs

- formulários em `DialogFormShell`
- detalhes em `DialogDetailShell`
- header claro, corpo escaneável, footer funcional

---

## Motion e Interação

- **duração padrão:** 150ms a 300ms
- **preferir:** transição de cor, borda, sombra, opacidade
- **evitar:** escalas agressivas, bounce excessivo, efeitos chamativos sem função
- **respeitar:** `prefers-reduced-motion`

---

## Acessibilidade

- contraste mínimo WCAG AA em light e dark mode
- foco visível em componentes interativos
- ícones consistentes, preferencialmente Lucide/SVG
- cor nunca como único indicador de estado
- campos com labels
- elementos clicáveis com feedback claro e cursor apropriado

---

## Dark Mode

- o sistema deve funcionar nativamente em light/dark
- sidebar permanece escura em ambos os temas
- superfícies de vídeo/chat têm tokens próprios e sempre escuros
- portal do cliente possui tokens isolados e não deve herdar decisões arbitrárias da área autenticada

---

## Anti-Padrões

- design lúdico ou casual demais
- gradientes neon “AI”
- visual exageradamente marketing dentro da área autenticada
- sombras pesadas sem necessidade
- badges com cor arbitrária
- tipografia fora da família oficial
- cards translúcidos com contraste ruim
- animações que atrapalham leitura operacional
- pages fora do padrão `PageShell`

---

## Checklist Antes de Entregar UI

- [ ] Usei tokens existentes em vez de valores crus
- [ ] Usei shells canônicos da aplicação
- [ ] Mantive semântica visual de domínio para badges e status
- [ ] Garanti contraste adequado em light/dark
- [ ] Mantive foco visível e navegação acessível
- [ ] Evitei hover com deslocamento incômodo
- [ ] Respeitei a densidade adequada para o contexto
- [ ] Mantive o layout responsivo sem scroll horizontal no mobile
- [ ] Preservei o tom institucional e jurídico do produto

---

## Arquivos de Referência

- `src/app/globals.css`
- `src/lib/design-system/tokens.ts`
- `src/lib/design-system/variants.ts`
- `src/components/ui/badge.tsx`
- `src/components/ui/semantic-badge.tsx`
- `src/components/ui/typography.tsx`
- `src/components/shared/page-shell.tsx`
- `src/components/shared/data-shell/data-shell.tsx`
- `src/components/shared/dialog-shell/dialog-form-shell.tsx`
- `src/components/shared/dialog-shell/dialog-detail-shell.tsx`

---

## Resumo Executivo

O ZattarOS deve parecer um **produto jurídico enterprise premium**, com linguagem visual confiável, semântica forte, leitura operacional rápida e uso disciplinado de tokens. Toda nova interface deve reforçar **clareza, autoridade, previsibilidade e consistência arquitetural**.