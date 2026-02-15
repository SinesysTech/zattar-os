# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Zattar OS
**Generated:** 2026-02-14 18:41:56
**Category:** Analytics Dashboard

---

## Global Rules

### Color Palette

| Role | Hex | OKLCH | Tailwind/CSS Variable |
|------|-----|-------|----------------------|
| Primary (Brand) | `#7C3AED` | `oklch(0.45 0.25 285)` | `--primary` / `bg-primary` |
| Highlight (Action) | `#F59E0B` | `oklch(0.68 0.22 45)` | `--highlight` / `bg-highlight` |
| Background | `#F8FAFC` | `oklch(0.96 0.01 270)` | `--background` |
| Card | `#FFFFFF` | `oklch(1 0 0)` | `--card` / `bg-card` |
| Text | `#1E293B` | `oklch(0.24 0 0)` | `--foreground` |
| Muted Text | `#64748B` | `oklch(0.55 0.02 270)` | `--muted-foreground` |

**Color Notes:** Zattar purple (brand identity) + action orange (CTAs, warnings). Use `bg-primary` and `bg-highlight` directly in Tailwind - do NOT wrap in `var()` or `hsl()`.

### Typography

- **Heading Font:** Montserrat (600/700 weights)
- **Body Font:** Inter (300/400/500 weights)
- **Mono Font:** Geist Mono (code, technical data)
- **Mood:** modern, professional, tech-forward, clean, trustworthy, innovative
- **Already configured:** Fonts are loaded via Next.js font optimization

**Usage in Tailwind:**
```tsx
// Headings
<h1 className="font-heading font-semibold">Page Title</h1>

// Body text (default)
<p className="font-sans">Regular text uses Inter by default</p>

// Code/technical
<code className="font-mono">Process ID: 12345</code>
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```tsx
// Use shadcn/ui Button component - already configured
import { Button } from "@/components/ui/button"

// Primary (Zattar Purple)
<Button variant="default">Salvar Processo</Button>

// Action/Warning (Orange Highlight)
<Button variant="destructive">Excluir Cliente</Button>

// Secondary (Outline)
<Button variant="outline">Cancelar</Button>

// Ghost (Subtle)
<Button variant="ghost">Ver Detalhes</Button>

// Custom: Action Orange (when destructive is too harsh)
<Button className="bg-highlight hover:bg-highlight/90 text-white">
  Enviar para Tribunal
</Button>
```

**Critical Rule:** Use shadcn/ui `<Button>` component, NOT custom CSS buttons. All variants are pre-configured with proper Zattar colors.

### Cards

```tsx
// Use shadcn/ui Card component - already configured
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

// Standard card
<Card>
  <CardHeader>
    <CardTitle>Processos Ativos</CardTitle>
    <CardDescription>120 processos em andamento</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>

// Clickable card (add hover effect)
<Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
  {/* Content */}
</Card>

// KPI card (common in data-dense dashboards)
<Card className="border-l-4 border-l-primary">
  <CardContent className="pt-6">
    <div className="text-2xl font-bold">R$ 125.000</div>
    <p className="text-xs text-muted-foreground">Honorários Recebidos</p>
  </CardContent>
</Card>
```

**Critical Rules:**
- Always use `bg-card` (white), not `bg-background` (off-white)
- Add `cursor-pointer` to clickable cards
- Use `hover:-translate-y-0.5` (subtle), NOT `hover:-translate-y-2` (too jarring)

### Inputs

```tsx
// Use shadcn/ui Input component - already configured
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Standard input with label
<div className="space-y-2">
  <Label htmlFor="cpf">CPF do Cliente</Label>
  <Input
    id="cpf"
    type="text"
    placeholder="000.000.000-00"
    className="h-9" // Use h-9 (36px) to match toolbar height
  />
</div>

// Search input (common in DataTableToolbar)
<Input
  placeholder="Buscar processos..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="h-9 w-62.5"
/>
```

**Critical Rules:**
- All inputs must have a `<Label>` with `htmlFor` attribute (accessibility)
- Use `h-9` height to match toolbar components (36px standard)
- Minimum 16px font size to prevent iOS zoom on focus

### Modals

```tsx
// Use shadcn/ui Dialog component - already configured
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

// Standard dialog
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Editar Cliente</DialogTitle>
      <DialogDescription>
        Atualize as informações do cliente abaixo.
      </DialogDescription>
    </DialogHeader>
    {/* Form content */}
  </DialogContent>
</Dialog>

// Large dialog (for complex forms)
<DialogContent className="max-w-3xl">
  {/* Content */}
</DialogContent>

// BETTER: Use DialogFormShell wrapper (Zattar pattern)
import { DialogFormShell } from "@/components/shared/dialog-form-shell"

<DialogFormShell
  open={open}
  onOpenChange={setOpen}
  title="Novo Processo"
  description="Cadastre um novo processo judicial"
>
  {/* Form fields */}
</DialogFormShell>
```

**Critical Rule:** Prefer `DialogFormShell` over raw `Dialog` for consistency with Zattar patterns.

### Badges (Status Indicators)

**CRITICAL:** Never hardcode badge colors. Always use semantic variant system.

```tsx
import { Badge } from "@/components/ui/badge"
import { getSemanticBadgeVariant } from "@/lib/design-system"

// Status badges (ATIVO, INATIVO, PENDENTE, etc.)
<Badge variant={getSemanticBadgeVariant('status', 'ATIVO')}>
  Ativo
</Badge>

// Tribunal badges (TRT1, TRT2, TST, etc.)
<Badge variant={getSemanticBadgeVariant('tribunal', 'TRT1')}>
  TRT1
</Badge>

// Priority badges (ALTA, MEDIA, BAIXA)
<Badge variant={getSemanticBadgeVariant('prioridade', 'ALTA')}>
  Alta Prioridade
</Badge>

// WRONG - never do this
<Badge className="bg-blue-100 text-blue-800">TRT1</Badge> // ❌
```

**Supported categories:** `status`, `tribunal`, `grau`, `parte`, `prioridade`, `tipo`

### Data Tables (DataShell Pattern)

**MANDATORY:** All data table pages must use `DataShell` + `DataTable` pattern.

```tsx
// Gold standard: src/features/partes/components/clientes/clientes-table-wrapper.tsx
import { DataShell } from "@/components/shared/data-shell"
import { DataTable } from "@/components/shared/data-shell/data-table"
import { DataTableToolbar } from "@/components/shared/data-shell/data-table-toolbar"
import { DataPagination } from "@/components/shared/data-shell/data-pagination"

export function ProcessosTableWrapper({ initialData, totalCount }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [pageIndex, setPageIndex] = useState(0)

  // Debounce search (500ms)
  const debouncedSearch = useDebounce(searchTerm, 500)

  // Reset page on filter change
  useEffect(() => {
    setPageIndex(0)
  }, [debouncedSearch])

  return (
    <DataShell>
      {/* Toolbar floats above */}
      <DataTableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar processos..."
      >
        {/* Filter components here */}
      </DataTableToolbar>

      {/* Table with border and background */}
      <DataTable
        columns={columns}
        data={data}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Pagination floats below */}
      <DataPagination
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPageIndex}
      />
    </DataShell>
  )
}
```

**Critical DataShell Rules:**
- Toolbar elements must be `h-9` (36px height)
- Table has `rounded-md border bg-card`
- No vertical dividers between columns (set `meta.align` for alignment)
- Server-side pagination: `pageIndex` is 0-based in UI, 1-based in API
- Always use `useDebounce` for search (500ms delay)
- Reset `pageIndex` to 0 when filters change

### Icons

**MANDATORY:** Use Lucide React icons. NEVER use emojis as icons.

```tsx
import { FileText, User, Calendar, AlertCircle } from "lucide-react"

// Correct
<FileText className="h-4 w-4" />
<User className="h-5 w-5 text-muted-foreground" />

// Wrong
<span>📄</span> // ❌ Never use emojis
```

**Standard sizes:**
- `h-4 w-4` (16px) - Table cells, inline text
- `h-5 w-5` (20px) - Buttons, tabs
- `h-6 w-6` (24px) - Page headers, larger buttons

---

## Style Guidelines

**Style:** Data-Dense Dashboard

**Keywords:** Multiple charts/widgets, data tables, KPI cards, minimal padding, grid layout, space-efficient, maximum data visibility

**Best For:** Business intelligence dashboards, financial analytics, enterprise reporting, operational dashboards, data warehousing

**Key Effects:** Hover tooltips, chart zoom on click, row highlighting on hover, smooth filter animations, data loading spinners

### Page Pattern

**Pattern Name:** Data-Dense + Drill-Down

- **CTA Placement:** Above fold
- **Section Order:** Hero > Features > CTA

---

## Anti-Patterns (Do NOT Use)

- ❌ Ornate design
- ❌ No filtering

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
