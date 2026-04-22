---
name: zattar-glass
description: Use when modifying, creating, or reviewing any UI in ZattarOS (paths under `src/app/(authenticated)/**` or `src/components/**`). First skill to invoke for frontend work — routes to the right specialized sub-skill and provides shared Glass Briefing vocabulary (tokens, GlassPanel depths, Heading/Text variants, shape-indexed canonical modules).
---

# Zattar Glass — Hub

## Overview

Routing hub for the Zattar OS Glass Briefing Design System. **Does not implement anything.** Classifies the task shape and routes to the right specialized sub-skill. Provides shared vocabulary (tokens, depths, typography, shared components) consumed by all sub-skills.

## Routing — Which sub-skill?

```
Creating a new component/page?      → invoke zattar-glass-creating
Refactoring existing UI code?       → invoke zattar-glass-migrating
Translating external brief/mockup?  → invoke zattar-glass-translating
(ui-ux-pro-max output, Figma, etc.)
Adding/changing a design token?     → invoke zattar-glass-governing
```

For hybrid tasks (e.g., "refactor to Glass and add new widget"), invoke sub-skills sequentially: migrating first, creating second — never mix workflows in a single commit.

## Shape classification (first action of every sub-skill)

Every task starts by classifying the target module against the 10 shapes below. See `references/glass-vocabulary.md` for the canon cheat sheet.

| Shape | Canon |
|---|---|
| Temporal multi-view | `expedientes/` |
| Nested FSD | `partes/` ⚠ |
| Kanban/Pipeline | `contratos/` ⚠ |
| Dashboard widget grid | `dashboard/` |
| Process Workspace | `processos/[id]/` |
| Wizard multi-step admin | `assinatura-digital/` ⚠ |
| Chat/Thread | none — use `translating` |
| CRUD simples | `entrevistas-trabalhistas/` |
| High-adoption custom | `comunica-cnj/` |
| Content-rich docs | `ajuda/` |

⚠ = canon has known drift. Sub-skill must lift the canon in the same work unit before replicating it.

## Shared vocabulary

See `references/glass-vocabulary.md` for: glass depths (1–3), typography variants, color tokens (OKLCH semantic), shared components catalog, anti-patterns, shape→canon cheat sheet.

## Ground rules (applies to all sub-skills)

1. Never hex, never `bg-{color}-{scale}` from Tailwind default — always CSS var or semantic token.
2. Never raw `<h*>` — always `<Heading level=...>`.
3. Never `shadow-xl` inside `(authenticated)/` — use `glass-widget`/`glass-kpi`.
4. Never `<Sheet>` — use centered `glass-dialog`.
5. Always run `npm run audit:design-system` before claiming a task done.

## Pointers (not force-loaded)

- Full DS authority: `design-system/MASTER.md`
- Token registry: `src/lib/design-system/tokens.ts` + `src/lib/design-system/token-registry.ts`
- Governance workflow: `design-system/GOVERNANCE.md`
- Visual review checklist: `docs/architecture/VISUAL-REVIEW-CHECKLIST.md`
- Baseline/ROADMAP: `design-system/ROADMAP.md`

## Boundary

**This skill does NOT implement anything.** It routes and provides vocabulary. If you are reading this and have not yet invoked a sub-skill, STOP and invoke one.

## Red flags — rationalizations that mean you should stop

| Thought | Reality |
|---|---|
| "Small change, I don't need to route" | Small changes are where drift accumulates. Route. |
| "I know the shape / canon from memory" | From-memory replication is exactly how drift spreads. Classify shape via §Shape classification; consult canon. |
| "The hub is overhead" | The hub is <300 words. Reading it costs less than re-deciding. |
| "I'll invoke the sub-skill later" | Later = never. Invoke now. |
