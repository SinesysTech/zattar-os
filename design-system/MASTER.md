# Zattar OS — Design System MASTER

> **Single Source of Truth** para todas as decisões visuais do Zattar OS.
> Arquitetura alinhada com **DTCG v2025.10** (Design Tokens Community Group, W3C) e **Tailwind CSS v4** (`@theme inline`).
> Última revisão: 2026-04-24 · Versão: **3.0.0** · Linguagem visual: **Zattar**
> Base de referência visual: [`DESIGN-stripe (1).md`](../DESIGN-stripe%20(1).md) — fonte de inspiração externa. Os valores foram absorvidos e renomeados para o domínio Zattar; a partir daqui, o MASTER é a autoridade.

> ⚠️ **Breaking change 2.x → 3.0** — o ZattarOS abandonou a linguagem "Glass Briefing" (glassmorphism com blur + transparência) e adotou a **Linguagem Zattar**: superfícies opacas brancas, hierarquia por sombras azuladas multicamada, paleta ancorada em Zattar Purple `#533afd` e Deep Navy `#061b31`. O componente `<GlassPanel>` e as classes `.glass-*` foram preservados como API pública, mas o tratamento visual interno foi inteiramente reescrito. A escala tipográfica agora usa **weight 300 como assinatura** em display sizes, com OpenType `ss01` habilitado em todo texto.

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
12. [Sistema de Elevação (ex-Glass)](#12-sistema-de-elevação-ex-glass)
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

O ZattarOS é um sistema corporativo para firmas legais. Seu design precisa refletir **precisão técnica** e **autoridade financeira** — uma linguagem visual ancorada em confiança institucional e sofisticação tipográfica.

### Cinco princípios não-negociáveis

1. **Leveza como assinatura.** O peso tipográfico padrão em display sizes é **300** (thin). Onde sistemas convencionais gritam em 700 bold, o ZattarOS sussurra em 300. A tipografia só precisa ser autoritativa quando o conteúdo também é.
2. **Profundidade por cor, não por transparência.** A elevação é comunicada por **sombras azul-tintadas multicamada** (`rgba(50,50,93,0.25)`), não por `backdrop-blur`. Cards são **opacos** e brancos, não translúcidos. Isso é a inversão deliberada do antigo "Glass Briefing".
3. **Zattar Purple como âncora interativa.** `#533afd` é o único roxo. É o CTA primário, o link, o estado selecionado, a borda de foco. Ruby `#ea2261` e Magenta `#f96bee` existem **apenas como acentos decorativos** em gradientes hero e ilustrações — nunca em botões ou links.
4. **Raios conservadores (4–8px).** Nada de pill (`rounded-full`) em cards ou botões. Nada de `rounded-2xl` (16px) no default. O raio de trabalho é **4px**, com variações até 8px para elementos hero.
5. **`ss01` em todo texto sans-serif, `tnum` em toda coluna numérica.** A feature OpenType `ss01` modifica glifos (`a`, `g`, `l`) para um desenho mais geométrico. É a "impressão digital" tipográfica do sistema. `tnum` garante alinhamento vertical de números em tabelas financeiras. Os dois modos **nunca se sobrepõem**.

### O que o ZattarOS **não é**

- Não é glassmorphism. Não há `backdrop-filter: blur()` em containers primários.
- Não é minimalista vazio. O whitespace é **mensurado**, não oceânico. Dados densos, chrome generoso.
- Não é Material 3. Apesar de preservarmos tokens `surface-container-*` para interop com shadcn/ui, a hierarquia MD3 é subordinada ao sistema Zattar.
- Não é "corporate light blue". O azul aqui é **navy profundo** (`#061b31`), não clear-sky.

---

## 2. Arquitetura de Tokens

Três camadas, cada uma com um papel discreto:

```
┌─ Reference (Core) ─┐    ┌─ Semantic ──────┐    ┌─ Component ──┐
│ --zattar-purple    │ →  │ --primary       │ →  │ --btn-bg     │
│ --navy-900         │    │ --foreground    │    │ --input-ring │
│ --slate-500        │    │ --muted         │    │ --card-shadow│
└────────────────────┘    └─────────────────┘    └──────────────┘
```

| Camada | Papel | Exemplo | Localização canônica |
|---|---|---|---|
| **Reference** | Valor bruto (hex/OKLCH), nunca referenciado direto por componentes | `--zattar-purple-500: oklch(0.52 0.27 276)` | [src/app/globals.css:233+](src/app/globals.css) (`:root` block) |
| **Semantic** | Papel na UI, referencia Reference | `--primary: var(--zattar-purple-500)` | [src/app/globals.css:233+](src/app/globals.css) (`:root` block) |
| **Component** | Derivação por componente, referencia Semantic | `--btn-primary-bg: var(--primary)` | [src/components/ui/button.tsx](src/components/ui/button.tsx) (inline) |

**Regra**: componentes consomem **apenas semantic tokens** ou utilities Tailwind que resolvem para semantic (`bg-primary`, `text-foreground`). Nunca Reference direto. Nunca hex literal.

### Espelhamento TS

- [src/lib/design-system/tokens.ts](src/lib/design-system/tokens.ts) — exporta `SPACING`, `TYPOGRAPHY`, `OPACITY_SCALE`, `LAYOUT`, `STRIPE_PALETTE`, `ELEVATION` para consumo programático
- [src/lib/design-system/token-registry.ts](src/lib/design-system/token-registry.ts) — lista tipada de todos os tokens existentes (usado pelo audit)
- [tailwind.config.ts](tailwind.config.ts) — apenas plugins e overrides mínimos; Tailwind v4 lê cores do `@theme inline` em `globals.css`

---

## 3. Reference Tokens (Core)

### 3.1 Paleta base Zattar

Todos os valores em hex e OKLCH equivalente (para o `:root` do `globals.css`).

#### Primary Purple

| Token | Hex | OKLCH | Uso |
|---|---|---|---|
| `--zattar-purple-500` | `#533afd` | `oklch(0.52 0.27 276)` | CTA primário, links, estado selecionado |
| `--zattar-purple-600` | `#4434d4` | `oklch(0.45 0.25 276)` | Hover do primário |
| `--zattar-purple-700` | `#2e2b8c` | `oklch(0.30 0.21 276)` | Ícone em hover profundo |
| `--zattar-purple-400` | `#665efd` | `oklch(0.55 0.22 275)` | Highlight de range/input |
| `--zattar-purple-300` | `#b9b9f9` | `oklch(0.78 0.10 276)` | Border ativa, subdued hover |
| `--zattar-purple-200` | `#d6d9fc` | `oklch(0.89 0.04 275)` | Borders suaves secundárias |
| `--zattar-purple-900` | `#362baa` | `oklch(0.33 0.18 275)` | Dashed border, drop zones |

#### Deep Navy & Text

| Token | Hex | OKLCH | Uso |
|---|---|---|---|
| `--navy-heading` | `#061b31` | `oklch(0.21 0.045 253)` | **Todo heading, nav text, strong label**. Substitui `#000000`. |
| `--navy-label` | `#273951` | `oklch(0.32 0.045 253)` | Form labels, subheadings |
| `--navy-body` | `#64748d` | `oklch(0.54 0.03 250)` | Body text, descrições, captions |
| `--navy-975` | `#0d253d` | `oklch(0.25 0.045 253)` | Darkest neutral (quase-black azulado) |

#### Brand Dark

| Token | Hex | OKLCH | Uso |
|---|---|---|---|
| `--brand-dark-900` | `#1c1e54` | `oklch(0.22 0.10 275)` | Seções brand imersivas, footer, **base do dark mode** |

#### Accent Colors (decorativos apenas)

| Token | Hex | OKLCH | Uso |
|---|---|---|---|
| `--accent-ruby` | `#ea2261` | `oklch(0.58 0.25 15)` | Ícones, gradientes decorativos |
| `--accent-magenta` | `#f96bee` | `oklch(0.73 0.25 330)` | Gradientes, decoração hero |
| `--accent-magenta-100` | `#ffd7ef` | `oklch(0.92 0.08 340)` | Surfaces tintadas, badges temáticos |

#### Status

| Token | Hex | OKLCH | Uso |
|---|---|---|---|
| `--success-500` | `#15be53` | `oklch(0.70 0.20 145)` | Badge de sucesso |
| `--success-700` | `#108c3d` | `oklch(0.55 0.18 150)` | Texto em badge de sucesso |
| `--warning-600` | `#9b6829` | `oklch(0.52 0.10 65)` | Destaque lemon (warning/highlight) |

#### Borders & Surface

| Token | Hex | OKLCH | Uso |
|---|---|---|---|
| `--border-default` | `#e5edf5` | `oklch(0.94 0.01 245)` | Borda padrão de cards, dividers |
| `--surface-white` | `#ffffff` | `oklch(1 0 0)` | Background de página, card base |

#### Shadow Colors (literais)

Estas ficam como literais RGBA — OKLCH em box-shadow tem suporte incompleto em browsers 2025.

| Token | Valor | Uso |
|---|---|---|
| `--shadow-zattar-blue` | `rgba(50, 50, 93, 0.25)` | Sombra primária (far shadow) |
| `--shadow-zattar-deep` | `rgba(3, 3, 39, 0.25)` | Sombra profunda (modais) |
| `--shadow-neutral` | `rgba(0, 0, 0, 0.1)` | Sombra secundária (near shadow) |
| `--shadow-ambient` | `rgba(23, 23, 23, 0.08)` | Ambient lift suave |
| `--shadow-soft` | `rgba(23, 23, 23, 0.06)` | Lift mínimo |
| `--shadow-top-sticky` | `rgba(0, 55, 112, 0.08)` | Sticky header shadow |

---

## 4. Semantic Tokens

Camada semântica que componentes consomem. Definida em `:root` de [src/app/globals.css](src/app/globals.css).

### 4.1 Núcleo shadcn (obrigatório)

Dark mode segue a receita literal da "dark brand section" (seção 6.2). Todo semantic que não é explicitamente redefinido no DESIGN MD herda alpha-white sobre `--brand-dark-900`, mantendo coerência com a vocabulary do documento de referência.

| Semantic | Light (`:root`) | Dark (`.dark`) | Usage |
|---|---|---|---|
| `--background` | `--surface-white` (`#ffffff`) | `--brand-dark-900` (`#1c1e54`) | Page background |
| `--foreground` | `--navy-heading` (`#061b31`) | `#ffffff` | Body text |
| `--card` | `--surface-white` | `--brand-dark-900` | Card surface (dark herda bg) |
| `--card-foreground` | `--navy-heading` | `#ffffff` | Card text |
| `--popover` | `--surface-white` | `--brand-dark-900` | Popover surface |
| `--popover-foreground` | `--navy-heading` | `#ffffff` | Popover text |
| `--primary` | `--zattar-purple-500` (`#533afd`) | `--zattar-purple-500` | CTA, link, selected — **não muda no dark** |
| `--primary-foreground` | `#ffffff` | `#ffffff` | Text on primary |
| `--secondary` | `oklch(0.96 0.005 250)` | `rgba(255,255,255,0.06)` | Secondary button bg |
| `--secondary-foreground` | `--navy-heading` | `#ffffff` | Text on secondary |
| `--muted` | `oklch(0.97 0.005 245)` | `rgba(255,255,255,0.04)` | Muted bg |
| `--muted-foreground` | `--navy-body` (`#64748d`) | `rgba(255,255,255,0.7)` | Muted text |
| `--accent` | `oklch(0.96 0.005 250)` | `rgba(255,255,255,0.08)` | Hover/focus bg |
| `--accent-foreground` | `--zattar-purple-500` | `--zattar-purple-500` | Accent text |
| `--destructive` | `--accent-ruby` (`#ea2261`) | `--accent-ruby` | Destructive action |
| `--destructive-foreground` | `#ffffff` | `#ffffff` | Text on destructive |
| `--border` | `--border-default` (`#e5edf5`) | `rgba(255,255,255,0.1)` | Default border (literal do MD) |
| `--input` | `--border-default` | `rgba(255,255,255,0.1)` | Input border |
| `--ring` | `--zattar-purple-500` | `--zattar-purple-500` | Focus ring |

### 4.2 Status

| Semantic | Light | Dark | Usage |
|---|---|---|---|
| `--success` | `--success-500` (`#15be53`) | `--success-500` | Success states |
| `--success-foreground` | `--success-700` (`#108c3d`) | `#ffffff` | Success text |
| `--warning` | `--warning-600` (`#9b6829`) | `--warning-600` | Warning states |
| `--warning-foreground` | `#ffffff` | `#ffffff` | Warning text |
| `--info` | `--zattar-purple-500` | `--zattar-purple-500` | Info states (reusa primary) |
| `--info-foreground` | `#ffffff` | `#ffffff` | Info text |

### 4.3 Brand (legacy compat)

| Semantic | Light | Dark | Usage |
|---|---|---|---|
| `--brand` | `--zattar-purple-500` | `--zattar-purple-500` | Alias de `--primary` |
| `--highlight` | `--accent-ruby` | `--accent-ruby` | **Descontinuado como UI** — só decoração. Badges/elementos que usavam `--highlight` migram para `--primary` ou `--warning`. |

### 4.4 Surface (hierarquia Zattar)

Sem blur. Sem transparência. Cada surface é opaca, diferenciada por sombra.

| Semantic | Light | Dark | Usage |
|---|---|---|---|
| `--surface-1` | `--surface-white` | `oklch(0.25 0.06 275)` | Base surface (flat) |
| `--surface-2` | `--surface-white` | `oklch(0.28 0.07 275)` | Elevated surface |
| `--surface-3` | `--surface-white` | `oklch(0.32 0.08 275)` | Peak surface |

### 4.5 Module namespaces (preservados)

Portal, chat, video, events — redefinidos com paleta Zattar. Ver seção 5.

---

## 5. Component Tokens

### 5.1 Botões

```css
/* Primary */
--btn-primary-bg: var(--zattar-purple-500);
--btn-primary-bg-hover: var(--zattar-purple-600);
--btn-primary-fg: var(--surface-white);
--btn-primary-radius: 4px;
--btn-primary-padding: 8px 16px;
--btn-primary-font-size: 16px;
--btn-primary-font-weight: 400;

/* Ghost */
--btn-ghost-bg: transparent;
--btn-ghost-bg-hover: color-mix(in oklab, var(--zattar-purple-500) 5%, transparent);
--btn-ghost-fg: var(--zattar-purple-500);
--btn-ghost-border: 1px solid var(--zattar-purple-300);
```

### 5.2 Cards

```css
--card-bg: var(--surface-white);
--card-border: 1px solid var(--border-default);
--card-radius: 6px;
--card-shadow-standard: var(--shadow-zattar-blue) 0 30px 45px -30px,
                       var(--shadow-neutral)     0 18px 36px -18px;
--card-shadow-ambient: var(--shadow-ambient) 0 15px 35px 0;
```

### 5.3 Inputs

```css
--input-bg: var(--surface-white);
--input-border: 1px solid var(--border-default);
--input-radius: 4px;
--input-focus-ring: 1px solid var(--zattar-purple-500);
--input-label-color: var(--navy-label);
--input-text-color: var(--navy-heading);
--input-placeholder: var(--navy-body);
```

### 5.4 Badges

```css
/* Neutral pill */
--badge-neutral-bg: var(--surface-white);
--badge-neutral-fg: oklch(0 0 0);
--badge-neutral-border: 1px solid oklch(0.98 0 245);
--badge-radius: 4px;

/* Success */
--badge-success-bg: color-mix(in oklab, var(--success-500) 20%, transparent);
--badge-success-fg: var(--success-700);
--badge-success-border: 1px solid color-mix(in oklab, var(--success-500) 40%, transparent);
```

### 5.5 Portal do Cliente

O Portal é seção brand imersiva — usa `--brand-dark-900` como base em ambos os modos.

```css
--portal-bg: var(--brand-dark-900);
--portal-card: color-mix(in oklab, var(--surface-white) 10%, var(--brand-dark-900));
--portal-text: var(--surface-white);
--portal-text-muted: oklch(1 0 0 / 0.70);
```

---

## 6. Modes & Themes

### 6.1 Light Mode (default)

Canvas branco puro, headings em deep navy, superfícies opacas com sombras azul-tintadas. Segue o guia visual Zattar 1:1.

### 6.2 Dark Mode

O ZattarOS **mantém** dark mode, aplicando a receita de "dark brand section" descrita no design MD de referência como padrão de toda a superfície dark. Valores **literais** (sem interpolação inventada):

| Token | Valor | Origem no DESIGN MD |
|---|---|---|
| `--background` (dark) | `#1c1e54` | Brand Dark — "dark brand section" |
| `--foreground` (dark) | `#ffffff` | "white text" em dark section |
| `--muted-foreground` (dark) | `rgba(255,255,255,0.7)` | "Body 16px weight 300, rgba(255,255,255,0.7)" |
| `--card` (dark) | `#1c1e54` | Mesma base (cards dentro de dark section herdam a cor) |
| `--card-foreground` (dark) | `#ffffff` | — |
| `--border` (dark) | `rgba(255,255,255,0.1)` | "Cards inside use rgba(255,255,255,0.1) border" |
| `--input` (dark) | `rgba(255,255,255,0.1)` | Mesma regra de border em dark |
| `--primary` (dark) | `#533afd` | Zattar Purple mantém — o roxo não muda de hue |
| `--primary-foreground` (dark) | `#ffffff` | — |
| `--ring` (dark) | `#533afd` | Focus ring mantém o roxo |

**Princípio**: dark mode é a "dark brand section" expandida para a página inteira. Sem cálculos de luminância inventados; os valores são os do design MD de referência, aplicados uniformemente.

### 6.3 Application

Toggle via classe `.dark` no `<html>` (via `next-themes`). Nenhum componente faz detecção manual — só consome semantic tokens.

---

## 7. Tipografia

### 7.1 Famílias

| Função | Família | Fallback | Licença |
|---|---|---|---|
| Sans (display, body, UI) | **Switzer** | `Inter, -apple-system, BlinkMacSystemFont, sans-serif` | Fontshare (grátis) |
| Mono (código, tabular) | **Source Code Pro** | `ui-monospace, SFMono-Regular, monospace` | Google Fonts (grátis) |

> **Por quê Switzer**: fonte geométrica variable, suporta peso 300, suporta OpenType `ss01`/`ss02` que reproduzem o "DNA geométrico" do sohne-var da Stripe sem o custo de licenciamento. Já carregada via `next/font/local` ou Fontshare CDN.

### 7.2 OpenType Features

Aplicadas globalmente via CSS no `:root`:

```css
:root {
  font-feature-settings: "ss01" on, "ss02" on, "cv11" on;
}

/* Em colunas numéricas (tables, charts, KPIs): */
.tabular-nums,
[data-tabular] {
  font-feature-settings: "tnum" on;
}
```

- `ss01` / `ss02` / `cv11`: alternates geométricas (single-storey `a`, reta `l`, `g` de dois andares)
- `tnum`: numerais tabulares para alinhamento vertical em dados financeiros
- `ss01` e `tnum` **nunca se sobrepõem** (um número em parágrafo usa ss01, um número em tabela usa tnum)

### 7.3 Escala Hierárquica

| Variant (Heading/Text) | Role | Size | Weight | Line-height | Letter-spacing | Feature |
|---|---|---|---|---|---|---|
| `Heading display-hero` | Hero máximo | 56px (3.50rem) | 300 | 1.03 | -1.4px | ss01 |
| `Heading display` | Hero secundário | 48px (3.00rem) | 300 | 1.15 | -0.96px | ss01 |
| `Heading page` | Título de página | 32px (2.00rem) | 300 | 1.10 | -0.64px | ss01 |
| `Heading section` | Seção de feature | 26px (1.63rem) | 300 | 1.12 | -0.26px | ss01 |
| `Heading card` | Card title, subseção | 22px (1.38rem) | 300 | 1.10 | -0.22px | ss01 |
| `Heading widget` | Widget title | 18px (1.13rem) | 400 | 1.30 | normal | ss01 |
| `Heading kpi-value` | Valor de KPI | 32px (2.00rem) | 300 | 1.10 | -0.64px | tnum |
| `Text body-large` | Intro text | 18px (1.13rem) | 300 | 1.40 | normal | ss01 |
| `Text body` | Body padrão | 16px (1.00rem) | 300 | 1.40 | normal | ss01 |
| `Text label` | Form label | 14px (0.88rem) | 400 | 1.20 | normal | ss01 |
| `Text button` | Botão grande | 16px (1.00rem) | 400 | 1.00 | normal | ss01 |
| `Text button-sm` | Botão compacto | 14px (0.88rem) | 400 | 1.00 | normal | ss01 |
| `Text link` | Link | 14px (0.88rem) | 400 | 1.00 | normal | ss01 |
| `Text caption` | Metadata | 13px (0.81rem) | 400 | 1.30 | normal | ss01 |
| `Text caption-sm` | Timestamps | 12px (0.75rem) | 400 | 1.33 | normal | ss01 |
| `Text caption-tabular` | Dados financeiros | 12px (0.75rem) | 400 | 1.33 | -0.36px | tnum |
| `Text micro` | Axis labels | 10px (0.63rem) | 300 | 1.15 | 0.1px | ss01 |
| `Text micro-tabular` | Chart data numérico | 10px (0.63rem) | 300 | 1.15 | -0.3px | tnum |
| `Text code` | Código inline | 12px (0.75rem) | 500 | 2.00 | normal | — |
| `Text code-label` | Label técnico | 12px (0.75rem) | 500 uppercase | 2.00 | normal | — |

### 7.4 Princípios

- **Light weight is the signature** — 300 em display, sempre. Sem 600/700 em sans.
- **Progressive tracking** — letter-spacing tightens com size: -1.4 (56px) → -0.64 (32px) → -0.22 (22px) → normal (16px-)
- **Two-weight simplicity** — 300 (heading/body) e 400 (UI/buttons/links). Source Code Pro usa 500/700.
- **Heading color** — sempre `--navy-heading` (#061b31), nunca `#000`.

---

## 8. Espaçamento

### 8.1 Grid base: 8px

Escala densa no small-end (otimizada para dados financeiros):

```
1, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 40, 48, 64, 80, 96
```

### 8.2 Tokens

Exportados em [src/lib/design-system/tokens.ts](src/lib/design-system/tokens.ts) como `SPACING`:

```ts
export const SPACING = {
  '0': '0',
  '0.25': '1px',
  '0.5': '2px',
  '1': '4px',
  '1.5': '6px',
  '2': '8px',
  '2.5': '10px',
  '3': '12px',
  '3.5': '14px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '8': '32px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
} as const;
```

### 8.3 Semantic spacing

```ts
export const SEMANTIC_SPACING = {
  cardPadding: SPACING['4'],        // 16px
  cardPaddingLg: SPACING['6'],      // 24px
  sectionGap: SPACING['12'],        // 48px
  sectionGapLg: SPACING['16'],      // 64px
  gridGap: SPACING['3'],            // 12px
  gridGapLg: SPACING['4'],          // 16px
  inputPadding: `${SPACING['2']} ${SPACING['3']}`, // 8px 12px
  buttonPadding: `${SPACING['2']} ${SPACING['4']}`, // 8px 16px
  badgePadding: `0 ${SPACING['1.5']}`, // 0 6px
};
```

### 8.4 Página

```ts
export const PAGE_LAYOUT = {
  maxWidth: '1080px',    // Container principal Zattar
  gutter: SPACING['6'],  // 24px
  heroGap: SPACING['16'], // 64px entre hero e feature
};
```

---

## 9. Bordas e Raio

### 9.1 Escala conservadora

| Token | Value | Uso |
|---|---|---|
| `--radius-none` | 0 | Elementos full-bleed |
| `--radius-xs` | 1px | Fine-grained (divisores com arredondamento sutil) |
| `--radius-sm` | 4px | **Default** — botões, inputs, badges, cards padrão |
| `--radius-md` | 5px | Cards standard |
| `--radius-lg` | 6px | Nav container, cards comfortable, dropdowns |
| `--radius-xl` | 8px | Cards featured, hero elements |
| `--radius-2xl` | 12px | **Reservado** — apenas hero/decorative, nunca default |

O token base `--radius` resolve para **`--radius-sm` (4px)**.

### 9.2 Espessura de borda

- Default: `1px solid var(--border)` (cor: `--border-default`)
- Ativo/selecionado: `1px solid var(--zattar-purple-300)`
- Foco: `1px solid var(--zattar-purple-500)` + ring outline
- Destrutivo: `1px solid var(--destructive)`
- Dashed (drop zone, placeholder): `1px dashed var(--zattar-purple-900)`

### 9.3 Proibições

- ❌ `rounded-full` em cards, containers, inputs
- ❌ `rounded-2xl` ou maior como default de card
- ❌ Borda de 2px+ em elementos UI padrão

---

## 10. Sombras e Elevação

### 10.1 Filosofia

A sombra é **brand-colored**. Usa o mesmo azul-navy do sistema cromático, não cinza neutro. A sombra far (mais distante) carrega a cor; a sombra near (mais próxima) é neutra escura.

Fórmula Zattar:

```
shadow:
  rgba(50, 50, 93, 0.25) 0px Y1 B1 -S1,  /* blue-tinted far */
  rgba(0, 0, 0, 0.1)     0px Y2 B2 -S2;  /* neutral near */
```

Onde `Y1/B1 > Y2/B2` (far shadow sempre maior que near).

### 10.2 Escala de elevação

| Level | Token | Valor | Uso |
|---|---|---|---|
| 0 — Flat | `--elevation-flat` | `none` | Page background, texto inline |
| 1 — Ambient | `--elevation-ambient` | `rgba(23,23,23,0.06) 0 3px 6px` | Lift sutil, hover hint |
| 2 — Standard | `--elevation-standard` | `rgba(23,23,23,0.08) 0 15px 35px` | Cards standard, painéis |
| 3 — Elevated | `--elevation-elevated` | `rgba(50,50,93,0.25) 0 30px 45px -30px, rgba(0,0,0,0.1) 0 18px 36px -18px` | Cards featured, dropdowns, popovers |
| 4 — Deep | `--elevation-deep` | `rgba(3,3,39,0.25) 0 14px 21px -14px, rgba(0,0,0,0.1) 0 8px 17px -8px` | Modais, floating panels |
| Ring | `--elevation-ring` | `0 0 0 2px var(--zattar-purple-500)` | Foco de teclado |

### 10.3 Regras

- Sombras **nunca** são cinza neutro. Sempre tintadas.
- Hover em cards intensifica a sombra (geralmente passando de Level 2 para Level 3).
- Sticky headers usam sombra superior (`rgba(0,55,112,0.08)` top-edge).
- Dark mode reduz opacidades (0.25 → 0.15) mas mantém a fórmula.

---

## 11. Ícones

### 11.1 Biblioteca

- **lucide-react** como única biblioteca de ícones.
- Stroke-width padrão: **1.5** (não 2). Combina com o peso 300 da tipografia.

### 11.2 Sizing

| Contexto | Tamanho | Classe |
|---|---|---|
| Inline com texto body | 16px | `size-4` |
| UI em botão | 14px | `size-3.5` |
| Navigation | 18px | `size-4.5` |
| Feature card | 20–24px | `size-5` / `size-6` |
| Hero/illustrative | 32px+ | `size-8+` |

### 11.3 Cor

- Default: `text-muted-foreground` (navy-body)
- Ativo: `text-primary` (zattar-purple)
- Em botão primário: `text-primary-foreground` (branco)
- Decorativo (accent): `text-[var(--accent-ruby)]` ou magenta

---

## 12. Sistema de Elevação (ex-Glass)

> ⚠️ **Renomeação semântica 2.x → 3.0** — o antigo "Sistema Glass" foi aposentado. O componente `<GlassPanel>` e as classes `.glass-*` **persistem como API pública** para compatibilidade, mas implementam agora o **Sistema de Elevação Zattar** (sombras tintadas, superfícies opacas).

### 12.1 `<GlassPanel depth={1|2|3}>`

Mantém a mesma API, novo comportamento visual:

| Depth | Antes (glass) | Agora (Zattar) | Uso |
|---|---|---|---|
| 1 | backdrop-blur 20px, bg transparent | bg-card, border default, elevation ambient | Containers grandes, widgets |
| 2 | bg mais opaco, kpi treatment | bg-card, border default, elevation standard | KPIs, métricas |
| 3 | primary tint, backdrop-blur xl | bg-card, border primary/20, elevation elevated | Destaque máximo |

### 12.2 Classes utilitárias

- `.glass-widget` → agora aplica `elevation-standard` + border default + bg-card
- `.glass-kpi` → agora aplica `elevation-standard` + border default + bg-card (visualmente idêntico a widget; diferenciação por padding/tipografia)
- `.glass-dropdown` → elevation-elevated + bg-popover + border
- `.glass-dialog` + `.glass-dialog-overlay` → elevation-deep + overlay escuro `rgba(6,27,49,0.50)`

**Sem** `backdrop-filter`, **sem** `backdrop-blur`, **sem** `bg-*/0.04` em nenhuma dessas classes.

---

## 13. Patterns de Página

### 13.1 Estrutura básica

```tsx
<PageShell title="..." actions={...}>
  <section className="max-w-270 mx-auto">
    {/* Grid de cards */}
  </section>
</PageShell>
```

### 13.2 Hero (quando aplicável)

- Background: `bg-background` (branco)
- Headline: `<Heading level="display">` com weight 300, letter-spacing -0.96
- Subtitle: `<Text variant="body-large">` com color muted-foreground
- CTAs: `<Button>` primary + `<Button variant="ghost">` lado-a-lado
- Max-width: 1080px

### 13.3 Dark brand sections

Para seções imersivas (portal do cliente, dashboard hero):

```tsx
<section className="bg-(--brand-dark-900) text-white">
  {/* heading branco, body com alpha 0.70 */}
</section>
```

### 13.4 Section rhythm

Alternância light ↔ dark-brand previne monotonia sem introduzir cor arbitrária. Use com parcimônia — 1 a 2 seções dark por página.

### 13.5 Grid de features

- 3 colunas em desktop
- 2 colunas em tablet
- 1 coluna em mobile
- Gap: 16px (grid-gap token)

---

## 14. Animações

### 14.1 Filosofia

O sistema Zattar é **restrained**. Nada de spring bouncy, nada de gradient-sweep. Animações são **sutis e funcionais**:

- Duração padrão: **200ms**
- Easing padrão: `cubic-bezier(0.4, 0, 0.2, 1)` (standard ease)
- Hover em card: shadow intensifica de Level 2 → 3, 200ms
- Focus ring: aparece instantâneo, sem fade
- Accordion/collapse: 250ms standard ease

### 14.2 Tokens

```ts
export const MOTION = {
  duration: {
    instant: '0ms',
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  },
};
```

### 14.3 Respeito a `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 15. Responsividade

### 15.1 Breakpoints

| Nome | Width | Tailwind |
|---|---|---|
| xs | < 480px | — |
| sm | 640px | `sm:` |
| md | 768px | `md:` |
| lg | 1024px | `lg:` |
| xl | 1280px | `xl:` |
| 2xl | 1536px | `2xl:` |

### 15.2 Collapsing strategy

- Hero: 56px → 48px → 32px (mobile)
- Grid: 3 cols → 2 cols → 1 col
- Section spacing: 64px → 40px em mobile
- Nav horizontal → hamburger em < md
- Tabelas: scroll horizontal em mobile

### 15.3 Touch targets

- Botões: mínimo 44×44px de área touch
- Links nav: padding suficiente (8px+ vertical)

---

## 16. Acessibilidade

### 16.1 Contraste mínimo

- Texto body sobre background: **4.5:1** (WCAG AA)
- Texto grande (18pt+ ou 14pt bold): **3:1**
- Elementos UI (borders, ícones): **3:1**

### 16.2 Focus ring

- Sempre visível em navegação por teclado
- `outline: 2px solid var(--zattar-purple-500)`
- `outline-offset: 2px`
- Nunca `outline: none` sem substituto equivalente

### 16.3 Navegação por teclado

- Todos os elementos interativos tabuláveis
- Ordem de tab lógica (DOM order = visual order)
- Skip link obrigatório em páginas principais (`<SkipLink>`)

### 16.4 ARIA

- Ícones decorativos: `aria-hidden="true"`
- Ícones funcionais (botão-ícone): `aria-label`
- Landmarks: `<main>`, `<nav>`, `<aside>`, `<header>`, `<footer>`

---

## 17. Badges Semânticos

### 17.1 Variants

| Variant | Bg | Fg | Border | Uso |
|---|---|---|---|---|
| `neutral` | `--surface-white` | `oklch(0 0 0)` | `1px solid oklch(0.98 0 245)` | Metadata, counters |
| `success` | `rgba(21,190,83,0.2)` | `--success-700` | `1px solid rgba(21,190,83,0.4)` | Active, paid, confirmed |
| `warning` | `color-mix(in oklab, var(--warning-600) 20%, transparent)` | `var(--warning-600)` | `1px solid color-mix(...40%)` | Pending, attention |
| `destructive` | `color-mix(in oklab, var(--destructive) 20%, transparent)` | `var(--destructive)` | `1px solid ...40%` | Error, cancelled |
| `info` | `color-mix(in oklab, var(--zattar-purple-500) 10%, transparent)` | `var(--zattar-purple-500)` | `1px solid ...30%` | Info, processing |

### 17.2 Estrutura

- Padding: `1px 6px` (neutral) ou `2px 8px` (status)
- Radius: 4px
- Font: 10px weight 300 (status) ou 11px weight 400 (neutral)
- Uppercase opcional para labels técnicos

### 17.3 Componente canônico

Usar `<Badge variant="...">` de [src/components/ui/badge.tsx](src/components/ui/badge.tsx) ou `<SemanticBadge>` de [src/components/ui/semantic-badge.tsx](src/components/ui/semantic-badge.tsx).

---

## 18. Theming Runtime

### 18.1 Toggle

`next-themes` aplica/remove a classe `.dark` no `<html>`. Todas as CSS variables têm override em `.dark { ... }` no `globals.css`.

### 18.2 Inicialização

Para evitar flash de tema errado, o `<ThemeProvider>` em [src/components/ui/theme-provider.tsx](src/components/ui/theme-provider.tsx) usa `defaultTheme="system"` + `enableSystem`.

### 18.3 Override por componente

Proibido. Nenhum componente deve detectar `theme === 'dark'` e renderizar condicionalmente. Todos devem consumir semantic tokens e deixar o CSS resolver.

---

## 19. Governance

### 19.1 Roles

| Role | Responsabilidade |
|---|---|
| **Design System Owner** | Mantém `globals.css`, `tokens.ts`, MASTER.md, aprova PRs estruturais |
| **Module Developer** | Consome semantic tokens; nunca edita Reference direto |
| **Reviewer** | Valida compliance em PRs |

### 19.2 Invariantes

1. **Nenhum hex literal fora de `globals.css` Reference tokens.**
2. **Nenhum import direto de hex do design MD de referência — sempre via semantic.**
3. **Docs simultâneas**: nenhum token merged sem entrada em `MASTER.md` + `token-registry.ts`.
4. **Versionamento**: 3.0 = breaking (esta migração), 3.x = additions, 3.x.y = fixes.

Ver [design-system/GOVERNANCE.md](design-system/GOVERNANCE.md) para o fluxo completo.

---

## 20. Métricas de Adoção

Geradas por `npm run audit:design-system`:

| KPI | Meta | Status |
|---|---|---|
| Hex literals fora de Reference | 0 | Gate CI |
| Tailwind color hardcodes (bg-blue-500 etc) | 0 | Gate CI |
| Tokens sem documentação em MASTER.md | 0 | Warning |
| `<GlassPanel>` sem depth explícito | 0 | Warning |
| Cards com `rounded-2xl+` | 0 | Gate CI |
| Fontes fora de Switzer/Source Code Pro | 0 | Gate CI |

Snapshot diário em [design-system/reports/latest.json](design-system/reports/latest.json).

---

## 21. Workflow de Mudança

1. Proposta em issue: motivação, before/after, impacto em audit.
2. PR toca `globals.css` + `tokens.ts` + `token-registry.ts` + `MASTER.md` **no mesmo commit**.
3. Audit passa local (`npm run audit:design-system:ci`).
4. Review pelo DS Owner.
5. Merge → rebuild + snapshot de métricas.

Deprecation: manter token antigo com `@deprecated` por 1 sprint, notificar em CHANGELOG, então remover.

---

## 22. Anti-Patterns

### ❌ Nunca

```tsx
// Hex literal
<div style={{ background: '#533afd' }}>   // → bg-primary

// Tailwind color hardcode
<div className="bg-blue-500">             // → bg-primary

// Weight 600/700 em sans display
<Heading className="font-bold">           // → weight 300 já é default

// Border radius pill em card
<Card className="rounded-full">           // → rounded-sm (4px)

// backdrop-blur em surface primária
<div className="backdrop-blur-xl">        // → elevation tokens

// Black puro em heading
<h1 className="text-black">               // → text-foreground (navy)

// Orange/yellow em interactive
<Button className="bg-orange-500">        // → bg-primary (purple)
```

### ✅ Sempre

```tsx
// Semantic token
<div className="bg-primary">

// Typography component
<Heading level="page">Audiências</Heading>
<Text variant="body">descrição...</Text>

// Tabular em número
<Text variant="caption-tabular">R$ 1.234,56</Text>

// GlassPanel com depth
<GlassPanel depth={2}>...</GlassPanel>

// Ring de foco semântico
<button className="focus-visible:ring-2 focus-visible:ring-primary">
```

---

## 23. Checklist Pre-Entrega

Antes de dar merge em qualquer mudança visual:

- [ ] Nenhum hex literal fora de `globals.css :root`
- [ ] Nenhuma Tailwind color utility (`bg-blue-*`, `text-red-*` etc)
- [ ] Todo texto sans usa `<Heading>` ou `<Text>` (sem `<h1>` direto, sem `<span className="text-xl">`)
- [ ] Todo card usa `<GlassPanel>` ou `<Card>` (sem `<div>` com classes de sombra inline)
- [ ] Border-radius ≤ 8px em containers/botões/inputs
- [ ] Weight 300 em `Heading` display/page/section
- [ ] Focus ring visível e roxo
- [ ] Dark mode validado
- [ ] `npm run audit:design-system` sem novos offenders
- [ ] `npm run type-check` passando

---

## 24. Mapa de Arquivos

| Arquivo | Papel | Editar? |
|---|---|---|
| [design-system/MASTER.md](design-system/MASTER.md) | Este documento — contrato narrativo | Sim, via workflow seção 21 |
| [design-system/GOVERNANCE.md](design-system/GOVERNANCE.md) | Workflow e roles | Raramente |
| [design-system/ROADMAP.md](design-system/ROADMAP.md) | Metas trimestrais, KPIs, baseline | Por quarter |
| [design-system/reports/](design-system/reports/) | Snapshots do audit | Auto-gerado |
| [src/app/globals.css](src/app/globals.css) | **CSS Canônico** — `:root` + `.dark` + `@theme inline` + classes | DS Owner |
| [src/lib/design-system/tokens.ts](src/lib/design-system/tokens.ts) | Espelho TS dos tokens (SPACING, TYPOGRAPHY, etc) | DS Owner |
| [src/lib/design-system/token-registry.ts](src/lib/design-system/token-registry.ts) | Lista tipada para audit | Sincronizar com globals |
| [src/components/shared/glass-panel.tsx](src/components/shared/glass-panel.tsx) | `<GlassPanel depth={1\|2\|3}>` — API estável, visual Zattar | DS Owner |
| [src/components/ui/typography.tsx](src/components/ui/typography.tsx) | `<Heading>` + `<Text>` com escala Zattar | DS Owner |
| [src/app/layout.tsx](src/app/layout.tsx) | Imports de Switzer + Source Code Pro | DS Owner |
| [tailwind.config.ts](tailwind.config.ts) | Apenas plugins + max-w custom | Raramente |

---

**Fim do MASTER.md — versão 3.0.0**
