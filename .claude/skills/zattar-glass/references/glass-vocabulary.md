# Glass Briefing — Shared Vocabulary

Condensed reference used by all `zattar-glass-*` skills. Full authority: `design-system/MASTER.md`.

## Glass depths (3 levels)

| Depth | Class / Component | Use case |
|---|---|---|
| 1 | `<GlassPanel depth={1}>` / `.glass-widget` | Outer containers, panels, transparent groupings |
| 2 | `<GlassPanel depth={2}>` / `.glass-kpi` | KPI cards, medium emphasis |
| 3 | `<GlassPanel depth={3}>` | Maximum emphasis, primary-tinted |

## Typography (via `@/components/ui/typography`)

`<Heading level="page|section|card|kpi-value|label|caption|meta-label|micro-caption|overline|...">` — 10 levels.
`<Text variant="label|caption|kpi-value|..."> ` — 17 variants.

**Never**: raw `<h1>..<h6>` for semantic text, inline font-size, `font-mono` in dialogs (feedback memory).

## Color tokens (OKLCH semantic; never hex, never `bg-{color}-{scale}`)

| Namespace | Examples |
|---|---|
| Brand | `--primary`, `--primary-foreground` |
| Status | `--success`, `--warning`, `--info`, `--destructive` |
| Surfaces | `--surface-*` (9 variants) |
| Charts | `--chart-1`..`--chart-8` |
| Events | `--event-audiencia`, `--event-expediente`, `--event-prazo` |
| Portal | `--portal-*` (11 tokens) |
| Chat | `--chat-thread-bg`, `--chat-bubble-received`, `--chat-bubble-sent`, `--chat-sidebar-active` |
| Widgets | `--widget-radius`, `--widget-padding`, `--widget-gap`, `--widget-transition` |

## Shared components (check before creating new)

| Category | Components |
|---|---|
| Layout | `PageShell`, `FormShell`, `TemporalViewShell`, `DetailSheet` |
| Glass | `GlassPanel`, `WidgetContainer`, `AmbientBackdrop` |
| Navigation | `TabPills`, `ViewSwitcher`, `DateNavigation`, `WeekNavigator` |
| Data | `DataTable`, `TablePagination`, `EmptyState` |
| Typography | `Heading`, `Text`, `BrandMark` |

## Anti-patterns (auto-fail in `audit:design-system`)

- Hex literal in `.tsx` (`#5523eb`, `#fff`) — use CSS var.
- Tailwind default color (`bg-blue-500`, `text-red-600`) — use semantic token.
- `shadow-xl`/`shadow-2xl` in `(authenticated)/` — use `glass-widget` or `glass-kpi`.
- Raw `<h1>..<h6>` for semantic text — use `<Heading level=...>`.
- `<Sheet>` component — project uses `glass-dialog` centered Dialog (memory: "Sem Sheet, usar Dialog").
- `font-mono` in dialogs for times/process numbers — use Inter (memory: "Sem font-mono nos dialogs").
- Manual composition of glass effects (opacity + blur + bg-white/X) — use `GlassPanel`.

## Shape → canon cheat sheet (from spec §10.1)

| Shape | Canon path |
|---|---|
| Temporal multi-view | `src/app/(authenticated)/expedientes/` |
| Nested FSD | `src/app/(authenticated)/partes/` (imature — lift needed) |
| Kanban/Pipeline | `src/app/(authenticated)/contratos/` (3 hex — lift needed) |
| Dashboard widget grid | `src/app/(authenticated)/dashboard/` |
| Process Workspace | `src/app/(authenticated)/processos/[id]/` |
| Wizard multi-step admin | `src/app/(authenticated)/assinatura-digital/` (lift needed) |
| Chat/Thread | NO CANON — use `translating` + active redesign doc |
| CRUD simples | `src/app/(authenticated)/entrevistas-trabalhistas/` |
| High-adoption custom | `src/app/(authenticated)/comunica-cnj/` |
| Content-rich docs | `src/app/(authenticated)/ajuda/` |
