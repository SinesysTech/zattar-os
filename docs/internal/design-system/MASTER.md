# Design System Master File - Zattar Advogados

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Zattar Advogados
**Updated:** 2026-01-27
**Category:** Legal Services / Labor Law
**Framework:** Next.js 15+ / React 19 / Tailwind CSS v4 / shadcn/ui

---

## Design Philosophy

**Style:** Modern Professional with Trust & Authority elements

This design system balances:
- **Modernity** - Clean interfaces, subtle animations, contemporary typography
- **Trust** - Professional color palette, clear hierarchy, accessible design
- **Authority** - Prominent credentials, metrics, social proof

**Best For:** Modern law firms targeting younger demographics and digital-native clients while maintaining professional credibility.

---

## Color System (OKLCH)

### Brand Colors

| Token | OKLCH Value | Approx Hex | Usage |
|-------|-------------|------------|-------|
| `--primary` | `oklch(0.45 0.25 285)` | `#5523eb` | CTAs, links, focus states, brand identity |
| `--highlight` | `oklch(0.68 0.22 45)` | `#d97706` | Badges, alerts, status indicators |
| `--brand` | `oklch(0.45 0.25 285)` | `#5523eb` | Pure Zattar Purple |

### Semantic Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--background` | `oklch(0.96 0.01 270)` | `oklch(0.18 0 0)` | Page background |
| `--foreground` | `oklch(0.24 0 0)` | `oklch(0.98 0 0)` | Primary text |
| `--card` | `oklch(1 0 0)` | `oklch(0.24 0 0)` | Card backgrounds |
| `--muted` | `oklch(0.96 0.01 270)` | `oklch(0.3 0 0)` | Alternating sections |
| `--muted-foreground` | `oklch(0.55 0.02 270)` | `oklch(0.7 0 0)` | Secondary text |
| `--border` | `oklch(0.88 0 0)` | `oklch(1 0 0 / 0.15)` | Borders, dividers |
| `--destructive` | `oklch(0.6 0.2 25)` | `oklch(0.6 0.2 25)` | Error states |

### Section Color Palette

Per-section accent colors for visual variety:

| Color | Class | Sections |
|-------|-------|----------|
| Blue | `text-blue-500` | Peticao Inicial, Compliance |
| Amber | `text-amber-500` | Audiencia, Risco, Consultoria Preventiva |
| Green | `text-green-500` | Conciliacao, Atuacao Completa, Diagnostico |
| Purple | `text-purple-500` | Recurso |
| Red | `text-red-500` | Tribunais, Nossa Causa, Cultura |
| Indigo | `text-indigo-500` | Vinculo Empregaticio |

---

## Typography

### Font Stack

```css
--font-sans: var(--font-inter);        /* Body text, UI */
--font-heading: var(--font-montserrat); /* Headlines, titles */
--font-mono: var(--font-geist-mono);    /* Code, IDs, numbers */
```

### Type Scale

| Element | Mobile | Tablet | Desktop | Weight | Font |
|---------|--------|--------|---------|--------|------|
| H1 (Hero) | `text-4xl` | `text-5xl` | `text-6xl`/`text-7xl` | bold | Montserrat |
| H2 (Section) | `text-3xl` | `text-4xl` | `text-5xl` | bold | Montserrat |
| H3 (Subsection) | `text-xl` | `text-2xl` | `text-3xl` | bold | Montserrat |
| H4 (Card title) | `text-lg` | `text-lg` | `text-xl` | semibold | Montserrat |
| Body | `text-base` | `text-base` | `text-lg` | normal | Inter |
| Body small | `text-sm` | `text-sm` | `text-sm` | normal | Inter |
| Caption | `text-xs` | `text-xs` | `text-xs` | normal | Inter |

### Line Height

- Headlines: `leading-tight` or `leading-[1.15]`
- Body text: `leading-relaxed` (1.625)
- UI text: `leading-normal` (1.5)

---

## Spacing System

### Container

```css
.container {
  max-width: 72rem; /* max-w-6xl = 1152px */
  margin-inline: auto;
  padding-inline: 1rem;    /* px-4 */
}

@media (min-width: 768px) {
  .container {
    padding-inline: 1.5rem; /* md:px-6 */
  }
}
```

### Section Padding

```css
section {
  padding-block: 4rem;  /* py-16 */
}

@media (min-width: 640px) {
  section {
    padding-block: 6rem; /* sm:py-24 */
  }
}
```

### Spacing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `gap-2` | 8px | Icon + text |
| `gap-4` | 16px | Button groups, inline elements |
| `gap-6` | 24px | List items, feature rows |
| `gap-8` | 32px | Card grids |
| `mb-16` | 64px | Section title to content |
| `mt-16` | 64px | CTA after content |

---

## Component Specifications

### Buttons

| Variant | Classes |
|---------|---------|
| Primary | `bg-primary text-primary-foreground rounded-full min-h-[48px] px-8` |
| Outline | `border-border bg-transparent rounded-full min-h-[48px] px-8 shadow-none` |
| Ghost | `hover:bg-accent hover:text-accent-foreground rounded-md` |

**Touch Target:** Minimum `min-h-[48px]` for accessibility (exceeds WCAG 44px requirement)

### Cards

```css
.card {
  padding: 1.5rem; /* p-6 */
  border-radius: 0.75rem; /* rounded-xl */
  border: 1px solid hsl(var(--border) / 0.5);
  background: var(--card);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05); /* shadow-sm */
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  border-color: var(--border);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1); /* shadow-md */
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

### Section Badges

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

### Header (Glassmorphism)

```tsx
// Scroll-triggered glass effect
className={cn(
  "transition-all duration-300",
  isScrolled
    ? "bg-background/95 backdrop-blur-xl shadow-lg dark:bg-background/90"
    : "bg-transparent backdrop-blur-none"
)}
```

---

## Animation Guidelines

### Duration

- Micro-interactions: `150-200ms`
- Content transitions: `200-300ms`
- Page transitions: `300-500ms`
- Never exceed `500ms` for UI animations

### Easing

- Enter: `ease-out`
- Exit: `ease-in`
- State changes: `ease-in-out`

### Reduced Motion

All animations MUST respect `prefers-reduced-motion`:

```tsx
import { useReducedMotion } from "framer-motion";

const shouldReduceMotion = useReducedMotion();

const variants = {
  animate: shouldReduceMotion
    ? { opacity: 1 } // Static state
    : { opacity: 1, y: 0, transition: { ... } } // Animated
};
```

### CSS Fallback

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Icon Libraries

### Primary: Lucide React

Used for feature icons, navigation, and content.

```tsx
import { Scale, Shield, Award, Users } from "lucide-react";
```

### Secondary: Mynaui Icons

Used for brand social icons and specific UI elements.

```tsx
import { BrandInstagram, BrandLinkedin, BrandFacebook } from "@mynaui/icons-react";
import { Menu, Search, Message } from "@mynaui/icons-react";
```

### Icon Sizes

| Context | Size | Class |
|---------|------|-------|
| Navigation | 24px | `h-6 w-6` |
| Feature/card | 24px | `h-6 w-6` |
| Button inline | 20px | `h-5 w-5` |
| Badge/indicator | 16px | `h-4 w-4` |

---

## Accessibility Standards

### Color Contrast

- Body text: >= 4.5:1 (WCAG AA)
- Large text (18px+ bold): >= 3:1
- UI components: >= 3:1

### Focus States

```css
*:focus-visible {
  outline: none;
  ring: 2px;
  ring-color: var(--primary);
  ring-offset: 2px;
  ring-offset-color: var(--background);
}

/* Hide focus on mouse click */
*:focus:not(:focus-visible) {
  outline: none;
  ring: 0;
}
```

### Touch Targets

- Minimum: `44x44px` (WCAG recommendation)
- Preferred: `48x48px` (implemented via `min-h-[48px]`)
- Spacing between targets: >= 8px (`gap-2`)

### ARIA Labels

- Icon-only buttons: MUST have `aria-label`
- Images: MUST have descriptive `alt` text
- Navigation: Use `aria-current="page"` for active state

---

## Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Base | < 640px | Single column, stacked layouts |
| `sm` | >= 640px | Minor spacing adjustments |
| `md` | >= 768px | Desktop nav, 2-col grids |
| `lg` | >= 1024px | 3-col grids, side images |
| `xl` | >= 1280px | Max container, large typography |

---

## Anti-Patterns (DO NOT USE)

| Issue | Problem | Solution |
|-------|---------|----------|
| Emojis as icons | Inconsistent, inaccessible | Use SVG icons (Lucide/Mynaui) |
| Missing cursor:pointer | Poor interaction feedback | Add to all clickable elements |
| Empty href="#" | Navigation issues, a11y problems | Use buttons or proper links |
| Hardcoded light colors | Breaks dark mode | Use CSS variables |
| Long animations (>500ms) | Feels sluggish | Keep under 300ms |
| Instant state changes | Jarring experience | Add 150-200ms transition |
| Invisible focus states | Keyboard users can't navigate | Ensure visible focus ring |
| Continuous decorative animations | Distracting, a11y issue | Use for loading only |

---

## Pre-Delivery Checklist

Before deploying any UI changes, verify:

### Visual Quality
- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Lucide/Mynaui)
- [ ] Colors use CSS variables, not hardcoded values
- [ ] Dark mode tested and working

### Interaction
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Focus states visible for keyboard navigation
- [ ] Touch targets minimum 44x44px

### Accessibility
- [ ] Text contrast ratio >= 4.5:1
- [ ] All images have descriptive alt text
- [ ] Icon buttons have aria-label
- [ ] `prefers-reduced-motion` respected

### Responsive
- [ ] Tested at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on any viewport
- [ ] No content hidden behind fixed elements

### Performance
- [ ] Images use Next.js Image with sizes prop
- [ ] No layout shift on load
- [ ] Animations use transform/opacity (not width/height)
