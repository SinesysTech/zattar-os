---
name: zattar-os-design
description: Use this skill to generate well-branded interfaces and assets for ZattarOS (Zattar Advogados' legal management platform by Synthropic), either for production or throwaway prototypes/mocks/slides/decks. Contains essential design guidelines, Glass Briefing aesthetic, OKLCH colors anchored at hue 281°, Montserrat+Inter typography, glass surface system, Lucide iconography, and a working UI kit with Sidebar/KPI/ProcessCard/Calendar/Chat components for prototyping.
user-invocable: true
---

# ZattarOS Design Skill — Glass Briefing

Read the `README.md` file within this skill first — it contains the full Manifesto, CONTENT FUNDAMENTALS (language, voice, casing, PT-BR vocabulary), VISUAL FOUNDATIONS (colors, type, glass system, spacing, shadows, animation), and ICONOGRAPHY sections.

Then explore the other available files:

- `colors_and_type.css` — copy-paste this file into any new HTML/React output. It exposes all CSS variables (`--primary`, `--event-*`, `--entity-*`, etc.) and semantic typography classes (`.text-page-title`, `.text-kpi-value`, etc.) used throughout the system.
- `preview/` — per-concept specimen cards. Open any file to see canonical usage of a single primitive (buttons, badges, cards, palettes, type).
- `ui_kits/zattar-os/` — full React+Babel reproduction of the admin dashboard. Lift individual components (`<Sidebar>`, `<KpiCard>`, `<ProcessCard>`, `<CalendarWidget>`, `<PulseStrip>`, `<ChatPanel>`, `<GlassPanel>`, `<Button>`, `<Chip>`, `<IconContainer>`, `<BrandMark>`) or copy the entire `index.html` as a shell.
- `assets/zattar-icon.png` — app icon (Z. wordmark with purple dot).

## When producing visual artifacts (slides, mocks, throwaway prototypes)
1. Copy `colors_and_type.css` into the output directory and link it.
2. Import Google Fonts: Inter + Montserrat + Manrope + Geist Mono.
3. Load Lucide via `<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js">` — never draw icons inline.
4. Use the `<BrandMark>` helper from `ui_kits/zattar-os/shared.jsx` for Zattar "Z." wordmark.
5. Write every copy string in **PT-BR**. Never emoji as UI. Never Title Case buttons.
6. Use glass surfaces (`.glass-kpi`, `.glass-widget`, `.glass-dialog`) on top of a subtle ambient radial-gradient background — don't use flat dark/light in isolation.
7. KPI numbers are **Montserrat + tabular-nums**. Process numbers are **Geist Mono + tabular-nums**.
8. Status / event / entity colors are **semantic tokens** — use `--event-audiencia` not a random hex.

## When working on production code
- Use shadcn/ui conventions (style: new-york).
- Enforce `<Heading level>` and `<Text variant>` — never compose `font-heading text-2xl` manually.
- Use layout primitives `<Stack gap>`, `<Inline gap>`, `<Inset variant>` instead of ad-hoc flex/gap/padding.
- Support Density Axis: use `data-density="compact"` for dense dashboards/forms. Shells handle this automatically via `density` prop.
- `--radius` is runtime-themeable. Always reference via `rounded-*` utilities, never hard-code `border-radius: 8px`.
- Shadows cap at `shadow-lg`. `shadow-xl` / `shadow-2xl` are forbidden.
- Animate only `transform` + `opacity`. Respect `prefers-reduced-motion`.
- Sidebar is **always dark** in both themes (don't swap it light in light mode).

## If invoked bare
If the user invokes this skill without guidance, ask them what they want to build or design (a prototype, a slide deck, a component, a full flow). Ask clarifying questions about scope, audience, and what they want to vary. Then act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need — always rooted in the tokens, components, and rules from `README.md` and `colors_and_type.css`.

## Escalation / substitution flags
- **Fonts**: currently delivered via Google Fonts CDN. For offline production code or Canva export, request WOFF2 files (especially Geist Mono licensing).
- **Logos**: actual `/public/logos/*.svg` from the source repo are not bundled here. The `<BrandMark>` helper reconstructs the "Z." wordmark typographically. If you need the canonical SVG, flag this to the user and request the original file.
- **Portal do Cliente** has its own visual scope (`--portal-*` tokens) — not covered by this kit. Escalate if portal work is requested.
