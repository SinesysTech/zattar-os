# Portal do Cliente — Revisão Completa de Design & Plano de Redesign

**Data:** 2026-04-05
**Versão:** 1.0
**Escopo:** Auditoria visual, definição de design system e wireframes estruturais

---

## PARTE 1 — DIAGNÓSTICO: O QUE ESTÁ ERRADO

### 1.1 Resumo Executivo

O portal do cliente sofre de **fragmentação total de design**. Foram encontrados:

- **40+ cores hardcoded** (hex, rgb, oklch inline) em vez de tokens semânticos
- **3 implementações diferentes** de timeline
- **2 sidebars mortas** no código (`sidebar.tsx`, `portal-navbar.tsx`)
- **Zero padronização tipográfica** — misturam-se 4 famílias de fonte sem hierarquia
- **Nenhuma continuidade** com o design system interno (que usa OKLCH, tokens semânticos, e componentes padronizados)
- **Espaçamento arbitrário** — valores como `text-[10px]`, `blur-[60px]`, `shadow-[0_20px_40px_rgba(0,0,0,0.55)]` espalhados
- **Acessibilidade comprometida** — contraste insuficiente, falta de ARIA labels, inputs sem label

### 1.2 Inventário de Problemas por Categoria

---

#### A) CORES — Caos Total

| Problema | Arquivos Afetados | Severidade |
|----------|-------------------|------------|
| Status badges com cores hardcoded (`bg-blue-100 text-blue-800`) | `audiencia-card.tsx`, `contrato-card.tsx` | **CRÍTICO** |
| Cores de status sem tokens semânticos (`bg-emerald-500`, `bg-red-500`) | `dashboard-view.tsx`, `financeiro-content.tsx`, `agendamentos-content.tsx` | **CRÍTICO** |
| Shadows hardcoded com rgba | `dashboard-view.tsx`, `cpf-hero-form.tsx`, `action-buttons.tsx`, `cta-zattar.tsx` | ALTO |
| Opacidades arbitrárias (`bg-white/5`, `bg-white/10`, `border-white/5`) | `dashboard-view.tsx`, `service-card.tsx` | ALTO |
| Background hexadecimal inline (`bg-[#191919]/60`) | `service-card.tsx` | ALTO |
| Gradientes sem sistema (`bg-linear-to-br from-primary/10`) | `header.tsx` (morto), `service-index-header.tsx` | MÉDIO |
| Links com `text-blue-600` hardcoded em vez de `text-primary` | `audiencia-card.tsx` | MÉDIO |

**Exemplos concretos do desastre:**

```tsx
// audiencia-card.tsx — ERRADO: cores hardcoded por status
case 'MARCADA': return 'bg-blue-100 text-blue-800 border-blue-200';
case 'REALIZADA': return 'bg-green-100 text-green-800 border-green-200';

// contrato-card.tsx — ERRADO: mesma coisa
case 'distribuido': return 'bg-green-500 hover:bg-green-600 text-white';
case 'desistencia': return 'bg-black hover:bg-gray-800 text-white';

// dashboard-view.tsx — ERRADO: shadow inline
className="shadow-[0_0_20px_rgba(168,85,247,0.3)]"

// range-input.tsx — ERRADO: estilo inline com OKLCH
style={{ background: `linear-gradient(to right, oklch(0.80 0.18 281) ${progress}%...` }}
```

---

#### B) TIPOGRAFIA — Sem Hierarquia

| Problema | Onde | Severidade |
|----------|------|------------|
| 4 famílias de fonte sem regra de uso (`font-sans`, `font-heading`, `font-headline`, `font-mono`) | Todo o portal | **CRÍTICO** |
| Tamanhos arbitrários (`text-[10px]`, `text-[11px]`, `text-[12px]`, `text-[2rem]`) | `dashboard-view.tsx`, `service-index-header.tsx`, vários | **CRÍTICO** |
| Pesos sem hierarquia (`font-black` + `font-bold` + `font-semibold` sem padrão) | Vários | ALTO |
| Salto agressivo de tamanho (`text-4xl` → `text-6xl` no mobile→desktop) | `service-index-header.tsx` | ALTO |
| Tracking inconsistente (`tracking-tighter`, `tracking-[0.2em]`, `tracking-widest` misturados) | `sidebar.tsx`, `service-index-header.tsx` | MÉDIO |

**O que falta:**
- Escala tipográfica definida (display, h1, h2, h3, body, caption, overline)
- Mapeamento claro: qual fonte para qual contexto
- Tokens semânticos de tamanho e peso

---

#### C) ESPAÇAMENTO — Sem Ritmo

| Problema | Onde | Severidade |
|----------|------|------------|
| Padding com 6 breakpoints (`px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12`) | `portal-shell.tsx` | ALTO |
| Footer `py-8` vs conteúdo `py-6` — ritmo vertical quebrado | `portal-shell.tsx` | MÉDIO |
| Gaps arbitrários entre componentes (`gap-1.5`, `gap-2.5`, `gap-3.5`) | Vários | MÉDIO |
| Cards com padding inconsistente (`p-4`, `p-5`, `p-6`, `p-8`) | `processo-card.tsx`, `service-card.tsx`, vários | ALTO |
| Margens inline (`mt-1`, `mt-2`, `mt-3`, `mt-4`, `mt-6`) sem padrão | Todo o portal | MÉDIO |

---

#### D) COMPONENTES — Fragmentação

| Problema | Severidade |
|----------|------------|
| **3 timelines diferentes** (`timeline.tsx`, `processo-timeline.tsx`, inline em `processo-detalhe-content.tsx`) | **CRÍTICO** |
| **2 sidebars mortas** (`sidebar.tsx` e `portal-navbar.tsx` não usadas) | ALTO |
| **2 headers mortos** (`header.tsx` não usado) | ALTO |
| Badge/status styling diferente em cada card (Badge, AppBadge, span inline) | **CRÍTICO** |
| Empty states inconsistentes (custom AlertCircle vs `EmptyState` component) | MÉDIO |
| Botões de filtro com cores diferentes por página | MÉDIO |
| Formatação de datas duplicada em 3+ componentes | MÉDIO |
| Formatação monetária embutida em componentes ao invés de utility | MÉDIO |
| Stat/Metric cards sem componente padrão (cada página faz diferente) | ALTO |

---

#### E) ACESSIBILIDADE — Comprometida

| Problema | Severidade |
|----------|------------|
| `text-muted-foreground/40` no disclaimer — quase invisível | **CRÍTICO** |
| Toggle switch customizado sem acessibilidade de teclado | ALTO |
| Collapsible sections sem `aria-expanded` | ALTO |
| Ícones sem `aria-label` em botões icon-only | ALTO |
| Range input sem suporte adequado a teclado | MÉDIO |
| Cores como único indicador de status (sem ícone/texto complementar) | MÉDIO |

---

#### F) RESPONSIVIDADE — Lacunas

| Problema | Severidade |
|----------|------------|
| Elementos `absolute` (badges em cards) sem ajuste mobile | ALTO |
| Grid pula breakpoint tablet (vai de 1 col direto para 3) | MÉDIO |
| Truncação de texto com ponto fixo (`max-w-48`) sem responsive | MÉDIO |
| Sem layout alternativo para tabelas em mobile | ALTO |

---

## PARTE 2 — DESIGN SYSTEM: PORTAL DO CLIENTE

### 2.1 Filosofia

O portal do cliente é um **subsistema derivado** do design system interno. Ele:

- **Herda** os tokens de cor base (primary, destructive, muted, etc.)
- **Simplifica** a paleta — menos variantes, mais clareza
- **Eleva a confiança** — tipografia profissional jurídica, espaçamento generoso
- **Prioriza legibilidade** — o cliente não é power user, precisa entender rápido

### 2.2 Tokens de Cor — Portal

```
┌─────────────────────────────────────────────────────────────────┐
│  PALETA DO PORTAL DO CLIENTE                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SURFACES                                                       │
│  ─────────                                                      │
│  --portal-bg:           oklch(0.97 0.005 281)   // fundo geral  │
│  --portal-card:         oklch(1.0 0 0)          // cards        │
│  --portal-card-hover:   oklch(0.98 0.005 281)   // card hover   │
│  --portal-surface:      oklch(0.95 0.008 281)   // seções alt   │
│                                                                 │
│  TEXT                                                           │
│  ─────                                                          │
│  --portal-text:         oklch(0.15 0.01 281)    // principal    │
│  --portal-text-muted:   oklch(0.45 0.01 281)    // secundário   │
│  --portal-text-subtle:  oklch(0.60 0.005 281)   // terciário    │
│                                                                 │
│  BRAND (herda do interno)                                       │
│  ─────                                                          │
│  --portal-primary:      var(--primary)           // Zattar Purple│
│  --portal-primary-soft: oklch(0.95 0.05 281)    // bg sutil     │
│                                                                 │
│  STATUS (semânticos — OBRIGATÓRIOS)                             │
│  ──────                                                         │
│  --portal-success:      oklch(0.55 0.18 145)    // pago, ativo  │
│  --portal-success-soft: oklch(0.95 0.05 145)    // bg success   │
│  --portal-warning:      oklch(0.60 0.18 75)     // pendente     │
│  --portal-warning-soft: oklch(0.95 0.05 75)     // bg warning   │
│  --portal-danger:       oklch(0.55 0.22 25)     // atrasado     │
│  --portal-danger-soft:  oklch(0.95 0.05 25)     // bg danger    │
│  --portal-info:         oklch(0.55 0.18 250)    // informativo  │
│  --portal-info-soft:    oklch(0.95 0.05 250)    // bg info      │
│                                                                 │
│  DARK MODE (inverte as surfaces, mantém hue 281)                │
│  ─────────                                                      │
│  --portal-bg:           oklch(0.14 0.005 281)                   │
│  --portal-card:         oklch(0.20 0.008 281)                   │
│  --portal-text:         oklch(0.95 0.005 281)                   │
│  --portal-text-muted:   oklch(0.65 0.01 281)                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Regra de ouro:** NUNCA usar `bg-blue-100`, `text-emerald-400`, `bg-red-500` etc. diretamente. Sempre usar os tokens semânticos acima via classes utilitárias do Tailwind.

### 2.3 Tipografia — Portal

```
┌─────────────────────────────────────────────────────────────────┐
│  ESCALA TIPOGRÁFICA DO PORTAL                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FONTES                                                         │
│  ──────                                                         │
│  Headings:  Inter (font-sans) — já carregada no projeto         │
│  Body:      Inter (font-sans) — mesma fonte, pesos diferentes   │
│  Display:   Manrope (font-headline) — títulos de seção hero     │
│  Mono:      Geist Mono (font-mono) — números de processo, CPF   │
│                                                                 │
│  DECISÃO: NÃO adicionar EB Garamond / Lato.                    │
│  O projeto já carrega Inter + Montserrat + Manrope + Geist.     │
│  Adicionar mais fontes = mais peso. Inter é excelente para      │
│  interfaces profissionais. Manrope para display/hero.           │
│                                                                 │
│  ESCALA DE TAMANHOS                                             │
│  ─────────────────                                              │
│  Token          Tailwind        Uso                             │
│  ─────          ────────        ───                             │
│  display        text-3xl        Títulos hero de seção (Serviços)│
│  h1             text-2xl        Título de página                │
│  h2             text-xl         Título de card/seção            │
│  h3             text-lg         Subtítulo, grupo                │
│  body           text-base       Texto corrido, parágrafos       │
│  body-sm        text-sm         Texto secundário, descrições    │
│  caption        text-xs         Labels, metadata, timestamps    │
│  overline       text-xs         Labels uppercase com tracking   │
│                                                                 │
│  ⛔ PROIBIDO: text-[10px], text-[11px], text-[12px], text-[2rem]│
│                                                                 │
│  ESCALA DE PESOS                                                │
│  ────────────────                                               │
│  Token          Tailwind        Uso                             │
│  ─────          ────────        ───                             │
│  display        font-bold       Títulos hero                    │
│  heading        font-semibold   Títulos h1-h3                   │
│  emphasis       font-medium     Labels importantes, nav ativo   │
│  body           font-normal     Texto corrido                   │
│                                                                 │
│  ⛔ PROIBIDO: font-black no portal (agressivo demais)           │
│                                                                 │
│  LINE HEIGHT                                                    │
│  ───────────                                                    │
│  Headings:   leading-tight (1.25)                               │
│  Body:       leading-relaxed (1.625)                            │
│  Captions:   leading-normal (1.5)                               │
│                                                                 │
│  LETTER SPACING                                                 │
│  ───────────────                                                │
│  Display:    tracking-tight (-0.025em)                          │
│  Headings:   tracking-tight (-0.025em)                          │
│  Body:       tracking-normal (0)                                │
│  Overline:   tracking-wider (0.05em)                            │
│                                                                 │
│  ⛔ PROIBIDO: tracking-[0.2em], tracking-tighter, tracking-widest│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 Espaçamento — Portal

```
┌─────────────────────────────────────────────────────────────────┐
│  SISTEMA DE ESPAÇAMENTO DO PORTAL                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ESCALA BASE (múltiplos de 4px)                                 │
│  ────────────────────────────────                               │
│  Token     Tailwind    Pixels    Uso                            │
│  ─────     ────────    ──────    ───                            │
│  2xs       gap-1       4px       Ícone + texto inline           │
│  xs        gap-1.5     6px       Badges, tags                   │
│  sm        gap-2       8px       Elementos compactos            │
│  md        gap-3       12px      Entre items de lista           │
│  base      gap-4       16px      Padrão entre elementos        │
│  lg        gap-6       24px      Entre seções dentro de card    │
│  xl        gap-8       32px      Entre cards/seções de página   │
│                                                                 │
│  PADDING DE CONTAINERS                                          │
│  ────────────────────                                           │
│  Page content:   px-4 md:px-8 lg:px-12     (3 breakpoints MAX) │
│  Cards:          p-5                        (fixo, não escala)  │
│  Card header:    px-5 pb-4                  (com border-b)      │
│  Card sections:  p-4                        (sub-seções)        │
│  Inline items:   px-3 py-2                  (badges, chips)     │
│                                                                 │
│  VERTICAL RHYTHM                                                │
│  ───────────────                                                │
│  Entre seções de página:  space-y-8                             │
│  Entre cards:             space-y-6                             │
│  Dentro de card:          space-y-4                             │
│  Entre form fields:       space-y-3                             │
│                                                                 │
│  ⛔ PROIBIDO: px-10, px-12 (excessivo), gap-1.5 + gap-2.5 +    │
│  gap-3.5 (meios valores criam ruído), blur-[60px] e similares  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.5 Componentes — Portal

```
┌─────────────────────────────────────────────────────────────────┐
│  COMPONENTES PADRÃO DO PORTAL                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CARD VARIANTS                                                  │
│  ─────────────                                                  │
│  Default:    bg-portal-card rounded-xl border border-border/50  │
│              p-5 shadow-sm                                      │
│  Elevated:   + shadow-md (para cards de destaque)               │
│  Interactive:+ hover:shadow-md hover:border-primary/20          │
│              cursor-pointer transition-all duration-200          │
│                                                                 │
│  STATUS BADGE (obrigatório p/ todos os status)                  │
│  ────────────                                                   │
│  Componente: <PortalBadge status="success|warning|danger|info"> │
│  Styling:    bg-{status}-soft text-{status} rounded-full        │
│              px-2.5 py-0.5 text-xs font-medium                  │
│  Regra:      SEMPRE acompanhar cor com ícone ou dot indicator   │
│                                                                 │
│  STAT CARD (métricas do dashboard)                              │
│  ─────────                                                      │
│  Componente: <PortalStatCard label icon value trend />          │
│  Layout:     Ícone à esquerda, label em caption, valor em h2    │
│  Regra:      Grid responsivo: grid-cols-2 lg:grid-cols-4       │
│                                                                 │
│  LIST ITEM (linhas de dados)                                    │
│  ─────────                                                      │
│  Componente: <PortalListItem>                                   │
│  Styling:    py-4 border-b border-border/50 last:border-0       │
│              flex items-center justify-between gap-4             │
│  Regra:      Padding SEMPRE py-4, nunca py-3 ou py-2.5          │
│                                                                 │
│  EMPTY STATE                                                    │
│  ───────────                                                    │
│  Componente: Usar <EmptyState> de @/components/shared           │
│  Regra:      NUNCA criar empty state inline customizado         │
│                                                                 │
│  TIMELINE (consolidar em 1 componente)                          │
│  ────────                                                       │
│  Componente: <PortalTimeline items={[]} />                      │
│  Styling:    Linha vertical com dots coloridos por status        │
│  Regra:      DELETAR timeline.tsx duplicada e inline versions   │
│                                                                 │
│  FILTER BAR                                                     │
│  ──────────                                                     │
│  Componente: <PortalFilterBar filters={[]} onFilter />          │
│  Styling:    Botões ghost com active state bg-primary/10        │
│              text-primary. Altura h-9 uniforme.                  │
│  Regra:      MESMA aparência em todas as páginas                │
│                                                                 │
│  SECTION HEADER                                                 │
│  ──────────────                                                 │
│  Componente: <PortalSectionHeader title description action />   │
│  Styling:    h2 font-semibold tracking-tight + description      │
│              text-sm text-muted + action button à direita        │
│  Regra:      Usar em TODA seção que agrupa conteúdo             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.6 Sombras — Portal

```
Apenas 3 níveis permitidos:

  shadow-sm      → Cards padrão, containers
  shadow-md      → Cards elevated, hover states
  shadow-lg      → Modais, popovers, dropdowns

  ⛔ PROIBIDO:
  shadow-[0_20px_40px_rgba(0,0,0,0.55)]
  shadow-[0_0_20px_rgba(168,85,247,0.3)]
  shadow-[0_4px_20px_rgba(204,151,255,0.2)]
```

### 2.7 Border Radius — Portal

```
Apenas 3 níveis:

  rounded-lg     → Inputs, botões, badges
  rounded-xl     → Cards, containers
  rounded-full   → Avatars, dots, badges pill

  ⛔ PROIBIDO: rounded-2xl, rounded-md misturado com rounded-lg
```

---

## PARTE 3 — WIREFRAMES ESTRUTURAIS

### 3.1 Layout Master — Shell do Portal

```
┌──────────────────────────────────────────────────────────┐
│ PORTAL SHELL                                              │
│                                                           │
│ ┌──────┐ ┌─────────────────────────────────────────────┐ │
│ │      │ │ HEADER (h-16, sticky)                        │ │
│ │      │ │ [☰ trigger]              [Nome] [Avatar ▾]   │ │
│ │ SIDE │ ├─────────────────────────────────────────────┤ │
│ │ BAR  │ │                                              │ │
│ │      │ │  CONTENT AREA                                │ │
│ │ Logo │ │  px-4 md:px-8 lg:px-12                      │ │
│ │      │ │  py-6                                        │ │
│ │ Nav  │ │  space-y-8 (entre seções)                    │ │
│ │      │ │                                              │ │
│ │ ──── │ │  max-w-6xl mx-auto (conteúdo centrado)      │ │
│ │      │ │                                              │ │
│ │ User │ │                                              │ │
│ │ Menu │ ├─────────────────────────────────────────────┤ │
│ │      │ │ FOOTER — py-6 border-t text-xs text-muted   │ │
│ └──────┘ └─────────────────────────────────────────────┘ │
│                                                           │
│ Sidebar: collapsible, icon mode em mobile                 │
│ Content: ScrollArea com padding responsivo                │
│ Footer: Links legais + copyright                          │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ DASHBOARD                                                │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ HEADER SECTION                                       │ │
│ │ "Olá, {nome}" — h1 font-semibold                    │ │
│ │ "Acompanhe seus processos" — body-sm text-muted     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                          space-y-8      │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                    │
│ │ STAT │ │ STAT │ │ STAT │ │ STAT │  grid-cols-2       │
│ │ CARD │ │ CARD │ │ CARD │ │ CARD │  lg:grid-cols-4    │
│ │      │ │      │ │      │ │      │  gap-4              │
│ └──────┘ └──────┘ └──────┘ └──────┘                    │
│                                          space-y-8      │
│ ┌──────────────────────┐ ┌──────────────────────────┐  │
│ │ PROCESSOS RECENTES   │ │ PRÓXIMOS COMPROMISSOS    │  │
│ │ (PortalSectionHeader)│ │ (PortalSectionHeader)    │  │
│ │                      │ │                          │  │
│ │ ┌──────────────────┐ │ │ ┌──────────────────────┐ │  │
│ │ │ PortalListItem   │ │ │ │ PortalListItem       │ │  │
│ │ │ PortalListItem   │ │ │ │ PortalListItem       │ │  │
│ │ │ PortalListItem   │ │ │ │ PortalListItem       │ │  │
│ │ └──────────────────┘ │ │ └──────────────────────┘ │  │
│ │ [Ver todos →]        │ │ [Ver agenda →]           │  │
│ └──────────────────────┘ └──────────────────────────┘  │
│                                                          │
│ Layout: grid-cols-1 lg:grid-cols-2 gap-6                │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Processos (Lista)

```
┌─────────────────────────────────────────────────────────┐
│ PROCESSOS                                                │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ PortalSectionHeader                                  │ │
│ │ "Meus Processos" — h1                               │ │
│ │ "{n} processos encontrados" — body-sm text-muted    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ FILTER BAR                                           │ │
│ │ [🔍 Buscar...        ] [Todos] [Andamento] [Concl.] │ │
│ │                                    h-9 uniforme      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                          space-y-4      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ PROCESSO CARD (Interactive variant)                  │ │
│ │ ┌────────────────────────────────────────────────┐  │ │
│ │ │ [●] Nº 0001234-56.2024.5.01.0001  [Badge]     │  │ │
│ │ │     font-mono                    PortalBadge   │  │ │
│ │ │                                                │  │ │
│ │ │ Reclamação Trabalhista — h3                    │  │ │
│ │ │ Vara do Trabalho, TRT1 — body-sm text-muted   │  │ │
│ │ │                                                │  │ │
│ │ │ Última mov: 02/04/2026 — caption text-subtle   │  │ │
│ │ └────────────────────────────────────────────────┘  │ │
│ │                                                      │ │
│ │ ┌────────────────────────────────────────────────┐  │ │
│ │ │ (repete...)                                     │  │ │
│ │ └────────────────────────────────────────────────┘  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Cards: espaçamento space-y-4                            │
│ Cada card: p-5, cursor-pointer, hover:shadow-md         │
└─────────────────────────────────────────────────────────┘
```

### 3.4 Processo Detalhe

```
┌─────────────────────────────────────────────────────────┐
│ PROCESSO DETALHE                                         │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ BACK NAV                                             │ │
│ │ [← Voltar aos processos] — body-sm text-primary     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ HEADER CARD (elevated)                               │ │
│ │ Nº 0001234-56.2024.5.01.0001 — font-mono h2        │ │
│ │ [PortalBadge: Em Andamento]                          │ │
│ │                                                      │ │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐             │ │
│ │ │ Vara     │ │ Tribunal │ │ Grau     │  grid-3     │ │
│ │ │ caption  │ │ caption  │ │ caption  │  gap-4      │ │
│ │ │ value    │ │ value    │ │ value    │             │ │
│ │ └──────────┘ └──────────┘ └──────────┘             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                          space-y-8      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ TIMELINE SECTION                                     │ │
│ │ PortalSectionHeader: "Movimentações"                 │ │
│ │                                                      │ │
│ │ ┌─ ● ── 02/04/2026 ─────────────────────────────┐  │ │
│ │ │       Publicação de sentença                    │  │ │
│ │ │       Detalhes da movimentação...               │  │ │
│ │ ├─ ○ ── 28/03/2026 ─────────────────────────────┤  │ │
│ │ │       Audiência de instrução realizada          │  │ │
│ │ ├─ ○ ── 15/03/2026 ─────────────────────────────┤  │ │
│ │ │       Petição protocolada                       │  │ │
│ │ └───────────────────────────────────────────────┘  │ │
│ │                                                      │ │
│ │ Usar <PortalTimeline> (ÚNICO componente)             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ DOCUMENTOS SECTION                                   │ │
│ │ PortalSectionHeader: "Documentos"                    │ │
│ │                                                      │ │
│ │ PortalListItem: Petição Inicial.pdf      [↓]        │ │
│ │ PortalListItem: Contestação.pdf          [↓]        │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 3.5 Financeiro

```
┌─────────────────────────────────────────────────────────┐
│ FINANCEIRO                                               │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ PortalSectionHeader: "Financeiro"                    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│ │ PortalStat   │ │ PortalStat   │ │ PortalStat   │     │
│ │ Total        │ │ Pago         │ │ Pendente     │     │
│ │ R$ 12.500    │ │ R$ 8.200     │ │ R$ 4.300     │     │
│ │ caption      │ │ success      │ │ warning      │     │
│ └──────────────┘ └──────────────┘ └──────────────┘     │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ FILTER BAR                                           │ │
│ │ [Todos] [Pago] [Pendente] [Atrasado]                │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ PortalListItem                                       │ │
│ │ ┌────────────────────────────────────────────────┐  │ │
│ │ │ Honorários - Proc. 0001234    R$ 2.500,00      │  │ │
│ │ │ Venc: 15/04/2026              [Badge: Pendente]│  │ │
│ │ └────────────────────────────────────────────────┘  │ │
│ │ (repete com PortalListItem padrão...)               │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Valores monetários: font-mono font-semibold             │
│ Datas: font-mono text-xs text-muted                     │
└─────────────────────────────────────────────────────────┘
```

### 3.6 Agendamentos

```
┌─────────────────────────────────────────────────────────┐
│ AGENDAMENTOS                                             │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ PortalSectionHeader: "Agendamentos"                  │ │
│ │ "{n} agendamentos" — body-sm text-muted             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ FILTER BAR                                           │ │
│ │ [Próximos] [Passados] [Todos]                       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ AGENDAMENTO CARD (Interactive)                       │ │
│ │ ┌────────────────────────────────────────────────┐  │ │
│ │ │ ┌────┐                                         │  │ │
│ │ │ │ 15 │  Reunião sobre acordo              p-5  │  │ │
│ │ │ │ABR │  14:00 — Presencial                     │  │ │
│ │ │ │    │  Local: Escritório central               │  │ │
│ │ │ └────┘  [PortalBadge: Confirmado]              │  │ │
│ │ └────────────────────────────────────────────────┘  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Date block: bg-primary-soft rounded-lg p-3              │
│ Tipo badge: usa PortalBadge com variante semântica      │
└─────────────────────────────────────────────────────────┘
```

### 3.7 Serviços Hub

```
┌─────────────────────────────────────────────────────────┐
│ SERVIÇOS                                                 │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ HERO SECTION                                         │ │
│ │ "Serviços" — display font-headline font-bold        │ │
│ │              tracking-tight                          │ │
│ │ "Ferramentas e calculadoras trabalhistas"            │ │
│ │              — body text-muted                       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                          space-y-8      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ CATEGORY SECTION                                     │ │
│ │ PortalSectionHeader: "Calculadoras"                  │ │
│ │                                                      │ │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐             │ │
│ │ │ Service  │ │ Service  │ │ Service  │  grid       │ │
│ │ │ Card     │ │ Card     │ │ Card     │  cols-1     │ │
│ │ │          │ │          │ │          │  sm:cols-2  │ │
│ │ │ [Icon]   │ │ [Icon]   │ │ [Icon]   │  lg:cols-3  │ │
│ │ │ Title    │ │ Title    │ │ Title    │  gap-4      │ │
│ │ │ Desc     │ │ Desc     │ │ Desc     │             │ │
│ │ └──────────┘ └──────────┘ └──────────┘             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Service Card: bg-portal-card p-5 rounded-xl             │
│               border border-border/50                    │
│               hover:shadow-md hover:border-primary/20   │
│               cursor-pointer transition-all duration-200 │
│                                                          │
│ ⛔ NÃO USAR: bg-[#191919]/60, border-white/5            │
└─────────────────────────────────────────────────────────┘
```

### 3.8 Calculadora (Template)

```
┌─────────────────────────────────────────────────────────┐
│ CALCULADORA                                              │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ BACK NAV: [← Voltar aos serviços]                   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ CALCULATOR HEADER                                    │ │
│ │ "Calculadora de Rescisão" — h1                      │ │
│ │ "Simule os valores..." — body-sm text-muted         │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌───────────────────────┐ ┌───────────────────────────┐ │
│ │ INPUT PANEL           │ │ RESULTS PANEL             │ │
│ │ (Card default)        │ │ (Card elevated, sticky)   │ │
│ │                       │ │                           │ │
│ │ [Form fields]         │ │ Resultado:                │ │
│ │ space-y-3             │ │                           │ │
│ │                       │ │ ┌─────────────────────┐   │ │
│ │ Labels: caption       │ │ │ ResultRow            │   │ │
│ │ Inputs: h-10          │ │ │ Label    R$ Value    │   │ │
│ │ Selects: h-10         │ │ │ border-b             │   │ │
│ │                       │ │ ├─────────────────────┤   │ │
│ │ [Calcular] primary    │ │ │ ResultRow            │   │ │
│ │ w-full h-10           │ │ │ Label    R$ Value    │   │ │
│ │                       │ │ ├═════════════════════┤   │ │
│ │                       │ │ │ TOTAL    R$ Total    │   │ │
│ │                       │ │ │ font-semibold        │   │ │
│ │                       │ │ └─────────────────────┘   │ │
│ │                       │ │                           │ │
│ │                       │ │ [↓ Baixar PDF] [↗ Comp.] │ │
│ └───────────────────────┘ └───────────────────────────┘ │
│                                                          │
│ Layout: grid-cols-1 lg:grid-cols-2 gap-6                │
│ Results panel: lg:sticky lg:top-24                      │
│ Valores: font-mono font-semibold                        │
│                                                          │
│ ⛔ NÃO USAR: text-red-400 para negativos                │
│ ✅ USAR: text-portal-danger                              │
└─────────────────────────────────────────────────────────┘
```

### 3.9 Perfil

```
┌─────────────────────────────────────────────────────────┐
│ PERFIL                                                   │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ PROFILE HEADER (Card elevated)                       │ │
│ │ ┌──────┐                                             │ │
│ │ │Avatar│  Nome Completo — h1                        │ │
│ │ │ 64px │  CPF: ***.***.***-00 — font-mono caption   │ │
│ │ └──────┘  Email — body-sm text-muted                │ │
│ └─────────────────────────────────────────────────────┘ │
│                                          space-y-8      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ DADOS PESSOAIS (Card default)                        │ │
│ │ PortalSectionHeader: "Dados Pessoais"                │ │
│ │                                                      │ │
│ │ Label: Value    grid-cols-1 md:grid-cols-2           │ │
│ │ Label: Value    gap-4                                │ │
│ │ Label: Value                                         │ │
│ │                                                      │ │
│ │ Labels: caption text-muted uppercase tracking-wider  │ │
│ │ Values: body font-medium                             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ PREFERÊNCIAS (Card default)                          │ │
│ │ Toggle: Modo escuro                                  │ │
│ │ Toggle: Notificações por email                       │ │
│ │                                                      │ │
│ │ Usar Switch de shadcn/ui (acessível)                 │ │
│ │ ⛔ NÃO USAR toggle customizado sem a11y             │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## PARTE 4 — PLANO DE EXECUÇÃO

### Fase 0: Limpeza (pré-requisito)

| # | Tarefa | Arquivos |
|---|--------|----------|
| 0.1 | Deletar `header.tsx` (não usado) | `portal/feature/components/layout/header.tsx` |
| 0.2 | Deletar `sidebar.tsx` (não usado) | `portal/feature/components/layout/sidebar.tsx` |
| 0.3 | Deletar `portal-navbar.tsx` (não usado) | `portal/feature/components/layout/portal-navbar.tsx` |
| 0.4 | Deletar `navigation-menu.tsx` se não referenciado | `portal/feature/components/ui/navigation-menu.tsx` |

### Fase 1: Tokens & Base

| # | Tarefa |
|---|--------|
| 1.1 | Adicionar tokens `--portal-*` no `globals.css` (cores, surfaces, status) |
| 1.2 | Criar classes utilitárias Tailwind para os tokens portal |
| 1.3 | Padronizar `portal-shell.tsx` (padding 3 breakpoints, footer alinhado) |
| 1.4 | Ajustar `portal-header.tsx` (hierarquia visual, responsive) |

### Fase 2: Componentes Base

| # | Tarefa |
|---|--------|
| 2.1 | Criar `PortalBadge` com variantes semânticas (success, warning, danger, info) |
| 2.2 | Criar `PortalStatCard` (label, icon, value, trend) |
| 2.3 | Criar `PortalListItem` (padding padrão py-4, layout flex) |
| 2.4 | Criar `PortalSectionHeader` (title, description, action) |
| 2.5 | Criar `PortalFilterBar` (botões ghost uniformes h-9) |
| 2.6 | Criar `PortalTimeline` (consolidar 3 implementações em 1) |

### Fase 3: Migrar Páginas

| # | Tarefa |
|---|--------|
| 3.1 | Redesign `dashboard-content.tsx` — usar PortalStatCard + PortalListItem |
| 3.2 | Redesign `processos-content.tsx` — usar PortalFilterBar + cards padronizados |
| 3.3 | Redesign `processo-detalhe-content.tsx` — usar PortalTimeline |
| 3.4 | Redesign `financeiro-content.tsx` — eliminar hardcoded colors |
| 3.5 | Redesign `agendamentos-content.tsx` — padronizar cards |
| 3.6 | Redesign `audiencias-content.tsx` — substituir hardcoded badges |
| 3.7 | Redesign `contratos-content.tsx` — substituir status colors |
| 3.8 | Redesign `pagamentos-content.tsx` — padronizar com PortalListItem |
| 3.9 | Redesign `perfil-content.tsx` — usar layout do wireframe |

### Fase 4: Serviços

| # | Tarefa |
|---|--------|
| 4.1 | Padronizar `service-card.tsx` — eliminar bg-[#191919]/60 |
| 4.2 | Padronizar `calculator-shell.tsx` — usar tokens de spacing |
| 4.3 | Padronizar inputs (currency, number, range, select, toggle) — acessibilidade + tokens |
| 4.4 | Padronizar `result-row.tsx` — usar tokens semânticos |
| 4.5 | Padronizar `action-buttons.tsx` — eliminar shadow hardcoded |

### Fase 5: QA & Polish

| # | Tarefa |
|---|--------|
| 5.1 | Audit de acessibilidade — ARIA labels, keyboard nav, contraste |
| 5.2 | Audit responsivo — testar 375px, 768px, 1024px, 1440px |
| 5.3 | Audit dark mode — todos os tokens devem funcionar em ambos os modos |
| 5.4 | Extrair utilitários compartilhados (formatação de data, moeda, status) |
| 5.5 | Documentar design system do portal em RULES.md |

---

## PARTE 5 — REGRAS DE OURO (RESUMO)

1. **NUNCA** hardcodar cores — usar tokens semânticos `--portal-*`
2. **NUNCA** usar `text-[10px]` ou valores arbitrários — escala tipográfica fixa
3. **NUNCA** criar timeline, badge ou empty state inline — usar componente padrão
4. **SEMPRE** acompanhar cor de status com ícone ou texto (acessibilidade)
5. **SEMPRE** usar `cursor-pointer` + `transition-all duration-200` em elementos clicáveis
6. **MÁXIMO** 3 breakpoints de padding: `px-4 md:px-8 lg:px-12`
7. **MÁXIMO** 3 níveis de sombra: `shadow-sm`, `shadow-md`, `shadow-lg`
8. **MÁXIMO** 3 níveis de radius: `rounded-lg`, `rounded-xl`, `rounded-full`
9. **font-mono** exclusivo para: números de processo, CPF, valores monetários, datas
10. **font-headline** (Manrope) exclusivo para: títulos display de seções hero
