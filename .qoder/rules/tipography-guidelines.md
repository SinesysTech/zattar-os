---
trigger: model_decision
description: Apply when creating or modifying UI components, pages with text content, headings, or any typography elements. Use to ensure consistent visual hierarchy, accessibility, and maintainability across the application.
---

# Typography System Guidelines

## Overview

The project uses a complete typography system based on shadcn/ui with polymorphic components and CSS classes. **Always use this system** for new components to ensure consistency, accessibility, and maintainability.

## Available Components

### Headings
- **H1**: Main page title (only one per page)
- **H2**: Main sections
- **H3**: Subsections
- **H4**: Smaller titles or component titles

### Text
- **P**: Standard paragraph
- **Lead**: Highlighted introductory paragraph
- **Large**: Large text for emphasis
- **Small**: Small text for notes
- **Muted**: Muted color text

### Special
- **Blockquote**: Quotes
- **List**: Bulleted lists
- **InlineCode**: Code or technical terms
- **Table**: Tables with consistent styling

## Usage Options

### Option A: React Components (Recommended)

```tsx
import { Typography } from '@/components/ui/typography';

export function MyComponent() {
  return (
    <div>
      <Typography.H2>Section Title</Typography.H2>
      <Typography.P>
        Paragraph with consistent spacing and styles.
      </Typography.P>
    </div>
  );
}
```

**Advantages:**
- Type-safe with TypeScript
- Polymorphism via `as` prop
- Easy composition with `className`
- Full IntelliSense in VS Code

### Option B: CSS Classes

```tsx
export function MyComponent() {
  return (
    <div>
      <h2 className="typography-h2">Section Title</h2>
      <p className="typography-p">
        Paragraph with consistent spacing and styles.
      </p>
    </div>
  );
}
```

**Advantages:**
- More direct for simple semantic HTML
- Lower component overhead

## Rules

### 1. Always Use the System for New Components

❌ **DON'T** use raw Tailwind typography classes:

```tsx
<div className="text-xl font-bold">Process #12345</div>
<p className="text-sm text-gray-500">Status: In progress</p>
```

✅ **DO** use Typography components:

```tsx
<Typography.H3>Process #12345</Typography.H3>
<Typography.Muted>Status: In progress</Typography.Muted>
```

### 2. Maintain Logical Hierarchy

❌ **DON'T** skip heading levels:

```tsx
<Typography.H1>Main Page</Typography.H1>
<Typography.H4>Detail</Typography.H4> {/* Skipped H2 and H3 */}
```

✅ **DO** maintain sequential order:

```tsx
<Typography.H1>Main Page</Typography.H1>
<Typography.H2>Section</Typography.H2>
<Typography.H3>Subsection</Typography.H3>
<Typography.H4>Detail</Typography.H4>
```

### 3. Use Polymorphism When Needed

Use the `as` prop when you need a different HTML element while maintaining visual style:

```tsx
// H1 semantic with H2 visual style (useful for SEO)
<Typography.H2 as="h1">
  Main Title with H2 Visual Style
</Typography.H2>

// Div with paragraph style
<Typography.P as="div">
  Content that needs to be div but with paragraph style
</Typography.P>
```

### 4. Compose with Tailwind Classes

Add additional Tailwind classes while maintaining base styles:

```tsx
<Typography.H2 className="mt-8 text-primary">
  Title with Custom Margin and Color
</Typography.H2>

<Typography.P className="max-w-prose text-justify">
  Paragraph with max width and justified text
</Typography.P>
```

### 5. Use Correct Variant for Context

| Variant | Use When |
|---------|----------|
| **H1** | Main page title, hero sections |
| **H2** | Main sections, content separators |
| **H3** | Subsections, important card titles |
| **H4** | Smaller titles, form group labels |
| **Lead** | First paragraph of articles, introductions |
| **P** | Standard body text |
| **Large** | Important questions, textual CTAs |
| **Muted** | Metadata (dates, authors), secondary instructions |
| **Small** | Form labels, captions, footnotes |
| **Blockquote** | Quotes, important highlights |
| **InlineCode** | Variable names, commands, technical terms |
| **List** | Ordered or unordered lists |
| **Table** | Data tables |

## Accessibility Requirements

### Always:
- ✅ Use correct semantic HTML tags
- ✅ Maintain logical hierarchy (don't skip levels)
- ✅ Ensure minimum 4.5:1 contrast for normal text
- ✅ Use line-height of at least 1.5
- ✅ Minimum font size: 14px for body text

### Never:
- ❌ Use headings only for styling (use `as` prop if needed)
- ❌ Skip heading levels (h1 → h3)
- ❌ Use multiple H1s on the same page

## Practical Examples

### Example 1: Process Card

```tsx
import { Typography } from '@/components/ui/typography';
import { Card } from '@/components/ui/card';

export function ProcessCard() {
  return (
    <Card>
      <Typography.H3>Process #12345</Typography.H3>
      <Typography.Muted>Status: In progress</Typography.Muted>
      <Typography.P className="mt-4">
        Process details...
      </Typography.P>
    </Card>
  );
}
```

### Example 2: Capture Page

```tsx
import { Typography } from '@/components/ui/typography';

export function CapturaPage() {
  return (
    <div className="container">
      <Typography.H1>PJE-TRT Data Capture</Typography.H1>
      <Typography.Lead className="mt-4">
        Automated system for capturing processes, hearings, and pending items
        from Regional Labor Courts.
      </Typography.Lead>

      <div className="mt-8">
        <Typography.H2>New Capture</Typography.H2>
        <Typography.P>
          Select capture type and fill in required data.
        </Typography.P>
        {/* Form */}
      </div>
    </div>
  );
}
```

### Example 3: Dialog with Information

```tsx
import { Typography } from '@/components/ui/typography';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';

export function HearingDialog() {
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <Typography.H3 as="h2">Hearing Details</Typography.H3>
          <Typography.Muted>Process: 0001234-56.2024.5.03.0001</Typography.Muted>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Typography.H4>Date and Time</Typography.H4>
            <Typography.P>11/15/2024 at 2:30 PM</Typography.P>
          </div>

          <div>
            <Typography.H4>Location</Typography.H4>
            <Typography.P>Virtual Room</Typography.P>
            <Typography.InlineCode>https://pje.trt3.jus.br/...</Typography.InlineCode>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## Common Substitutions

When refactoring existing code, use these substitutions:

| Old Tailwind Classes | Typography System |
|---------------------|-------------------|
| `text-4xl font-bold` | `<Typography.H1>` or `className="typography-h1"` |
| `text-3xl font-bold` | `<Typography.H2>` or `className="typography-h2"` |
| `text-2xl font-semibold` | `<Typography.H3>` or `className="typography-h3"` |
| `text-xl font-semibold` | `<Typography.H4>` or `className="typography-h4"` |
| `text-base` | `<Typography.P>` or `className="typography-p"` |
| `text-lg text-muted-foreground` | `<Typography.Lead>` or `className="typography-lead"` |
| `text-sm text-muted-foreground` | `<Typography.Muted>` or `className="typography-muted"` |
| `text-xs` | `<Typography.Small>` or `className="typography-small"` |

## Migration Strategy

**For existing code**: Migration is optional and gradual. Use the analysis script to identify inconsistencies:

```bash
node scripts/analyze-typography.js
```

**Priority order**:
1. New components (always use Typography system)
2. UI components in `components/ui/`
3. Main pages
4. Legacy code (only if being refactored)

**No need to migrate**:
- Components that already work well
- Legacy code that will be rewritten soon
- Cases where Tailwind is more appropriate (specific utilities)

## Resources

- **Interactive Documentation**: [http://localhost:3000/docs/typography](http://localhost:3000/docs/typography)
- **Component**: `components/ui/typography.tsx`
- **CSS Classes**: Defined in `app/globals.css`
- **Analysis Script**: `scripts/analyze-typography.js`

## Remember

The goal is **consistency and maintainability**. When in doubt, prefer using the Typography system.
