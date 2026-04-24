# ZattarOS UI Kit — Glass Briefing

Interactive recreation of the ZattarOS admin dashboard. Demonstrates the key components in their native composition:

- **Sidebar** (premium dark, always) — nav with collapse
- **KpiCard** — glass surface, tabular numerics, delta
- **ProcessCard** — CNJ number, parties, status chip, meta grid
- **CalendarWidget** — upcoming hearings & deadlines with event colors
- **ChatPanel** — internal team chat
- **IconContainer / Avatar / Chip / Button** — atomic primitives

Open `index.html` for the interactive demo. Click between `Dashboard`, `Processos`, `Agenda`, `Chat` in the sidebar to navigate.

## Files

| File | Purpose |
|---|---|
| `index.html` | Main demo shell, loads React + Babel + all components |
| `shared.jsx` | Tokens proxy (CSS vars), lucide icon wrapper, utils |
| `Sidebar.jsx` | Nav sidebar (dark, collapsible) |
| `GlassPanel.jsx` | Glass surface wrapper with depth variants |
| `KpiCard.jsx` | Tabular KPI with delta |
| `ProcessCard.jsx` | Legal case card |
| `CalendarWidget.jsx` | Upcoming events list |
| `ChatPanel.jsx` | Team chat view |
| `Button.jsx` / `Chip.jsx` / `IconContainer.jsx` | Atomic primitives |
| `Topbar.jsx` | **DEPRECATED** — ver nota abaixo |
| `PulseStrip.jsx` | **DEPRECATED** — ver nota abaixo |

## Not included
- No real backend, data is static
- Portal do Cliente has its own visual scope — not mocked here

## Protótipos DEPRECATED

Dois arquivos do kit original não refletem o produto real e estão marcados como referência histórica:

- **`Topbar.jsx`** — o app evoluiu para `DashboardHeader` Pedrinho-centric (logo + módulos + toggle do assistente Pedrinho). A busca é **per-página** (cada módulo tem seu `SearchInput` local), não global no header. O "Topbar" genérico do protótipo não será implementado.

- **`PulseStrip.jsx`** — activity feed com log de intimações/movimentações **não existe no produto**. Fica como escopo futuro se o roadmap de dashboard jurídico solicitar. O componente homônimo em `src/components/dashboard/pulse-strip.tsx` é um **KPI metrics strip** (totalizadores por categoria), não activity feed.
