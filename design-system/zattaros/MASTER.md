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

Usar os tokens definidos no projeto e nunca equivalentes improvisados. Abaixo a distinção entre **tokens CSS semânticos** (existem em `globals.css` como variáveis) e **variantes visuais de componente** (nascem da composição de tokens dentro de um componente).

#### Tokens CSS semânticos

Fonte da verdade: `src/app/globals.css` + `src/lib/design-system/token-registry.ts`.

- **Primary**: ações principais, links críticos, foco, seleção ativa (Zattar Purple)
- **Secondary**: apoio visual e superfícies auxiliares
- **Success**: estados positivos, concluído, válido, saudável
- **Info**: estados informativos, em análise, neutro positivo
- **Warning**: pendência, atenção, risco moderado
- **Destructive**: erro, cancelamento, atraso crítico, ação irreversível
- **Accent**: destaque complementar (laranja/âmbar) para CTAs secundários e marcadores de ação pontuais
- **Highlight**: token independente de realce pontual — tooltips ativos, badges de atenção leve, chips de foco momentâneo; **não é sinônimo de Accent**, os dois coexistem no sistema
- **Muted / Foreground / Background / Border / Card / Popover**: superfícies e hierarquia base
- **Sidebar-\***: tokens isolados da sidebar (permanece escura em ambos os temas)

#### Variantes visuais de componente (sem token CSS próprio)

- **Neutral**: **não é um token CSS**. É uma variante visual implementada no `Badge` (`src/components/ui/badge.tsx`) compondo `bg-muted` + `text-foreground` (tom soft) ou `bg-foreground` + `text-background` (tom solid). Usar para arquivado, encerrado, inativo, sem significado forte.

> Regra: nunca criar uma variável CSS `--neutral` para simular esse comportamento. Sempre usar a variante `neutral` do `Badge` ou compor `muted` + `foreground` diretamente.

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

### Classes Canônicas vs Legadas

#### Classes CSS canônicas (usar sempre)

Declaradas em `src/app/globals.css` com `font-family` explícita:

- `.text-page-title`, `.text-section-title`, `.text-card-title`, `.text-widget-title`
- `.text-display-1`, `.text-display-2`
- `.text-body`, `.text-label`, `.text-helper`
- `.text-kpi-value`, `.text-meta-label`, `.text-mono-num`
- `.text-micro-badge`, `.text-overline`

#### Componentes React canônicos

Declarados em `src/components/ui/typography.tsx`:

- `<Heading level="page|section|card|subsection|widget|display-1|display-2|marketing-hero|marketing-section|marketing-title" />`
- `<Text variant="body|body-lg|body-sm|label|caption|helper|kpi-value|widget-sub|meta-label|micro-caption|micro-badge|overline|marketing-lead|marketing-overline" />`

#### Classes e componentes legados (evitar em código novo)

- Classes CSS `.typography-h1`, `.typography-h2`, `.typography-h3`, `.typography-h4` ainda presentes em `globals.css`. **Não aplicam `font-heading` explicitamente**, então caem no default do body (Inter) em vez de Montserrat. São tratáveis como débito técnico — ver seção "Débitos Técnicos Rastreados".
- Componentes React `H1`, `H2`, `H3`, `H4`, `P`, `Blockquote`, `List`, `InlineCode`, `Lead`, `Large`, `Small`, `Muted`, `Table` marcados `@deprecated` em `typography.tsx`. Código novo deve usar `<Heading>` / `<Text>`.

> Regra: em código novo, nunca importar os componentes `@deprecated` nem aplicar as classes `.typography-h*`. Migrações dos call-sites existentes acontecem progressivamente durante a fase de aplicação por página.

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

Usar a hierarquia de profundidade já existente no projeto. Cada nível é consumido via `GLASS_DEPTH` em `src/lib/design-system/tokens.ts` ou via classes CSS dedicadas.

- **Depth 1 / widget**: classe CSS dedicada `.glass-widget` em `globals.css`. Superfície leve para containers auxiliares.
- **Depth 2 / KPI**: classe CSS dedicada `.glass-kpi` em `globals.css`. Camada mais perceptível para indicadores e blocos de resumo.
- **Depth 3 / destaque**: **composição semântica com tint da cor primária** (`bg-primary/[0.04] backdrop-blur-xl border-primary/10`). Não existe classe `.glass-depth-3` ainda; o consumo autorizado é exclusivamente via `GLASS_DEPTH[3]` exportado em `tokens.ts`.

### Regras de Uso

- Glass deve ajudar a hierarquia, não virar efeito decorativo gratuito.
- Em light mode, transparência deve preservar contraste e legibilidade.
- Em overlays e diálogos, o blur deve ser controlado e elegante.
- **Nunca replicar inline** a composição do Depth 3 em JSX — sempre importar `GLASS_DEPTH` do design system. Isso garante que a futura migração para classe `.glass-depth-3` dedicada não exija refactor disperso.

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

O design system deve refletir semântica visual para o conjunto completo de categorias declaradas em `BadgeCategory` (`src/lib/design-system/variants.ts`). A tabela abaixo agrupa as ~37 categorias reais por domínio de negócio:

- **Processual**: `tribunal`, `status`, `grau`, `polo`, `parte`
- **Audiências**: `audiencia_status`, `audiencia_modalidade`, `audiencia_indicador`
- **Captura e expedientes**: `captura_status`, `expediente_tipo`, `expediente_status`
- **Contratos e cobrança**: `tipo_contrato`, `tipo_cobranca`, `status_contrato`, `parcela_status`, `repasse_status`
- **RH / folha**: `folha_status`, `salario_status`
- **Obrigações**: `obrigacao_status`, `obrigacao_tipo`, `obrigacao_direcao`
- **Documentos e templates**: `document_signature_status`, `template_status`
- **Gestão de projetos**: `project_status`, `task_status`, `priority`
- **Financeiro / contábil**: `payment_status`, `financial_alert`, `ativo_status`, `orcamento_status`, `orcamento_item_status`, `tipo_conta_contabil`, `conciliacao_status`
- **Comunicação / VoIP**: `call_status`, `network_quality`, `online_status`
- **Perícia**: `pericia_situacao`
- **Erros**: `error_type`

> Fonte da verdade para categorias: `BadgeCategory` em `src/lib/design-system/variants.ts`. Qualquer nova categoria de domínio deve ser adicionada lá primeiro (e refletida em `getSemanticBadgeVariant()` + `getSemanticBadgeTone()`) antes de aparecer em qualquer UI.

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

### Fonte da verdade — tokens e variáveis

- `src/app/globals.css` — CSS custom properties, classes glass, tipografia canônica
- `src/lib/design-system/tokens.ts` — espelho tipado DTCG (cores, glass, spacing, typography, motion, etc.)
- `src/lib/design-system/variants.ts` — mapa de domínio → variante visual (`BadgeCategory`, `getSemanticBadgeVariant`, `getSemanticBadgeTone`)
- `src/lib/design-system/token-registry.ts` — inventário autoritativo dos 495 tokens

### Componentes UI base

- `src/components/ui/badge.tsx` — variantes CVA sem hardcode, base dos badges semânticos
- `src/components/ui/semantic-badge.tsx` — wrapper que resolve domínio → variante + tone
- `src/components/ui/typography.tsx` — `<Heading>` / `<Text>` (APIs canônicas) + componentes `@deprecated`

### Shells e primitivas de layout

- `src/components/shared/page-shell.tsx`
- `src/components/shared/data-shell/data-shell.tsx`
- `src/components/shared/dialog-shell/dialog-form-shell.tsx`
- `src/components/shared/dialog-shell/dialog-detail-shell.tsx`
- `src/components/shared/detail-section/detail-section.tsx` e `detail-section-card.tsx`

---

## Débitos Técnicos Rastreados

Itens identificados na auditoria de conformidade MASTER ↔ implementação que **não** foram quitados nesta consolidação do MASTER. Serão endereçados na fase seguinte, quando a skill `ui-ux-pro-max` for aplicada página a página.

1. **Classes `.typography-h1..h4` sem `font-heading`** em `src/app/globals.css` (linhas 1375-1387). Precisam declarar `font-family: var(--font-heading)` ou serem removidas após migração dos call-sites.
2. **Duplicação de `.text-display-1` e `.text-display-2`** em `src/app/globals.css` (linhas 1478-1486 e 1513-1520). Manter apenas uma definição canônica.
3. **`GLASS_DEPTH[3]` como composição inline** em `src/lib/design-system/tokens.ts` (linha 634). Candidato a virar classe `.glass-depth-3` dedicada em `globals.css`, para paridade com `.glass-widget` e `.glass-kpi`.
4. **Migração dos call-sites legados**: substituir usos de `.typography-h*` e dos componentes `@deprecated` de `typography.tsx` pelas APIs canônicas (`<Heading>`, `<Text>`, `.text-page-title`, etc.). Será feito por página durante a fase de aplicação da skill.

---

## Resumo Executivo

O ZattarOS deve parecer um **produto jurídico enterprise premium**, com linguagem visual confiável, semântica forte, leitura operacional rápida e uso disciplinado de tokens. Toda nova interface deve reforçar **clareza, autoridade, previsibilidade e consistência arquitetural**.