# Zattar OS — Design System MASTER

> **Single Source of Truth** para todas as decisões visuais do Zattar OS.
> Arquitetura alinhada com **DTCG v2025.10** (Design Tokens Community Group, W3C) e **Tailwind CSS v4** (`@theme inline`).
> Última revisão: 2026-04-22 · Versão: **2.0.0**

---

## 0. Índice

1. [Manifesto](#1-manifesto)
2. [Arquitetura de Tokens](#2-arquitetura-de-tokens)
3. [Reference Tokens (Core)](#3-reference-tokens-core)
4. [Semantic Tokens](#4-semantic-tokens)
5. [Component Tokens](#5-component-tokens)
6. [Modes & Themes](#6-modes--themes)
7. [Tipografia](#7-tipografia)
8. [Espaçamento](#8-espaçamento)
9. [Bordas e Raio](#9-bordas-e-raio)
10. [Sombras e Elevação](#10-sombras-e-elevação)
11. [Ícones](#11-ícones)
12. [Sistema Glass](#12-sistema-glass)
13. [Patterns de Página](#13-patterns-de-página)
14. [Animações](#14-animações)
15. [Responsividade](#15-responsividade)
16. [Acessibilidade](#16-acessibilidade)
17. [Badges Semânticos](#17-badges-semânticos)
18. [Theming Runtime](#18-theming-runtime)
19. [Governance](#19-governance)
20. [Métricas de Adoção](#20-métricas-de-adoção)
21. [Workflow de Mudança](#21-workflow-de-mudança)
22. [Anti-Patterns](#22-anti-patterns)
23. [Checklist Pre-Entrega](#23-checklist-pre-entrega)
24. [Mapa de Arquivos](#24-mapa-de-arquivos)

---

## 1. Manifesto

### O que somos

Zattar OS é um sistema de gestão jurídica para escritórios brasileiros. Não é um SaaS genérico, não é um dashboard corporativo frio. É a **mesa de trabalho digital** de um advogado — precisa ser funcional como uma ferramenta de precisão e ter a presença visual de um escritório premium.

### Princípios de Design

| # | Princípio | Significado |
|---|-----------|-------------|
| 1 | **Vidro sobre pedra** | Glass morphism sutil sobre fundação sólida. Transparência para elegância, nunca para confusão |
| 2 | **Dados primeiro, decoração nunca** | Cada pixel serve informação. Sem badges fake, sem teatro corporativo |
| 3 | **Roxo com propósito** | O roxo Zattar (`#5523eb`) aparece apenas onde há intenção — CTAs, foco, estados ativos |
| 4 | **Hierarquia por opacidade** | Não multiplicamos cores; usamos opacidade do mesmo token para criar profundidade |
| 5 | **Mobile-honest** | Responsive real — escondemos o que não cabe, nunca comprimimos até ficar ilegível |
| 6 | **Tipografia é arquitetura** | Montserrat para títulos, Inter para o conteúdo que importa |
| 7 | **Animação é feedback, não espetáculo** | 150-300ms, transform/opacity apenas. Respeitar `prefers-reduced-motion` |
| 8 | **Tokens > classes > hex** | Semantic tokens vencem utility classes vencem valores literais — nunca o inverso |

### Personalidade Visual

- **Tom**: Profissional-premium, nunca corporativo-frio
- **Densidade**: Alta (informação densa com espaçamento preciso)
- **Contraste**: Forte em light mode, sutil em dark mode
- **Estética**: Glass Briefing — vidro fosco com bordas sutis e sombras de ambiente
- **Tint**: Todos os neutros carregam micro-tint roxo (hue 281°, croma 0.005–0.01)

---

## 2. Arquitetura de Tokens

O Zattar OS segue a hierarquia de tokens **DTCG v2025.10**: três camadas de abstração crescente de propósito.

```
┌─────────────────────────────────────────────────────────┐
│  CAMADA 3 — COMPONENT TOKENS                            │
│  ────────────────────────────                           │
│  Aplicação específica a um componente                   │
│  Ex: --widget-radius, --tab-pill-active-bg              │
│  Consome: Semantic Tokens                               │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────┐
│  CAMADA 2 — SEMANTIC TOKENS                             │
│  ───────────────────────────                            │
│  Propósito e intenção (independente de valor)           │
│  Ex: --primary, --destructive, --success                │
│  Consome: Reference Tokens                              │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────┐
│  CAMADA 1 — REFERENCE TOKENS (CORE)                     │
│  ────────────────────────────────                       │
│  Valores brutos OKLCH, imutáveis                        │
│  Ex: oklch(0.48 0.26 281) (Zattar Purple)               │
│  Consome: nada                                          │
└─────────────────────────────────────────────────────────┘
```

### Regras de direção

1. **Component tokens** DEVEM consumir semantic tokens.
2. **Semantic tokens** DEVEM consumir reference tokens.
3. Componentes React DEVEM consumir **semantic ou component tokens**, nunca reference tokens diretos.
4. **Hex literais e valores OKLCH inline são proibidos** em `.tsx/.ts/.css` fora de `globals.css`.

### Pontos de Truth

| Fonte | O que contém | Autoridade |
|---|---|---|
| [`src/app/globals.css`](../src/app/globals.css) — `:root` + `.dark` + `@theme inline` | **202 CSS variables primárias** + ~140 aliases `@theme inline` gerados pelo Tailwind v4 | **CANÔNICA** |
| [`src/lib/design-system/tokens.ts`](../src/lib/design-system/tokens.ts) | Espelho TypeScript read-only com tipo tipado das keys | Espelho |
| [`design-system/MASTER.md`](./MASTER.md) | Esta documentação + governance | Fonte narrativa |
| [`tailwind.config.ts`](../tailwind.config.ts) | Apenas plugins (ex: `tailwindcss-animate`) — **não contém tokens** | Legacy |

> **Tailwind v4**: as cores/fontes são lidas de `@theme inline` em `globals.css`, não de `tailwind.config.ts`. Qualquer token adicionado no `.ts` é ignorado para utility generation.

---

## 3. Reference Tokens (Core)

Todas as cores usam **OKLCH** com hue 281° (Zattar Purple) como âncora tonal. Neutros possuem micro-tint do primary para coesão.

**Fórmula**: `oklch(Lightness Chroma Hue / Alpha)`

### 3.1 Âncoras de Marca

| Token conceitual | Light | Dark | Hex aproximado |
|---|---|---|---|
| Brand Primary | `oklch(0.48 0.26 281)` | `oklch(0.70 0.20 281)` | `#5523eb` / `#9f85ff` |
| Action Orange | `oklch(0.60 0.22 45)` | `oklch(0.70 0.20 45)` | `#e67e40` / `#e88a4a` |
| Hue Tonal | `281°` | `281°` | (roxo Zattar) |

### 3.2 User Palette (18 cores)

Escala cromatic wheel OKLCH para tags, labels de eventos, cores configuráveis pelo usuário. Luminosidade perceptualmente uniforme (`L ≈ 0.65`), croma 0.18 para contraste WCAG AA em superfícies claras. Definidas uma única vez (sem dark override — são pigmentos de usuário).

| Token | Hue | Descrição | Uso |
|---|---|---|---|
| `--palette-1` | 25° | vermelho | `#ED4949` |
| `--palette-2` | 50° | laranja | `#ED7E40` |
| `--palette-3` | 75° | âmbar | `#E5A23A` |
| `--palette-4` | 95° | amarelo | `#DAB52D` |
| `--palette-5` | 130° | lima | `#9FBE3E` |
| `--palette-6` | 145° | verde | `#4FB04F` |
| `--palette-7` | 160° | esmeralda | `#3DAF7A` |
| `--palette-8` | 180° | teal | `#3DAFA6` |
| `--palette-9` | 210° | ciano | `#3DA8C7` |
| `--palette-10` | 230° | azul claro | `#3D90D6` |
| `--palette-11` | 255° | azul | `#3D6BD6` |
| `--palette-12` | 275° | índigo | `#4D55E0` |
| `--palette-13` | 295° | violeta | `#6E48E0` |
| `--palette-14` | 310° | roxo | `#8E48E0` |
| `--palette-15` | 330° | fúcsia | `#C449D6` |
| `--palette-16` | 0° | pink | `#D6498F` |
| `--palette-17` | 15° | rosa | `#DA4566` |
| `--palette-18` | 281° (gray) | cinza neutro | `#6B6B70` |

Fonte: [`globals.css:759-794`](../src/app/globals.css#L759-L794)

---

## 4. Semantic Tokens

### 4.1 Core Palette

| Token | Light | Dark | Propósito |
|---|---|---|---|
| `--background` | `oklch(0.96 0.01 281)` | `oklch(0.17 0.005 281)` | Canvas principal |
| `--foreground` | `oklch(0.15 0.01 281)` | `oklch(0.98 0 0)` | Texto principal |
| `--card` | `oklch(1.0 0 0)` | `oklch(0.22 0.005 281)` | Fundo de cards |
| `--card-foreground` | `oklch(0.15 0.01 281)` | `oklch(0.98 0 0)` | Texto de cards |
| `--popover` | `oklch(1.0 0 0)` | `oklch(0.22 0.005 281)` | Fundo de popovers |
| `--primary` | `oklch(0.48 0.26 281)` | `oklch(0.70 0.20 281)` | CTAs, links, foco, estados ativos |
| `--primary-foreground` | `oklch(1.0 0 0)` | `oklch(0.15 0.10 281)` | Texto sobre primary |
| `--secondary` | `oklch(0.95 0.04 281)` | `oklch(0.28 0.01 281)` | Accent suave, purple wash |
| `--muted` | `oklch(0.92 0.01 281)` | `oklch(0.28 0.005 281)` | Fundos desabilitados |
| `--muted-foreground` | `oklch(0.42 0.01 281)` | `oklch(0.65 0.005 281)` | Texto secundário |
| `--accent` | `oklch(0.95 0.04 281)` | `oklch(0.28 0.01 281)` | Hover states |
| `--border` | `oklch(0.87 0.01 281)` | `oklch(1 0 0 / 0.12)` | Bordas de containers |
| `--input` | `oklch(0.87 0.01 281)` | `oklch(1 0 0 / 0.12)` | Bordas de inputs |
| `--ring` | `transparent` | `transparent` | Anel de foco (desabilitado intencionalmente) |
| `--brand` | `oklch(0.48 0.26 281)` | `oklch(0.70 0.20 281)` | Referência pura da marca |
| `--highlight` | `oklch(0.60 0.22 45)` | `oklch(0.70 0.20 45)` | Badges de ação, alertas que pedem atenção |

### 4.2 Status Semânticos

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--success` | `oklch(0.55 0.18 145)` | `oklch(0.70 0.18 145)` | Concluído, ativo, positivo |
| `--success-foreground` | `oklch(1.0 0 0)` | `oklch(0.98 0 0)` | Texto sobre success |
| `--warning` | `oklch(0.60 0.18 75)` | `oklch(0.78 0.16 85)` | Atenção, pendente, suspense |
| `--warning-foreground` | `oklch(1.0 0 0)` | `oklch(0.15 0 0)` | Texto sobre warning |
| `--info` | `oklch(0.55 0.18 250)` | `oklch(0.70 0.18 250)` | Informacional, terceiros |
| `--info-foreground` | `oklch(1.0 0 0)` | `oklch(0.98 0 0)` | Texto sobre info |
| `--destructive` | `oklch(0.55 0.22 25)` | `oklch(0.65 0.20 25)` | Erro, cancelado, perigoso |
| `--destructive-foreground` | `oklch(1.0 0 0)` | `oklch(1.0 0 0)` | Texto sobre destructive |

**Utility classes** em `@layer utilities`:

- `.text-status-{success|warning|error|info}` — apenas cor de texto
- `.bg-status-{success|warning|error|info}` — background soft (10% opacity) + cor de texto

### 4.3 Sidebar (Premium dark-always)

| Token | Light | Dark |
|---|---|---|
| `--sidebar` | `oklch(0.22 0.01 281)` | `oklch(0.17 0.005 281)` |
| `--sidebar-foreground` | `oklch(0.98 0 0)` | `oklch(0.98 0 0)` |
| `--sidebar-primary` | `oklch(0.70 0.20 281)` | `oklch(0.70 0.20 281)` |
| `--sidebar-primary-foreground` | `oklch(1.0 0 0)` | `oklch(1.0 0 0)` |
| `--sidebar-accent` | `oklch(0.30 0.01 281)` | `oklch(0.26 0.005 281)` |
| `--sidebar-accent-foreground` | `oklch(1 0 0)` | `oklch(0.98 0 0)` |
| `--sidebar-border` | `oklch(1 0 0 / 0.1)` | `oklch(1 0 0 / 0.1)` |
| `--sidebar-ring` | `oklch(0.70 0.20 281)` | `oklch(0.70 0.20 281)` |

### 4.4 Charts

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--chart-1` | `oklch(0.48 0.26 281)` | `oklch(0.70 0.20 281)` | Primário (roxo) |
| `--chart-2` | `oklch(0.60 0.22 45)` | `oklch(0.70 0.20 45)` | Secundário (laranja) |
| `--chart-3` | `oklch(0.92 0.01 281)` | `oklch(0.35 0.005 281)` | Background/referência (cinza) |
| `--chart-4` | `oklch(0.55 0.18 150)` | `oklch(0.65 0.18 150)` | Positivo (verde) |
| `--chart-5` | `oklch(0.70 0.01 281)` | `oklch(0.50 0.005 281)` | Neutro (cinza médio) |
| `--chart-6` | `oklch(0.65 0.15 200)` | `oklch(0.65 0.15 200)` | Ciano |
| `--chart-7` | `oklch(0.60 0.18 320)` | `oklch(0.60 0.18 320)` | Magenta |
| `--chart-8` | `oklch(0.70 0.12 80)` | `oklch(0.70 0.12 80)` | Amarelo |

**Derivados** (light/dark via `oklch(from ...)`):

- `--chart-primary-soft` · `--chart-destructive-soft` · `--chart-warning-soft` · `--chart-success-soft` · `--chart-muted-soft` — alphas 0.35–0.50 para preenchimento de treemaps/funnels
- `--chart-success-dark` · `--chart-warning-dark` — 5% mais escuros para contraste em stacked bars

### 4.5 Material Design 3 (Surface & Tonal)

Escala MD3 completa — neutros tintados com hue 281° e croma 0.005-0.01.

**Surface Hierarchy (9 tokens)**:

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--surface` | `oklch(0.98 0.005 281)` | `oklch(0.12 0.005 281)` | Layer base |
| `--surface-dim` | `oklch(0.90 0.005 281)` | `oklch(0.12 0.005 281)` | Surface atenuada |
| `--surface-bright` | `oklch(1.0 0 0)` | `oklch(0.30 0.005 281)` | Surface ênfase |
| `--surface-container-lowest` | `oklch(1.0 0 0)` | `oklch(0.06 0.005 281)` | Elevação -1 |
| `--surface-container-low` | `oklch(0.97 0.005 281)` | `oklch(0.14 0.005 281)` | Elevação 0 |
| `--surface-container` | `oklch(0.96 0.005 281)` | `oklch(0.17 0.005 281)` | Elevação 1 (padrão) |
| `--surface-container-high` | `oklch(0.94 0.005 281)` | `oklch(0.20 0.005 281)` | Elevação 2 |
| `--surface-container-highest` | `oklch(0.92 0.005 281)` | `oklch(0.24 0.005 281)` | Elevação 3 |
| `--surface-variant` | `oklch(0.93 0.01 281)` | `oklch(0.24 0.01 281)` | Surface alternativa |

Aliases rápidos (utility classes):

- `.bg-surface-1` → `var(--surface-1)`
- `.bg-surface-2` → `var(--surface-2)`
- `.bg-surface-3` → `var(--surface-3)`

**Surface Foreground & Inverse**:

- `--on-surface` / `--on-surface-variant`
- `--inverse-surface` / `--inverse-on-surface`
- `--outline` / `--outline-variant`

**Primary Extended**: `--on-primary`, `--primary-container`, `--on-primary-container`, `--primary-fixed`, `--primary-fixed-dim`, `--on-primary-fixed`, `--on-primary-fixed-variant`

**Secondary Extended**: mesmos 7 slots para secondary

**Tertiary** (vermelho complementar hue 25°): `--tertiary`, `--on-tertiary`, `--tertiary-container`, `--on-tertiary-container`, `--tertiary-fixed`, `--tertiary-fixed-dim`, `--on-tertiary-fixed`, `--on-tertiary-fixed-variant`

**Error Extended**: `--error-container`, `--on-error-container`, `--on-error`

**Dim Variants**: `--primary-dim`, `--secondary-dim`, `--tertiary-dim`, `--error-dim`, `--inverse-primary`, `--surface-tint`

> Total MD3: 38 tokens. Usar quando precisar de hierarquia de elevação rigorosa.

### 4.6 Entidades de Domínio

Cores semânticas por tipo de entidade jurídica, mapeadas a tokens de status:

```css
--entity-cliente:         var(--primary);
--entity-parte-contraria: var(--warning);
--entity-terceiro:        var(--info);
--entity-representante:   var(--success);
```

| Tipo | Text | Background | Exemplo |
|---|---|---|---|
| Cliente | `text-primary/70` | `bg-primary/8` | Cards de cliente |
| Parte Contrária | `text-warning/70` | `bg-warning/8` | Cards de parte contrária |
| Terceiro | `text-info/70` | `bg-info/8` | Peritos, advogados, testemunhas |
| Representante | `text-success/70` | `bg-success/8` | Representantes legais |

### 4.7 Event Colors (Calendário)

Mapeamento `palette → event` para fontes de evento de calendário:

| Token | Aponta para | Semântica |
|---|---|---|
| `--event-audiencia` | `--palette-10` (azul claro) | Formal/oficial |
| `--event-expediente` | `--palette-3` (âmbar) | Atenção/prazo |
| `--event-obrigacao` | `--palette-2` (laranja) | Financeiro |
| `--event-pericia` | `--palette-13` (violeta) | Técnico/expert |
| `--event-agenda` | `--palette-12` (índigo) | Pessoal/neutro |
| `--event-prazo` | `--palette-1` (vermelho) | Urgência |
| `--event-default` | `--palette-11` (azul) | Fallback |

### 4.8 Chat

| Token | Light | Dark |
|---|---|---|
| `--chat-thread-bg` | `oklch(0.97 0.005 281)` | `oklch(0.15 0.005 281)` |
| `--chat-bubble-received` | `oklch(1.0 0 0)` | `oklch(0.26 0.005 281)` |
| `--chat-bubble-sent` | `var(--primary)` | `var(--primary)` |
| `--chat-sidebar-active` | `oklch(0.95 0.04 281)` | `oklch(0.24 0.01 281)` |

Utility classes: `.bg-chat-thread`, `.bg-chat-bubble-received`, `.bg-chat-bubble-sent`, `.bg-chat-sidebar-active`.

### 4.9 Video Call (Always Dark)

Videochamada ignora light/dark mode — sempre escura por demanda de contraste em vídeo.

| Token | Valor |
|---|---|
| `--video-bg` | `oklch(0.145 0.005 281)` |
| `--video-surface` | `oklch(0.21 0.005 281)` |
| `--video-surface-hover` | `oklch(0.278 0.005 281)` |
| `--video-border` | `oklch(0.278 0.005 281)` |
| `--video-muted` | `oklch(0.556 0.01 281)` |
| `--video-text` | `oklch(1.0 0 0)` |
| `--video-skeleton` | `oklch(0.278 0.005 281)` |

### 4.10 Portal do Cliente

Scope dedicado para a rota `(portal)` — totalmente separado da UI admin.

| Token | Descrição |
|---|---|
| `--portal-bg` · `--portal-card` · `--portal-card-hover` · `--portal-surface` | Fundos |
| `--portal-text` · `--portal-text-muted` · `--portal-text-subtle` | Texto (3 níveis) |
| `--portal-primary` · `--portal-primary-soft` | Primary + variant soft |
| `--portal-success` · `--portal-success-soft` | Status |
| `--portal-warning` · `--portal-warning-soft` | Status |
| `--portal-danger` · `--portal-danger-soft` | Status |
| `--portal-info` · `--portal-info-soft` | Status |

> **11 tokens × 2 temas** — evitam acoplamento entre admin e portal.

### 4.11 Efeitos Visuais

**Glow Effects** (usados em hover de CTAs, shadow ambient):

- `--glow-primary` (alpha 0.35/0.25 L/D)
- `--glow-primary-subtle` (alpha 0.04/0.03)
- `--glow-primary-faint` (alpha 0.02/0.015)
- `--glow-destructive` (alpha 0.50/0.35)
- `--glow-warning` (alpha 0.40/0.30)

**Skeleton** (cinza neutro dedicado, chroma 0 — não tintado):

- `--skeleton` · `--skeleton-highlight`

**Gauge Meter**:

- `--gauge-good` → `--success`
- `--gauge-warning` → `--warning`
- `--gauge-danger` → `--destructive`
- `--gauge-neutral` → `--primary`

**Insight Banner**:

- `--insight-alert-bg` → `--destructive`
- `--insight-success-bg` → `--success`
- `--insight-info-bg` → `--primary`
- `--insight-warning-bg` → `--warning`

### 4.12 Hierarquia por Opacidade

Em vez de criar dezenas de cores, modulamos opacidade sobre tokens semânticos. **Usar esta escala, nunca inventar**.

```
Texto principal:     text-foreground
Texto secundário:    text-muted-foreground
Texto terciário:     text-muted-foreground/50
Texto quaternário:   text-muted-foreground/40
Texto fantasma:      text-muted-foreground/55  (mono nums)
Texto mínimo:        text-muted-foreground/60  (subtítulos widgets)

Borda forte:         border-border
Borda média:         border-border/30
Borda sutil:         border-border/20
Borda mínima:        border-border/10
Borda fantasma:      border-border/[0.06]

Fundo primary:       bg-primary/15  (hover forte)
Fundo primary médio: bg-primary/10  (icon backgrounds)
Fundo primary soft:  bg-primary/8   (badges, icon containers)
Fundo primary sutil: bg-primary/6   (tags pill)
Fundo primary tint:  bg-primary/5   (container tags)
Fundo primary leve:  bg-primary/4   (insight banners)
Fundo primary mín:   bg-primary/3   (card selecionado)
```

---

## 5. Component Tokens

Tokens de componente específicos, definidos em `globals.css:691-742`.

### 5.1 Widget System

| Token | Valor | Uso |
|---|---|---|
| `--widget-radius` | `1rem` (16px) | Border radius de widgets |
| `--widget-padding` | `1.25rem` (20px) | Padding interno |
| `--widget-gap` | `1rem` (16px) | Gap entre items |
| `--widget-border-opacity` | `0.06` | Opacidade de bordas |
| `--widget-label-size` | `10px` | Tamanho de labels |
| `--widget-number-weight` | `700` | Peso de números |
| `--widget-transition` | `200ms` | Duração de transição |
| `--widget-hover-scale` | `1.01` | Scale no hover |

### 5.2 Card Entity

| Token | Valor |
|---|---|
| `--card-entity-radius` | `1rem` |
| `--card-entity-padding` | `1rem` |
| `--card-entity-avatar-size` | `2.5rem` (40px) |
| `--card-entity-avatar-radius` | `0.75rem` |

### 5.3 Tab Pills

| Token | Valor |
|---|---|
| `--tab-pill-radius` | `0.75rem` |
| `--tab-pill-padding-x` | `0.75rem` |
| `--tab-pill-padding-y` | `0.375rem` |
| `--tab-pill-active-bg` | `var(--primary)` |

### 5.4 Pulse Strip

| Token | Valor |
|---|---|
| `--pulse-gap` | `1.5rem` |
| `--pulse-padding-x` | `1.25rem` |
| `--pulse-padding-y` | `0.75rem` |

### 5.5 Detail Panel & Search

| Token | Valor |
|---|---|
| `--detail-panel-width` | `380px` |
| `--search-radius` | `0.5rem` |
| `--search-bg` | `rgba(255, 255, 255, 0.04)` |

---

## 6. Modes & Themes

Zattar OS opera em **5 modos visuais independentes**. Cada modo é ativado por seletor CSS e sobrescreve um subset de tokens.

| Modo | Seletor | Escopo | Tokens sobrescritos |
|---|---|---|---|
| **Light** (default) | `:root` | Admin logado | Todos |
| **Dark** | `:root.dark` | Admin + toggle | Todos |
| **Portal** | `:root[data-portal]` + classes `bg-portal-*` | `/portal/*` (cliente) | `--portal-*` (22 tokens) |
| **Website** | `html.website-root-scale.dark` | `/website/*` (marketing) | `--primary`, `--primary-dim`, `--background` + glass overrides |
| **Auth Runway** | `.auth-runway` class scope | `/auth/*` | Spotlight + noise apenas, tokens ficam |
| **Video Call** | `--video-*` tokens isolados | Chamadas ativas | 7 tokens always-dark |

### 6.1 Theme Presets (Runtime)

Usuário pode trocar a cor primária via `body[data-theme-preset]`. 7 presets em `globals.css:2020-2053`:

| Preset | Primary OKLCH | Aproximação |
|---|---|---|
| Default | `oklch(0.48 0.26 281)` | Zattar Purple |
| `blue` | `oklch(0.53 0.24 250)` | Azul |
| `green` | `oklch(0.52 0.19 150)` | Verde |
| `orange` | `oklch(0.65 0.21 45)` | Laranja |
| `red` | `oklch(0.55 0.22 25)` | Vermelho |
| `violet` | `oklch(0.6 0.24 290)` | Violeta |
| `yellow` | `oklch(0.75 0.18 90)` | Amarelo |
| `slate` | `oklch(0.4 0.03 240)` | Cinza-azul |

### 6.2 Radius Presets (Runtime)

`body[data-theme-radius]`:

| Preset | `--radius` |
|---|---|
| `none` | `0rem` |
| `sm` | `0.25rem` |
| `md` | `0.5rem` (default) |
| `lg` | `0.75rem` |
| `xl` | `1rem` |

### 6.3 Scale Presets (Runtime)

`body[data-theme-scale]` ajusta font-size base:

- `sm`: `90%`
- default: `100%`
- `lg`: `110%`

---

## 7. Tipografia

### 7.1 Root Font Size

**IMPORTANTE**: `html { font-size: 18px }` — todos os tamanhos `rem` são inflados.

```
text-xs  (0.75rem)  → 13.5px real
text-sm  (0.875rem) → 15.75px real
text-base (1rem)    → 18px real
text-lg  (1.125rem) → 20.25px real
text-xl  (1.25rem)  → 22.5px real
text-2xl (1.5rem)   → 27px real
```

Tamanhos micro usam `px` fixo para precisão (imunes ao root 18px).

Override: `html.website-root-scale { font-size: 16.2px }` (marketing).

### 7.2 Font Stack

| Variável CSS | Classe Tailwind | Fonte | Uso |
|---|---|---|---|
| `--font-sans` | `font-sans` | **Inter** | Corpo de texto, formulários, tabelas |
| `--font-heading` | `font-heading` | **Montserrat** | Títulos de página, seções, cards |
| `--font-display` | `font-display` | **Montserrat** (alias) | KPIs, métricas grandes |
| `--font-headline` | `font-headline` | **Manrope** | Headlines do Magistrate AI |
| `--font-mono` | `font-mono` | **Geist Mono** | Código, números de processo |
| `--font-label` | (alias) | Inter | Labels, chips, badges |
| `--font-body` | (alias) | Inter | Body de texto longo |

### 7.3 Componentes Tipados (Enforcement)

**Enforcement rígido**: usar `<Heading>` e `<Text>` de `@/components/ui/typography`. Compor classes manualmente é bloqueado por `audit:design-system`.

| Componente | Uso | CSS Class |
|---|---|---|
| `<Heading level="page">` | Título de página | `.text-page-title` |
| `<Heading level="section">` | Seção principal | `.text-section-title` |
| `<Heading level="card">` | Card grande, painel | `.text-card-title` |
| `<Heading level="subsection">` | Subseção, accordion | `.text-subsection-title` |
| `<Heading level="widget">` | Widget header | `.text-widget-title` |
| `<Heading level="marketing-hero">` | Hero website | `.text-marketing-hero` |
| `<Heading level="marketing-section">` | Seção website | `.text-marketing-section` |
| `<Text variant="kpi-value">` | Métricas destaque | `.text-kpi-value` |
| `<Text variant="meta-label">` | Labels uppercase | `.text-meta-label` |
| `<Text variant="widget-sub">` | Subtítulo widget | `.text-widget-sub` |
| `<Text variant="caption">` | Texto auxiliar | `.text-caption` |
| `<Text variant="helper">` | Dicas de campo | `.text-helper` |
| `<Text variant="micro-badge">` | Texto badge | `.text-micro-badge` |
| `<Text variant="overline">` | Label ALL-CAPS | `.text-overline` |
| `<Text variant="label">` | Labels de campo | `.text-label` |
| `<Text variant="micro-caption">` | Timestamps terciários | `.text-micro-caption` |
| `<Text variant="marketing-lead">` | Lead website | `.text-marketing-lead` |

### 7.4 Escala Tipográfica Completa

| Classe CSS | Size | Weight | Family | Uso |
|---|---|---|---|---|
| `.text-display-1` | 36-60px (clamp) | Bold | heading | Hero, landing |
| `.text-display-2` | 30-48px (clamp) | Bold | heading | Hero secundário |
| `.text-page-title` | 24px | Bold | heading | PageShell title |
| `.text-section-title` | 20px | Semibold | heading | Seção principal |
| `.text-card-title` | 18px | Semibold | heading | Card grande |
| `.text-subsection-title` | 16px | Semibold | heading | Subseção, accordion |
| `.text-widget-title` | 14px | Semibold | heading | Widget header |
| `.text-body-lg` | ~20px | Normal | sans | Lead body |
| `.text-body` | ~18px | Normal | sans | Body padrão |
| `.text-body-sm` | ~16px | Normal | sans | Body compacto |
| `.text-label` | 14px | Medium | sans | Labels de campo |
| `.text-caption` | 13px | Normal | sans | Texto auxiliar |
| `.text-helper` | 13px | Normal | sans | Dicas, descrições |
| `.text-widget-sub` | 12px | Normal | sans | Subtítulo de widget |
| `.text-overline` | 11px | Semibold | sans | ALL-CAPS genérico |
| `.text-meta-label` | 11px | Semibold | sans | Metadata uppercase (tracking 0.14em) |
| `.text-kpi-value` | 24px | Bold | heading | KPIs (tabular-nums) |
| `.text-mono-num` | 10px | Normal | mono | Números processo/datas |
| `.text-micro-caption` | 10px | Normal | sans | Timestamps terciários |
| `.text-micro-badge` | 9px | Medium | sans | Texto de badge |

### 7.5 Marketing (Website Público)

Escalas dedicadas — **não usar em admin**:

| Classe | Clamp | Uso |
|---|---|---|
| `.text-marketing-hero` | 36px → 80px | H1 principal (hero landing) |
| `.text-marketing-section` | 26px → 48px | H2 de seção |
| `.text-marketing-title` | 22px → 34px | H3 bloco interno |
| `.text-marketing-lead` | 15px → 19px | Parágrafo lead |
| `.text-marketing-overline` | 13px | Label ALL-CAPS em primary |

### 7.6 Fallback Typography (MDX & Legacy)

Classes de fallback em `@layer components` para contextos que não usam `<Heading>/<Text>`:

`.typography-{h1|h2|h3|h4|p|lead|large|small|muted|blockquote|list|inline-code|table|table-wrapper}`

> **Regra**: Não usar em componentes novos. Apenas MDX renderizado ou compatibilidade retroativa.

### 7.7 Regras Críticas

- **Body text mínimo**: `text-sm` (~15.75px) em desktop, `text-xs` (~13.5px) em mobile
- **Números financeiros**: Sempre `tabular-nums`
- **KPIs**: `font-heading font-bold tabular-nums` (Montserrat)
- **tracking-tight**: Apenas em títulos de página
- **tracking-wider**: Apenas em labels uppercase
- **Headings HTML**: `h1-h6` recebem `font-heading text-foreground` automaticamente via `globals.css`

---

## 8. Espaçamento

### 8.1 Grid Base: 4px

Todo espaçamento é múltiplo de 4px. Usamos a escala do Tailwind.

### 8.2 Layout Semântico

Exportados via `SPACING_SEMANTIC` em `tokens.ts`:

| Contexto | Padding | Gap | Classes |
|---|---|---|---|
| **Página** | `p-4 sm:p-6 lg:p-8` | `gap-6 lg:gap-8` | Container principal |
| **Seção** | `p-4 sm:p-6` | `gap-4 sm:gap-6` | Blocos dentro de página |
| **Card padrão** | `p-4 sm:p-6` | `gap-3 sm:gap-4` | Cards normais |
| **Card compacto** | `p-3 sm:p-4` | `gap-2` | Cards em grids densos |
| **Card minimal** | `p-3` | `gap-1.5` | Kanban cards |
| **GlassPanel** | `p-5` | `gap-3` | Panels glass |
| **PulseStrip** | `px-5 py-3` | `gap-6` | Barra de stats |
| **Formulário** | — | `gap-4` (fields), `gap-6` (seções) | Forms |
| **Tabela** | `px-3 py-2` (cell), `px-3 py-3` (header) | `gap-4` | DataTable |
| **Dialog** | `p-6` | `gap-4`, `gap-2` (footer) | Modais |

### 8.3 Escala de Gap

| Nome | Classe | Pixels | Uso |
|---|---|---|---|
| Tight | `gap-1` | 4px | Icon+text inline |
| Compact | `gap-1.5` | 6px | Dentro de cards pequenos |
| Default | `gap-2` | 8px | Entre elementos inline |
| Loose | `gap-3` | 12px | Entre cards, entre items |
| Section | `gap-4` | 16px | Entre seções |
| Block | `gap-6` | 24px | Entre blocos maiores |
| Page | `gap-8` | 32px | Espaçamento de página |

### 8.4 Container Max-Widths

| Contexto | Classe | Uso |
|---|---|---|
| Página CRM | `max-w-350` (1400px) | Partes, Contratos |
| Dialog padrão | `sm:max-w-md` | Forms simples |
| Dialog largo | `sm:max-w-lg` | Side panels |
| Sheet | `w-full sm:w-96` | Widget picker |
| Detail Panel | `380px` (`--detail-panel-width`) | Panel lateral |

> Utility Tailwind `max-w-350`/`w-350` = 1400px, definido em [`tailwind.config.ts:19-25`](../tailwind.config.ts#L19-L25). Único token Tailwind que não está no CSS.

---

## 9. Bordas e Raio

### 9.1 Border Radius

| Token | Classe | Pixels | Uso |
|---|---|---|---|
| Base | `--radius: 0.5rem` | 8px | Valor runtime (customizável via `data-theme-radius`) |
| 2XL | `rounded-2xl` | 16px | GlassPanel, containers externos |
| XL | `rounded-xl` | 12px | Cards, botões grandes, avatares |
| LG | `rounded-lg` | 8px | Inputs, alert banners |
| MD | `rounded-md` | 6px | Botões pequenos, badges |
| SM | `rounded-sm` | 4px | Elementos mínimos |
| Full | `rounded-full` | 50% | Badges pill, dots |

### 9.2 Hierarquia de Uso

```
Container externo (GlassPanel):  rounded-2xl
Card / button grande:            rounded-xl
Input / card menor:              rounded-lg
Badge / botão pequeno:           rounded-md
Elemento mínimo:                 rounded-sm
Dot / avatar / pill:             rounded-full
```

### 9.3 Patterns de Borda

```
Container padrão:  border border-border/20
Container depth-2: border border-border/30
Divider sutil:     border-t border-border/10
Divider forte:     border-t border-border
Input:             border border-input
Accent left:       border-l-[3px] border-l-{color}
Dashed (filters):  border-dashed
Kanban header:     border-b-2 {stage.color}
```

---

## 10. Sombras e Elevação

### 10.1 Escala Padrão

| Nível | Classe | Uso |
|---|---|---|
| 0 | `shadow-none` | Flat elements |
| 1 | `shadow-sm` | Botões, elevação sutil |
| 2 | `shadow` | Cards padrão |
| 3 | `shadow-md` | Hover states, cards ativos |
| 4 | `shadow-lg` | Drag overlays, modais |
| **PROIBIDO** | ~~`shadow-xl`~~ ~~`shadow-2xl`~~ | **NUNCA** |

### 10.2 Glass Shadows (Customizadas)

```css
/* Light Mode */
glass-kpi:          0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02),
                    inset 0 1px 0 rgba(255,255,255,0.85)
glass-kpi:hover:    0 4px 16px rgba(0,0,0,0.06),
                    inset 0 1px 0 rgba(255,255,255,0.95)
glass-widget:       0 2px 12px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02),
                    inset 0 1px 0 rgba(255,255,255,0.8)
glass-widget:hover: 0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.03),
                    inset 0 1px 0 rgba(255,255,255,0.9)
glass-dialog:       0 24px 48px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08),
                    0 2px 6px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)
glass-dropdown:     0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04),
                    inset 0 1px 0 rgba(255,255,255,1)
ambient:            0 20px 40px rgba(0,0,0,0.08)
```

Utility class: `.shadow-ambient` (light mode only).

### 10.3 Glow Effects

Alphas derivados de tokens de cor para halos decorativos:

```css
.purple-glow-hover:hover { box-shadow: 0 0 30px var(--glow-primary-subtle); }
```

---

## 11. Ícones

### 11.1 Biblioteca: Lucide React

**Única biblioteca de ícones**. Sem emojis como ícones UI. Sem mistura de bibliotecas.

### 11.2 Escala de Tamanho

| Tamanho | Classe | Pixels | Uso |
|---|---|---|---|
| XS | `size-2` | 8px | Dots decorativos |
| SM | `size-2.5` | 10px | Contato em cards |
| MD | `size-3` | 12px | Footer metrics |
| MD+ | `size-3.5` | 14px | Botões, search input |
| Default | `size-4` / `h-4 w-4` | 16px | Headers, actions |
| LG | `h-5 w-5` | 20px | Ícones maiores |
| XL | `h-6 w-6` | 24px | Section headers |
| 2XL | `h-8 w-8` | 32px | Dialog actions, empty states |
| 3XL | `h-10 w-10` | 40px | Empty state principal |

### 11.3 Cores de Ícones

```
Padrão:      text-muted-foreground
Sutil:       text-muted-foreground/50
Muito sutil: text-muted-foreground/40
Fantasma:    text-muted-foreground/55
Primary:     text-primary
Semântico:   text-destructive | text-success | text-warning | text-info
Dinâmico:    style={{ color }}  (por config)
```

### 11.4 Icon Containers

| Tamanho | Classes | Pixels | Uso |
|---|---|---|---|
| LG | `size-10 rounded-xl flex items-center justify-center shrink-0` | 40px | Cards de processo |
| MD | `size-8 rounded-lg flex items-center justify-center shrink-0` | 32px | Listas, rows |
| SM | `size-6 rounded-md flex items-center justify-center shrink-0` | 24px | Inline, badges |
| XS | `size-5 rounded flex items-center justify-center shrink-0` | 20px | Indicators |

**Componente obrigatório**: `<IconContainer size>` de `@/components/ui/icon-container`.

---

## 12. Sistema Glass

### 12.1 Variantes de Glass

| Classe | BG Light | BG Dark | Blur | Uso |
|---|---|---|---|---|
| `glass-kpi` | `rgba(255,255,255,0.70)` | `rgba(255,255,255,0.06)` | 12px | KPI cards, stat cards |
| `glass-widget` | `rgba(255,255,255,0.62)` | `rgba(255,255,255,0.04)` | 16px | Widget containers |
| `glass-card` | `rgba(255,255,255,0.72)` | (light only) | 20px | Cards premium |
| `glass-panel` | `rgba(255,255,255,0.65)` | (light only) | 20px | Panels gerais |
| `glass-dropdown` | `rgba(255,255,255,0.95)` | `rgba(30,30,35,0.95)` | 20px | Dropdowns, menus flutuantes |
| `glass-dialog` | `rgba(255,255,255,0.92)` | `rgba(18,18,22,0.92)` | 24px | Modais elevados |
| `glass-dialog-overlay` | `rgba(0,0,0,0.25)` + blur 4px | `rgba(0,0,0,0.55)` + blur 4px | — | Backdrop de modal |

### 12.2 GlassPanel Depth

Component `<GlassPanel depth>`:

| Depth | Classes internas | Uso |
|---|---|---|
| **1** (default) | `glass-widget bg-transparent border-border/20` | Containers de widget |
| **2** | `glass-kpi bg-transparent border-border/30` | KPI cards, stats |
| **3** | `bg-primary/[0.04] backdrop-blur-xl border-primary/10` | Destaque máximo |

Classe base: `rounded-2xl border transition-all duration-300 flex flex-col`

### 12.3 Regras do Glass

1. Sempre com `border` sutil (`border-border/20` ou `border-border/30`)
2. Sombra inset para "brilho de borda" em light mode
3. **NUNCA** usar `bg-white/10` em light mode (invisível) — mínimo `bg-white/55`
4. Light mode auto-inverte `bg-white/*` e `border-white/*` patterns via regra CSS em `globals.css:646-666`
5. Floating overlays (popovers, dropdowns, tooltips) **removem backdrop-filter** automaticamente via `[data-slot]` rules em `globals.css:675-683`

---

## 13. Patterns de Página

### 13.1 Header de Página

```jsx
<div className="flex items-start justify-between gap-4">
  <Heading level="page">Título</Heading>
  <div className="flex items-center gap-2">{actions}</div>
</div>
```

Subtítulo: `text-sm text-muted-foreground/50 mt-0.5`

### 13.2 Layout de Página

Exportado em `PAGE_LAYOUT` em `tokens.ts`:

```ts
container:      'max-w-350 mx-auto'
sectionGap:     'space-y-5'
pagePadding:    'py-6'
page:           'max-w-350 mx-auto space-y-5 py-6'  // composição completa
cardGrid:       'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
detailLayout:   'grid gap-3 lg:grid-cols-[1fr_380px]'
detailPanel:    'sticky top-4 self-start'
pageHeader:     'flex items-start justify-between gap-4'
toolbar:        'flex flex-col sm:flex-row items-start sm:items-center gap-3'
```

### 13.3 Modos de Visualização

| Modo | Descrição | Componente |
|---|---|---|
| **Grid** | Cards em grid responsivo | `EntityCard` / `ContratoCard` |
| **List** | Rows compactos | `EntityListRow` / `ContratoListRow` |
| **Pipeline/Kanban** | Colunas com drag-drop | `KanbanColumn` + cards |

### 13.4 Estados Padrão

| Estado | Componente |
|---|---|
| Vazio | `<EmptyState icon title description action />` |
| Carregando | `<Skeleton />` ou `.skeleton` utility (shimmer) |
| Erro | `<EmptyState variant="error" />` |

### 13.5 Componentes Shell Obrigatórios

| Uso | Componente | Import |
|---|---|---|
| Layout de página | `<PageShell>` | `@/components/shared/page-shell` |
| Layout de tabela | `<DataShell>` | `@/components/shared/data-shell` |
| Dialog de form | `<DialogFormShell>` | `@/components/shared/dialog-form-shell` |
| Temporal view (calendário) | `<TemporalViewShell>` | `@/components/shared/temporal-view-shell` |
| Detail sheet | `<DetailSheet>` | `@/components/shared/detail-sheet` |
| Form | `<FormShell>` | `@/components/shared/form-shell` |

---

## 14. Animações

### 14.1 Escala de Duração

| Nome | Duração | Uso |
|---|---|---|
| Fast | `150ms` | Hover de botão, toggle |
| Normal | `200ms` | Maioria das interações |
| Slow | `300ms` | Abertura de panels, glass |
| Chart | `500ms` | Barras, progress |
| Long | `700ms` | Funnel bars, gauge |
| Count | `1200ms` | AnimatedNumber |

### 14.2 Propriedades Animáveis

Exportadas em `TRANSITIONS` em `tokens.ts`:

```
transition-all duration-200     (padrão)
transition-colors duration-200  (só cor)
transition-transform duration-200
transition-opacity duration-200
```

### 14.3 Easing

- **Padrão**: `ease-in-out`
- **Progress**: `ease-out`
- **Counting**: `cubic-out` (`1 - Math.pow(1 - progress, 3)`)

### 14.4 Hover Effects

```
Card scale:       hover:scale-[1.01]
Card shadow:      hover:shadow-md
Background:       hover:bg-white/4 (sutil)
Background forte: hover:bg-muted/50
Opacity reveal:   opacity-0 group-hover:opacity-100
Icon scale:       group-hover:scale-110
```

### 14.5 Keyframes Customizados

- `skeleton-shimmer` (1.8s ease-in-out infinite) — shimmer em `.skeleton`
- `auth-breathe` (10s ease-in-out) — spotlight breathing em auth
- `auth-drift` (22s ease-in-out) — warm spotlight drift em auth

### 14.6 Regras

1. **Sempre respeitar `prefers-reduced-motion`** — implementado globalmente em `globals.css:971-981`
2. **Nunca animar `width`, `height`, `top`, `left`** — usar `transform` e `opacity`
3. Drag overlay: `opacity-95 shadow-lg rotate-1`
4. Loading: `animate-pulse` para skeletons ou `.skeleton` (preferido), `animate-spin` para spinners
5. `animate-ping` apenas em indicadores de foco crítico
6. Elementos interativos (button, a, input, select, textarea, `[role="button"]`) recebem `transition-all duration-200 ease-in-out` automaticamente via `globals.css:1010-1017`

---

## 15. Responsividade

### 15.1 Breakpoints

| Prefixo | Largura | Dispositivo |
|---|---|---|
| (default) | < 640px | Mobile |
| `sm:` | ≥ 640px | Mobile landscape |
| `md:` | ≥ 768px | Tablet |
| `lg:` | ≥ 1024px | Desktop |
| `xl:` | ≥ 1280px | Desktop largo |
| `2xl:` | ≥ 1536px | Ultra wide |
| `xs:` (custom) | ≥ 480px | Entre mobile/sm |

### 15.2 Patterns Responsivos

```
Grid de cards:  grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
Grid de KPIs:   grid-cols-1 md:grid-cols-2 lg:grid-cols-4
Grid de stats:  gap-4 md:grid-cols-5
Dashboard:      grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3
Direção:        flex-col sm:flex-row
Padding:        p-4 sm:p-6 lg:p-8
Texto:          text-xs sm:text-sm
Visibilidade:   hidden sm:block / hidden md:block / hidden lg:block
Largura:        w-full sm:w-auto
```

### 15.3 Overflow Prevention

Regras globais em `globals.css:962-969` + `1050-1053`:

- `html, body { overflow-x-hidden; max-width: 100vw }`
- `[style*="width"] { max-width: 100% !important }`
- Flex/grid containers → `min-w-0` para evitar overflow

---

## 16. Acessibilidade

### 16.1 Contraste (WCAG 2.1)

- **Texto normal**: mínimo **4.5:1**
- **Texto grande**: mínimo **3:1**
- **NUNCA** usar `text-muted-foreground/30` ou inferior para texto legível (apenas decorativo)
- Dark mode do primary é `L=0.70` para garantir 6:1 em fundo escuro

### 16.2 Interação

- Touch targets: **mínimo 44×44px**
- Focus visible: `focus-visible:ring-2 focus-visible:ring-ring` (exceto em `*:focus` globais removidos)
- Todos clicáveis: `cursor-pointer`
- `aria-label` em botões icon-only
- `sr-only` para texto acessível escondido
- Tab order deve seguir ordem visual

### 16.3 Motion

- `@media (prefers-reduced-motion: reduce)` implementado globalmente
- Fornece alternativa estática para animações (skeleton fallback, auth spotlights param)

### 16.4 Semântica

- `h1-h6` com `font-heading` automaticamente
- `alt` obrigatório em `<Image>`
- `aria-busy` em estados de loading
- `role` apropriado em componentes customizados

---

## 17. Badges Semânticos

### 17.1 Sistema

**Nunca** hardcodar cores de badge. Usar:

```tsx
import { SemanticBadge } from '@/components/ui/semantic-badge'

<SemanticBadge category="tribunal" value="TRT1" />
<SemanticBadge category="status" value="ATIVO" tone="soft" />
```

### 17.2 Categorias (27)

Mapeadas em [`src/lib/design-system/variants.ts`](../src/lib/design-system/variants.ts):

| Categoria | Exemplos |
|---|---|
| `tribunal` | TRT1, TRT2, TST, STJ, STF, TJ-* |
| `status` | ATIVO, SUSPENSO, ARQUIVADO, CONCLUIDO |
| `grau` | 1o_GRAU, 2o_GRAU, TST, SUPERIOR |
| `parte_tipo` | PERITO, TESTEMUNHA, MINISTERIO, ADVOGADO |
| `polo` | ATIVO, PASSIVO, AUTOR, REU |
| `audiencia_status` | AGENDADA, REALIZADA, CANCELADA |
| `audiencia_modalidade` | PRESENCIAL, VIRTUAL, HIBRIDA |
| `expediente_tipo` | CITACAO, INTIMACAO, NOTIFICACAO |
| `captura_status` | PENDENTE, CAPTURADO, ERRO |
| `comunicacao_cnj` | PENDENTE, ENVIADO, CONFIRMADO |
| `pericia_situacao` | AGUARDANDO, EM_ANDAMENTO, CONCLUIDA |
| `parcela_status` | PENDENTE, PAGO, VENCIDO, CANCELADO |
| `repasse_status` | PENDENTE, PAGO, CANCELADO |

> Lista completa: [`variants.ts`](../src/lib/design-system/variants.ts).

### 17.3 Tones

| Tone | Estilo | Uso |
|---|---|---|
| `soft` (default) | BG claro + texto colorido | Dentro de cards, tabelas |
| `solid` | BG forte + texto branco | Destaque, headers |

---

## 18. Theming Runtime

### 18.1 ActiveThemeProvider

Troca dinâmica de tema via data attributes no `<body>`:

- `data-theme-preset` — cor primária (7 presets)
- `data-theme-radius` — raio (5 presets)
- `data-theme-scale` — scale de fonte (3 presets)
- `data-theme-content-layout` — `centered` (max-w-1280 + centro)
- `class="dark"` — dark mode

### 18.2 Classes especiais

- `.website-root-scale` — escopo de marketing (font-size 16.2px + primary mais saturado)
- `.auth-runway` — escopo de auth (spotlights + noise)
- `.pedrinho-chat-wrapper` — escopo do assistente AI (overrides CopilotKit)

---

## 19. Governance

### 19.1 Modelo

Zattar OS usa modelo **Federated** com core centralizado:

- **Core Team**: mantém `globals.css`, `tokens.ts`, MASTER.md, componentes shared
- **Feature Teams**: consomem tokens, propõem novos via workflow §21
- **Contribuidores**: qualquer dev pode propor token via PR seguindo §21

### 19.2 Roles

| Role | Responsabilidade |
|---|---|
| **Design System Owner** | Mantém MASTER.md, aprova PRs de tokens |
| **Adoption Champion** | 1 por módulo, garante que o módulo usa o sistema |
| **Contributor** | Qualquer dev que consume e propõe |

### 19.3 Cadência

| Evento | Frequência | Duração | Quem |
|---|---|---|---|
| Adoption Check-in | Mensal | 45min | Owner + Champions |
| Governance Retro | Trimestral | 90min | Todos |
| Token PR Review | On-demand | — | Owner + 1 Champion |

### 19.4 Princípios

1. **CSS primeiro**: token só existe quando está em `@theme inline` + `:root`/`.dark` em `globals.css`
2. **Docs simultâneas**: nenhum token é merged sem entrada correspondente em `MASTER.md`
3. **Versionamento semântico**: adições = minor, breaking = major, fixes = patch
4. **Deprecação com prazo**: tokens deprecated têm no mínimo 1 ciclo de aviso antes da remoção

---

## 20. Métricas de Adoção

Métricas inspiradas em **zeroheight Adoption Framework** e **Netguru DS Maturity Matrix**.

### 20.1 KPIs Primários

| Métrica | Definição | Meta Q2/2026 | Fonte |
|---|---|---|---|
| **Component Coverage** | % de arquivos `.tsx` que importam ≥1 typed component (`<Heading>/<Text>/<GlassPanel>/<IconContainer>`) | ≥ 40% | `audit:design-system` |
| **Manual Composition Rate** | Arquivos compondo `font-heading text-2xl` manualmente (anti-pattern) | 0 | grep |
| **Hardcoded Color Rate** | Arquivos com classes `bg-<color>-<n>` ou hex literal | ≤ 3 arquivos | grep |
| **`shadow-xl` Usage** | Arquivos com `shadow-xl` (proibido) | 0 em `(authenticated)/` | grep |
| **Token Documentation Coverage** | % de CSS variables documentadas em MASTER.md | ≥ 95% | `audit:design-system` |
| **Typed Component Adoption** | Contagem absoluta de arquivos com `<Heading>/<Text>/<GlassPanel>/<PageShell>` | ≥ 200 | grep |

### 20.2 KPIs Secundários

| Métrica | Definição | Meta |
|---|---|---|
| **Exception Log Volume** | PRs marcados com `design-system:exception` | ≤ 2/mês |
| **Time-to-Token** | Horas entre proposta de token e merge em `globals.css` | ≤ 48h |
| **Drift Incidents** | Bugs visuais por divergência de tokens em QA | 0 por sprint |
| **Module Adoption Score** | % de módulos com ≥1 `PageShell` + componentes typed | ≥ 90% |

### 20.3 Como medir

Executar localmente:

```bash
npm run audit:design-system            # report completo em JSON + Markdown
npm run audit:design-system -- --fail  # exit 1 se meta não atingida (CI)
```

O relatório é salvo em `design-system/reports/YYYY-MM-DD.md` e `design-system/reports/latest.json`.

### 20.4 Baseline (2026-04-22)

Snapshot oficial pós-framework v2.0.0 (após correção dos 2 bloqueadores + expansão do registry):

| Métrica | Valor | Meta | Status |
|---|---|---|:---:|
| Overall Score | **65/100 (C)** | ≥ 75 (B) | WARN |
| Typography Adoption | 192 | ≥ 200 | WARN (−8) |
| GlassPanel Adoption | 126 | ≥ 115 | ✅ OK |
| IconContainer Adoption | 32 | — | baseline |
| PageShell Adoption | 39 | — | baseline |
| SemanticBadge Adoption | 51 | — | baseline |
| Any typed (file %) | 32% (331/1021) | ≥ 40% | WARN |
| Manual Composition | 0 | 0 | ✅ OK |
| `shadow-xl/2xl` em auth | 0 | 0 | ✅ OK |
| Hardcoded Tailwind colors | 3 | ≤ 3 | ✅ OK |
| Hex em auth | 12 | ≤ 9 | WARN (+3) |
| Token Registry Coverage | **100%** (202/202) | ≥ 99% | ✅ OK |
| Token Documentation Coverage | **95%** | ≥ 95% | ✅ OK |

---

## 21. Workflow de Mudança

### 21.1 Adicionar token novo

```
1. PROPOR       → abrir issue "[DS] Novo token: --xxx" com caso de uso + valor proposto
2. DISCUTIR     → owner + 1 champion revisam em 48h
3. IMPLEMENTAR  → PR contendo:
                  ├─ globals.css: definição em :root + .dark (se aplicável)
                  ├─ globals.css: @theme inline mapping
                  ├─ tokens.ts: entrada no agrupamento correto (se TS-consumed)
                  ├─ MASTER.md: seção apropriada atualizada
                  └─ tests: ao menos 1 uso real em componente
4. REVIEW       → owner aprova MASTER + código
5. MERGE        → automático se audit:design-system passar
```

### 21.2 Modificar token existente

```
1. CHECK        → npm run audit:design-system -- --where=<token-name>
                  (lista todos os usos do token)
2. PROPOSAL     → PR alterando valor com:
                  ├─ screenshots antes/depois
                  ├─ breakdown de impacto (# arquivos afetados)
                  └─ justificativa
3. APROVACAO    → owner + 2 champions (não 1)
4. MERGE        → com label "design-system:breaking" se tour de módulos exigida
```

### 21.3 Deprecar token

```
1. MARK         → adicionar @deprecated em MASTER + comment em globals.css
2. WAIT         → 1 ciclo de sprint mínimo
3. MIGRATE      → owner cria PRs de migração automática (sed/codemod) para consumidores
4. REMOVE       → PR removendo token + audit final
```

### 21.4 Como rodar o audit

```bash
# Relatório completo
npm run audit:design-system

# Só métricas de adoção (rápido)
npm run audit:design-system -- --metrics-only

# Detalhar ofensores de um padrão específico
npm run audit:design-system -- --violations=hardcoded-colors
npm run audit:design-system -- --violations=shadow-xl
npm run audit:design-system -- --violations=manual-composition

# Saída CI (exit code 1 se falhar)
npm run audit:design-system -- --ci

# Onde um token está sendo usado
npm run audit:design-system -- --where=--primary
```

---

## 22. Anti-Patterns

### 22.1 Absolutos (bloqueiam PR)

| Anti-Pattern | Correto |
|---|---|
| Emojis como ícones UI | SVG do Lucide |
| `shadow-xl` / `shadow-2xl` | `shadow-lg` no máximo |
| Hardcoded color (`bg-blue-500`, `text-red-600`) | Tokens semânticos (`bg-primary`, `text-destructive`) |
| Hex literal (`#fff`, `#5523eb`) em componentes | Variável OKLCH ou token |
| `font-heading text-2xl font-bold` manual | `<Heading level="page">` |
| Composição manual de `<Text>` | `<Text variant="...">` |
| `text-gray-400` em light mode | `text-muted-foreground/50` mínimo |
| `bg-white/10` em light mode | `bg-white/55` mínimo |
| Fontes literais (`font-family: 'Inter'`) | CSS variable (`font-sans`) |
| Mistura de bibliotecas de ícones | Apenas Lucide React |
| `<Sheet>` como detail panel | `<Dialog>` com classes `glass-dialog` |
| `z-index` arbitrário (`z-[999]`) | Escala definida (`z-10/20/30/40/50/60/70`) |
| Animar `width`/`height`/`top`/`left` | Usar `transform` + `opacity` |
| Botões icon-only sem `aria-label` | Sempre incluir `aria-label` |

### 22.2 Fortes (review exige justificativa)

| Anti-Pattern | Racional |
|---|---|
| Criar novo `--palette-N` | Os 18 existentes cobrem todos os casos de tag/event |
| Criar `--tertiary` novo | MD3 `--tertiary` (hue 25°) já existe |
| Usar `--tertiary` fora de vermelho complementar | É reservado para erro/destaque complementar |
| Criar nova classe `.glass-*` | 7 variantes já cobrem todos os contextos |
| Criar novo `font-*` | 5 stacks já cobrem todos os usos |

### 22.3 Convenções (não-bloqueantes)

- Preferir `<SemanticBadge>` sobre `<Badge>` com classes manuais
- Preferir `IconContainer` sobre `<div className="size-10 rounded-xl">`
- Preferir `<PageShell>` sobre montar header/content manualmente
- Preferir `SPACING_SEMANTIC.page.padding` sobre `p-4 sm:p-6 lg:p-8`

---

## 23. Checklist Pre-Entrega

### Visual

- [ ] Sem emojis como ícones (apenas Lucide SVG)
- [ ] Todas as cores via tokens (CSS variables), sem hardcoded
- [ ] Hover states não causam layout shift
- [ ] Glass elements visíveis em light mode (opacity ≥ 55%)
- [ ] Badges usando `<SemanticBadge>`, nunca classes de cor

### Interação

- [ ] Todos clicáveis têm `cursor-pointer`
- [ ] Hover states fornecem feedback visual
- [ ] Transições em 150–300ms
- [ ] Focus states visíveis para teclado

### Layout

- [ ] Responsivo em 375px, 768px, 1024px, 1440px
- [ ] Sem scroll horizontal em mobile
- [ ] Conteúdo não escondido atrás de elementos fixos
- [ ] `max-width` consistente

### Dados

- [ ] Números com `tabular-nums`
- [ ] Empty states definidos
- [ ] Loading skeletons definidos (usar `.skeleton` shimmer)

### Acessibilidade

- [ ] Alt text em imagens
- [ ] Labels em form inputs
- [ ] `aria-label` em botões icon-only
- [ ] `prefers-reduced-motion` respeitado
- [ ] Contraste 4.5:1 mínimo em texto

### Tokens

- [ ] Nenhum novo hex literal
- [ ] Nenhuma nova classe de cor Tailwind (`bg-blue-*` etc)
- [ ] Se novo token foi criado: workflow §21 seguido
- [ ] `npm run audit:design-system -- --ci` passa

---

## 24. Mapa de Arquivos

```
design-system/
├── MASTER.md                    ESTE ARQUIVO — Single Source of Truth
├── GOVERNANCE.md                Workflow de mudança + escalação
├── ROADMAP.md                   Plano de adequação + métricas
├── UNIFIED_LAYOUT_PATTERN.md    Patterns específicos de layout
└── reports/
    ├── latest.json              Último relatório do audit
    └── YYYY-MM-DD.md            Snapshots históricos

src/app/globals.css              CANÔNICO — 495 CSS variables + @theme inline
                                  ├─ :root  (light mode + component tokens)
                                  ├─ .dark  (dark mode override)
                                  ├─ @theme inline (Tailwind v4 token registry)
                                  ├─ @layer base (HTML defaults)
                                  ├─ @layer components (typography classes, tabs)
                                  └─ @layer utilities (glass, skeleton, status, chat)

src/lib/design-system/
├── tokens.ts                    TS mirror: SPACING, TYPOGRAPHY, PAGE_LAYOUT,
│                                 GLASS_DEPTH, ICON_CONTAINER, AVATAR_SIZES,
│                                 SHADOWS, RADIUS, TRANSITIONS, Z_INDEX,
│                                 COLOR_TOKENS, PALETTE, EVENT_COLORS,
│                                 PORTAL, SURFACE, MD3
├── variants.ts                  Semantic badge variants (27 categorias)
├── event-colors.ts              Calendar/agenda event colors
├── semantic-tones.ts            Domain tone layer (no color)
├── utils.ts                     Formatters BR (CPF/CNPJ/Date/Currency)
└── index.ts                     Barrel export

src/components/
├── ui/                          104+ componentes shadcn/ui + typed wrappers
│   ├── typography.tsx           <Heading> <Text> (typed enforcement)
│   ├── icon-container.tsx       <IconContainer>
│   ├── semantic-badge.tsx       <SemanticBadge>
│   └── ...
├── shared/                      Shells obrigatórios
│   ├── page-shell.tsx
│   ├── data-shell.tsx
│   ├── dialog-form-shell.tsx
│   ├── glass-panel.tsx
│   └── ...
└── dashboard/                   Primitivos CRM (EntityCard, PulseStrip, TabPills)

tailwind.config.ts               LEGACY v4 — apenas plugins + maxWidth custom
                                 (cores estão em @theme inline do CSS)
```

### Fontes (carregadas em `layout.tsx`)

```
Inter       → --font-inter       → font-sans      (corpo, UI)
Montserrat  → --font-montserrat  → font-heading   (títulos)
Montserrat  → --font-montserrat  → font-display   (KPIs — alias)
Manrope     → --font-manrope     → font-headline  (Magistrate AI)
Geist Mono  → --font-geist-mono  → font-mono      (código, números)
```

---

**Fim do MASTER.md v2.0.0** — Quando em dúvida, leia `globals.css` primeiro (é a fonte canônica), MASTER.md depois (é a fonte narrativa).

Para workflow de mudança, ver [`GOVERNANCE.md`](./GOVERNANCE.md).
Para plano de adequação e KPIs, ver [`ROADMAP.md`](./ROADMAP.md).
