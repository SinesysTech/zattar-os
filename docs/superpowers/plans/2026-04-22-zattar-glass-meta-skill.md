# Zattar Glass Meta-Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 5-part meta-skill suite (hub `zattar-glass` + 4 sub-skills: `-creating`, `-migrating`, `-governing`, `-translating`) inside `.claude/skills/` of the ZattarOS repo, enforcing deterministic Glass Briefing adoption via shape-indexed canonical modules.

**Architecture:** 5 Claude Code skills as flat directories under `.claude/skills/`. Each skill has `SKILL.md` (YAML frontmatter + markdown body, ≤500 words) plus optional `references/*.md` for heavy content. Skills reference each other by name (no imports, no force-load). Discipline enforced via pressure-test RED-GREEN-REFACTOR with subagent baselines captured per phase. Design source: `docs/superpowers/specs/2026-04-22-zattar-glass-meta-skill-design.md`.

**Tech Stack:** Markdown/YAML (skill content), Graphviz DOT (flowcharts inside SKILL.md), Bash (verification scripts using project's `npm run audit:design-system`), Agent tool dispatches (pressure tests).

**Reference spec:** [docs/superpowers/specs/2026-04-22-zattar-glass-meta-skill-design.md](../specs/2026-04-22-zattar-glass-meta-skill-design.md)

---

## Phase 0 — Setup & scaffolding

Create directory structure and scratchpad for baseline artifacts. No skill content yet.

### Task 0.1: Create skill directory tree

**Files:**
- Create: `.claude/skills/zattar-glass/references/` (dir)
- Create: `.claude/skills/zattar-glass-creating/examples/` (dir)
- Create: `.claude/skills/zattar-glass-migrating/references/` (dir)
- Create: `.claude/skills/zattar-glass-translating/references/` (dir)
- Create: `.claude/skills/zattar-glass-governing/references/` (dir)
- Create: `.planning/zattar-glass-baselines/` (dir, for captured RED rationalizations — git-ignored)

- [ ] **Step 1: Create all skill directories**

Run:
```bash
mkdir -p .claude/skills/zattar-glass/references \
         .claude/skills/zattar-glass-creating/examples \
         .claude/skills/zattar-glass-migrating/references \
         .claude/skills/zattar-glass-translating/references \
         .claude/skills/zattar-glass-governing/references \
         .planning/zattar-glass-baselines
```

Expected: no output, directories exist.

- [ ] **Step 2: Verify structure**

Run: `find .claude/skills/zattar-glass* -type d | sort`

Expected output (10 lines):
```
.claude/skills/zattar-glass
.claude/skills/zattar-glass/references
.claude/skills/zattar-glass-creating
.claude/skills/zattar-glass-creating/examples
.claude/skills/zattar-glass-governing
.claude/skills/zattar-glass-governing/references
.claude/skills/zattar-glass-migrating
.claude/skills/zattar-glass-migrating/references
.claude/skills/zattar-glass-translating
.claude/skills/zattar-glass-translating/references
```

- [ ] **Step 3: Add `.planning/` to `.gitignore` if not present**

Run: `grep -q "^\.planning/$" .gitignore || echo ".planning/" >> .gitignore`

- [ ] **Step 4: Commit scaffolding**

```bash
git add .claude/skills/ .gitignore
git commit -m "chore(zattar-glass): scaffold skill directories"
```

---

### Task 0.2: Author shared determinism-verification script

**Files:**
- Create: `.claude/skills/zattar-glass/references/verify-determinism.sh`

This script is used by every phase's GREEN test to compare decisions across 3 subagent runs on the same RED scenario.

- [ ] **Step 1: Write script**

Create `.claude/skills/zattar-glass/references/verify-determinism.sh`:

```bash
#!/usr/bin/env bash
# verify-determinism.sh — compares 3 subagent outputs on the same RED scenario.
# Usage: ./verify-determinism.sh run1.txt run2.txt run3.txt
# Exit 0 if classifications + decisions converge; non-zero otherwise.
set -euo pipefail

if [ "$#" -ne 3 ]; then
  echo "usage: $0 run1.txt run2.txt run3.txt" >&2
  exit 2
fi

# Extract shape classification from each run (expects "SHAPE: X" line)
s1=$(grep -m1 '^SHAPE:' "$1" | awk -F': ' '{print $2}' || echo "")
s2=$(grep -m1 '^SHAPE:' "$2" | awk -F': ' '{print $2}' || echo "")
s3=$(grep -m1 '^SHAPE:' "$3" | awk -F': ' '{print $2}' || echo "")

if [ "$s1" != "$s2" ] || [ "$s2" != "$s3" ]; then
  echo "FAIL: shape classifications diverge: [$s1] [$s2] [$s3]" >&2
  exit 1
fi

# Extract canon path from each run (expects "CANON: path" line)
c1=$(grep -m1 '^CANON:' "$1" | awk -F': ' '{print $2}' || echo "")
c2=$(grep -m1 '^CANON:' "$2" | awk -F': ' '{print $2}' || echo "")
c3=$(grep -m1 '^CANON:' "$3" | awk -F': ' '{print $2}' || echo "")

if [ "$c1" != "$c2" ] || [ "$c2" != "$c3" ]; then
  echo "FAIL: canon paths diverge: [$c1] [$c2] [$c3]" >&2
  exit 1
fi

# Extract decisions block (between DECISIONS_START/DECISIONS_END markers)
awk '/^DECISIONS_START$/,/^DECISIONS_END$/' "$1" | sort > /tmp/.zg_d1
awk '/^DECISIONS_START$/,/^DECISIONS_END$/' "$2" | sort > /tmp/.zg_d2
awk '/^DECISIONS_START$/,/^DECISIONS_END$/' "$3" | sort > /tmp/.zg_d3

if ! diff -q /tmp/.zg_d1 /tmp/.zg_d2 > /dev/null || ! diff -q /tmp/.zg_d2 /tmp/.zg_d3 > /dev/null; then
  echo "FAIL: decision sets diverge. Diffs:" >&2
  diff /tmp/.zg_d1 /tmp/.zg_d2 || true
  diff /tmp/.zg_d2 /tmp/.zg_d3 || true
  exit 1
fi

echo "PASS: shape=[$s1] canon=[$c1] decisions converge across 3 runs"
exit 0
```

- [ ] **Step 2: Make executable**

Run: `chmod +x .claude/skills/zattar-glass/references/verify-determinism.sh`

- [ ] **Step 3: Smoke-test with dummy inputs**

```bash
cat > /tmp/r1.txt <<EOF
SHAPE: CRUD simples
CANON: src/app/(authenticated)/entrevistas-trabalhistas/
DECISIONS_START
GlassPanel depth=1 for list container
Heading level=page for page title
Heading level=section for card headers
DECISIONS_END
EOF
cp /tmp/r1.txt /tmp/r2.txt
cp /tmp/r1.txt /tmp/r3.txt
.claude/skills/zattar-glass/references/verify-determinism.sh /tmp/r1.txt /tmp/r2.txt /tmp/r3.txt
```

Expected: `PASS: shape=[CRUD simples] canon=[src/app/(authenticated)/entrevistas-trabalhistas/] decisions converge across 3 runs`

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/zattar-glass/references/verify-determinism.sh
git commit -m "chore(zattar-glass): add determinism verification helper"
```

---

## Phase 1 — Hub `zattar-glass`

Implement the routing hub + shared vocabulary. Must be first because sub-skills reference it.

### Task 1.1: RED baseline — capture rationalizations without any skill

**Files:**
- Create: `.planning/zattar-glass-baselines/01-hub-red.md`

- [ ] **Step 1: Dispatch subagent with pressure scenario, NO skill available**

Use the Agent tool with `subagent_type=general-purpose` and this exact prompt:

```
Você é um desenvolvedor sênior do ZattarOS.

Tarefa: O módulo `src/app/(authenticated)/notas/` está com apenas 9 TSX, zero uso de GlassPanel, uma tag <h*> crua, e não importa @/components/ui/typography. Você precisa refatorar ele para aderir ao Design System Glass Briefing do projeto.

Pressões:
1. É urgente — o PR precisa sair hoje.
2. Você já refatorou três outros módulos similares (audiencias, expedientes, obrigacoes) — sabe o que fazer de cabeça.
3. O módulo é pequeno, então "é só trocar os componentes rapidamente".

Descreva passo-a-passo o que você faria, incluindo:
- SHAPE: [qual o shape do módulo? CRUD simples, Temporal, Kanban, Nested FSD, outro?]
- CANON: [qual módulo canônico você consultaria como referência?]
- DECISIONS_START
[liste as decisões estruturais que você tomaria — depths de GlassPanel, níveis de Heading, componentes shared, tokens]
DECISIONS_END

Não consulte a base de código — decida de cabeça, como se estivesse apressado.
```

- [ ] **Step 2: Capture response verbatim to baseline file**

Save the subagent's full response to `.planning/zattar-glass-baselines/01-hub-red.md`.

Expected observations to document:
- Whether agent classified shape at all (expected: no explicit classification — jumps to implementation).
- Whether agent named a canon (expected: no — picks "audiencias" or similar from memory without evidence).
- Whether agent's decisions are vague ("use GlassPanel" without depth, "use Heading" without level) — expected yes.
- Common rationalizations: "é só refatorar rápido", "é parecido com audiencias", "decido na hora".

- [ ] **Step 3: Verify baseline captures expected failure modes**

Run: `cat .planning/zattar-glass-baselines/01-hub-red.md | head -40`

Check: at least 2 rationalizations match "too simple to need canon", "decide on the fly", "already did something similar". If baseline is already compliant (unlikely without skill), re-run with stronger pressure (add "você já está exausto, 3 horas de sono").

---

### Task 1.2: Write hub supporting file `glass-vocabulary.md`

**Files:**
- Create: `.claude/skills/zattar-glass/references/glass-vocabulary.md`

- [ ] **Step 1: Write file with full content**

Create `.claude/skills/zattar-glass/references/glass-vocabulary.md`:

```markdown
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
```

- [ ] **Step 2: Verify file created with expected sections**

Run: `grep -c "^##" .claude/skills/zattar-glass/references/glass-vocabulary.md`

Expected: `7` (7 top-level sections).

---

### Task 1.3: Write hub SKILL.md

**Files:**
- Create: `.claude/skills/zattar-glass/SKILL.md`

- [ ] **Step 1: Write SKILL.md with full content**

Create `.claude/skills/zattar-glass/SKILL.md`:

```markdown
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
| "It's a small change, I don't need to route" | Small changes are where drift accumulates. Route. |
| "I already know what to do" | You are about to re-invent a decision the canon already made. Route. |
| "The hub is overhead" | The hub is <300 words. Reading it costs less than re-deciding. |
| "I'll invoke the sub-skill later" | Later = never. Invoke now. |
```

- [ ] **Step 2: Verify frontmatter is valid YAML and description ≤500 chars**

Run:
```bash
python3 -c "
import re, sys
content = open('.claude/skills/zattar-glass/SKILL.md').read()
m = re.search(r'^---\n(.*?)\n---', content, re.DOTALL)
if not m:
    print('FAIL: no frontmatter'); sys.exit(1)
import yaml
fm = yaml.safe_load(m.group(1))
assert fm['name'] == 'zattar-glass', f'name mismatch: {fm.get(\"name\")}'
desc_len = len(fm['description'])
assert desc_len <= 500, f'description {desc_len} chars > 500'
print(f'OK: name={fm[\"name\"]}, desc_len={desc_len}')
"
```

Expected: `OK: name=zattar-glass, desc_len=<number ≤500>`.

- [ ] **Step 3: Verify SKILL.md word count ≤500**

Run: `wc -w .claude/skills/zattar-glass/SKILL.md`

Expected: `<500 .claude/skills/zattar-glass/SKILL.md`. If over, trim "Shared vocabulary" section (it already delegates to references file).

---

### Task 1.4: GREEN test — verify skill changes behavior

**Files:**
- Create: `.planning/zattar-glass-baselines/01-hub-green.md`

- [ ] **Step 1: Dispatch subagent with same scenario, WITH skill available**

Use Agent tool with `subagent_type=general-purpose`. Prompt:

```
Você está em uma sessão Claude Code no projeto ZattarOS (/Users/jordanmedeiros/Projetos/zattar-os). A skill `zattar-glass` está disponível em `.claude/skills/zattar-glass/SKILL.md`.

Tarefa: O módulo `src/app/(authenticated)/notas/` está com apenas 9 TSX, zero uso de GlassPanel, uma tag <h*> crua, e não importa @/components/ui/typography. Você precisa refatorar ele para aderir ao Design System Glass Briefing.

INSTRUÇÃO OBRIGATÓRIA: antes de responder, LEIA `.claude/skills/zattar-glass/SKILL.md` e `.claude/skills/zattar-glass/references/glass-vocabulary.md`. Depois responda conforme a hub orienta.

Responda no formato:
SHAPE: [classificação explícita]
CANON: [path absoluto do módulo canônico]
SUB_SKILL: [qual sub-skill invocaria]
DECISIONS_START
[decisões de alto nível]
DECISIONS_END
```

- [ ] **Step 2: Capture response to `.planning/zattar-glass-baselines/01-hub-green.md`**

- [ ] **Step 3: Verify compliance criteria met**

Check that response contains:
- `SHAPE: CRUD simples` (exact)
- `CANON:` line with path containing `entrevistas-trabalhistas`
- `SUB_SKILL: zattar-glass-migrating` (because target is refactor, not new)
- DECISIONS_START/END block present

Run:
```bash
f=.planning/zattar-glass-baselines/01-hub-green.md
grep -q "^SHAPE: CRUD simples$" $f && \
grep -q "^CANON:.*entrevistas-trabalhistas" $f && \
grep -q "^SUB_SKILL: zattar-glass-migrating" $f && \
grep -q "^DECISIONS_START$" $f && \
echo "GREEN OK" || echo "GREEN FAIL"
```

Expected: `GREEN OK`.

If `GREEN FAIL`, proceed to Task 1.5 (refactor).

---

### Task 1.5: Refactor — close any loopholes discovered

**Files:**
- Modify: `.claude/skills/zattar-glass/SKILL.md`

- [ ] **Step 1: If GREEN failed, diff RED vs GREEN rationalizations**

Run: `diff .planning/zattar-glass-baselines/01-hub-red.md .planning/zattar-glass-baselines/01-hub-green.md | head -80`

Identify which rationalization from RED is still present in GREEN (e.g., agent skipped shape classification; still named canon from memory; still decided without reading vocabulary).

- [ ] **Step 2: Add explicit counter to the SKILL.md Red flags table**

Example: if GREEN still skipped shape classification, add row:
```markdown
| "I know the shape already, skip classification" | Memory ≠ canon. Classify explicitly using §Routing table — this is the first action. |
```

- [ ] **Step 3: Re-run GREEN test**

Repeat Task 1.4 with same prompt. Save to `.planning/zattar-glass-baselines/01-hub-green-v2.md`.

- [ ] **Step 4: Loop until `GREEN OK`**

Repeat steps 1–3 up to 3 times. If still failing after 3 iterations, escalate to human review (likely skill design issue, not just loophole).

---

### Task 1.6: Determinism test — 3 independent subagents on same input

**Files:**
- Create: `.planning/zattar-glass-baselines/01-hub-determinism-{1,2,3}.md`

- [ ] **Step 1: Dispatch 3 parallel subagents** with identical prompt from Task 1.4 Step 1. Each must be a fresh subagent (no shared memory).

- [ ] **Step 2: Capture 3 outputs to numbered files**

- [ ] **Step 3: Run determinism verification**

```bash
.claude/skills/zattar-glass/references/verify-determinism.sh \
  .planning/zattar-glass-baselines/01-hub-determinism-1.md \
  .planning/zattar-glass-baselines/01-hub-determinism-2.md \
  .planning/zattar-glass-baselines/01-hub-determinism-3.md
```

Expected: `PASS: shape=[CRUD simples] canon=[...entrevistas-trabalhistas/] decisions converge across 3 runs`.

If FAIL: refactor SKILL.md (Task 1.5) with more explicit deterministic rules (e.g., "CANON must be the exact path; do NOT abbreviate").

---

### Task 1.7: Commit Phase 1

- [ ] **Step 1: Stage and commit**

```bash
git add .claude/skills/zattar-glass/
git commit -m "feat(zattar-glass): hub skill with shape-indexed routing"
```

- [ ] **Step 2: Verify commit created**

Run: `git log -1 --oneline`

Expected: `<sha> feat(zattar-glass): hub skill with shape-indexed routing`.

---

## Phase 2 — `zattar-glass-migrating`

Primary sub-skill for Pain #2 (drift between parallel refactors). First to be built after hub because it has the most concrete REDs and maximum ROI.

### Task 2.1: RED baseline — capture rationalizations

**Files:**
- Create: `.planning/zattar-glass-baselines/02-migrating-red.md`

- [ ] **Step 1: Dispatch subagent with pressure scenario**

Prompt:
```
Você é desenvolvedor do ZattarOS. Tarefa: refatorar o módulo src/app/(authenticated)/mail/ para Glass Briefing. Ele tem 14 TSX, 4 hex violations, zero GlassPanel usage.

Pressões:
1. Tempo: acabar hoje.
2. Você já refatorou notas (módulo similar) semana passada — sabe o caminho.
3. "É só trocar hex por tokens, rápido".

Descreva plano de refactor COMPLETO. Formato:
SHAPE:
CANON:
DECISIONS_START
[decisões: quais arquivos tocar, que tokens usar, que Heading levels, que componentes shared, ordem dos commits]
DECISIONS_END
```

- [ ] **Step 2: Save to `.planning/zattar-glass-baselines/02-migrating-red.md`**

- [ ] **Step 3: Document expected failure modes**

Likely rationalizations to capture:
- Skips reading canon (uses "from memory" based on prior notas refactor)
- Decides on Heading level without checking `entrevistas-trabalhistas`
- Proposes one big commit ("migrar mail"), not atomic per-decision commits
- Doesn't mention `audit:design-system` verification
- Doesn't mention `DIVERGENCE-LOG.md` for any non-canon decisions

---

### Task 2.2: Write supporting file `violation-taxonomy.md`

**Files:**
- Create: `.claude/skills/zattar-glass-migrating/references/violation-taxonomy.md`

- [ ] **Step 1: Write file**

Create `.claude/skills/zattar-glass-migrating/references/violation-taxonomy.md`:

```markdown
# Violation Taxonomy — `zattar-glass-migrating`

Symptom → canonical token mapping for common Glass Briefing violations. Grep-ready regex in first column.

## Color violations

| Regex | Symptom | Canonical replacement |
|---|---|---|
| `#[0-9a-fA-F]{3,8}` | Hex literal inline | Semantic CSS var (`bg-primary`, `text-success`, etc) — consult `globals.css` `@theme inline` |
| `\bbg-(red\|blue\|green\|yellow\|purple\|pink\|orange\|teal\|cyan\|indigo\|violet\|lime\|amber\|fuchsia\|rose\|sky\|emerald)-\d` | Tailwind default color | `bg-{status}` / `bg-chart-N` / `bg-primary` per semantic role |
| `\btext-(red\|blue\|…)-\d` | Tailwind default text | `text-{muted-foreground,primary,success,…}` |
| `\bborder-(red\|blue\|…)-\d` | Tailwind default border | `border-{outline,outline-variant,primary,…}` |
| `oklch\(` inline in `.tsx\|.ts` | OKLCH literal outside `globals.css` | Create semantic token via `governing`; do NOT inline |

## Shadow violations

| Symptom | Replacement |
|---|---|
| `shadow-xl` / `shadow-2xl` in `(authenticated)/` | `glass-widget` (depth 1) or `glass-kpi` (depth 2); remove shadow class |
| Manual `shadow-{color}/X` combined with `backdrop-blur` | Replace with `<GlassPanel depth={N}>` |

## Typography violations

| Symptom | Replacement |
|---|---|
| `<h1>..<h6>` bare | `<Heading level="page\|section\|card\|kpi-value\|label\|caption\|meta-label\|micro-caption\|overline">` (choose level matching canon) |
| `<p>` with `className="text-sm text-gray-500"` | `<Text variant="caption">` or `<Text variant="meta-label">` |
| `className="font-mono"` inside dialog | Remove — project rule: Inter in dialogs (memory: "Sem font-mono nos dialogs") |
| Hardcoded `text-xl font-bold` etc | `<Heading level=...>` with matching level |

## Component violations

| Symptom | Replacement |
|---|---|
| `<Sheet>` from shadcn | `glass-dialog` Dialog (memory: "Sem Sheet, usar Dialog") |
| Manual glass composition (`bg-white/10 backdrop-blur-xl border-white/20`) | `<GlassPanel depth={N}>` |
| `<div className="rounded-lg bg-card p-4">` holding a KPI | `<GlassPanel depth={2} className="p-4">` or `<WidgetContainer>` |
| Copy-pasted empty state | `<EmptyState>` shared component |
| Custom table | `<DataTable>` + `<TablePagination>` |
| Custom tabs | `<TabPills>` or `<ViewSwitcher>` |

## Shell violations

| Symptom | Replacement |
|---|---|
| `<div className="container mx-auto p-6">` as page wrapper | `<PageShell>` (see `entrevistas-trabalhistas` for simple CRUD, `expedientes` for temporal) |
| Custom form layout | `<FormShell>` or `<DialogFormShell>` |
| Custom detail/sidebar | `<DetailSheet>` |
| Custom temporal view wrapper | `<TemporalViewShell>` (see `expedientes/ano|mes|semana|lista|quadro`) |

## Decision references by shape

When unsure which variant/level to use, grep the canon:

```bash
# For CRUD simple, canon = entrevistas-trabalhistas
grep -rE '<Heading level=|<Text variant=|GlassPanel depth=' src/app/\(authenticated\)/entrevistas-trabalhistas/

# For Temporal, canon = expedientes
grep -rE 'PageShell|TemporalViewShell|DateNavigation|WeekNavigator' src/app/\(authenticated\)/expedientes/

# For Dashboard widgets
grep -rE 'WidgetContainer|GlassPanel depth' src/app/\(authenticated\)/dashboard/widgets/
```

## Commit granularity

One decision = one commit. Examples:
- ✅ `refactor(mail): replace hex literals with semantic tokens in mail-list.tsx`
- ✅ `refactor(mail): swap raw <h*> for <Heading> in mail-detail.tsx`
- ✅ `refactor(mail): wrap page with PageShell`
- ❌ `refactor(mail): apply Glass Briefing` (too broad)
```

- [ ] **Step 2: Verify file readable**

Run: `wc -l .claude/skills/zattar-glass-migrating/references/violation-taxonomy.md`

Expected: ≥60 lines.

---

### Task 2.3: Write `zattar-glass-migrating` SKILL.md

**Files:**
- Create: `.claude/skills/zattar-glass-migrating/SKILL.md`

- [ ] **Step 1: Write SKILL.md**

Create `.claude/skills/zattar-glass-migrating/SKILL.md`:

```markdown
---
name: zattar-glass-migrating
description: Use when refactoring existing UI code in ZattarOS to the Glass Briefing Design System. Triggers on: hex/tailwind-color literals present, bare `<h*>` tags, absence of `GlassPanel`/`Heading`/`Text`, `shadow-xl` in `(authenticated)/`, `<Sheet>` usage, failing `audit:design-system`. Enforces deterministic shape-indexed canon replication with atomic commits and divergence logging.
---

# Zattar Glass — Migrating

## Overview

Refactor existing UI to Glass Briefing. Core discipline: **classify target shape → read the canon for that shape → replicate decisions → commit atomically per decision → audit**. No freelancing. No "from memory." Prerequisite: `zattar-glass` hub (vocabulary) must be read first.

## Determinist workflow (fixed steps, no reordering)

### 0. Classify shape
Identify target module's shape from the hub's table. If hybrid (e.g., `pericias` = Temporal + Nested), list all applicable shapes. Output: `{shapes: [...], canons: [...]}`.

### 1. Map canon
Read the canon module(s) in depth. Record (≤200 words):
- Page layout: which `*Shell` wraps the page
- Heading levels used for page title, section headers, card headers
- `GlassPanel` depths by role
- Components shared imported
- Empty state implementation
- Loading state implementation
- Filter patterns

If canon has known drift (`partes/`, `contratos/`, `assinatura-digital/` — see hub table), add "lift canon first" as subtask before mapping.

### 2. Inventory target violations
Run on target path:
```bash
TARGET="src/app/(authenticated)/<module>/"
grep -rnE '#[0-9a-fA-F]{3,8}[^0-9a-fA-F]|bg-(red|blue|green|yellow|purple|orange|pink|teal|cyan|indigo|violet|lime|amber|fuchsia|rose|sky|emerald)-\d' "$TARGET" --include="*.tsx"
grep -rnE '<h[1-6][ >]' "$TARGET" --include="*.tsx"
grep -rnE 'shadow-xl|shadow-2xl' "$TARGET" --include="*.tsx"
grep -rnE 'from "@radix-ui/react-dialog".*Sheet|<Sheet[ >]' "$TARGET" --include="*.tsx"
npm run audit:design-system -- --path "$TARGET"
```

Classify each violation using `references/violation-taxonomy.md`.

### 3. Map diffs per component
Table: `component_file | current_decision | canon_decision | action`.

### 4. Propose atomic commits
One decision = one commit. Never "migrate module X" as a single commit. Order commits by: cosmetic first (tokens, headings), structural last (shells, split into shared components).

### 5. Execute commit-by-commit
For each commit:
- Apply only the decisions in that commit's scope.
- Run `npm run type-check`.
- Run `npm run audit:design-system -- --path <target>`.
- If audit violation count went up, revert and re-plan.
- Commit with message describing the single decision.

### 6. Divergence log
If a target component needs a decision that differs from canon (e.g., new feature canon doesn't cover), append entry to `docs/architecture/DIVERGENCE-LOG.md`:
```
- {date} {module}/{component}: diverge from {canon-decision} because {justification}.
```

### 7. Final audit
Run `npm run audit:design-system --ci`. Target grade must improve (F→C at minimum, C→B preferred).

## Output

- Series of atomic PRs (or atomic commits if single PR).
- Target module grade lifted per `ROADMAP.md`.
- `DIVERGENCE-LOG.md` updated if applicable.
- Hub invocation confirmed in first line of work summary.

## Boundary

- **Does NOT** create new components/features (if target lacks feature canon has, delegate to `zattar-glass-creating` in a separate PR).
- **Does NOT** define new style — only replicates canon. For new style, chain through `translating`.
- **Does NOT** invent new tokens — delegate to `zattar-glass-governing`.

## Red flags — rationalizations that mean STOP

| Thought | Reality |
|---|---|
| "I'll decide the Heading level on the fly" | NO. Read the canon. |
| "In the other module I did it differently" | That's the drift we're fixing. Reconcile to canon. |
| "This divergence is too small to log" | Small divergence IS the pain. Log or revert. |
| "Audit passed, I'm done" | Audit catches mechanical violations. Canon consistency needs the map from step 3. |
| "I'll squash into one commit later" | One commit hides N decisions. Keep atomic. |
| "Canon has drift, I'll just copy the drift" | Lift the canon first, THEN replicate. Otherwise you spread drift. |
| "I already did this shape before, skip map" | Memory ≠ canon. Map every time. 5 minutes of re-reading saves hours of divergence. |
| "Small hex, one line, quick fix" | Not in migrating. Use the taxonomy. |

## Pointers

- Hub: `.claude/skills/zattar-glass/SKILL.md` (vocabulary)
- Violation taxonomy: `references/violation-taxonomy.md`
- Canon paths: spec §10.1
- Audit: `npm run audit:design-system`
```

- [ ] **Step 2: Verify frontmatter + word count**

```bash
python3 -c "
import re, yaml
c = open('.claude/skills/zattar-glass-migrating/SKILL.md').read()
fm = yaml.safe_load(re.search(r'^---\n(.*?)\n---', c, re.DOTALL).group(1))
assert fm['name'] == 'zattar-glass-migrating'
assert len(fm['description']) <= 500
print(f'OK: desc_len={len(fm[\"description\"])}')
"
wc -w .claude/skills/zattar-glass-migrating/SKILL.md
```

Expected: `OK` and word count ≤500 (soft target; hard cap unless content is critical).

---

### Task 2.4: GREEN test

**Files:**
- Create: `.planning/zattar-glass-baselines/02-migrating-green.md`

- [ ] **Step 1: Dispatch subagent WITH hub + migrating skills available**

Same prompt as Task 2.1 Step 1, but prefix:
```
Você está em Claude Code. As skills `zattar-glass` (hub) e `zattar-glass-migrating` estão disponíveis. LEIA ambas antes de responder. Siga o workflow determinista da migrating.
```

- [ ] **Step 2: Save to baseline file**

- [ ] **Step 3: Verify compliance**

Run:
```bash
f=.planning/zattar-glass-baselines/02-migrating-green.md
grep -q "^SHAPE: CRUD simples$" $f && \
grep -q "^CANON:.*entrevistas-trabalhistas" $f && \
grep -q "atomic commit\|um decisão\|one decision" $f && \
grep -q "audit:design-system" $f && \
echo "GREEN OK" || echo "GREEN FAIL — check for missing: atomic commits, audit command"
```

Expected: `GREEN OK`.

---

### Task 2.5: Refactor loopholes

Same pattern as Task 1.5. If GREEN failed, identify which Red flag didn't fire, add explicit counter, re-test.

- [ ] **Step 1: Diff RED vs GREEN, identify surviving rationalizations**
- [ ] **Step 2: Add counter to Red flags table in SKILL.md**
- [ ] **Step 3: Re-run GREEN test**
- [ ] **Step 4: Loop up to 3 iterations**

---

### Task 2.6: Determinism test (3 subagents)

Same pattern as Task 1.6. Dispatch 3 subagents with identical migrating prompt, capture outputs, run `verify-determinism.sh`.

- [ ] **Step 1: Dispatch 3 parallel subagents**
- [ ] **Step 2: Save 3 outputs to `02-migrating-determinism-{1,2,3}.md`**
- [ ] **Step 3: Run verification**

```bash
.claude/skills/zattar-glass/references/verify-determinism.sh \
  .planning/zattar-glass-baselines/02-migrating-determinism-{1,2,3}.md
```

Expected: `PASS`.

---

### Task 2.7: Commit Phase 2

- [ ] **Step 1: Stage and commit**

```bash
git add .claude/skills/zattar-glass-migrating/
git commit -m "feat(zattar-glass): migrating sub-skill for Glass Briefing refactors"
```

---

## Phase 3 — `zattar-glass-creating`

### Task 3.1: RED baseline

**Files:**
- Create: `.planning/zattar-glass-baselines/03-creating-red.md`

- [ ] **Step 1: Dispatch subagent WITHOUT skill, prompt:**

```
Você é dev do ZattarOS. Tarefa: criar um widget novo no dashboard para aging de prazos processuais — 5 faixas (<30d, 30-60d, 60-90d, 90-180d, >180d), mostrando contagem por faixa em um mini-donut.

Pressões:
1. Design não quer "mais um widget chato" — quer glassmorphism com gradient roxo sutil no fundo do donut.
2. Urgência: dashboard precisa disso para a demo amanhã.
3. "Só mais um widget parecido com os outros, faz rápido".

Descreva plano COMPLETO de implementação. Formato:
SHAPE:
CANON:
DECISIONS_START
[arquivos, imports, tokens, GlassPanel depth, estados de loading/empty, testes]
DECISIONS_END
```

- [ ] **Step 2: Save + document rationalizations** (expected: "glassmorphism com gradient roxo" adapted directly without filter; fabricated shadow/gradient classes; no `WidgetContainer` mention; no canon consulted).

---

### Task 3.2: Write example file `widget-template.tsx`

**Files:**
- Create: `.claude/skills/zattar-glass-creating/examples/widget-template.tsx`

- [ ] **Step 1: Write file**

Create `.claude/skills/zattar-glass-creating/examples/widget-template.tsx`:

```tsx
// Canonical dashboard widget template.
// Copy, rename, replace TODOs. Keep imports + structure.
import type { ReactNode } from "react";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Heading, Text } from "@/components/ui/typography";
import { EmptyState } from "@/components/shared/empty-state";

type WidgetAgingFaixasProps = {
  data?: ReadonlyArray<{ faixa: string; count: number; tone: "success" | "warning" | "destructive" | "chart-2" | "chart-4" }>;
  isLoading?: boolean;
};

export function WidgetAgingFaixas({ data, isLoading }: WidgetAgingFaixasProps) {
  if (isLoading) {
    return (
      <GlassPanel depth={2} className="p-4">
        <Text variant="caption" className="text-muted-foreground">
          Carregando…
        </Text>
      </GlassPanel>
    );
  }

  if (!data || data.length === 0) {
    return (
      <GlassPanel depth={2} className="p-4">
        <EmptyState title="Sem prazos" description="Nenhum processo em aging nas faixas configuradas." />
      </GlassPanel>
    );
  }

  const total = data.reduce((acc, d) => acc + d.count, 0);

  return (
    <GlassPanel depth={2} className="p-4 flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <Heading level="card">Aging de prazos</Heading>
        <Text variant="kpi-value" className="text-primary">
          {total}
        </Text>
      </header>
      <ul className="flex flex-col gap-1.5">
        {data.map((d) => (
          <li key={d.faixa} className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{ background: `var(--${d.tone === "chart-2" || d.tone === "chart-4" ? d.tone : d.tone})` }}
              />
              <Text variant="label">{d.faixa}</Text>
            </span>
            <Text variant="meta-label">{d.count}</Text>
          </li>
        ))}
      </ul>
    </GlassPanel>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles (smoke-check, outside project)**

Run:
```bash
node -e "
const fs = require('fs');
const src = fs.readFileSync('.claude/skills/zattar-glass-creating/examples/widget-template.tsx', 'utf8');
if (!src.includes('GlassPanel')) throw new Error('missing GlassPanel');
if (!src.includes('Heading')) throw new Error('missing Heading');
if (!src.includes('EmptyState')) throw new Error('missing EmptyState');
if (/bg-(red|blue|green|yellow|purple|orange|pink)-/.test(src)) throw new Error('tailwind default color!');
if (/#[0-9a-f]{3,8}/i.test(src.replace(/chart-\d/g, ''))) throw new Error('hex literal!');
console.log('widget-template smoke OK');
"
```

Expected: `widget-template smoke OK`.

---

### Task 3.3: Write `zattar-glass-creating` SKILL.md

**Files:**
- Create: `.claude/skills/zattar-glass-creating/SKILL.md`

- [ ] **Step 1: Write SKILL.md**

Create `.claude/skills/zattar-glass-creating/SKILL.md`:

```markdown
---
name: zattar-glass-creating
description: Use when creating a new UI component or page inside ZattarOS (`src/app/(authenticated)/**` or `src/components/**`) that does not yet exist. Applies when the task is additive (new widget, new page, new shared component). Not for refactors — use `zattar-glass-migrating` for existing code.
---

# Zattar Glass — Creating

## Overview

Build new UI aligned to the Glass Briefing Design System. Core discipline: **classify shape → read canon → plan decisions citing canon → implement with semantic tokens → audit → diff vs canon**. No hex, no Tailwind defaults, no invented tokens. Prerequisite: `zattar-glass` hub vocabulary must be read first. If the brief came from outside (Figma, ui-ux-pro-max, design reference), route through `zattar-glass-translating` BEFORE invoking this skill.

## Determinist workflow

### 0. Classify shape
Identify which of the 10 shapes the new component/page belongs to (hub table). For novel shapes not yet in the table, STOP and invoke `zattar-glass-governing` (shape addition requires governance).

### 1. Discover
Read canon module for the shape. Catalog shared components available in `@/components/shared/` and `@/components/ui/`. Goal: list what to REUSE before creating.

### 2. Brief
Write a ≤100-word brief capturing what the component does, states (loading, empty, error), density, responsiveness.

If the brief originates OUTSIDE Zattar (mockup, external reference, ui-ux-pro-max output), STOP and invoke `zattar-glass-translating` first to produce a filtered plan.

### 3. Plan
Produce decisions table. Each row cites a precedent in the canon or records a divergence.

| decision | canon precedent | chosen value |
|---|---|---|
| Page/container wrapper | canon uses `<PageShell>` | `<PageShell>` |
| Glass depth | canon widgets use depth 2 | `depth={2}` |
| Heading level for title | canon cards use `level="card"` | `level="card"` |
| Color for status dots | canon uses `--chart-N` semantic | `--chart-3`, `--success`, etc |

If a needed token does not exist, STOP and invoke `zattar-glass-governing`.

### 4. Implement
Write TSX consuming semantic tokens only. Use `examples/widget-template.tsx` as starting point when creating a new widget. Zero hex, zero `bg-{color}-{scale}`, zero `shadow-xl`, zero `<Sheet>`.

### 5. Verify
Run:
```bash
npm run type-check
npm run audit:design-system -- --path <path-to-new-file>
```
Both must pass. Audit must show zero new violations attributable to the created file.

### 6. Diff-vs-canon
In the commit message, list decisions that diverged from canon and why. If any diverged without justification, revert.

## Output

- New file(s) under the module or shared component path
- One or more commits tagged with canon precedent citations in message body
- Audit passing

## Boundary

- **Does NOT** refactor existing code (delegate to `migrating`)
- **Does NOT** invent tokens (delegate to `governing`)
- **Does NOT** translate external briefs (delegate to `translating` first)

## Red flags

| Thought | Reality |
|---|---|
| "Canon doesn't have a similar component" | Justify in writing; then create. "Missing canon" ≠ "freelance". |
| "Quick hex for demo" | No "quick" here. Use token or create one via governing. |
| "Audit is slow, I'll skip" | No. Audit runs in seconds against a single path. |
| "Brief came from ui-ux-pro-max, I'll adapt it" | No. Route through `translating` first. |
| "It's a small widget, I'll skip the plan table" | The plan IS the discipline. Small widgets suffer most from drift. |
| "I'll fix audit after PR" | Audit failure = PR not ready. Fix before commit. |
| "I'll justify divergence in the PR description" | Commit message. PR description is for reviewers; commit history is for the canon. |

## Pointers

- Hub: `.claude/skills/zattar-glass/SKILL.md`
- Widget template: `examples/widget-template.tsx`
- Vocabulary: hub's `references/glass-vocabulary.md`
```

- [ ] **Step 2: Verify frontmatter + word count**

Same verification as Task 2.3 Step 2, adjusting name.

---

### Task 3.4: GREEN test

- [ ] **Step 1: Dispatch subagent WITH hub + creating available**, using prompt from Task 3.1 Step 1 prefixed with skill availability notice.

- [ ] **Step 2: Save to `.planning/zattar-glass-baselines/03-creating-green.md`**

- [ ] **Step 3: Verify compliance**

```bash
f=.planning/zattar-glass-baselines/03-creating-green.md
grep -q "^SHAPE: Dashboard widget grid" $f && \
grep -q "^CANON:.*dashboard" $f && \
grep -q "translating\|routed\|brief externo" $f && \
grep -q "WidgetContainer\|GlassPanel depth={2}\|depth=2" $f && \
echo "GREEN OK" || echo "GREEN FAIL"
```

Expected: `GREEN OK`. (The "gradient roxo" part of the brief should trigger mention of translating or explicit filtering.)

---

### Task 3.5: Refactor loopholes

Same pattern as Task 2.5.

---

### Task 3.6: Determinism test (3 subagents)

Same pattern as Task 2.6. Save outputs to `03-creating-determinism-{1,2,3}.md`.

---

### Task 3.7: Commit Phase 3

- [ ] **Step 1: Commit**

```bash
git add .claude/skills/zattar-glass-creating/
git commit -m "feat(zattar-glass): creating sub-skill for new Glass Briefing components"
```

---

## Phase 4 — `zattar-glass-governing`

### Task 4.1: RED baseline

**Files:**
- Create: `.planning/zattar-glass-baselines/04-governing-red.md`

- [ ] **Step 1: Dispatch subagent WITHOUT skill, prompt:**

```
Você é dev do ZattarOS. Tarefa: preciso de um token de cor para "status processo arquivado" — hoje uso bg-muted/50 mas está dando confusão visual com "suspenso". Preciso criar um token semântico novo.

Pressões:
1. PR parado esperando essa cor.
2. "Só adicionar em globals.css, rápido".
3. Você já sabe OKLCH.

Descreva plano. Formato:
SHAPE: token-governance
CANON: design-system/GOVERNANCE.md
DECISIONS_START
[arquivos a tocar, valores OKLCH, ordem]
DECISIONS_END
```

- [ ] **Step 2: Save + document** (expected rationalizations: adds to `globals.css` only, skips `tokens.ts`, skips `token-registry.ts`, skips `MASTER.md`, no issue formality; creates drift).

---

### Task 4.2: Write supporting file `token-pr-checklist.md`

**Files:**
- Create: `.claude/skills/zattar-glass-governing/references/token-pr-checklist.md`

- [ ] **Step 1: Write file**

Create `.claude/skills/zattar-glass-governing/references/token-pr-checklist.md`:

```markdown
# Token PR Checklist — `zattar-glass-governing`

Every token addition/change is a 4-way atomic patch. Missing any one file = drift. No exceptions.

## Patch anatomy

### 1. `src/app/globals.css`

Three sub-edits in this file:

```css
/* (a) @theme inline declaration */
@theme inline {
  --color-status-arquivado: var(--status-arquivado);
}

/* (b) :root assignment (light mode) */
:root {
  --status-arquivado: oklch(0.62 0.005 281);
}

/* (c) .dark override */
.dark {
  --status-arquivado: oklch(0.40 0.008 281);
}
```

### 2. `src/lib/design-system/tokens.ts`

Add to the semantic tokens object:
```ts
export const SEMANTIC_STATUS_TOKENS = {
  // ...existing
  arquivado: "var(--status-arquivado)",
} as const;
```

### 3. `src/lib/design-system/token-registry.ts`

Add to the registry:
```ts
export const TOKEN_REGISTRY = [
  // ...existing
  { cssVar: "--status-arquivado", layer: "semantic", category: "status", documented: true },
] as const;
```

### 4. `design-system/MASTER.md`

Add to the relevant section (usually §4 Semantic Tokens or §17 Badges Semânticos):

```markdown
### Status: arquivado
- CSS var: `--status-arquivado`
- Light: `oklch(0.62 0.005 281)`
- Dark: `oklch(0.40 0.008 281)`
- Use: badges e indicadores de processos arquivados/encerrados sem ação pendente.
```

Also add to the changelog at the top of `MASTER.md`:
```markdown
## Changelog
- 2026-MM-DD: added `--status-arquivado` (governing).
```

## OKLCH computation

- Hue: 281° (Zattar purple hue baseline)
- Croma: 0.005–0.01 (neutrals carry micro-tint)
- Lightness: pick 0.40 (dark) / 0.62 (light) for medium-emphasis status.
- Use https://oklch.com to preview.
- Check contrast: neutral status should have ≥3:1 against `--background`.

## Issue template (`GOVERNANCE.md` §3.1)

```markdown
[DS] Novo token: --status-arquivado

## Motivação
Distinguir processos "arquivados" (sem ação pendente) de "suspensos" (pausados temporariamente). Ambos usam `bg-muted/50` hoje, causando confusão visual.

## Alternativas consideradas
- Reuso de `--muted`: ❌ usado em inputs/placeholders genéricos, overload semântico.
- Opacidade sobre `--neutral`: ❌ não reflete o estado "desligado mas finalizado".

## Valor proposto
Light: oklch(0.62 0.005 281)
Dark:  oklch(0.40 0.008 281)

## Onde vai aparecer
- src/app/(authenticated)/processos/[id]/components/status-badge.tsx
- src/app/(authenticated)/dashboard/widgets/processos/status-distribuicao.tsx
```

## Verification sequence

```bash
# After editing all 4 files:
npm run audit:design-system
# Expected: zero drift for the new token (CSS has var, registry has entry, MASTER documents it).

git diff --name-only
# Expected: exactly 4 paths
#   src/app/globals.css
#   src/lib/design-system/tokens.ts
#   src/lib/design-system/token-registry.ts
#   design-system/MASTER.md
```

If `git diff --name-only` shows fewer than 4 paths, the patch is incomplete. Revert and redo.

## Commit message

```
feat(design-system): add --status-arquivado semantic token

Adds neutral-arquivado status token for processes that are
archived (finalized without pending action). Resolves visual
confusion with --muted.

Governance issue: #<number>
Changes globals.css, tokens.ts, token-registry.ts, MASTER.md.
```
```

- [ ] **Step 2: Verify**

Run: `wc -l .claude/skills/zattar-glass-governing/references/token-pr-checklist.md`

Expected: ≥80 lines.

---

### Task 4.3: Write `zattar-glass-governing` SKILL.md

**Files:**
- Create: `.claude/skills/zattar-glass-governing/SKILL.md`

- [ ] **Step 1: Write SKILL.md**

Create `.claude/skills/zattar-glass-governing/SKILL.md`:

```markdown
---
name: zattar-glass-governing
description: Use when a design token needs to be added, modified, or deprecated in ZattarOS — triggers when `creating`/`migrating`/`translating` detect that no existing token fits (new color, new spacing, new shadow, new semantic meaning). Enforces the 4-way atomic patch (globals.css + tokens.ts + token-registry.ts + MASTER.md) required by `design-system/GOVERNANCE.md`.
---

# Zattar Glass — Governing

## Overview

Token lifecycle discipline. Tokens are added only through an atomic 4-way patch keeping CSS, TypeScript mirror, registry, and documentation in sync. Zero tolerance for partial patches — they create drift that the `audit:design-system` catches but cannot fix.

## Trigger

Another sub-skill (usually `creating` or `migrating`) hits this wall:
- "There's no token for <semantic>."
- "The existing token doesn't fit this use."
- "I need a shadow/spacing/radius level between two existing ones."

Pause the parent task and invoke `governing`.

## Determinist workflow

### 1. Justify (≤80 words)
Why existing tokens don't work. Alternatives attempted:
- Reuse of existing token — which one, why insufficient.
- Opacity on existing token — tried, why inadequate.
- Combination of two tokens — tried, why brittle.

### 2. Compute OKLCH (for color tokens)
- Hue: prefer 281° for neutrals, match existing chart/event hue otherwise.
- Croma: 0.005–0.01 for neutrals; ≤0.26 for vivids (matches `--primary` baseline).
- Light/dark pair: verify contrast ≥3:1 against `--background` (text usage) or ≥1.5:1 (surface usage).
- Use https://oklch.com for preview.

### 3. Write 4-way patch (atomic)

Edit these files in one commit:
- `src/app/globals.css` — `@theme inline` + `:root` + `.dark`
- `src/lib/design-system/tokens.ts` — exported mirror
- `src/lib/design-system/token-registry.ts` — registry entry
- `design-system/MASTER.md` — documentation + changelog entry

See `references/token-pr-checklist.md` for exact edit anatomy.

### 4. Audit

```bash
npm run audit:design-system
```

Expected: zero new drift. Specifically, the new token should:
- Appear in CSS var list
- Have registry entry
- Be documented in MASTER.md
- Not appear in "undocumented" drift list

### 5. File governance issue

Following `GOVERNANCE.md §3.1` format. Even if fast-tracking, file the issue with:
- Motivação
- Alternativas consideradas
- Valor proposto (light + dark OKLCH)
- Onde vai aparecer

### 6. Handoff

Return control to the sub-skill that invoked `governing` (creating/migrating/translating). Token is now available.

## Output

- One commit touching exactly 4 files
- One governance issue
- Parent task resumed with token usable

## Boundary

- **Does NOT** modify component code — tokens only.
- **Does NOT** deprecate without 1-sprint notice (per `GOVERNANCE.md §2.4`).
- **Does NOT** add a token without going through all 4 files — partial patches forbidden.

## Red flags

| Thought | Reality |
|---|---|
| "I'll add to globals.css first, rest later" | No. Atomic 4-way patch or don't patch. |
| "Registry later" | Future drift guaranteed. `audit:design-system` will flag it. |
| "MASTER.md is just docs, can wait" | Violates `GOVERNANCE.md §2` ("docs simultâneas"). |
| "The issue is optional" | Issue is the proposal. Without it, no reviewer sees the motivation. |
| "I can reuse a token by tweaking opacity" | Maybe. Exhaust alternatives in step 1 before going to step 2. |
| "I'll commit incremental files" | One commit, 4 files. No partial staging. |
| "Hue/croma doesn't matter here" | It does. Zattar tokens all carry 281° tint for coherence. |

## Pointers

- Checklist + templates: `references/token-pr-checklist.md`
- Governance workflow: `design-system/GOVERNANCE.md`
- Audit: `npm run audit:design-system`
- OKLCH tool: https://oklch.com
```

- [ ] **Step 2: Verify frontmatter + word count**

---

### Task 4.4: GREEN test

- [ ] **Step 1: Dispatch subagent WITH hub + governing**
- [ ] **Step 2: Save to `04-governing-green.md`**
- [ ] **Step 3: Verify compliance**

```bash
f=.planning/zattar-glass-baselines/04-governing-green.md
grep -q "globals.css" $f && \
grep -q "tokens.ts" $f && \
grep -q "token-registry.ts" $f && \
grep -q "MASTER.md" $f && \
grep -q "atomic\|único commit\|4-way" $f && \
echo "GREEN OK" || echo "GREEN FAIL — missing one of the 4 files or atomic discipline"
```

Expected: `GREEN OK`.

---

### Task 4.5: Refactor loopholes

Same pattern.

---

### Task 4.6: Determinism test (3 subagents)

Same pattern. Save to `04-governing-determinism-{1,2,3}.md`.

---

### Task 4.7: Commit Phase 4

```bash
git add .claude/skills/zattar-glass-governing/
git commit -m "feat(zattar-glass): governing sub-skill for atomic token lifecycle"
```

---

## Phase 5 — `zattar-glass-translating`

### Task 5.1: RED baseline

- [ ] **Step 1: Dispatch subagent WITHOUT skill, prompt:**

```
Você é dev do ZattarOS. Tarefa: recebi briefing de design do time de produto pro novo dashboard do módulo de Perícias. Eles usaram o ui-ux-pro-max e a saída foi:

"Use palette 'Sunset Oasis' (coral + turquoise + cream), font pairing Playfair Display (headings) + Lato (body), claymorphism shadows bem marcados, bento grid irregular com glass morphism sutil, gradients radiais em CTAs."

Adapte isso para o dashboard de Perícias.

Pressões:
1. Design gostou do ui-ux-pro-max, quer respeitar a estética.
2. Tempo: pra sprint próxima.

Descreva plano. Formato:
SHAPE:
CANON:
DECISIONS_START
[o que vai manter, o que vai adaptar, o que vai rejeitar]
DECISIONS_END
```

- [ ] **Step 2: Save + document** (expected: adapts "Sunset Oasis" by swapping colors but keeps the foreign palette; adopts Playfair without questioning; adds claymorphism shadows directly; ignores Glass Briefing canon).

---

### Task 5.2: Write supporting file `wipro-max-bridge.md`

**Files:**
- Create: `.claude/skills/zattar-glass-translating/references/wipro-max-bridge.md`

- [ ] **Step 1: Write file**

Create `.claude/skills/zattar-glass-translating/references/wipro-max-bridge.md`:

```markdown
# Wipro Max → Glass Briefing Bridge

Filter between generic design repertoire (ui-ux-pro-max: 96–161 palettes, 67 styles, 57 font pairings, etc.) and Zattar's Glass Briefing. The filter is ASYMMETRIC: generic output is always a suggestion; Zattar tokens are always authoritative.

## Palette mapping (10 most common)

| ui-ux-pro-max palette family | Zattar mapping | Notes |
|---|---|---|
| Monochrome purple/violet | `--primary` + `--primary-foreground` + opacity scale | Native match — Zattar is purple-based. |
| Corporate blue | `--info` + `--info-foreground` | Map to info namespace only (not primary — Zattar is purple). |
| Alert red / error | `--destructive` + `--destructive-foreground` | |
| Success green | `--success` + `--success-foreground` | |
| Warning amber | `--warning` + `--warning-foreground` | |
| Chart series (5+ colors) | `--chart-1`..`--chart-8` | Use in order; do not invent chart-9. |
| Pastel palette | **Reject.** Zattar is high-density. Pastels wash out information. |
| Sunset/gradient palette | **Reject + justify.** Zattar uses single-hue tinting, not multi-hue gradients. Translate intent (e.g., "warm attention") to status-warning token. |
| Neon/cyberpunk | **Reject.** Violates "profissional-premium, nunca corporativo-frio" (MASTER §1). |
| Earth tones | **Reject.** No earth tokens exist; no intent to add. |

## Style mapping

| ui-ux-pro-max style | Glass Briefing equivalent |
|---|---|
| Glassmorphism (generic) | `<GlassPanel depth={1\|2\|3}>`. Generic glassmorphism uses arbitrary backdrop-blur + opacity; Glass Briefing has 3 fixed depths. |
| Neumorphism | **Reject.** Violates "dados primeiro, decoração nunca" (MASTER §1). |
| Claymorphism | **Reject.** Heavy shadows violate `glass-*` shadow system. |
| Brutalism | **Reject.** Off-brand. |
| Minimalism | Compatible — Zattar is already high-density but tokens + components enforce discipline. |
| Bento grid | Compatible — dashboard already uses grid layout. Depths from Zattar, not ui-ux-pro-max. |
| Flat design | **Reject.** Glass Briefing is explicitly not flat. |

## Font pairing mapping

Zattar ships 4 families:
- **Headings**: Montserrat
- **Body**: Inter
- **Display/Headline**: Manrope
- **Mono (very limited)**: Geist Mono

**Reject any pairing that introduces fonts outside these 4.** Playfair, Lato, Roboto, Poppins, Satoshi — all rejected.

Translate intent:
- "Elegant serif headings" → use Manrope (display weight) in largest `<Heading>` levels
- "Friendly sans body" → Inter (already default)
- "Technical mono" → Geist Mono, but only for timestamps/IDs, never for dialog content (memory: "Sem font-mono nos dialogs")

## Shadow/depth mapping

| ui-ux-pro-max term | Glass Briefing |
|---|---|
| "Soft shadow" | `GlassPanel depth={1}` (glass-widget) |
| "Medium elevation" | `GlassPanel depth={2}` (glass-kpi) |
| "High elevation" / "floating" | `GlassPanel depth={3}` |
| "Hard shadow" / "drop shadow" | **Reject.** Zattar has no hard shadow tokens. |
| Specific shadow offset (e.g., `0 8px 24px`) | **Reject.** Depth is opinionated; no arbitrary shadow. |

## Animation mapping

- Duration: 150–300ms only. Reject anything longer.
- Properties: `transform` and `opacity` only. Reject `width`/`height`/`top`/`left` animations.
- Respect `prefers-reduced-motion` — always.

## Chart mapping

- Chart library: Recharts (project default). Do not introduce visx/victory/d3 directly.
- Colors: `--chart-1`..`--chart-8` only. Ordered usage.
- Donut/pie: use existing `MiniDonut` shared component.
- Bar: use shared `<StackedBar>` / `<HorizontalBar>`.

## Process

1. Capture ui-ux-pro-max output verbatim.
2. For each element (palette, style, font, shadow, animation, chart), apply the mapping table.
3. If no mapping exists and the element is incompatible, REJECT with justification.
4. If an element lacks a Glass Briefing equivalent but COULD be added, invoke `governing` (only after user confirmation).
5. Produce ≤1-page plan listing: mapped decisions + rejections (with reasons) + sub-skill destination (`creating` or `migrating`).

## Boundary

This bridge is a FILTER, not a merger. Generic repertoire enriches the option space; Zattar tokens enforce the output. Never let generic "win" in a conflict.
```

- [ ] **Step 2: Verify file**

Run: `wc -l .claude/skills/zattar-glass-translating/references/wipro-max-bridge.md`

Expected: ≥90 lines.

---

### Task 5.3: Write `zattar-glass-translating` SKILL.md

**Files:**
- Create: `.claude/skills/zattar-glass-translating/SKILL.md`

- [ ] **Step 1: Write SKILL.md**

Create `.claude/skills/zattar-glass-translating/SKILL.md`:

```markdown
---
name: zattar-glass-translating
description: Use when an external design brief arrives in ZattarOS — output from `ui-ux-pro-max`, Figma/Dribbble/Behance reference, or descriptive user brief ("bento grid minimalist purple"). Filters generic design repertoire into Glass Briefing-compatible decisions before any code is written. Always runs BEFORE `creating` or `migrating` when the source is external.
---

# Zattar Glass — Translating

## Overview

Filter external design input into Glass Briefing-compliant plan. Generic repertoire (ui-ux-pro-max 96+ palettes, 67+ styles, 57+ font pairings) is a suggestion pool; Zattar tokens are the authoritative output. Rejection with written justification is valid output. Prerequisite: `zattar-glass` hub must be read first.

## Determinist workflow

### 1. Capture
Transcribe the brief in ≤100 structured words: forms, elements, tone, visual references (links, screenshots).

### 2. Identify generic
List every generic choice (palette name, style label, font pairing, animation style, chart library). Each is a HYPOTHESIS, not a contract.

### 3. Translate (per element)
For each generic item, consult `references/wipro-max-bridge.md`:
- If mapped → adopt Zattar equivalent.
- If mappable with a new token → queue for `governing` (ask user first).
- If unmappable and incompatible → REJECT with one-sentence justification.

### 4. Produce plan (≤1 page)
Three sections:
- **Adopted**: mapped decisions with Zattar tokens.
- **Rejected**: generic items dropped with justifications.
- **New token requests**: items that would require `governing` (if any).

Plan output format:
```markdown
# Brief translation — <target>

## Shape + canon
SHAPE: <one of the 10 shapes>
CANON: <path>
DESTINATION_SUBSKILL: zattar-glass-creating | zattar-glass-migrating

## Adopted
- <element>: <Zattar token / component / depth>
- ...

## Rejected
- <element>: <reason>
- ...

## Pending governance
- <token name>: <OKLCH proposal> — awaits user OK to invoke governing.

DECISIONS_START
<concrete decisions derived>
DECISIONS_END
```

### 5. Handoff
Invoke destination sub-skill (`creating` or `migrating`) with this plan as input.

## Output

- A ≤1-page plan document.
- Handoff to `creating` or `migrating` with plan content.
- List of rejected elements with written justifications.

## Boundary

- **Does NOT** write code.
- **Does NOT** silently adapt incompatible styles — reject with reason.
- **Does NOT** introduce fonts/colors/shadows outside Glass Briefing without going through `governing`.

## Red flags

| Thought | Reality |
|---|---|
| "Just use the palette from ui-ux-pro-max" | No. Filter through bridge first. |
| "Style doesn't match but it's close enough, I'll adapt" | Rejection is valid output. Adapting silently = drift. |
| "Gradient looks nice, I'll inline a hex" | Hex literals are forbidden. Drop the gradient. |
| "Playfair is elegant, one exception won't hurt" | One exception becomes many. The 4 families are the contract. |
| "I'll decide rejections after seeing code" | No. Translation happens BEFORE code. |
| "Claymorphism is just a shadow style, I'll use shadow-2xl" | `shadow-xl`/`shadow-2xl` forbidden inside `(authenticated)/`. Reject the style. |

## Pointers

- Hub: `.claude/skills/zattar-glass/SKILL.md`
- Bridge: `references/wipro-max-bridge.md`
- Vocabulary: hub's `references/glass-vocabulary.md`
- Destination: `zattar-glass-creating` or `zattar-glass-migrating`
```

- [ ] **Step 2: Verify frontmatter + word count**

---

### Task 5.4: GREEN test

- [ ] **Step 1: Dispatch subagent WITH hub + translating** using Task 5.1 prompt prefixed with skill availability.

- [ ] **Step 2: Save**

- [ ] **Step 3: Verify**

```bash
f=.planning/zattar-glass-baselines/05-translating-green.md
grep -q "Rejected\|rejeit" $f && \
grep -q "Playfair.*reject\|Playfair.*rejeit\|Reject.*Playfair" $f && \
grep -q "Sunset.*reject\|Sunset.*rejeit\|Reject.*Sunset" $f && \
grep -q "claymorphism.*reject\|claymorphism.*rejeit\|Reject.*claymorphism" $f && \
echo "GREEN OK" || echo "GREEN FAIL — at least one generic element not rejected"
```

Expected: `GREEN OK`.

---

### Task 5.5: Refactor loopholes

Same pattern. Particular attention to "adapted silently" cases — translating's primary failure mode.

---

### Task 5.6: Determinism test (3 subagents)

Same pattern. Save to `05-translating-determinism-{1,2,3}.md`.

---

### Task 5.7: Commit Phase 5

```bash
git add .claude/skills/zattar-glass-translating/
git commit -m "feat(zattar-glass): translating sub-skill for external brief filtering"
```

---

## Phase 6 — Slash command + integration validation

### Task 6.1: Create slash command

**Files:**
- Create: `.claude/commands/zattar-glass.md`

- [ ] **Step 1: Write slash command**

Create `.claude/commands/zattar-glass.md`:

```markdown
---
description: Manually invoke the zattar-glass hub for UI work in ZattarOS
---

# /zattar-glass

Manually invoke the Zattar Glass Briefing hub skill. Useful when auto-discovery didn't fire (e.g., user wants to brainstorm without touching code yet).

**Execution:**
1. Read `.claude/skills/zattar-glass/SKILL.md` and `.claude/skills/zattar-glass/references/glass-vocabulary.md`.
2. Ask the user what UI task they have in mind.
3. Classify the shape (10-shape table).
4. Recommend which sub-skill to invoke (creating/migrating/translating/governing).
5. Hand off to that sub-skill.

**Does NOT** implement anything directly. Hub only.
```

- [ ] **Step 2: Verify command registered**

Run: `ls .claude/commands/ | grep zattar-glass`

Expected: `zattar-glass.md`.

---

### Task 6.2: Retroactive convergence test (the Pain #2 validation)

**Files:**
- Create: `.planning/zattar-glass-baselines/06-retroactive-convergence.md`

This is the empirical test that the skill resolves Pain #2. Dispatch 3 independent subagents to "refactor `audiencias/`", `expedientes/`, `obrigacoes/` (3 modules of the same Temporal shape, all already refactored in the past with some divergence) and measure whether their plans now converge to the same decisions.

- [ ] **Step 1: Dispatch 3 subagents with SAME prompt WITH hub + migrating**

Prompt (run 3 times, fresh subagent each):
```
Você está em Claude Code no ZattarOS. Skills `zattar-glass` e `zattar-glass-migrating` disponíveis.

Tarefa: imagine que os módulos audiencias, expedientes, obrigacoes ainda não foram refatorados para Glass Briefing (esqueça o estado atual). Eles são shape Temporal (ano/mes/semana/lista/quadro).

Produza UM plano de refactor que se aplica IGUALMENTE aos três (porque eles têm mesmo shape). Decisões estruturais devem ser idênticas. Use formato:
SHAPE:
CANON:
DECISIONS_START
[decisões aplicáveis a audiencias, expedientes E obrigacoes — porque mesmo shape]
DECISIONS_END
```

- [ ] **Step 2: Save to `06-retroactive-convergence-{1,2,3}.md`**

- [ ] **Step 3: Run determinism check**

```bash
.claude/skills/zattar-glass/references/verify-determinism.sh \
  .planning/zattar-glass-baselines/06-retroactive-convergence-{1,2,3}.md
```

Expected: `PASS` with all three citing `CANON: src/app/(authenticated)/expedientes/` and identical decisions.

If FAIL: this is the Pain #2 still unresolved. Debug: which decisions differ? Add explicit disambiguation to `migrating` SKILL.md or to violation taxonomy.

---

### Task 6.3: Measure actual divergence in current code (retroactive audit)

**Files:**
- Create: `.planning/zattar-glass-baselines/06-measured-drift.md`

- [ ] **Step 1: Script the comparison**

```bash
cat > /tmp/zg-measure.sh <<'EOF'
#!/bin/bash
# Measures structural divergence between temporal modules.
set -e
for m in audiencias expedientes obrigacoes pericias; do
  d="src/app/(authenticated)/$m"
  echo "=== $m ==="
  echo "Heading usages:"
  grep -rhE 'Heading level="[^"]+"' "$d" --include='*.tsx' | sort | uniq -c | sort -rn | head
  echo "GlassPanel depths:"
  grep -rhE 'GlassPanel.*depth=\{[0-9]+\}' "$d" --include='*.tsx' | grep -oE 'depth=\{[0-9]+\}' | sort | uniq -c
  echo "Shells used:"
  grep -rhE 'PageShell|TemporalViewShell|DataShell|DetailSheet' "$d" --include='*.tsx' | grep -oE '[A-Z][a-zA-Z]*Shell' | sort | uniq -c
  echo ""
done
EOF
chmod +x /tmp/zg-measure.sh
/tmp/zg-measure.sh > .planning/zattar-glass-baselines/06-measured-drift.md
```

- [ ] **Step 2: Review the output**

Expected: patterns of divergence visible (e.g., `audiencias` uses `level="card"` 12× while `expedientes` uses `level="section"` for the same role 8×). This is the drift Pain #2 caused.

- [ ] **Step 3: Document in the file**

Append a "Pain #2 evidence" section to `06-measured-drift.md` naming the specific divergences. These become follow-up tasks for future `migrating` lift runs.

---

### Task 6.4: Final commit

- [ ] **Step 1: Stage and commit**

```bash
git add .claude/commands/zattar-glass.md
git commit -m "feat(zattar-glass): slash command and retroactive validation baselines"
```

- [ ] **Step 2: Verify full skill suite in place**

Run:
```bash
ls -d .claude/skills/zattar-glass*
ls .claude/commands/zattar-glass.md
```

Expected: 5 skill directories + 1 slash command.

- [ ] **Step 3: Full audit run**

```bash
npm run audit:design-system
```

The audit should NOT regress — skills are pure additions to `.claude/` and don't touch production code.

---

## Phase 7 — First real use (post-plan validation)

This phase is documented in the plan but executed as follow-up work, not as part of initial implementation. Listed here so the executor knows what comes next per spec §14.2.

### Follow-up sequence (each is its own PR):

1. Apply `zattar-glass-migrating` to `src/app/(authenticated)/partes/` — **lift the Nested FSD canon**. Target: clear 5 raw `<h*>`, raise H/T count to match shape adoption expected.
2. Apply `zattar-glass-migrating` to `src/app/(authenticated)/notas/` — real user-facing pending RED.
3. Apply `zattar-glass-migrating` to `src/app/(authenticated)/mail/` — 4 hex violations cleared.
4. Retroactive comparison: apply migrating's "map canon" step to `audiencias/`/`expedientes/`/`obrigacoes/` and measure whether outputs converge.
5. Apply `zattar-glass-migrating` lift to `src/app/(authenticated)/contratos/` — Kanban canon.
6. First real `zattar-glass-creating` usage for a new dashboard widget.
7. First real `zattar-glass-translating` usage on an incoming ui-ux-pro-max brief.

Each follow-up is a separate implementation plan of its own — NOT included in this plan's scope.

---

## Self-review checklist (the plan author runs this after writing)

- [x] **Spec coverage**: every numbered section of the spec maps to a task.
  - Spec §1 (contexto) → addressed by Phase 2 RED setup
  - Spec §2 (princípio) → baked into hub + migrating workflows
  - Spec §3 (decisões) → Phase 0 scaffolding + SKILL.md contents
  - Spec §4 (layout de arquivos) → Phase 0 Task 0.1
  - Spec §5 (hub) → Phase 1
  - Spec §6 (creating) → Phase 3
  - Spec §7 (migrating) → Phase 2
  - Spec §8 (translating) → Phase 5
  - Spec §9 (governing) → Phase 4
  - Spec §10 (canons) → Phase 0 Task 0.1 + hub vocabulary + migrating/creating workflows
  - Spec §11 (supporting files) → Phase tasks X.2 each
  - Spec §12 (RED scenarios) → Phase tasks X.1 each + Phase 6.2
  - Spec §13 (testing strategy) → Phase tasks X.4/X.6 + determinism script Task 0.2
  - Spec §14 (build sequence) → Phase 1-5 in order + Phase 7 follow-up
  - Spec §15 (non-goals) → not implemented, correctly scoped out
  - Spec §16 (success metrics) → Phase 6.2 and 6.3
  - Spec §17 (open questions) → Phase 6 slash command + handled in tasks

- [x] **Placeholder scan**: no TBD, TODO, "implement later", or "similar to Task N" references.

- [x] **Type consistency**: skill names (`zattar-glass`, `zattar-glass-creating`, `zattar-glass-migrating`, `zattar-glass-translating`, `zattar-glass-governing`) used identically across all tasks. File paths consistent.

- [x] **Every step has actual content**: no "fill in details" — all SKILL.md bodies, all supporting files, all verification commands inline.

---

## Execution handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-22-zattar-glass-meta-skill.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration. Good for this plan because:
- Each phase's RED/GREEN requires fresh subagent anyway (for pressure tests)
- Review checkpoint between phases catches skill design issues early
- Parallel Phase 6 determinism tests are natural for subagent dispatch

**2. Inline Execution** — Execute tasks in current session with checkpoints. Viable here because:
- All tasks are file-writes with exact content (no exploratory work)
- Verification commands are deterministic
- Can be paused/resumed across sessions

**Which approach?**
