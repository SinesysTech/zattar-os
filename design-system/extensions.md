# ZattarOS Design System — Extensions

> Complemento ao spec canônico `colors_and_type.css` com todos os tokens derivados/extendidos que vivem em `src/app/globals.css`. Este arquivo é a documentação exaustiva que alimenta o KPI de coverage em `audit:design-system`.

> **Hierarquia**: reference tokens → semantic tokens → component tokens. Componentes devem consumir apenas semantic/component tokens; reference são building blocks internos.

> Gerado automaticamente a partir de `src/lib/design-system/token-registry.ts`. Total: **226 tokens** registrados.

---

## Semantic Core (shadcn) (21)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--background` | semantic | light, dark, website | Canvas principal |
| `--foreground` | semantic | light, dark | Texto principal |
| `--card` | semantic | light, dark | Fundo de cards |
| `--card-foreground` | semantic | light, dark | — |
| `--popover` | semantic | light, dark | — |
| `--popover-foreground` | semantic | light, dark | — |
| `--primary` | semantic | light, dark, website | CTAs, links, foco |
| `--primary-foreground` | semantic | light, dark | — |
| `--secondary` | semantic | light, dark | — |
| `--secondary-foreground` | semantic | light, dark | — |
| `--muted` | semantic | light, dark | — |
| `--muted-foreground` | semantic | light, dark | — |
| `--accent` | semantic | light, dark | — |
| `--accent-foreground` | semantic | light, dark | — |
| `--destructive` | semantic | light, dark | — |
| `--destructive-foreground` | semantic | light, dark | — |
| `--border` | semantic | light, dark | — |
| `--input` | semantic | light, dark | — |
| `--ring` | semantic | light, dark | transparent (disabled) |
| `--brand` | semantic | light, dark | — |
| `--highlight` | semantic | light, dark | Action Orange |

## Status Colors (9)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--success-500` | reference | light, dark | Success mid — spec light |
| `--success-700` | reference | light, dark | Success deep — foreground contrast |
| `--warning-600` | reference | light, dark | Warning — spec light |
| `--success` | semantic | light, dark | — |
| `--success-foreground` | semantic | light, dark | — |
| `--warning` | semantic | light, dark | — |
| `--warning-foreground` | semantic | light, dark | — |
| `--info` | semantic | light, dark | — |
| `--info-foreground` | semantic | light, dark | — |

## Sidebar (premium dark-always) (8)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--sidebar` | semantic | light, dark | — |
| `--sidebar-foreground` | semantic | light, dark | — |
| `--sidebar-primary` | semantic | light, dark | — |
| `--sidebar-primary-foreground` | semantic | light, dark | — |
| `--sidebar-accent` | semantic | light, dark | — |
| `--sidebar-accent-foreground` | semantic | light, dark | — |
| `--sidebar-border` | semantic | light, dark | — |
| `--sidebar-ring` | semantic | light, dark | — |

## Chart Palette (8)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--chart-1` | semantic | light, dark | — |
| `--chart-2` | semantic | light, dark | — |
| `--chart-3` | semantic | light, dark | — |
| `--chart-4` | semantic | light, dark | — |
| `--chart-5` | semantic | light, dark | — |
| `--chart-6` | semantic | light, dark | — |
| `--chart-7` | semantic | light, dark | — |
| `--chart-8` | semantic | light, dark | — |

## Chart Derived (soft/dark variants) (7)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--chart-primary-soft` | semantic | light, dark | — |
| `--chart-destructive-soft` | semantic | light, dark | — |
| `--chart-warning-soft` | semantic | light, dark | — |
| `--chart-success-soft` | semantic | light, dark | — |
| `--chart-muted-soft` | semantic | light, dark | — |
| `--chart-success-dark` | semantic | light, dark | — |
| `--chart-warning-dark` | semantic | light, dark | — |

## MD3 Surface Hierarchy (18)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--surface` | semantic | light, dark | — |
| `--surface-dim` | semantic | light, dark | — |
| `--surface-bright` | semantic | light, dark | — |
| `--surface-container-lowest` | semantic | light, dark | — |
| `--surface-container-low` | semantic | light, dark | — |
| `--surface-container` | semantic | light, dark | — |
| `--surface-container-high` | semantic | light, dark | — |
| `--surface-container-highest` | semantic | light, dark | — |
| `--surface-variant` | semantic | light, dark | — |
| `--on-surface` | semantic | light, dark | — |
| `--on-surface-variant` | semantic | light, dark | — |
| `--inverse-surface` | semantic | light, dark | — |
| `--inverse-on-surface` | semantic | light, dark | — |
| `--outline` | semantic | light, dark | — |
| `--outline-variant` | semantic | light, dark | — |
| `--surface-1` | semantic | light, dark | Legacy alias |
| `--surface-2` | semantic | light, dark | Legacy alias |
| `--surface-3` | semantic | light, dark | Legacy alias |

## MD3 Tonal Extended (31)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--on-primary` | semantic | light, dark | — |
| `--primary-container` | semantic | light, dark | — |
| `--on-primary-container` | semantic | light, dark | — |
| `--primary-fixed` | semantic | light, dark | — |
| `--primary-fixed-dim` | semantic | light, dark | — |
| `--on-primary-fixed` | semantic | light, dark | — |
| `--on-primary-fixed-variant` | semantic | light, dark | — |
| `--on-secondary` | semantic | light, dark | — |
| `--secondary-container` | semantic | light, dark | — |
| `--on-secondary-container` | semantic | light, dark | — |
| `--secondary-fixed` | semantic | light, dark | — |
| `--secondary-fixed-dim` | semantic | light, dark | — |
| `--on-secondary-fixed` | semantic | light, dark | — |
| `--on-secondary-fixed-variant` | semantic | light, dark | — |
| `--tertiary` | semantic | light, dark | — |
| `--on-tertiary` | semantic | light, dark | — |
| `--tertiary-container` | semantic | light, dark | — |
| `--on-tertiary-container` | semantic | light, dark | — |
| `--tertiary-fixed` | semantic | light, dark | — |
| `--tertiary-fixed-dim` | semantic | light, dark | — |
| `--on-tertiary-fixed` | semantic | light, dark | — |
| `--on-tertiary-fixed-variant` | semantic | light, dark | — |
| `--error-container` | semantic | light, dark | — |
| `--on-error-container` | semantic | light, dark | — |
| `--on-error` | semantic | light, dark | — |
| `--primary-dim` | semantic | light, dark, website | — |
| `--secondary-dim` | semantic | light, dark | — |
| `--tertiary-dim` | semantic | light, dark | — |
| `--error-dim` | semantic | light, dark | — |
| `--inverse-primary` | semantic | light, dark | — |
| `--surface-tint` | semantic | light, dark | — |

## User Palette (18 slots) (18)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--palette-1` | reference | light, dark | User-selectable palette color 1 |
| `--palette-2` | reference | light, dark | User-selectable palette color 2 |
| `--palette-3` | reference | light, dark | User-selectable palette color 3 |
| `--palette-4` | reference | light, dark | User-selectable palette color 4 |
| `--palette-5` | reference | light, dark | User-selectable palette color 5 |
| `--palette-6` | reference | light, dark | User-selectable palette color 6 |
| `--palette-7` | reference | light, dark | User-selectable palette color 7 |
| `--palette-8` | reference | light, dark | User-selectable palette color 8 |
| `--palette-9` | reference | light, dark | User-selectable palette color 9 |
| `--palette-10` | reference | light, dark | User-selectable palette color 10 |
| `--palette-11` | reference | light, dark | User-selectable palette color 11 |
| `--palette-12` | reference | light, dark | User-selectable palette color 12 |
| `--palette-13` | reference | light, dark | User-selectable palette color 13 |
| `--palette-14` | reference | light, dark | User-selectable palette color 14 |
| `--palette-15` | reference | light, dark | User-selectable palette color 15 |
| `--palette-16` | reference | light, dark | User-selectable palette color 16 |
| `--palette-17` | reference | light, dark | User-selectable palette color 17 |
| `--palette-18` | reference | light, dark | User-selectable palette color 18 |

## Event Colors (domínio jurídico) (7)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--event-audiencia` | semantic | light, dark | — |
| `--event-expediente` | semantic | light, dark | — |
| `--event-obrigacao` | semantic | light, dark | — |
| `--event-pericia` | semantic | light, dark | — |
| `--event-agenda` | semantic | light, dark | — |
| `--event-prazo` | semantic | light, dark | — |
| `--event-default` | semantic | light, dark | — |

## Chat (4)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--chat-thread-bg` | semantic | light, dark | — |
| `--chat-bubble-received` | semantic | light, dark | — |
| `--chat-bubble-sent` | semantic | light, dark | — |
| `--chat-sidebar-active` | semantic | light, dark | — |

## Video Call (always dark) (7)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--video-bg` | semantic | video-always | — |
| `--video-surface` | semantic | video-always | — |
| `--video-surface-hover` | semantic | video-always | — |
| `--video-border` | semantic | video-always | — |
| `--video-muted` | semantic | video-always | — |
| `--video-text` | semantic | video-always | — |
| `--video-skeleton` | semantic | video-always | — |

## Portal do Cliente (17)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--portal-bg` | semantic | portal | — |
| `--portal-card` | semantic | portal | — |
| `--portal-card-hover` | semantic | portal | — |
| `--portal-surface` | semantic | portal | — |
| `--portal-text` | semantic | portal | — |
| `--portal-text-muted` | semantic | portal | — |
| `--portal-text-subtle` | semantic | portal | — |
| `--portal-primary` | semantic | portal | — |
| `--portal-primary-soft` | semantic | portal | — |
| `--portal-success` | semantic | portal | — |
| `--portal-success-soft` | semantic | portal | — |
| `--portal-warning` | semantic | portal | — |
| `--portal-warning-soft` | semantic | portal | — |
| `--portal-danger` | semantic | portal | — |
| `--portal-danger-soft` | semantic | portal | — |
| `--portal-info` | semantic | portal | — |
| `--portal-info-soft` | semantic | portal | — |

## Entity (legal parties) (4)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--entity-cliente` | semantic | light, dark | — |
| `--entity-parte-contraria` | semantic | light, dark | — |
| `--entity-terceiro` | semantic | light, dark | — |
| `--entity-representante` | semantic | light, dark | — |

## Glow Effects (5)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--glow-primary` | semantic | light, dark | — |
| `--glow-primary-subtle` | semantic | light, dark | — |
| `--glow-primary-faint` | semantic | light, dark | — |
| `--glow-destructive` | semantic | light, dark | — |
| `--glow-warning` | semantic | light, dark | — |

## Skeleton Loading (2)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--skeleton` | semantic | light, dark | — |
| `--skeleton-highlight` | semantic | light, dark | — |

## Gauge Indicators (4)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--gauge-good` | component | light, dark | — |
| `--gauge-warning` | component | light, dark | — |
| `--gauge-danger` | component | light, dark | — |
| `--gauge-neutral` | component | light, dark | — |

## Insight Widgets (4)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--insight-alert-bg` | component | light, dark | — |
| `--insight-success-bg` | component | light, dark | — |
| `--insight-info-bg` | component | light, dark | — |
| `--insight-warning-bg` | component | light, dark | — |

## Widget System (8)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--widget-radius` | component | light, dark | — |
| `--widget-padding` | component | light, dark | — |
| `--widget-gap` | component | light, dark | — |
| `--widget-border-opacity` | component | light, dark | — |
| `--widget-label-size` | component | light, dark | — |
| `--widget-number-weight` | component | light, dark | — |
| `--widget-transition` | component | light, dark | — |
| `--widget-hover-scale` | component | light, dark | — |

## Card Entity (4)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--card-entity-radius` | component | light, dark | — |
| `--card-entity-padding` | component | light, dark | — |
| `--card-entity-avatar-size` | component | light, dark | — |
| `--card-entity-avatar-radius` | component | light, dark | — |

## Tab Pill (4)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--tab-pill-radius` | component | light, dark | — |
| `--tab-pill-padding-x` | component | light, dark | — |
| `--tab-pill-padding-y` | component | light, dark | — |
| `--tab-pill-active-bg` | component | light, dark | — |

## Pulse Strip (3)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--pulse-gap` | component | light, dark | — |
| `--pulse-padding-x` | component | light, dark | — |
| `--pulse-padding-y` | component | light, dark | — |

## Detail Panel (1)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--detail-panel-width` | component | light, dark | — |

## Search (2)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--search-radius` | component | light, dark | — |
| `--search-bg` | component | light, dark | — |

## Typography (7)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--font-sans` | reference | light, dark | — |
| `--font-heading` | reference | light, dark | — |
| `--font-display` | reference | light, dark | — |
| `--font-headline` | reference | light, dark | — |
| `--font-mono` | reference | light, dark | — |
| `--font-label` | reference | light, dark | — |
| `--font-body` | reference | light, dark | — |

## Radius (1)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--radius` | reference | light, dark | Base 8px, override via data-theme-radius |

## Breakpoints (1)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--breakpoint-xs` | reference | light, dark | Extra small (< sm), 480px |

## Reference Tokens (brand scales, neutrals, accents) (15)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--zattar-purple-200` | reference | light, dark | Borda suave hue 281° |
| `--zattar-purple-300` | reference | light, dark | Borda ativa |
| `--zattar-purple-400` | reference | light, dark | Primary light / dark-mode accent |
| `--zattar-purple-500` | reference | light, dark | #5523EB — PRIMARY anchor |
| `--zattar-purple-600` | reference | light, dark | Hover primary |
| `--zattar-purple-700` | reference | light, dark | Primary-dim |
| `--zattar-purple-900` | reference | light, dark | Deep, brand-dark |
| `--navy-heading` | reference | light, dark | Legado — = --foreground light |
| `--navy-label` | reference | light, dark | Legado — intermediário hue 281° |
| `--navy-body` | reference | light, dark | Legado — = --muted-foreground light |
| `--brand-dark-900` | reference | light, dark | Dark base para sidebar, video, portal |
| `--accent-ruby` | reference | light, dark | Decorativo hue 25° — chart, tertiary |
| `--accent-magenta` | reference | light, dark | Decorativo hue 330° — chart, gradient |
| `--surface-white` | reference | light, dark | #ffffff — base surface |
| `--border-default` | reference | light, dark | = --border light |

## Shadow Tokens (6)

| Token | Layer | Modes | Propósito |
|---|---|---|---|
| `--shadow-zattar-blue` | reference | light, dark | Sombra azul-tintada (cards, elevation) |
| `--shadow-zattar-deep` | reference | light, dark | Sombra deep (modal, dialog) |
| `--shadow-neutral` | reference | light, dark | Sombra neutra fallback |
| `--shadow-ambient` | reference | light, dark | Ambient shadow (20px 40px 0.08) |
| `--shadow-soft` | reference | light, dark | Sombra suave (cards em repouso) |
| `--shadow-top-sticky` | reference | light, dark | Sticky headers, navbar top |

