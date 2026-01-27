# Design System - Landing Page

> **Override Rules:** These rules override MASTER.md for the landing page (`/` route).

---

**Page:** Landing Page (Home)
**Route:** `/`
**Last Updated:** 2026-01-27
**Status:** Production

---

## Page Overview

A landing page principal do Zattar Advogados segue o padrão **Hero + Features + Testimonials + CTA**, otimizado para conversao em servicos juridicos.

### Estrutura de Secoes

| # | Secao | ID | Background | Altura |
|---|-------|-----|------------|--------|
| 1 | Header | - | Transparent/Glass | Fixed 60px |
| 2 | Hero | `inicio` | `bg-background` | min-h-[80vh] |
| 3 | Direitos Essenciais | `direitos-essenciais` | `bg-muted` | auto |
| 4 | Etapas Processuais | `processo` | `bg-background` | auto |
| 5 | Quem Somos | `quem-somos` | `bg-muted` | auto |
| 6 | Consultoria | `consultoria` | `bg-background` | auto |
| 7 | Footer | - | `bg-muted/60` | auto |

---

## Color Palette (Current Implementation)

### Brand Colors (OKLCH)

| Token | OKLCH Value | Hex Approx | Usage |
|-------|-------------|------------|-------|
| `--primary` | `oklch(0.45 0.25 285)` | `#5523eb` | CTAs, links, foco |
| `--highlight` | `oklch(0.68 0.22 45)` | `#d97706` | Badges, alertas |
| `--background` | `oklch(0.96 0.01 270)` | `#f5f5f7` | Fundo principal |
| `--foreground` | `oklch(0.24 0 0)` | `#1f1f1f` | Texto principal |
| `--muted` | `oklch(0.96 0.01 270)` | `#f5f5f7` | Fundos alternados |
| `--muted-foreground` | `oklch(0.55 0.02 270)` | `#6b7280` | Texto secundario |

### Section Color Mapping

| Section | Primary Color | Accent Icons |
|---------|--------------|--------------|
| Hero | Purple (`primary`) | - |
| Direitos | Purple icons on `primary/10` | Lucide icons |
| Etapas | Multi-color (blue, amber, green, purple, red) | Gradient backgrounds |
| Quem Somos | Per-pillar colors (red, blue, indigo, green, amber) | - |
| Consultoria | Per-pillar colors (blue, green, red, amber) | - |

---

## Typography

### Font Stack

```css
--font-sans: var(--font-inter);      /* Body text */
--font-heading: var(--font-montserrat); /* Headings */
--font-mono: var(--font-geist-mono);  /* Code/IDs */
```

### Type Scale (Landing Page Specific)

| Element | Mobile | Desktop | Weight | Font |
|---------|--------|---------|--------|------|
| H1 (Hero) | `text-5xl` | `text-7xl` | bold | Montserrat |
| H2 (Section) | `text-3xl` | `text-5xl` | bold | Montserrat |
| H3 (Card Title) | `text-lg` | `text-xl` | semibold | Montserrat |
| Body | `text-base` | `text-lg` | normal | Inter |
| Caption | `text-sm` | `text-sm` | normal | Inter |

### Line Height

- Body text: `leading-relaxed` (1.625)
- Headings: `leading-tight` ou `leading-[1.2]`

---

## Spacing System

### Container

```css
.container {
  max-width: 72rem; /* max-w-6xl = 1152px */
  padding-inline: 1rem; /* px-4 mobile */
  padding-inline: 1.5rem; /* md:px-6 desktop */
}
```

### Section Padding

```css
section {
  padding-block: 4rem; /* py-16 mobile */
  padding-block: 6rem; /* sm:py-24 desktop */
}
```

### Component Gaps

| Context | Mobile | Desktop |
|---------|--------|---------|
| Grid cards | `gap-8` | `gap-8` |
| Button group | `gap-4` | `gap-4` |
| Feature list | `gap-6` | `gap-6` |
| Section title to content | `mb-16` | `mb-16` |

---

## Component Specifications

### Header (Glassmorphism)

```tsx
// Scroll state detection
const [isScrolled, setIsScrolled] = useState(false);

// Glass effect classes
className={cn(
  "transition-all duration-300",
  isScrolled
    ? "bg-white/90 backdrop-blur-xl shadow-lg"
    : "bg-transparent backdrop-blur-none"
)}
```

**Z-Index:** `z-50`
**Position:** `fixed top-0 left-0 right-0`

### Buttons

| Variant | Classes |
|---------|---------|
| Primary | `bg-primary text-primary-foreground rounded-full` |
| Outline | `border-border bg-transparent rounded-full shadow-none` |
| Size lg | `h-11 px-8 text-base` |

### Cards (Direitos Section)

```css
.feature-card {
  padding: 1.5rem; /* p-6 */
  border-radius: 0.75rem; /* rounded-xl */
  border: 1px solid hsl(var(--border) / 0.5);
  background: var(--background);
  box-shadow: var(--shadow-sm);
  transition: all 200ms ease;
  cursor: pointer; /* IMPORTANTE */
}

.feature-card:hover {
  border-color: var(--border);
  box-shadow: var(--shadow-md);
}
```

### Icon Containers

```css
.icon-container {
  height: 3rem; /* h-12 */
  width: 3rem; /* w-12 */
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem; /* rounded-lg */
  background: hsl(var(--primary) / 0.1);
  color: var(--primary);
}
```

### Badges (Section Labels)

```css
.section-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem; /* px-3 py-1 */
  border-radius: 0.5rem; /* rounded-lg */
  background: hsl(var(--primary) / 0.1);
  color: var(--primary);
  font-size: 0.875rem; /* text-sm */
  font-weight: 600; /* font-semibold */
}
```

---

## Animation Guidelines

### Framer Motion (Etapas Section)

```tsx
// Floating animation
const variants = {
  initial: { y: 0, opacity: 0.8 },
  animate: {
    y: -10,
    opacity: 1,
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
};
```

### CSS Transitions

- **Duration:** 150-300ms para micro-interacoes
- **Easing:** `ease-in-out` (padrao Tailwind)
- **Properties:** Preferir `transform` e `opacity`

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Mobile | < 640px | Single column, stacked |
| `sm` | >= 640px | Minor adjustments |
| `md` | >= 768px | 2-column grids, desktop nav |
| `lg` | >= 1024px | 3-column grids, side images |
| `xl` | >= 1280px | Max container width |

### Grid Configurations

```css
/* Direitos Section */
.grid-features {
  grid-template-columns: 1fr; /* mobile */
  grid-template-columns: repeat(2, 1fr); /* md */
  grid-template-columns: repeat(3, 1fr); /* lg */
}

/* Quem Somos / Consultoria */
.grid-content {
  grid-template-columns: 1fr; /* mobile */
  grid-template-columns: repeat(2, 1fr); /* lg */
  gap: 4rem;
}
```

---

## Icon Usage

### Primary Icon Set: Lucide React

```tsx
import { FileText, PiggyBank, Landmark, ShieldCheck } from "lucide-react";
```

### Secondary Icon Set: Mynaui

```tsx
import { Menu, Search, Message } from "@mynaui/icons-react";
import { BrandInstagram, BrandLinkedin, BrandFacebook } from "@mynaui/icons-react";
```

### Icon Sizing

| Context | Size | Class |
|---------|------|-------|
| Navigation | 24px | `h-6 w-6` |
| Feature icon | 24px | `h-6 w-6` |
| Button icon | 20px | `h-5 w-5` |
| Small indicator | 16px | `h-4 w-4` |

---

## Accessibility Requirements

### Focus States

```css
*:focus-visible {
  outline: none;
  ring: 2px;
  ring-color: var(--primary);
  ring-offset: 2px;
  ring-offset-color: var(--background);
}
```

### Touch Targets

- Minimum: `44x44px`
- Buttons: `min-h-[44px]`
- Nav links: `px-4 py-2` (adequate padding)

### Color Contrast

- Body text on background: >= 4.5:1
- Large text (18px+ bold): >= 3:1
- Interactive elements: >= 3:1

---

## Anti-Patterns to Avoid

| Issue | Current | Fix |
|-------|---------|-----|
| Emoji as icon | Footer has `heart` emoji | Use `Heart` icon from Lucide |
| Missing cursor | Cards lack `cursor-pointer` | Add `cursor-pointer` |
| Empty hrefs | `href="#"` on cards | Use proper links or buttons |
| Glass in dark mode | `bg-white/90` hardcoded | Use `bg-background/90` |

---

## Pre-Delivery Checklist

- [ ] All cards have `cursor-pointer`
- [ ] No emojis used as icons
- [ ] All `href="#"` replaced with proper actions
- [ ] `prefers-reduced-motion` query in animations
- [ ] Focus states visible on all interactive elements
- [ ] Minimum 44x44px touch targets
- [ ] Text contrast ratio >= 4.5:1
- [ ] Images have descriptive alt text
- [ ] Header works in both light and dark mode
