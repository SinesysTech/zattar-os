# Design System — Magistrate AI / Neon Magistrate

> **Creative North Star: "The Neon Magistrate"**
> Dark-mode editorial tech-legal aesthetic. Rejects traditional law firm clichés in favor of a high-velocity, Silicon Valley–meets–Supreme Court identity. Every surface feels like a premium digital sanctuary.

---

## Table of Contents

1. [Foundations](#1-foundations)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing Scale](#4-spacing-scale)
5. [Border Radius](#5-border-radius)
6. [Elevation & Depth](#6-elevation--depth)
7. [Glassmorphism & Effects](#7-glassmorphism--effects)
8. [Layout System](#8-layout-system)
9. [Responsive Breakpoints](#9-responsive-breakpoints)
10. [Z-Index Layers](#10-z-index-layers)
11. [Transitions & Animation](#11-transitions--animation)
12. [Icon System](#12-icon-system)
13. [Components](#13-components)
14. [Page Templates](#14-page-templates)
15. [Do's and Don'ts](#15-dos-and-donts)
16. [Accessibility](#16-accessibility)
17. [Pre-Delivery Checklist](#17-pre-delivery-checklist)

---

## 1. Foundations

### Tech Stack

| Layer | Technology |
|-------|-----------|
| CSS Framework | Tailwind CSS (CDN + config) |
| Fonts | Google Fonts (Manrope + Inter) |
| Icons | Material Symbols Outlined (variable font) |
| Dark Mode | `class="dark"` on `<html>` — always active |
| Language | `lang="pt-BR"` |
| Plugins | `@tailwindcss/forms`, `@tailwindcss/container-queries` |

### Tailwind Config (Source of Truth)

```javascript
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // — Primary —
        "primary":                    "#cc97ff",
        "primary-dim":                "#9c48ea",
        "primary-container":          "#c284ff",
        "primary-fixed":              "#c284ff",
        "primary-fixed-dim":          "#b971ff",
        "on-primary":                 "#47007c",
        "on-primary-fixed":           "#000000",
        "on-primary-fixed-variant":   "#430076",
        "on-primary-container":       "#360061",
        "inverse-primary":            "#842cd3",
        "surface-tint":               "#cc97ff",

        // — Secondary —
        "secondary":                  "#e197fc",
        "secondary-dim":              "#d28aed",
        "secondary-container":        "#6a2785",
        "secondary-fixed":            "#f1c1ff",
        "secondary-fixed-dim":        "#ebaeff",
        "on-secondary":               "#530b6f",
        "on-secondary-fixed":         "#550e71",
        "on-secondary-fixed-variant": "#753290",
        "on-secondary-container":     "#f1bfff",

        // — Tertiary —
        "tertiary":                   "#ff95a0",
        "tertiary-dim":               "#f47786",
        "tertiary-container":         "#fe7e8e",
        "tertiary-fixed":             "#ff909c",
        "tertiary-fixed-dim":         "#fa7c8b",
        "on-tertiary":                "#680921",
        "on-tertiary-fixed":          "#39000d",
        "on-tertiary-fixed-variant":  "#711227",
        "on-tertiary-container":      "#570018",

        // — Error —
        "error":                      "#ff6e84",
        "error-dim":                  "#d73357",
        "error-container":            "#a70138",
        "on-error":                   "#490013",
        "on-error-container":         "#ffb2b9",

        // — Surfaces —
        "surface":                    "#0e0e0e",
        "surface-dim":                "#0e0e0e",
        "surface-bright":             "#2c2c2c",
        "surface-variant":            "#262626",
        "surface-container-lowest":   "#000000",
        "surface-container-low":      "#131313",
        "surface-container":          "#191919",
        "surface-container-high":     "#1f1f1f",
        "surface-container-highest":  "#262626",
        "background":                 "#0e0e0e",

        // — On Surface —
        "on-surface":                 "#ffffff",
        "on-surface-variant":         "#ababab",
        "on-background":              "#ffffff",
        "inverse-surface":            "#f9f9f9",
        "inverse-on-surface":         "#555555",

        // — Outline —
        "outline":                    "#757575",
        "outline-variant":            "#484848",
      },
      fontFamily: {
        "headline": ["Manrope", "sans-serif"],
        "body":     ["Inter", "sans-serif"],
        "label":    ["Inter", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg":      "0.25rem",
        "xl":      "0.5rem",
        "full":    "0.75rem",
      },
    },
  },
}
```

### Google Fonts Import

```html
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
```

---

## 2. Color System

### Material Design 3 — Extended Dark Theme

Our palette uses the Material Design 3 tonal palette system, rooted in deep darkness with electric purple accents.

#### Surface Hierarchy (Layer Stack)

| Token | Hex | Usage |
|-------|-----|-------|
| `surface-container-lowest` | `#000000` | Base body, deepest background |
| `surface` / `surface-dim` | `#0e0e0e` | Default page background |
| `surface-container-low` | `#131313` | Alternate section backgrounds |
| `surface-container` | `#191919` | Cards, containers, panels |
| `surface-container-high` | `#1f1f1f` | Input fields, interactive elements |
| `surface-container-highest` | `#262626` | Badges, chips, top-layer elements |
| `surface-bright` | `#2c2c2c` | Hover states, highlights |
| `surface-variant` | `#262626` | Alternative surface, dividers |

#### Primary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#cc97ff` | CTA text, links, accents, badges |
| `primary-dim` | `#9c48ea` | Gradient end, secondary purple |
| `primary-container` | `#c284ff` | Button hover state |
| `primary-fixed` | `#c284ff` | Fixed primary variant |
| `primary-fixed-dim` | `#b971ff` | Dimmed fixed primary |
| `on-primary-fixed` | `#000000` | Text on primary buttons |
| `surface-tint` | `#cc97ff` | Glass overlay tint (5% opacity) |

#### Semantic Status Colors

| Status | Primary Token | Hex | Dim Token | Hex |
|--------|--------------|-----|-----------|-----|
| Error | `error` | `#ff6e84` | `error-dim` | `#d73357` |
| Success | — | `emerald-400` | — | `green-400` |
| Warning | — | `amber-400` | — | `yellow-400` |
| Info | `secondary` | `#e197fc` | `secondary-dim` | `#d28aed` |

#### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `on-surface` | `#ffffff` | Headlines, primary text |
| `on-surface-variant` | `#ababab` | Body text, descriptions, muted |
| `outline` | `#757575` | Disabled text, placeholders |
| `outline-variant` | `#484848` | Ghost borders (20% opacity) |

#### Signature Gradient

```css
background: linear-gradient(135deg, #cc97ff 0%, #9c48ea 100%);
```

Used for: gradient text (`.text-gradient`), hero accents, decorative elements, some buttons.

#### The "No-Line" Rule

> Standard `1px solid` borders are **strictly prohibited** for section separation. Use background shifts (`surface-container-low` → `surface`) or spacing (`spacing-16`+) instead. When a border is necessary, use `border-white/5` or `border-white/10`.

#### Opacity Scale (Utility)

| Opacity | Tailwind Class | Usage |
|---------|---------------|-------|
| 5% | `white/5`, `primary/5` | Subtle hover bg, glass overlays |
| 10% | `white/10`, `primary/10` | Card backgrounds, icon badges |
| 20% | `white/20`, `primary/20` | Active states, glow elements |
| 30% | `primary/30` | Border accents, selection bg |
| 40% | — | Image overlays, trust ticker logos |
| 60% | — | Glass card backgrounds |

---

## 3. Typography

### Dual-Typeface System

| Role | Font | Weights | Semantic Purpose |
|------|------|---------|-----------------|
| **Display & Headlines** | Manrope | 400, 500, 700, 800 | "Voice of Authority" — hero text, section headers, navigation |
| **Body & Labels** | Inter | 300, 400, 500, 600 | "The Workhorse" — body text, inputs, labels, legal content |

### Type Scale

| Name | Tailwind | Size | Weight | Font | Usage |
|------|----------|------|--------|------|-------|
| Display Hero | `text-8xl` | 96px | `font-extrabold` (800) | Manrope | Landing page hero only |
| Display Large | `text-7xl` | 72px | `font-extrabold` (800) | Manrope | Hero headlines (desktop) |
| Display Medium | `text-6xl` | 60px | `font-extrabold` (800) | Manrope | Hero headlines (mobile fallback) |
| Display Small | `text-5xl` | 48px | `font-extrabold` (800) | Manrope | Portal page titles |
| Headline Large | `text-4xl` | 36px | `font-bold` (700) | Manrope | Section headers |
| Headline Medium | `text-3xl` | 30px | `font-bold` (700) | Manrope | Card titles, bento headers |
| Headline Small | `text-2xl` | 24px | `font-bold` (700) | Manrope | Subsection headers, sidebar brand |
| Title Large | `text-xl` | 20px | `font-bold` (700) | Manrope | Card subtitles, dialog titles |
| Title Medium | `text-lg` | 18px | `font-semibold` (600) | Inter | Lead paragraphs, large body |
| Body Large | `text-lg` | 18px | `font-normal` (400) | Inter | Lead paragraphs, descriptions |
| Body Medium | `text-base` | 16px | `font-normal` (400) | Inter | Default body text |
| Body Small | `text-sm` | 14px | `font-normal` (400) | Inter | Table cells, secondary text |
| Label Large | `text-sm` | 14px | `font-semibold` (600) | Inter | Nav items, form labels |
| Label Medium | `text-xs` | 12px | `font-bold` (700) | Inter | Kickers, timestamps, badges |
| Label Small | `text-[10px]` | 10px | `font-bold` (700) | Inter | Ultra-small captions, chart labels |

### Letter Spacing

| Token | Tailwind | Value | Usage |
|-------|----------|-------|-------|
| Tighter | `tracking-tighter` | -0.05em | Hero headlines, brand name |
| Tight | `tracking-tight` | -0.025em | Section headers, nav links |
| Normal | `tracking-normal` | 0em | Body text |
| Wider | `tracking-wider` | 0.05em | Labels |
| Widest | `tracking-widest` | 0.1em | Kickers, uppercase labels |
| Custom | `tracking-[0.2em]` | 0.2em | Subtitle kickers (e.g., "Tech-Legal Elite") |
| Custom | `tracking-[0.3em]` | 0.3em | Extra-wide section kickers |

### Line Height

| Token | Tailwind | Value | Usage |
|-------|----------|-------|-------|
| None | `leading-none` | 1.0 | Large headlines only |
| Tight | `leading-tight` | 1.25 | Headlines, compact text |
| Custom | `leading-[0.95]` | 0.95 | Extra-tight hero display |
| Relaxed | `leading-relaxed` | 1.625 | Body text, descriptions |

### Hierarchy Pattern

Every section follows the **Kicker → Headline → Body** pattern:

```html
<!-- Kicker: uppercase, primary, tiny, wide tracking -->
<span class="text-primary font-bold tracking-[0.2em] uppercase text-sm mb-4 block">
  Section Kicker
</span>
<!-- Headline: Manrope, bold, tight tracking -->
<h2 class="font-headline text-4xl md:text-5xl font-bold text-white tracking-tight">
  Section Title
</h2>
<!-- Body: Inter, muted, relaxed leading -->
<p class="text-on-surface-variant text-lg leading-relaxed max-w-xl mt-4">
  Description text here.
</p>
```

---

## 4. Spacing Scale

Base unit: **4px** (Tailwind default).

### Core Scale

| Token | Tailwind | Value | Primary Usage |
|-------|----------|-------|--------------|
| 1 | `p-1` / `m-1` | 4px | Micro spacing, icon gaps |
| 2 | `p-2` / `m-2` | 8px | Tight inner padding |
| 3 | `p-3` / `m-3` | 12px | Button icon padding |
| 4 | `p-4` / `m-4` | 16px | Standard inner padding |
| 5 | `p-5` / `m-5` | 20px | — |
| 6 | `p-6` / `m-6` | 24px | Card padding, grid gaps |
| 8 | `p-8` / `m-8` | 32px | Section inner padding, large cards |
| 10 | `p-10` / `m-10` | 40px | Hero button padding |
| 12 | `p-12` / `m-12` | 48px | Page horizontal padding (desktop) |
| 16 | `py-16` | 64px | Section vertical spacing |
| 20 | `py-20` | 80px | Major section breaks |
| 24 | `py-24` | 96px | Hero/Feature section padding |
| 32 | `py-32` | 128px | Maximum section spacing |

### Recommended Usage

| Context | Spacing |
|---------|---------|
| Card internal padding | `p-6` to `p-8` |
| Grid gap | `gap-4` to `gap-8` |
| Section vertical padding | `py-16` to `py-24` |
| Page horizontal padding | `px-6` (mobile) → `px-8` (tablet) → `px-12` (desktop) |
| Between heading and body | `mb-4` to `mb-6` |
| Between sections on same page | `mb-12` to `mb-16` |
| Sidebar item spacing | `space-y-1` to `space-y-2` |

---

## 5. Border Radius

### Custom Tailwind Scale

Our config overrides Tailwind defaults for a compact, modern feel:

| Token | Tailwind | Value | Usage |
|-------|----------|-------|-------|
| Default | `rounded` | 2px | Minimal rounding |
| Large | `rounded-lg` | 4px | Inputs, subtle elements |
| Extra Large | `rounded-xl` | 8px | Buttons, cards, containers |
| 2XL | `rounded-2xl` | 16px | Hero cards, featured content |
| 3XL | `rounded-3xl` | 24px | Hero images, bento cards |
| Full | `rounded-full` | 9999px | Badges, pills, avatars, floating nav |

### Practical Guidelines

| Component | Radius |
|-----------|--------|
| Primary buttons | `rounded-lg` to `rounded-xl` |
| Cards | `rounded-xl` to `rounded-3xl` |
| Input fields | `rounded-lg` |
| Badges/Chips | `rounded-full` |
| Floating navbar (public) | `rounded-full` or `rounded-2xl` |
| Portal top bar | `rounded-xl` |
| Sidebar nav items | `rounded-lg` |
| Image containers | `rounded-2xl` to `rounded-3xl` |
| Avatars | `rounded-full` |
| Icon badge containers | `rounded-lg` to `rounded-xl` |

---

## 6. Elevation & Depth

Depth is achieved through **surface layering** (background color shifts), not traditional box-shadows.

### The Layering Principle

```
[surface-container-lowest] #000000  ← Body background
  └─[surface]              #0e0e0e  ← Page background
    └─[surface-container]    #191919  ← Card / panel
      └─[surface-container-high] #1f1f1f  ← Input inside card
        └─[surface-container-highest] #262626  ← Badge inside card
```

### Shadow Tokens

| Name | CSS Value | Usage |
|------|-----------|-------|
| Ambient | `shadow-2xl` | Cards, modals |
| Nav Float | `shadow-[0_20px_40px_rgba(0,0,0,0.4)]` | Floating navigation |
| Sidebar | `shadow-[20px_0_40px_rgba(0,0,0,0.4)]` | Fixed sidebar |
| Purple Glow (subtle) | `shadow-[0_0_20px_rgba(204,151,255,0.3)]` | Primary buttons, active cards |
| Purple Glow (large) | `shadow-[0_0_30px_rgba(204,151,255,0.15)]` | Hero elements |
| Purple Glow (mega) | `shadow-[0_0_50px_rgba(204,151,255,0.15)]` | Tech visualizations |
| Toast | `shadow-[0_10px_40px_rgba(0,0,0,0.5)]` | Notifications |

### Ghost Border

When a border is needed for accessibility, use the "Ghost Border":

```html
<!-- Standard ghost border -->
<div class="border border-white/5">
<!-- Slightly visible ghost border -->
<div class="border border-white/10">
<!-- Active/hover ghost border -->
<div class="hover:border-primary/30">
```

---

## 7. Glassmorphism & Effects

### Glass Card

```css
.glass-card {
  background: rgba(31, 31, 31, 0.6);  /* #1f1f1f at 60% */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(72, 72, 72, 0.2);  /* outline-variant at 20% */
}
```

### Glass Panel (Alternative)

```css
.glass-panel {
  background: rgba(31, 31, 31, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
```

### Gradient Border (Premium Cards)

```css
.gradient-border {
  position: relative;
  background: rgba(25, 25, 25, 0.6);
  border-radius: 0.75rem;
}
.gradient-border::before {
  content: "";
  position: absolute;
  top: -1px; left: -1px; right: -1px; bottom: -1px;
  border-radius: 0.75rem;
  padding: 1px;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.4), rgba(0, 0, 0, 0.1));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
```

### Text Gradient

```css
.text-gradient {
  background: linear-gradient(135deg, #cc97ff 0%, #9c48ea 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Neon Glow (Text)

```css
.neon-glow,
.neon-text-glow {
  text-shadow: 0 0 10px rgba(204, 151, 255, 0.4);
}
```

### Background Glow Orbs

Used for hero sections and feature areas:

```html
<!-- Primary glow orb -->
<div class="absolute top-[-10%] right-[-10%] w-150 h-150 bg-primary/10 rounded-full blur-[120px]"></div>
<!-- Secondary glow orb -->
<div class="absolute bottom-[-10%] left-[-10%] w-100 h-100 bg-primary-dim/10 rounded-full blur-[100px]"></div>
```

### Purple Hover Glow

```css
.purple-glow-hover:hover {
  box-shadow: 0 0 30px rgba(168, 85, 247, 0.15);
}
```

### Sidebar Active State

```css
.sidebar-active {
  border-right: 2px solid #cc97ff;
  background: rgba(168, 85, 247, 0.05);
  color: #a78bfa;       /* purple-400 */
  font-weight: 700;
  border-radius: 0.5rem;
}
```

### Nav Sticky (Scroll Effect)

```css
.nav-sticky {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Scrollbar Hide

```css
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

### Selection Styling

```html
<body class="selection:bg-primary/30 selection:text-primary">
<!-- OR -->
<body class="selection:bg-primary selection:text-on-primary-fixed">
```

### Implementation Notes

> **Font Fallback:** The Tailwind config in this document includes `"sans-serif"` fallbacks in `fontFamily`. Some prototype HTML files omit this fallback — the design system values are canonical and must be used in the final implementation.
>
> **Glass Variations:** Some prototypes have minor glass opacity/blur variations (e.g., 0.4 opacity, 24px blur). The canonical values are **0.6 opacity** and **20px blur**. Use the values in this document.
>
> **Border Conventions:** Some prototypes use `border-white/5`, others use `rgba(72, 72, 72, 0.2)`. Both achieve a ghost border effect. Prefer the Tailwind `border-white/5` class for consistency.

---

## 8. Layout System

### Container Strategy

| Context | Max Width | Padding |
|---------|-----------|---------|
| Public pages | `max-w-7xl` (1280px) | `px-6 md:px-8 lg:px-12` |
| Portal content | `max-w-7xl` or `max-w-6xl` | `px-8` to `px-12` |
| Body text | `max-w-xl` (576px) | — |
| Hero text | `max-w-2xl` (672px) | — |
| Wide content | `max-w-3xl` (768px) | — |
| Search input | `max-w-md` (448px) | — |

### Grid System (12-Column)

```html
<!-- Standard asymmetric layout -->
<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
  <div class="lg:col-span-7">Main content</div>
  <div class="lg:col-span-5">Secondary content</div>
</div>

<!-- Portal bento layout -->
<div class="grid grid-cols-12 gap-6">
  <div class="col-span-12 lg:col-span-4">Stat card</div>
  <div class="col-span-12 lg:col-span-8">Chart</div>
</div>

<!-- Feature grid -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div class="md:col-span-2">Large feature</div>
  <div>Small feature</div>
</div>
```

### Common Layout Splits

| Split | Classes | Usage |
|-------|---------|-------|
| 70/30 | `lg:col-span-7` + `lg:col-span-5` | Hero, editorial |
| 67/33 | `lg:col-span-8` + `lg:col-span-4` | Dashboard main + sidebar |
| 33/67 | `lg:col-span-4` + `lg:col-span-8` | Stat card + chart |
| 50/50 | `md:grid-cols-2` | Two-column forms, split features |
| Thirds | `md:grid-cols-3` | Feature grids, bento |
| Full | `col-span-12` | Full-width sections |

### Portal Page Layout Skeleton

```html
<body>
  <!-- Fixed Sidebar (desktop) -->
  <aside class="h-screen w-64 fixed left-0 top-0 z-50">...</aside>

  <!-- Fixed Top Bar -->
  <header class="fixed top-4 right-4 left-72 h-16 z-40 rounded-xl">...</header>

  <!-- Main Content -->
  <main class="ml-64 pt-28 px-8 pb-12">
    <div class="max-w-7xl mx-auto">...</div>
  </main>
</body>
```

### Public Page Layout Skeleton

```html
<body>
  <!-- Floating Navigation -->
  <nav class="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-7xl z-50">...</nav>

  <!-- Content Sections -->
  <section class="relative min-h-screen flex items-center pt-20">...</section>
  <section class="py-24 bg-surface">...</section>
  <section class="py-24 bg-surface-container-low">...</section>

  <!-- Footer -->
  <footer class="border-t border-white/5 py-12 px-12">...</footer>
</body>
```

---

## 9. Responsive Breakpoints

| Breakpoint | Width | Prefix | Usage |
|-----------|-------|--------|-------|
| Mobile (default) | 0–639px | — | Single column, stacked layouts |
| Small | 640px+ | `sm:` | Rarely used, minor adjustments |
| Tablet | 768px+ | `md:` | 2–4 column grids, side-by-side layouts |
| Desktop | 1024px+ | `lg:` | 12-column grid, sidebar layout, full features |
| Wide | 1280px+ | `xl:` | Extra wide adjustments |

### Responsive Patterns

```html
<!-- Stack → Row -->
<div class="flex flex-col md:flex-row gap-4">

<!-- Single → Multi column -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

<!-- Mobile hidden → Desktop visible -->
<div class="hidden lg:flex">

<!-- Responsive padding -->
<div class="px-6 md:px-8 lg:px-12">

<!-- Responsive text -->
<h1 class="text-5xl md:text-7xl lg:text-8xl">

<!-- Sidebar: hidden mobile, visible desktop -->
<aside class="hidden lg:flex fixed left-0 w-64">
```

---

## 10. Z-Index Layers

| Layer | Z-Index | Elements |
|-------|---------|----------|
| Background | `z-0` | Glow orbs, decorative elements |
| Content | `z-10` | Relative positioned content above glows |
| Sidebar | `z-40` – `z-50` | Fixed sidebar navigation |
| Top Bar | `z-40` | Fixed header bar |
| Navigation (Public) | `z-50` | Floating public navbar |
| Modals & Toasts | `z-50` | Floating notifications, dialogs |

---

## 11. Transitions & Animation

### Duration Scale

| Duration | Tailwind | Usage |
|----------|----------|-------|
| 200ms | `duration-200` | Hover states, quick interactions |
| 300ms | `duration-300` | Standard transitions, color shifts |
| 500ms | `duration-500` | Image transforms, larger reveals |
| 700ms | `duration-700` | Hero image grayscale, dramatic reveals |

### Properties

| Property | Tailwind | Usage |
|----------|----------|-------|
| All | `transition-all` | General-purpose transitions |
| Colors | `transition-colors` | Text/background color changes |
| Transform | `transition-transform` | Scale, translate, rotate |
| Opacity | `transition-opacity` | Fade effects |

### Easing

| Easing | CSS | Usage |
|--------|-----|-------|
| Default | `ease-in-out` | Standard Tailwind default |
| Navigation | `cubic-bezier(0.4, 0, 0.2, 1)` | `.nav-sticky` scroll effect |

### Transform Effects

| Effect | Classes | Usage |
|--------|---------|-------|
| Hover zoom | `hover:scale-105` | Cards, images |
| Press effect | `active:scale-95` | Buttons |
| Subtle press | `active:scale-[0.98]` | Large buttons |
| Arrow nudge | `group-hover:translate-x-1` | Link arrows |
| Lift on hover | `group-hover:-translate-y-4` | Featured cards |
| Center | `-translate-y-1/2` | Vertically centered elements |

### Animation Classes

| Animation | Tailwind | Usage |
|-----------|----------|-------|
| Pulse | `animate-pulse` | Loading skeletons only |
| Spin | `animate-spin` | Loading spinners only |

### Accessibility — `prefers-reduced-motion`

All animations must respect the user's motion preference:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 12. Icon System

### Material Symbols Outlined

| Property | Value |
|----------|-------|
| Font | `Material Symbols Outlined` (variable font) |
| Default FILL | 0 (outline) |
| Default Weight | 400 |
| Default Grade | 0 |
| Default Optical Size | 24 |

```css
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
```

### Filled Variant

```html
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">icon_name</span>
```

### Bold Variant

```html
<span class="material-symbols-outlined" style="font-variation-settings: 'wght' 700;">icon_name</span>
```

### Size Scale

| Size | Tailwind | Usage |
|------|----------|-------|
| 16px | `text-sm` | Inline badges, tiny indicators |
| 20px | `text-[20px]` | Button icons |
| 24px | (default) | Standard icon size |
| 28px | `text-2xl` | Larger icons |
| 48px | `text-5xl` | Feature card icons |
| 72px | `text-6xl` | Hero decorative |
| 96px | `text-8xl` | Decorative oversized |
| 140px | `text-[140px]` | Background watermarks |

### Core Icon Set

| Category | Icons |
|----------|-------|
| Navigation | `dashboard`, `description`, `gavel`, `calendar_today`, `payments`, `person`, `settings` |
| Actions | `add`, `edit`, `search`, `notifications`, `chat_bubble`, `more_vert`, `logout` |
| Status | `check_circle`, `schedule`, `trending_up`, `verified`, `lock`, `security` |
| Content | `article`, `bookmark`, `link`, `upload_file`, `cloud_upload`, `note_add` |
| Legal/Tech | `auto_awesome`, `terminal`, `troubleshoot`, `query_stats`, `hub`, `bolt` |
| Navigation UI | `arrow_forward`, `chevron_right`, `chevron_left`, `expand_more`, `open_in_new` |
| Communication | `video_chat`, `support_agent`, `help`, `event` |

---

## 13. Components

### 13.1 Navigation — Floating Public Navbar

```html
<nav class="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-7xl rounded-full border border-white/5 bg-neutral-950/60 backdrop-blur-xl flex justify-between items-center px-8 py-4 z-50 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
  <!-- Brand -->
  <div class="text-2xl font-bold tracking-tighter text-white uppercase font-headline">
    Magistrate AI
  </div>
  <!-- Links -->
  <div class="hidden md:flex gap-8 items-center">
    <a class="text-purple-400 font-bold font-headline tracking-tight" href="#">Active</a>
    <a class="text-neutral-400 hover:text-purple-300 transition-colors font-headline tracking-tight" href="#">Link</a>
  </div>
  <!-- CTA -->
  <button class="bg-primary text-on-primary-fixed px-6 py-2 rounded-full font-bold active:scale-90 transition-transform">
    Get Started
  </button>
</nav>
```

**Variants:**
- Pill shape: `rounded-full` with `w-[90%]`
- Rounded box: `rounded-2xl` with `w-[95%]`

### 13.2 Navigation — Portal Sidebar

```html
<aside class="h-screen w-64 fixed left-0 top-0 border-r border-white/5 bg-[#0e0e0e] flex flex-col py-8 px-4 z-50 shadow-[20px_0_40px_rgba(0,0,0,0.4)] font-headline tracking-tight antialiased">
  <!-- Brand -->
  <div class="mb-10 px-2">
    <h1 class="text-2xl font-black tracking-tighter text-purple-500 uppercase">Neon Magistrate</h1>
    <p class="text-xs text-on-surface-variant tracking-[0.2em] uppercase mt-1">Tech-Legal Elite</p>
  </div>

  <!-- Nav Items -->
  <nav class="flex-1 space-y-1">
    <!-- Active Item -->
    <a class="flex items-center gap-3 px-4 py-3 rounded-lg text-purple-400 font-bold border-r-2 border-purple-500 bg-purple-500/10 transition-all duration-200" href="#">
      <span class="material-symbols-outlined">dashboard</span>
      <span>Dashboard</span>
    </a>
    <!-- Inactive Item -->
    <a class="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all duration-200" href="#">
      <span class="material-symbols-outlined">description</span>
      <span>Contracts</span>
    </a>
  </nav>

  <!-- Footer Actions -->
  <div class="mt-auto pt-8 border-t border-white/5 space-y-1">
    <button class="w-full py-3 bg-primary text-on-primary-fixed font-bold rounded-lg hover:bg-primary-container transition-all active:scale-95">
      New Case
    </button>
    <a class="flex items-center gap-3 px-4 py-2 text-zinc-500 hover:text-zinc-200 transition-colors" href="#">
      <span class="material-symbols-outlined">help</span><span>Support</span>
    </a>
    <a class="flex items-center gap-3 px-4 py-2 text-zinc-500 hover:text-zinc-200 transition-colors" href="#">
      <span class="material-symbols-outlined">logout</span><span>Logout</span>
    </a>
  </div>
</aside>
```

### 13.3 Navigation — Portal Top Bar

```html
<header class="fixed top-4 right-4 left-72 rounded-xl border border-white/10 bg-[#191919]/60 backdrop-blur-xl flex justify-between items-center h-16 px-6 z-40 shadow-2xl font-headline font-medium">
  <!-- Search -->
  <div class="flex items-center gap-4 flex-1">
    <div class="relative w-full max-w-md focus-within:ring-1 focus-within:ring-primary/50 rounded-lg">
      <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">search</span>
      <input class="w-full bg-surface-container-high border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-0 placeholder:text-zinc-600" placeholder="Buscar..." type="text" />
    </div>
  </div>
  <!-- Right Actions -->
  <div class="flex items-center gap-4">
    <button class="material-symbols-outlined text-zinc-400 hover:text-primary p-2 rounded-full hover:bg-white/5 transition-all">notifications</button>
    <button class="material-symbols-outlined text-zinc-400 hover:text-primary p-2 rounded-full hover:bg-white/5 transition-all">chat_bubble</button>
    <button class="material-symbols-outlined text-zinc-400 hover:text-primary p-2 rounded-full hover:bg-white/5 transition-all">settings</button>
    <div class="h-8 w-8 rounded-full overflow-hidden border border-primary/30">
      <img alt="User Profile" class="w-full h-full object-cover" src="..." />
    </div>
  </div>
</header>
```

### 13.4 Buttons

#### Primary Button

```html
<button class="bg-primary text-on-primary-fixed px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary-container transition-all active:scale-95 flex items-center gap-2">
  Label
  <span class="material-symbols-outlined">arrow_forward</span>
</button>
```

#### Gradient Button

```html
<button class="bg-linear-to-r from-primary to-primary-dim text-on-primary-fixed font-bold py-4 px-6 rounded-lg hover:shadow-[0_0_30px_rgba(204,151,255,0.3)] active:scale-95 transition-all">
  Label
</button>
```

#### Secondary / Outline Button

```html
<button class="border border-outline-variant/30 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/5 transition-all">
  Label
</button>
```

#### Ghost Button

```html
<a class="text-primary font-bold flex items-center gap-2 group-hover:gap-4 transition-all" href="#">
  Explore <span class="material-symbols-outlined">chevron_right</span>
</a>
```

#### Icon Button

```html
<button class="material-symbols-outlined text-zinc-400 hover:bg-white/5 p-2 rounded-full transition-all">
  notifications
</button>
```

### Size Variants

| Size | Padding | Text | Usage |
|------|---------|------|-------|
| Small | `px-4 py-2` | `text-sm` | Nav CTA, compact actions |
| Medium | `px-6 py-3` | `text-base` | Standard actions |
| Large | `px-8 py-4` | `text-lg` | Hero CTA, primary actions |
| Extra Large | `px-10 py-5` | `text-lg` | Hero featured CTA |

### 13.5 Cards

#### Surface Card (Standard)

```html
<div class="bg-surface-container rounded-xl p-6 border border-white/5 hover:border-primary/30 transition-all">
  Content
</div>
```

#### Glass Card (Premium)

```html
<div class="glass-card rounded-2xl p-8 border border-white/5">
  Content
</div>
```

#### Gradient Card (Featured)

```html
<div class="bg-linear-to-br from-primary/10 to-transparent rounded-2xl p-8 border border-white/5">
  Content
</div>
```

#### Bento Stat Card

```html
<div class="bg-surface-container rounded-xl p-8 flex flex-col justify-between relative overflow-hidden">
  <div class="flex justify-between items-start mb-8">
    <span class="text-on-surface-variant text-sm font-medium">Label</span>
    <div class="p-2 bg-primary/10 rounded-lg">
      <span class="material-symbols-outlined text-primary">icon_name</span>
    </div>
  </div>
  <div>
    <h3 class="text-3xl font-black font-headline tracking-tighter">R$ 142.500</h3>
    <p class="text-xs text-emerald-400 flex items-center gap-1 mt-2">
      <span class="material-symbols-outlined text-xs">trending_up</span> +12.5%
    </p>
  </div>
</div>
```

#### Featured Article Card (Image Overlay)

```html
<div class="group relative overflow-hidden rounded-xl bg-surface-container border border-white/5">
  <img class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-40" src="..." />
  <div class="absolute inset-0 bg-linear-to-t from-surface via-surface/60 to-transparent"></div>
  <div class="absolute bottom-0 left-0 p-8 w-full">
    <span class="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Category</span>
    <h2 class="font-headline text-3xl font-extrabold text-white mb-4 group-hover:text-primary transition-colors">Title</h2>
    <p class="text-on-surface-variant mb-6 line-clamp-2">Description</p>
  </div>
</div>
```

### 13.6 Badges / Chips

#### Status Badge

```html
<!-- Success -->
<span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-green-500/10 text-green-400">Ativo</span>
<!-- Error -->
<span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-red-500/10 text-red-400">Vencido</span>
<!-- Primary -->
<span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-primary/10 text-primary">Em análise</span>
```

#### Inline Badge (Chip)

```html
<span class="px-4 py-1.5 rounded-full bg-surface-container-highest text-primary text-xs font-bold uppercase tracking-wider">
  Category
</span>
```

#### Filter Chip

```html
<!-- Active -->
<button class="bg-primary text-on-primary-fixed px-5 py-2 rounded-full text-sm font-semibold transition-all">All</button>
<!-- Inactive -->
<button class="bg-surface-container-highest text-primary px-5 py-2 rounded-full text-sm font-semibold hover:bg-surface-variant transition-all">Category</button>
```

### 13.7 Input Fields

#### Text Input

```html
<div>
  <label class="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1 mb-2 block">Label</label>
  <input class="w-full bg-surface-container-high border-none rounded-lg p-4 text-white focus:ring-1 focus:ring-primary/50 placeholder:text-zinc-700 transition-all" placeholder="..." type="text" />
</div>
```

#### Search Input (with icon)

```html
<div class="relative w-full max-w-md focus-within:ring-1 focus-within:ring-primary/50 rounded-lg">
  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">search</span>
  <input class="w-full bg-surface-container-high border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-0 placeholder:text-zinc-600" placeholder="Buscar..." type="text" />
</div>
```

#### Toggle Switch

```html
<label class="relative inline-flex items-center cursor-pointer">
  <input type="checkbox" class="sr-only peer" />
  <div class="w-14 h-7 bg-zinc-800 peer-focus:outline-none rounded-full peer-checked:bg-primary
    after:content-[''] after:absolute after:top-0.5 after:left-1
    after:bg-white after:border-gray-300 after:rounded-full after:w-6 after:h-6
    after:transition-all peer-checked:after:translate-x-full">
  </div>
</label>
```

### 13.8 Tables

```html
<table class="w-full">
  <thead>
    <tr class="bg-surface-container-low">
      <th class="px-8 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest text-left">Header</th>
    </tr>
  </thead>
  <tbody>
    <tr class="hover:bg-white/5 transition-colors border-b border-white/5 group">
      <td class="px-8 py-6 text-sm">Cell content</td>
    </tr>
  </tbody>
</table>
```

### 13.9 Timeline / Activity Feed

#### Activity Item

```html
<div class="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all">
  <div class="h-8 w-8 rounded-lg bg-secondary-container flex items-center justify-center shrink-0
    <span class="material-symbols-outlined text-sm text-white">icon</span>
  </div>
  <div class="flex-1">
    <p class="text-sm text-white">Activity description</p>
    <span class="text-[10px] font-bold text-zinc-600 uppercase">2 horas atrás</span>
  </div>
</div>
```

#### Timeline Entry

```html
<div class="flex items-center justify-between py-5 border-b border-white/5 last:border-0 hover:bg-purple-500/5 px-4 -mx-4 rounded-lg transition-colors">
  <div class="flex items-center gap-4">
    <div class="w-3 h-3 rounded-full bg-primary"></div>
    <div>
      <p class="font-bold text-white">Event title</p>
      <p class="text-xs text-on-surface-variant">Date / details</p>
    </div>
  </div>
  <span class="text-xs font-bold text-on-surface-variant">Status</span>
</div>
```

### 13.10 Toast Notification

```html
<div class="fixed bottom-8 right-8 glass-card border border-primary/30 py-4 px-6 rounded-xl flex items-center gap-4 shadow-2xl z-50">
  <div class="h-8 w-8 bg-primary rounded-full flex items-center justify-center shrink-0">
    <span class="material-symbols-outlined text-on-primary-fixed text-sm">check</span>
  </div>
  <div>
    <p class="text-sm font-bold text-white">Success message</p>
    <p class="text-xs text-on-surface-variant">Details here</p>
  </div>
</div>
```

### 13.11 Bar Chart

```html
<div class="h-64 flex items-end justify-between gap-4 px-4">
  <div class="flex-1 group cursor-pointer">
    <div class="bg-white/5 rounded-t-lg h-[60%] relative overflow-hidden group-hover:bg-primary/20 transition-colors">
      <div class="absolute bottom-0 left-0 right-0 h-full bg-linear-to-t from-primary-dim to-primary shadow-[0_0_20px_rgba(168,85,247,0.3)]"></div>
    </div>
    <p class="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter text-center mt-2">Jan</p>
  </div>
  <!-- Repeat for each bar -->
</div>
```

### 13.12 Hero Section (Public Pages)

```html
<section class="relative min-h-screen flex items-center pt-20 overflow-hidden">
  <!-- Background Glows -->
  <div class="absolute inset-0 z-0">
    <div class="absolute top-[-10%] right-[-10%] w-150 h-150 bg-primary/10 rounded-full blur-[120px]"></div>
    <div class="absolute bottom-[-10%] left-[-10%] w-100 h-100 bg-secondary/10 rounded-full blur-[100px]"></div>
  </div>
  <!-- Content -->
  <div class="container mx-auto px-8 z-10 grid md:grid-cols-12 gap-12 items-center">
    <div class="md:col-span-7">
      <span class="inline-block px-4 py-1 rounded-full bg-surface-container-highest text-primary font-label text-xs font-bold uppercase tracking-widest mb-6">
        Kicker
      </span>
      <h1 class="text-6xl md:text-8xl font-extrabold font-headline leading-[0.95] tracking-tighter mb-8">
        Headline <br/><span class="text-gradient">Gradient text.</span>
      </h1>
      <p class="text-xl md:text-2xl text-on-surface-variant max-w-xl mb-10 leading-relaxed">
        Description
      </p>
      <div class="flex flex-col sm:flex-row gap-4">
        <button class="bg-primary text-on-primary-fixed px-10 py-5 rounded-md font-bold text-lg hover:bg-primary-container transition-all flex items-center gap-2 group">
          Primary CTA
          <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
        <button class="border border-outline-variant/40 px-10 py-5 rounded-md font-bold text-lg hover:bg-surface-container transition-all">
          Secondary CTA
        </button>
      </div>
    </div>
    <div class="md:col-span-5 relative hidden md:block">
      <div class="rounded-2xl overflow-hidden shadow-2xl border border-white/5">
        <img class="w-full aspect-4/5 object-cover grayscale hover:grayscale-0 transition-all duration-700" src="..." />
      </div>
    </div>
  </div>
</section>
```

### 13.13 Editorial Header (Portal Pages)

```html
<div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
  <div class="max-w-2xl">
    <span class="text-xs font-bold tracking-[0.2em] text-primary uppercase block mb-2">Kicker</span>
    <h2 class="text-5xl font-extrabold font-headline tracking-tighter leading-tight">Page Title.</h2>
    <p class="text-on-surface-variant text-lg mt-4 max-w-lg">Description text.</p>
  </div>
  <div class="flex gap-4">
    <button class="px-6 py-3 bg-primary text-on-primary-fixed font-bold rounded-lg hover:bg-primary-container transition-all flex items-center gap-2">
      <span class="material-symbols-outlined text-[20px]">add_circle</span>
      Action
    </button>
  </div>
</div>
```

### 13.14 Footer

```html
<footer class="border-t border-white/5 bg-surface py-12 px-12">
  <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
    <div>
      <span class="text-xl font-black tracking-tighter text-white uppercase font-headline">Magistrate AI</span>
      <p class="text-xs text-zinc-600 mt-1">Tech-Legal Elite</p>
    </div>
    <div class="flex gap-8">
      <a class="text-xs uppercase tracking-widest text-zinc-600 hover:text-purple-300 transition-colors" href="#">Link</a>
    </div>
    <p class="text-xs text-zinc-600">© 2024 Magistrate AI. All rights reserved.</p>
  </div>
</footer>
```

---

## 14. Page Templates

### Category A: Public Website Pages

| Page | Folder | Layout | Key Sections |
|------|--------|--------|-------------|
| Home v1 | `p_gina_inicial_advocacia_trabalhista` | Floating nav + hero + sections + footer | Hero, features, stats, CTA, trust ticker |
| Home v2 | `p_gina_inicial_magistrado_ai_v2` | Floating nav + hero + sections + footer | Hero with image, solutions grid, social proof |
| Solutions | `solutions_magistrate_ai` | Floating nav + hero + bento + CTA | Hero, core solutions bento, tech viz, CTA |
| Services | `servi_os_magistrate_ai` | Floating nav + sections | Service cards, feature grids |
| Expertise | `expertise_magistrate_ai` | Floating nav + editorial | Expert profiles, specialties |
| Insights v1 | `insights_magistrate_ai_1` | Floating nav + editorial grid | Featured article, bento grid, article list |
| Insights v2 | `insights_magistrate_ai_2` | Floating nav + editorial grid | Alt layout for insights |
| FAQ | `perguntas_frequentes_magistrate_ai` | Floating nav + accordion | Question/answer expandable sections |
| Contact | `contact_magistrate_ai` | Floating nav + form | Contact form, map, info |

### Category B: Portal / Dashboard Pages

| Page | Folder | Layout | Key Components |
|------|--------|--------|---------------|
| Dashboard (Client) | `dashboard_do_cliente_magistrate_ai` | Sidebar + topbar + bento | Stat cards, charts, activity feed, featured case |
| Dashboard (Dynamic) | `dashboard_din_mico_do_cliente_magistrate_ai` | Sidebar + topbar + bento | Interactive stat cards, dynamic charts |
| Dashboard (Vibrant) | `dashboard_vibrante_magistrate_ai` | Sidebar + topbar + bento | Gradient cards, purple glow effects |
| My Cases | `meus_processos_magistrate_ai` | Sidebar + topbar + table | Case list table, filters, status badges |
| Case Timeline | `acompanhamento_de_processos_com_timeline_magistrate_ai` | Sidebar + topbar + timeline | Timeline view, milestone markers |
| Process Timeline | `timeline_de_processos_magistrate_ai` | Sidebar + topbar + timeline | Alternate timeline view |
| Appointments | `agendamentos_magistrate_ai` | Sidebar + topbar + calendar | Meeting cards, calendar grid |
| Finance | `financeiro_magistrate_ai` | Sidebar + topbar + bento | Balance cards, charts, invoice table |
| Profile | `meu_perfil_magistrate_ai` | Sidebar + topbar + form | Profile form, digital vault, upload zone |
| Insights (Portal) | (merged insights pages) | Sidebar + topbar + editorial | Article grid, featured content |
| Contracts | `gest_o_de_contratos_magistrate_ai` | Sidebar + topbar + table | Contract list, status tracking |
| Services & Contracts | `servi_os_e_contratos_magistrate_ai` | Sidebar + topbar + mixed | Service cards + contract management |

### Category C: Calculator / Tool Pages

| Page | Folder | Layout | Key Components |
|------|--------|--------|---------------|
| Overtime Calculator | `calculadora_de_horas_extras_magistrate_ai` | Sidebar + topbar + split | Input panel, result panel, breakdown |
| Vacation Calculator | `calculadora_de_f_rias_magistrate_ai` | Sidebar + topbar + split | Input panel, result panel, breakdown |
| 13th Salary Calculator | `calculadora_de_13_sal_rio_magistrate_ai` | Sidebar + topbar + split | Input panel, result panel, breakdown |
| Contract Generator | `gerador_de_contratos_magistrate_ai` | Sidebar + topbar + wizard | Step-by-step form, preview panel |

---

## 15. Do's and Don'ts

### DO

- **Use asymmetrical layouts.** Align headline left, body text to a 60% offset column right.
- **Use `primary` (#cc97ff) sparingly.** It's a "surgical strike" of color, not a wash.
- **Use generous spacing.** `spacing-16` to `spacing-24` for section margins. Space is luxury.
- **Achieve depth through surface layering.** Not through heavy shadows.
- **Use Kicker → Headline → Body pattern** for every section.
- **Use `on-surface-variant` (#ababab) for body text.** Reduces eye strain on dark backgrounds.
- **Use `cursor-pointer`** on all clickable/hoverable cards and interactive elements.
- **Use `group-hover`** to propagate hover effects from parent to children.

### DON'T

- **Don't use pure white (#ffffff) for large body text blocks.** Use `on-surface-variant`.
- **Don't use sharp corners.** Minimum `rounded-lg` on everything.
- **Don't use standard law firm iconography** (scales, gavels as decoration). Use abstract geometric shapes or tech-style icons.
- **Don't use 1px solid borders for section separation.** Use background shifts or spacing.
- **Don't use horizontal dividers (1px lines).** Use `spacing-6`+ or alternating backgrounds.
- **Don't use emojis as icons.** Always use Material Symbols Outlined SVG icons.
- **Don't use linear easing** for UI transitions. Use `ease-out` or default Tailwind easing.
- **Don't use animations longer than 500ms** for UI interactions (700ms only for hero images).
- **Don't use `hover:scale` that causes layout shift.** Use `transform` for scale effects.

---

## 16. Accessibility

### Color Contrast

- All text meets **WCAG AA** minimum (4.5:1 for normal text, 3:1 for large text).
- `on-surface` (#ffffff) on `surface` (#0e0e0e) = **21:1** ratio.
- `on-surface-variant` (#ababab) on `surface` (#0e0e0e) = **9.5:1** ratio.
- `primary` (#cc97ff) on `surface` (#0e0e0e) = **8.2:1** ratio.

### Focus States

All interactive elements must have visible focus rings:

```html
focus:ring-1 focus:ring-primary/50
focus-visible:ring-2 focus-visible:ring-primary
```

### Keyboard Navigation

- Tab order must follow visual order.
- All interactive elements reachable via keyboard.
- Modal trap focus (when implemented).

### Reduced Motion

Respect `prefers-reduced-motion: reduce` for all animations and transitions.

### Form Accessibility

- Every `<input>` must have an associated `<label>`.
- Error messages placed near the problematic field.
- Use `aria-label` on icon-only buttons.

### Image Accessibility

- All meaningful images must have descriptive `alt` text.
- Decorative images: `alt=""` or CSS background.

---

## 17. Pre-Delivery Checklist

### Visual Quality
- [ ] No emojis used as icons (Material Symbols Outlined only)
- [ ] All icons from consistent icon set
- [ ] Hover states don't cause layout shift
- [ ] Gradient text uses `.text-gradient` class
- [ ] Ghost borders at correct opacity (white/5 or white/10)

### Interaction
- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states provide clear visual feedback
- [ ] Transitions: 150–300ms for interactions, up to 500ms for reveals
- [ ] `active:scale-95` on all buttons
- [ ] Focus states visible for keyboard navigation

### Dark Mode
- [ ] No element uses white/light backgrounds
- [ ] Body text uses `on-surface-variant`, NOT pure white
- [ ] All surfaces follow the layering hierarchy
- [ ] Glass effects use correct backdrop-blur values

### Layout
- [ ] Floating nav has proper spacing from edges
- [ ] No content hidden behind fixed navbars (`pt-20`+ or `pt-28`)
- [ ] Portal pages: sidebar `w-64` + main `ml-64 pt-28`
- [ ] No horizontal scroll on mobile
- [ ] Container max-width consistent within page type

### Accessibility
- [ ] All images have `alt` text
- [ ] Form inputs have labels
- [ ] `prefers-reduced-motion` respected
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)
- [ ] Icon-only buttons have `aria-label`

### Typography
- [ ] Headlines use `font-headline` (Manrope)
- [ ] Body text uses `font-body` (Inter)
- [ ] Kicker pattern: `text-xs font-bold uppercase tracking-widest text-primary`
- [ ] No text below `text-[10px]`
- [ ] Line lengths don't exceed `max-w-xl` for body text

### Consistency
- [ ] Same Tailwind config across all pages
- [ ] Same font imports across all pages
- [ ] Same icon library across all pages
- [ ] Same component patterns reused across pages

---

## 18. Implementation Guide (Next.js / React)

> This section bridges the prototype HTML with the actual Next.js 16 + React 19 implementation.

### 18.1 Tech Stack (Actual Implementation)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 |
| CSS | Tailwind CSS 4 + CSS variables in `globals.css` |
| Fonts | `next/font/google`: Manrope, Inter, Montserrat, Geist_Mono |
| Icons | **Lucide React** (`lucide-react`) — NOT Material Symbols |
| Components | shadcn/ui + custom components |
| State | React Hook Form, Zod, SWR |
| Charts | Recharts |
| Animation | Framer Motion + tw-animate-css |
| Auth | Supabase Auth |

### 18.2 Icon Mapping (Material Symbols → Lucide React)

| Material Symbol | Lucide Component | Import |
|-----------------|-----------------|--------|
| `dashboard` | `LayoutDashboard` | `lucide-react` |
| `description` | `FileText` | `lucide-react` |
| `gavel` | `Scale` | `lucide-react` |
| `calendar_today` | `Calendar` | `lucide-react` |
| `payments` / `credit_card` | `CreditCard` | `lucide-react` |
| `person` | `User` | `lucide-react` |
| `search` | `Search` | `lucide-react` |
| `help` | `HelpCircle` | `lucide-react` |
| `schedule` | `Clock` | `lucide-react` |
| `edit_document` | `FilePen` | `lucide-react` |
| `verified_user` / `verified` | `ShieldCheck` | `lucide-react` |
| `calculate` | `Calculator` | `lucide-react` |
| `trending_up` | `TrendingUp` | `lucide-react` |
| `visibility` | `Eye` | `lucide-react` |
| `download` | `Download` | `lucide-react` |
| `check_circle` | `CheckCircle` | `lucide-react` |
| `cloud_upload` | `CloudUpload` | `lucide-react` |
| `account_balance_wallet` | `Wallet` | `lucide-react` |
| `workspace_premium` / `award` | `Award` | `lucide-react` |
| `auto_awesome` | `Sparkles` | `lucide-react` |
| `notifications` | `Bell` | `lucide-react` |
| `chat_bubble` | `MessageSquare` | `lucide-react` |
| `settings` | `Settings` | `lucide-react` |
| `logout` | `LogOut` | `lucide-react` |
| `add` / `add_circle` | `Plus` / `PlusCircle` | `lucide-react` |
| `arrow_forward` | `ArrowRight` | `lucide-react` |
| `chevron_right` | `ChevronRight` | `lucide-react` |
| `chevron_left` | `ChevronLeft` | `lucide-react` |
| `expand_more` | `ChevronDown` | `lucide-react` |
| `more_vert` | `MoreVertical` | `lucide-react` |
| `filter_list` | `Filter` | `lucide-react` |
| `print` | `Printer` | `lucide-react` |
| `article` | `Newspaper` | `lucide-react` |
| `bookmark` | `Bookmark` | `lucide-react` |
| `tune` | `SlidersHorizontal` | `lucide-react` |
| `info` | `Info` | `lucide-react` |
| `bolt` | `Zap` | `lucide-react` |
| `hub` | `Network` | `lucide-react` |
| `terminal` | `Terminal` | `lucide-react` |
| `event` | `CalendarDays` | `lucide-react` |
| `event_upcoming` | `CalendarClock` | `lucide-react` |
| `video_chat` | `Video` | `lucide-react` |
| `support_agent` | `Headphones` | `lucide-react` |
| `beach_access` | `Palmtree` | `lucide-react` |
| `work` | `Briefcase` | `lucide-react` |
| `apartment` | `Building` | `lucide-react` |
| `shopping_cart` | `ShoppingCart` | `lucide-react` |
| `shield_person` | `ShieldCheck` | `lucide-react` |
| `lock` | `Lock` | `lucide-react` |
| `enhanced_encryption` | `KeyRound` | `lucide-react` |
| `home_pin` | `MapPin` | `lucide-react` |
| `assignment_ind` | `ClipboardList` | `lucide-react` |
| `open_in_new` | `ExternalLink` | `lucide-react` |
| `trending_down` | `TrendingDown` | `lucide-react` |
| `analytics` | `BarChart3` | `lucide-react` |
| `picture_as_pdf` | `FileDown` | `lucide-react` |
| `ios_share` | `Share` | `lucide-react` |
| `rate_review` | `MessageCircle` | `lucide-react` |
| `contract_edit` | `FileEdit` | `lucide-react` |
| `history_edu` | `History` | `lucide-react` |
| `ink_pen` | `Pen` | `lucide-react` |
| `calendar_add_on` | `CalendarPlus` | `lucide-react` |
| `query_stats` | `LineChart` | `lucide-react` |
| `troubleshoot` | `Bug` | `lucide-react` |
| `link_off` | `Unlink` | `lucide-react` |
| `person_edit` | `UserPen` | `lucide-react` |
| `badge` | `BadgeCheck` | `lucide-react` |
| `sentiment_dissatisfied` | `Frown` | `lucide-react` |
| `equalizer` | `BarChart2` | `lucide-react` |
| `payment` | `Banknote` | `lucide-react` |

### 18.3 React Component Inventory

#### Already Built (`src/features/website/`)

| Component | File | Props |
|-----------|------|-------|
| `WebsiteShell` | layout/website-shell.tsx | `children` |
| `Header` | layout/header.tsx | — |
| `Footer` | layout/footer.tsx | — |
| `SectionHeader` | sections/section-header.tsx | `kicker?, title, description?, align?, actions?, className?` |
| `EditorialHeader` | sections/editorial-header.tsx | `kicker, title, description?, actions?` |
| `GlowBackground` | effects/glow-background.tsx | `variant: "hero" \| "section"` |
| `GlassCard` | cards/glass-card.tsx | `children, className?, hover?` |
| `FeatureCard` | cards/feature-card.tsx | `icon, title, description, tags?, href?, wide?, className?` |
| `ArticleCard` | cards/article-card.tsx | `title, description, category, date, readTime, imageSrc, imageAlt, href, variant` |
| `StatCard` | cards/stat-card.tsx | `label, value, icon, change?, changeLabel?` |
| `FilterChips` | shared/filter-chips.tsx | `options, activeOption, onSelect, className?` |
| `ActivityItem` | shared/activity-item.tsx | `icon, iconBg?, title, timestamp, className?` |
| `TimelineEntry` | shared/timeline-entry.tsx | `title, subtitle, status, icon, dotColor, isLast` |

#### Already Built (`src/features/portal/`)

| Component | File | Props |
|-----------|------|-------|
| `PortalShell` | layout/portal-shell.tsx | `children` |
| `PortalHeader` | layout/header.tsx | — |
| `PortalSidebar` | layout/sidebar.tsx | — |

#### Barrel Export (`src/features/website/index.ts`)

```ts
export { HomePage, WebsiteShell, Header, Footer }
export { SectionHeader, EditorialHeader }
export { GlowBackground }
export { GlassCard, StatCard, FeatureCard, ArticleCard }
export { FilterChips, ActivityItem, TimelineEntry }
```

### 18.4 Prototype → Route Mapping

#### Website (Public)

| Prototype Folder | Route | Status |
|-----------------|-------|--------|
| `p_gina_inicial_magistrado_ai_v2` | `/` | Existing (needs refactor) |
| `servi_os_magistrate_ai` + `servi_os_e_contratos_magistrate_ai` | `/servicos` | Existing (needs refactor) |
| `solutions_magistrate_ai` | `/solucoes` | Existing (needs refactor) |
| `expertise_magistrate_ai` | `/expertise` | Existing (needs refactor) |
| `insights_magistrate_ai_1` | `/insights` | Existing (needs refactor) |
| `insights_magistrate_ai_2` | `/insights/tendencias` | Existing (needs refactor) |
| `perguntas_frequentes_magistrate_ai` | `/faq` | Existing (needs refactor) |
| `contact_magistrate_ai` | `/contato` | Existing (needs refactor) |

#### Portal (Authenticated)

| Prototype Folder | Route | Status |
|-----------------|-------|--------|
| `dashboard_vibrante_magistrate_ai` (primary) | `/portal/dashboard` | Needs implementation |
| `meus_processos_magistrate_ai` | `/portal/processos` | Needs implementation |
| `acompanhamento_de_processos_com_timeline_magistrate_ai` | `/portal/processos/[id]` | Needs implementation |
| `timeline_de_processos_magistrate_ai` | `/portal/processos/[id]/timeline` | Needs implementation |
| `financeiro_magistrate_ai` | `/portal/financeiro` | Existing (needs refactor) |
| `agendamentos_magistrate_ai` | `/portal/agendamentos` | Needs implementation |
| `gest_o_de_contratos_magistrate_ai` | `/portal/contratos` | Needs implementation |
| `gerador_de_contratos_magistrate_ai` | `/portal/contratos/gerador` | Existing (needs refactor) |
| `meu_perfil_magistrate_ai` | `/portal/perfil` | Existing (needs refactor) |
| `calculadora_de_f_rias_magistrate_ai` | `/portal/calculadoras/ferias` | Needs implementation |
| `calculadora_de_13_sal_rio_magistrate_ai` | `/portal/calculadoras/13-salario` | Needs implementation |
| `calculadora_de_horas_extras_magistrate_ai` | `/portal/calculadoras/horas-extras` | Needs implementation |
