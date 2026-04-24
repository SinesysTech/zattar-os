# ZattarOS UI Kit — Glass Briefing

Interactive recreation of the ZattarOS admin dashboard. Demonstrates the key components in their native composition:

- **Sidebar** (premium dark, always) — nav with collapse
- **Topbar** — search, breadcrumb, user menu
- **KpiCard** — glass surface, tabular numerics, delta
- **ProcessCard** — CNJ number, parties, status chip, meta grid
- **CalendarWidget** — upcoming hearings & deadlines with event colors
- **PulseStrip** — live activity feed (intimações, movimentações)
- **ChatPanel** — internal team chat
- **IconContainer / Avatar / Chip / Button** — atomic primitives

Open `index.html` for the interactive demo. Click between `Dashboard`, `Processos`, `Agenda`, `Chat` in the sidebar to navigate.

## Files

| File | Purpose |
|---|---|
| `index.html` | Main demo shell, loads React + Babel + all components |
| `shared.jsx` | Tokens proxy (CSS vars), lucide icon wrapper, utils |
| `Sidebar.jsx` | Nav sidebar (dark, collapsible) |
| `Topbar.jsx` | Top search + user menu |
| `GlassPanel.jsx` | Glass surface wrapper with depth variants |
| `KpiCard.jsx` | Tabular KPI with delta |
| `ProcessCard.jsx` | Legal case card |
| `CalendarWidget.jsx` | Upcoming events list |
| `PulseStrip.jsx` | Live activity feed |
| `ChatPanel.jsx` | Team chat view |
| `Button.jsx` / `Chip.jsx` / `IconContainer.jsx` | Atomic primitives |

## Not included
- No real backend, data is static
- Magistrate AI panel referenced but not deeply built
- Portal do Cliente has its own visual scope — not mocked here
