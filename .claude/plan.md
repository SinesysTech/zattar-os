# Design System Implementation Plan

## Executive Summary

O app já possui uma **fundação sólida** com tokens OKLCH, Typography component, e sistema de variantes semânticas. O problema não é falta de estrutura, mas **inconsistências de uso** e **gaps em tokens específicos**.

Esta proposta foca em **consolidar e expandir** o design system existente, não substituí-lo.

---

## Current State Analysis

### What's Working Well
| Component | Status | Location |
|-----------|--------|----------|
| OKLCH Color System | Excellent | `globals.css:89-205` |
| Brand Tokens | Excellent | `--brand`, `--highlight` |
| Semantic Badge Variants | Excellent | `lib/design-system/variants.ts` |
| Typography Component | Good | `components/ui/typography.tsx` |
| Spacing Tokens | Good | `lib/design-system/tokens.ts` |
| PageShell Component | Good | `components/shared/page-shell.tsx` |

### Gaps Identified

1. **Hardcoded Colors in Use**
   - `text-red-600`, `text-amber-600`, `text-green-500` used directly
   - `bg-white dark:bg-gray-950` instead of `bg-card`
   - ~40+ instances across the codebase

2. **Missing Semantic Status Colors**
   - No explicit `--success`, `--warning`, `--info` CSS variables
   - Colors exist in badge variants but not as global tokens

3. **Typography Inconsistencies**
   - `text-2xl`, `text-sm`, `text-lg` used ad-hoc
   - Typography component exists but underutilized
   - Missing fluid typography (clamp-based)

4. **Spacing Not Standardized**
   - `SPACING_CLASSES` exist but not enforced
   - Gaps like `gap-2`, `gap-4`, `gap-6` used inconsistently

---

## Implementation Plan

### Phase 1: Extend Color Tokens (globals.css)

Add semantic status colors that can be used globally:

```css
:root {
  /* Semantic Status Colors */
  --success: oklch(0.65 0.18 145);       /* Green */
  --success-foreground: oklch(0.98 0 0);
  --warning: oklch(0.75 0.18 85);        /* Amber */
  --warning-foreground: oklch(0.2 0 0);
  --info: oklch(0.6 0.18 250);           /* Blue */
  --info-foreground: oklch(0.98 0 0);

  /* Surface Tokens (layering) */
  --surface-1: oklch(0.98 0.005 270);    /* Subtle bg */
  --surface-2: oklch(0.96 0.01 270);     /* Cards on surface-1 */
  --surface-3: oklch(0.94 0.01 270);     /* Hover states */

  /* Interactive States */
  --hover: oklch(0 0 0 / 0.04);
  --active: oklch(0 0 0 / 0.08);
  --disabled-opacity: 0.5;
}

.dark {
  --success: oklch(0.7 0.18 145);
  --success-foreground: oklch(0.98 0 0);
  --warning: oklch(0.78 0.16 85);
  --warning-foreground: oklch(0.15 0 0);
  --info: oklch(0.65 0.18 250);
  --info-foreground: oklch(0.98 0 0);

  --surface-1: oklch(0.2 0 0);
  --surface-2: oklch(0.24 0 0);
  --surface-3: oklch(0.28 0 0);

  --hover: oklch(1 0 0 / 0.04);
  --active: oklch(1 0 0 / 0.08);
}
```

**Map to Tailwind in @theme inline:**
```css
@theme inline {
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
  --color-surface-1: var(--surface-1);
  --color-surface-2: var(--surface-2);
  --color-surface-3: var(--surface-3);
}
```

### Phase 2: Fluid Typography Scale (globals.css)

Add responsive typography utilities using CSS clamp:

```css
@layer components {
  /* Fluid Display Headings */
  .text-display-1 {
    font-size: clamp(2.25rem, 5vw, 3.75rem); /* 36-60px */
    line-height: 1.1;
    letter-spacing: -0.02em;
    @apply font-heading font-bold;
  }

  .text-display-2 {
    font-size: clamp(1.875rem, 4vw, 3rem); /* 30-48px */
    line-height: 1.15;
    letter-spacing: -0.02em;
    @apply font-heading font-bold;
  }

  /* Page Headings (already have typography-h1 etc, enhance them) */
  .text-page-title {
    @apply typography-h1; /* Reuse existing */
  }

  .text-section-title {
    @apply typography-h2;
  }

  .text-card-title {
    @apply typography-h3;
  }

  /* Body Text Variants */
  .text-body-lg {
    @apply text-lg leading-relaxed text-foreground;
  }

  .text-body {
    @apply text-base leading-relaxed text-foreground;
  }

  .text-body-sm {
    @apply text-sm leading-normal text-foreground;
  }

  /* Supporting Text */
  .text-label {
    @apply text-sm font-medium leading-none text-foreground;
  }

  .text-caption {
    @apply text-xs leading-normal text-muted-foreground;
  }

  .text-helper {
    @apply text-sm leading-normal text-muted-foreground;
  }

  /* Mono/Code */
  .text-code {
    @apply font-mono text-sm;
  }

  .text-data {
    @apply font-mono text-sm tabular-nums;
  }
}
```

### Phase 3: Spacing Semantic Tokens (tokens.ts)

Expand semantic spacing for common use cases:

```typescript
export const SPACING_SEMANTIC = {
  // Page Layout
  page: {
    padding: 'p-4 sm:p-6 lg:p-8',
    gap: 'gap-6 lg:gap-8',
  },

  // Section Layout
  section: {
    padding: 'p-4 sm:p-6',
    gap: 'gap-4 sm:gap-6',
    marginTop: 'mt-6 sm:mt-8',
  },

  // Card Layout
  card: {
    padding: 'p-4 sm:p-6',
    gap: 'gap-3 sm:gap-4',
    headerGap: 'gap-1.5',
  },

  // Inline Elements
  inline: {
    gap: 'gap-2',
    gapTight: 'gap-1',
    gapLoose: 'gap-3',
  },

  // Stack (vertical)
  stack: {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
  },

  // Form Elements
  form: {
    gap: 'gap-4',
    fieldGap: 'gap-2',
    sectionGap: 'gap-6',
  },
} as const;
```

### Phase 4: Create Status Utility Classes (globals.css)

```css
@layer utilities {
  /* Status text colors */
  .text-status-success { @apply text-success; }
  .text-status-warning { @apply text-warning; }
  .text-status-error { @apply text-destructive; }
  .text-status-info { @apply text-info; }

  /* Status backgrounds (soft) */
  .bg-status-success { @apply bg-success/10 text-success; }
  .bg-status-warning { @apply bg-warning/10 text-warning; }
  .bg-status-error { @apply bg-destructive/10 text-destructive; }
  .bg-status-info { @apply bg-info/10 text-info; }

  /* Interactive states */
  .interactive-hover { @apply hover:bg-hover transition-colors; }
  .interactive-active { @apply active:bg-active; }
}
```

### Phase 5: Migration of Hardcoded Colors

Create find-and-replace mappings:

| From | To |
|------|-----|
| `text-red-600` | `text-destructive` |
| `text-red-500` | `text-destructive` |
| `text-amber-600` | `text-warning` |
| `text-amber-500` | `text-warning` |
| `text-green-600` | `text-success` |
| `text-green-500` | `text-success` |
| `text-blue-500` | `text-info` |
| `text-blue-600` | `text-info` |
| `bg-white dark:bg-gray-950` | `bg-card` |
| `bg-white` (alone in dark-aware context) | `bg-card` |

**Files to migrate:**
- `src/app/app/tarefas/components/*.tsx` (~10 files)
- `src/app/app/financeiro/**/*.tsx` (~8 files)
- `src/app/app/configuracoes/page.tsx`
- `src/app/app/admin/**/*.tsx`

### Phase 6: Documentation Update

Update the existing design system playground page at `/app/app/ajuda/design-system/playground/page.tsx`:

1. Add color palette showcase (semantic colors)
2. Add typography scale examples
3. Add spacing visualization
4. Add interactive component states

---

## File Changes Summary

| File | Action | Scope |
|------|--------|-------|
| `globals.css` | Edit | Add ~60 lines (tokens + utilities) |
| `lib/design-system/tokens.ts` | Edit | Add ~40 lines (semantic spacing) |
| `lib/design-system/index.ts` | Edit | Export new tokens |
| `tarefas/components/*.tsx` | Edit | Replace hardcoded colors |
| `financeiro/**/*.tsx` | Edit | Replace hardcoded colors |
| `admin/**/*.tsx` | Edit | Replace hardcoded colors |
| `ajuda/design-system/playground/page-client.tsx` | Edit | Enhance documentation |

**Total estimated changes:** ~15-20 files, ~200-300 lines added/modified

---

## Benefits

1. **Consistency** - Single source of truth for status colors
2. **Maintainability** - Change colors in one place, applies everywhere
3. **Dark Mode** - Automatic dark mode support through tokens
4. **Developer Experience** - Semantic class names are self-documenting
5. **Accessibility** - OKLCH ensures perceptual uniformity and contrast

---

## Non-Breaking

This implementation is **fully backwards compatible**:
- Existing `bg-primary`, `text-muted-foreground` etc. continue to work
- New tokens are additive, not replacing
- Migration of hardcoded colors improves existing code without breaking it

---

## Approval Required

Please confirm if you'd like me to proceed with this implementation plan. I'll execute it phase by phase, starting with the token definitions in globals.css.
