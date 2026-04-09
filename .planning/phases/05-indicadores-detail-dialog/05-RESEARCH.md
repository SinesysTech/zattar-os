# Phase 5: Indicadores & Detail Dialog - Research

**Researched:** 2026-04-09
**Domain:** React component architecture, design system extension, Supabase audit log queries
**Confidence:** HIGH

## Summary

Phase 5 replaces the existing `AudienciaDetailSheet` (side sheet) with a centered `AudienciaDetailDialog` (max-w-3xl) and introduces 6 indicator badges using the existing `SemanticBadge` system. The dialog includes 7 visual sections (meta strip, processo, local/acesso, indicadores, preparo, observacoes, historico timeline) plus a footer with actions.

The codebase already has all the foundational pieces: `Dialog` component from shadcn/ui (Radix-based), `SemanticBadge` with extensible category system in `variants.ts`, `GlassPanel` for section containers, `PrepScore` with ring SVG and checklist breakdown, and `AuditLogService` for querying `logs_alteracao`. The main work is (1) extending the design system with `audiencia_indicador` badge category, (2) building the new dialog layout matching the approved mock, (3) adding a timeline component that merges manual logs and PJe system updates, and (4) migrating all 5 usage points from Sheet to Dialog.

**Primary recommendation:** Build badges first (shared across dialog, cards, rows for Phase 6), then build the dialog as a replacement of the existing sheet, reusing existing subpatterns (meta strip, processo section, PrepScore) and adding new sections (indicadores, timeline).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Criar novo componente `AudienciaDetailDialog` dedicado usando Dialog do shadcn/ui. NAO reusar DialogFormShell (que e voltado para forms). Layout: header fixo + body scrollavel + footer fixo.
- **D-02:** Secoes internas do dialog usam `GlassPanel depth-1` para consistencia com outros modulos (Processos, Expedientes). NAO criar estilo glass-card custom.
- **D-03:** Incluir 3 botoes de acao no header: "Entrar na Sala Virtual" (primario), "Visualizar Ata" (outline), "Abrir PJe" (outline). O botao "Abrir PJe" e novo — construir URL usando `idPje` + `trt` existentes no domain.
- **D-04:** Dialog max-width ~780px (max-w-3xl), max-height 92vh, com scrollbar estilizada. Fiel ao mock aprovado.
- **D-05:** Expandir o sistema `SemanticBadge` existente com nova categoria `audiencia_indicador` no design system (variants.ts/tokens.ts). Cada indicador e um valor da categoria. NAO criar componentes de badge standalone.
- **D-06:** Criar componente helper `AudienciaIndicadorBadges` que recebe uma audiencia e renderiza os badges aplicaveis. Prop `show` controla quais badges exibir (para diferentes contextos: dialog vs card vs row).
- **D-07:** Visibilidade segue requirements exatos (INDIC-01 a INDIC-06 mapped to specific contexts).
- **D-08:** Badge de presenca hibrida: badge simples + tooltip em cards/rows; badge + texto explicito no dialog.
- **D-09:** Combinar duas fontes de dados para montar a timeline completa: `logs_alteracao` (tabela), `dados_anteriores` (campo JSON), `created_at` da audiencia.
- **D-10:** Timeline ordenada cronologicamente (mais recente primeiro). Entradas manuais mostram avatar do usuario; entradas automaticas (PJe) mostram icone de sistema.
- **D-11:** Mapeamento de labels legiveis para campos (`AUDIENCIA_FIELD_LABELS`) definido no `domain.ts`.
- **D-12:** Substituicao big bang in-place: renomear `AudienciaDetailSheet` para `AudienciaDetailDialog`, trocar container, atualizar todos os 5 pontos de uso simultaneamente.
- **D-13:** Manter a mesma interface de props (`{ audienciaId?, audiencia?, open, onOpenChange }`). Integracao com `EditarAudienciaDialog` existente permanece inalterada.
- **D-14:** Arquivo renomeado de `audiencia-detail-sheet.tsx` para `audiencia-detail-dialog.tsx`.

### Claude's Discretion
- Abordagem de fetch para historico (useEffect paralelo vs action unificada) — Claude decide com base em performance e padroes do codebase
- URL pattern para "Abrir PJe" — Claude pesquisa formato correto
- Estrutura interna do componente de timeline (separar em subcomponentes ou inline)
- Logica de diff entre dados_anteriores e estado atual para entradas de sistema

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INDIC-01 | Badge "Segredo de Justica" (icone cadeado) visivel em cards, rows e dialog | Extend `SemanticBadge` category `audiencia_indicador` with value `segredo_justica` -> `warning` variant |
| INDIC-02 | Badge "Juizo Digital" visivel em cards, rows e dialog | Same category, value `juizo_digital` -> `info` variant |
| INDIC-03 | Badge "Designada" visivel em cards, rows e dialog | Same category, value `designada` -> `success` variant |
| INDIC-04 | Badge "Documento Ativo" visivel no dialog | Same category, value `documento_ativo` -> `info` variant |
| INDIC-05 | Indicador de litisconsorcio ("e outros") quando polo_*_representa_varios = true | Inline text in Processo section, not a SemanticBadge. Badge `neutral` for "Litisconsorcio ativo/passivo" |
| INDIC-06 | Badge de presenca hibrida indicando quem e presencial e quem e virtual | Same category, value `presenca_hibrida` -> `accent` variant. Tooltip in cards/rows, explicit text in dialog |
| DIALOG-01 | Dialog centrado (max-w-3xl) substituindo sheet lateral | Use shadcn `Dialog` + `DialogContent` with className override for max-w-3xl max-h-[92vh] |
| DIALOG-02 | Meta strip com horario, modalidade, tribunal e responsavel | Reuse pattern from existing DetailSheetMetaGrid, render inside GlassPanel depth-1 |
| DIALOG-03 | Secao Processo com numero mono, tribunal, grau e partes com litisconsorcio | Reuse ParteBadge, add inline "e outros" text when polo*RepresentaVarios=true |
| DIALOG-04 | Secao Local/Acesso com URL virtual (copiavel) e/ou endereco presencial + badge presenca hibrida | New section with copy-to-clipboard for URL, address display, presenca_hibrida badge+text |
| DIALOG-05 | Secao Indicadores com badges: segredo, juizo digital, designada, documento ativo | Render `AudienciaIndicadorBadges` with `show={['segredo_justica','juizo_digital','designada','documento_ativo']}` |
| DIALOG-06 | Secao Preparo com ring SVG + checklist de itens (6 itens ponderados) | Reuse existing `PrepScore` component with `showBreakdown={true}` and `size="lg"` |
| DIALOG-07 | Secao Observacoes com texto preservando whitespace | Simple GlassPanel section with `whitespace-pre-wrap` |
| DIALOG-08 | Secao Historico de Alteracoes como timeline vertical usando dados_anteriores | New timeline component querying `logs_alteracao` + diffing `dados_anteriores` |
| DIALOG-09 | Link/botao para ata de audiencia quando disponivel | Conditional "Visualizar Ata" button in header actions |
| DIALOG-10 | Permite abrir formulario de edicao (respeitando whitelist PJE para capturadas) | Reuse existing `EditarAudienciaDialog` integration, PJE whitelist already handled |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Purpose | Why Standard |
|---------|---------|--------------|
| radix-ui Dialog | Dialog primitive (already used by shadcn) | Already in project via `@/components/ui/dialog` |
| lucide-react | Icons (Lock, Monitor, CheckCircle2, FileCheck, Users, Layers, Cpu, etc.) | Already used across codebase |
| date-fns + ptBR locale | Date formatting for timeline | Already used in detail sheet |
| zod | Schema validation (no new schemas needed) | Already in project |

### Supporting (already installed)
| Library | Purpose | When to Use |
|---------|---------|-------------|
| @supabase/supabase-js | Query logs_alteracao for timeline | Already available via `createClient()` |

**No new dependencies required.** All building blocks exist in the codebase.

## Architecture Patterns

### Component Structure
```
src/app/(authenticated)/audiencias/
├── domain.ts                          # Add AUDIENCIA_FIELD_LABELS, AUDIENCIA_INDICADOR_* constants
├── components/
│   ├── audiencia-detail-dialog.tsx     # NEW (replaces audiencia-detail-sheet.tsx)
│   ├── audiencia-indicador-badges.tsx  # NEW helper component
│   ├── audiencia-timeline.tsx          # NEW timeline component (discretion: separate file)
│   ├── index.ts                       # Update exports
│   └── ...existing files
src/lib/design-system/
├── variants.ts                        # Add 'audiencia_indicador' to BadgeCategory + variant map
```

### Pattern 1: SemanticBadge Category Extension
**What:** Add `audiencia_indicador` to the `BadgeCategory` union type and create variant mapping.
**When to use:** For all 6 indicator badges.
**How:**

1. Add `'audiencia_indicador'` to `BadgeCategory` type in `variants.ts`
2. Create `AUDIENCIA_INDICADOR_VARIANTS` mapping:
   - `segredo_justica` -> `warning` (amber in mock)
   - `juizo_digital` -> `info` (indigo in mock)
   - `designada` -> `success` (green in mock)
   - `documento_ativo` -> `info` (blue in mock)
   - `litisconsorcio` -> `neutral` (slate in mock)
   - `presenca_hibrida` -> `accent` (purple in mock)
3. Add case to `getSemanticBadgeVariant()` switch
4. Add `'audiencia_indicador'` to `softCategories` array in `getSemanticBadgeTone()`
5. Optionally add specialized `AudienciaIndicadorSemanticBadge` export in `semantic-badge.tsx`

### Pattern 2: Dialog Layout (Header Fixed + Body Scroll + Footer Fixed)
**What:** Dialog with three zones: sticky header, scrollable body, sticky footer.
**When to use:** For the detail dialog.
**How:** Override `DialogContent` className with `max-w-3xl max-h-[92vh] flex flex-col p-0`. Then use three child divs: header (flex-shrink-0, padding), body (flex-1 overflow-y-auto), footer (flex-shrink-0, border-top).

The existing `Dialog` component from shadcn already uses Radix's `DialogContent` which is centered with `fixed top-[50%] left-[50%] translate-x/y-[-50%]`. Override `sm:max-w-lg` with `sm:max-w-3xl`.

### Pattern 3: Timeline Data Merging
**What:** Merge three data sources into a unified timeline.
**When to use:** For the "Historico de Alteracoes" section.
**Sources:**
1. `logs_alteracao` table (manual edits) — query via `AuditLogService.getLogs('audiencias', id)` or direct Supabase query from a server action
2. `dados_anteriores` field (PJe system update snapshot) — diff with current audiencia state to generate change entries
3. `created_at` of the audiencia — synthetic "Captura inicial" entry

**Recommended approach (discretion):** Use a separate `useEffect` for fetching `logs_alteracao` in parallel with the main audiencia fetch. The `dados_anteriores` diff is computed client-side since both current state and snapshot are already available. This avoids a new server action and follows the existing pattern in `AudienciaDetailSheet`.

### Pattern 4: AudienciaIndicadorBadges Helper
**What:** Component that receives an `Audiencia` and renders applicable badges.
**When to use:** In dialog (all badges), cards (subset), rows (subset).
**Interface:**
```typescript
interface AudienciaIndicadorBadgesProps {
  audiencia: Audiencia;
  show?: ('segredo_justica' | 'juizo_digital' | 'designada' | 'documento_ativo' | 'litisconsorcio' | 'presenca_hibrida')[];
  showPresencaDetail?: boolean; // true in dialog context for explicit text
  className?: string;
}
```

### Pattern 5: PJe URL Construction
**What:** Build "Abrir PJe" button URL from audiencia data.
**Verified pattern from codebase:** The PJe consultation URL follows: `https://pje.{trt_lower}.jus.br/consultaprocessual/detalhe-processo/{numero_processo}`

Where `trt_lower` maps TRT codes: `TRT1` -> `trt1`, `TRT15` -> `trt15`, etc. For TST: `tst`.

**Example:** `https://pje.trt1.jus.br/consultaprocessual/detalhe-processo/0001234-56.2024.5.01.0001`

This pattern is confirmed by multiple URLs found in `src/lib/integracoes/docs/pangea-api.md`.

Helper function to add in `domain.ts`:
```typescript
export function buildPjeUrl(trt: string, numeroProcesso: string): string {
  const trtLower = trt.toLowerCase();
  return `https://pje.${trtLower}.jus.br/consultaprocessual/detalhe-processo/${numeroProcesso}`;
}
```

### Anti-Patterns to Avoid
- **Standalone badge components:** Do NOT create individual components like `SegredoJusticaBadge`. Use `SemanticBadge` with `category="audiencia_indicador"` and the appropriate `value`.
- **Custom glass-card styles:** Do NOT create `.glass-card` CSS class. Use `GlassPanel depth={1}` component.
- **DialogFormShell:** Do NOT use `DialogFormShell` for this dialog. It is form-oriented and incompatible with the read-only detail layout.
- **Inline color classes for badges:** Do NOT use hardcoded `bg-warning/10 text-warning` etc. Route through `SemanticBadge`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Badge visual variants | Color mapping per indicator | `SemanticBadge category="audiencia_indicador"` | Design system consistency, single source of truth |
| Dialog centering + overlay | Custom portal/overlay | shadcn `Dialog` + `DialogContent` | Already handles z-index, animations, accessibility |
| Prep score calculation | Custom scoring logic | `calcPrepItems()` + `calcPrepScore()` from `prep-score.tsx` | Already correct with weighted items |
| Audit log fetching | Custom Supabase query | `AuditLogService.getLogs()` from `@/lib/domain/audit` | Already handles JOINs for user names |
| Object diffing | Custom comparison | `compararObjetos()` from `comparison.util.ts` | Already handles deep equality, control field removal |

## Common Pitfalls

### Pitfall 1: Dialog Content Overflow
**What goes wrong:** Dialog body content exceeds viewport without scroll, pushing footer off-screen.
**Why it happens:** Default `DialogContent` has `p-6 gap-4` and no overflow handling.
**How to avoid:** Override DialogContent with `p-0 flex flex-col max-h-[92vh]`. Give body `flex-1 overflow-y-auto` and footer `flex-shrink-0`.
**Warning signs:** Footer not visible, or entire dialog scrolls (not just body).

### Pitfall 2: Sheet-to-Dialog Migration Breakage
**What goes wrong:** Missing an import update causes runtime error in one view but not others.
**Why it happens:** `AudienciaDetailSheet` is used in 5 files (audiencias-client.tsx, audiencias-content.tsx, audiencias-list-wrapper.tsx, audiencias-table-wrapper.tsx, + barrel exports in index.ts x2).
**How to avoid:** Rename file first, then do a global find-replace for both the import path and component name. Use TypeScript compiler (`npm run type-check`) to catch all broken references.
**Warning signs:** Type errors after rename, missing imports in barrel files.

### Pitfall 3: dados_anteriores is Snake-Case
**What goes wrong:** Diff logic fails because `dados_anteriores` stores snake_case keys but current `Audiencia` object is camelCase.
**Why it happens:** `dados_anteriores` is set directly from `fromCamelToSnake(audienciaExistente)` in `updateAudiencia()` — so it's stored as snake_case JSONB.
**How to avoid:** Convert `dados_anteriores` to camelCase before diffing with current state, OR convert current state to snake_case. Use `fromSnakeToCamel()` on `dados_anteriores` before comparison.
**Warning signs:** All fields show as "changed" when they haven't actually changed.

### Pitfall 4: Timeline Fetching Causes Waterfall
**What goes wrong:** Dialog opens, fetches audiencia, THEN fetches logs — two sequential requests.
**Why it happens:** `logs_alteracao` query depends on knowing the audiencia ID, which may be fetched async.
**How to avoid:** When `audienciaId` prop is provided (most common case), fire both fetches in parallel. Only wait for audiencia fetch when only `audiencia` object prop is provided.
**Warning signs:** Noticeable delay before timeline appears after dialog opens.

### Pitfall 5: SemanticBadge Category Not in Tone Config
**What goes wrong:** New `audiencia_indicador` badges render with `solid` tone instead of `soft`.
**Why it happens:** Forgot to add `'audiencia_indicador'` to the `softCategories` array in `getSemanticBadgeTone()`.
**How to avoid:** When adding a new category to `BadgeCategory`, always check both `getSemanticBadgeVariant()` switch AND `getSemanticBadgeTone()` soft/solid mapping.
**Warning signs:** Badges look visually too heavy/opaque compared to mock.

## Code Examples

### Extending BadgeCategory (variants.ts)
```typescript
// 1. Add to BadgeCategory union
export type BadgeCategory =
  | 'tribunal'
  | 'status'
  // ... existing categories
  | 'audiencia_indicador'; // NEW

// 2. Create variant mapping
export const AUDIENCIA_INDICADOR_VARIANTS: Record<string, BadgeVisualVariant> = {
  segredo_justica: 'warning',
  juizo_digital: 'info',
  designada: 'success',
  documento_ativo: 'info',
  litisconsorcio: 'neutral',
  presenca_hibrida: 'accent',
};

// 3. Add to getSemanticBadgeVariant switch
case 'audiencia_indicador':
  return AUDIENCIA_INDICADOR_VARIANTS[key as string] ??
    AUDIENCIA_INDICADOR_VARIANTS[normalizedKey as string] ?? 'neutral';

// 4. Add to softCategories in getSemanticBadgeTone
const softCategories: BadgeCategory[] = [
  // ... existing
  'audiencia_indicador',
];
```

### Field Labels for Timeline (domain.ts)
```typescript
export const AUDIENCIA_FIELD_LABELS: Record<string, string> = {
  data_inicio: 'Data/Horario de Inicio',
  data_fim: 'Data/Horario de Fim',
  hora_inicio: 'Hora de Inicio',
  hora_fim: 'Hora de Fim',
  responsavel_id: 'Responsavel',
  status: 'Status',
  status_descricao: 'Situacao',
  modalidade: 'Modalidade',
  observacoes: 'Observacoes',
  url_audiencia_virtual: 'URL da Sala Virtual',
  endereco_presencial: 'Endereco Presencial',
  tipo_audiencia_id: 'Tipo de Audiencia',
  sala_audiencia_nome: 'Sala',
  designada: 'Designada',
  segredo_justica: 'Segredo de Justica',
  juizo_digital: 'Juizo Digital',
  polo_ativo_nome: 'Polo Ativo',
  polo_passivo_nome: 'Polo Passivo',
  numero_processo: 'Numero do Processo',
};
```

### Dialog Layout Structure
```typescript
// Override DialogContent for the 3-zone layout
<DialogContent
  className="sm:max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0"
  showCloseButton={false} // Custom close in header
>
  {/* Header — fixed */}
  <div className="flex-shrink-0 px-7 pt-6">
    {/* Title row, meta strip, action buttons */}
    <div className="border-b border-border/20" />
  </div>

  {/* Body — scrollable */}
  <div className="flex-1 overflow-y-auto px-7 py-5 space-y-3.5
    [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.12)_transparent]">
    {/* GlassPanel sections */}
  </div>

  {/* Footer — fixed */}
  <div className="flex-shrink-0 px-7 py-4 border-t border-border/20
    flex items-center justify-between bg-muted/30">
    <Button variant="outline">Fechar</Button>
    <Button onClick={openEdit}>
      <Pencil className="size-4" />
      Editar Audiencia
    </Button>
  </div>
</DialogContent>
```

### Timeline Entry Interface
```typescript
interface TimelineEntry {
  id: string;
  type: 'manual' | 'system' | 'captura_inicial';
  timestamp: string;
  usuario?: {
    nome: string;
    avatarUrl?: string;
  };
  changes: Array<{
    campo: string;       // human-readable label
    valorAnterior: string;
    valorNovo: string;
  }>;
  descricao?: string;    // for captura_inicial or summary
}
```

### Audit Log Query Pattern (existing)
```typescript
// From src/lib/domain/audit/services/audit-log.service.ts
const logs = await auditLogService.getLogs('audiencias', audienciaId);
// Returns: LogAlteracao[] with usuario JOINs
// dados_evento.changes = { campo: { old: value, new: value } }
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| DetailSheet (side panel) | Dialog (centered) | This phase | More space for timeline, better focus |
| Hardcoded badge spans | SemanticBadge system | Phase 1 (Processos redesign) | Consistent design system |
| No change history | Timeline from logs_alteracao + dados_anteriores | This phase | Full audit visibility |

## Open Questions

1. **PrepScore ring size in dialog**
   - What we know: Mock shows 84px ring. Current `SIZE_CONFIG.lg` is 64px.
   - What's unclear: Should we add an `xl` size (84px) to PrepScore, or override with custom size prop?
   - Recommendation: Add `xl` size config `{ ring: 84, stroke: 7, text: "text-xl" }` to maintain consistency.

2. **Mobile responsiveness of dialog**
   - What we know: Dialog is max-w-3xl (780px). On mobile (<768px), it should likely be full-screen or near-full.
   - What's unclear: CONTEXT.md doesn't specify mobile behavior.
   - Recommendation: Use `max-w-[calc(100%-2rem)] sm:max-w-3xl` (already the shadcn pattern) and add `h-[100dvh] sm:h-auto sm:max-h-[92vh]` for mobile full-screen.

3. **Litisconsorcio badge vs inline text**
   - What we know: Mock shows "e outros" inline with party name PLUS a separate "Litisconsorcio ativo" badge.
   - What's unclear: INDIC-05 says it's an "indicador" but the mock renders it as inline text + badge in the Processo section, not in the Indicadores section.
   - Recommendation: Render litisconsorcio inline in the Processo section (matching mock), and NOT duplicate in the Indicadores section.

## Project Constraints (from CLAUDE.md)

- **FSD Architecture:** Keep all components in `src/app/(authenticated)/audiencias/components/`
- **No Cross-Deep Imports:** Use barrel exports from module index
- **Shell UI Patterns:** Use `GlassPanel` for section containers (not custom glass styles)
- **Action Wrapper:** Any new server actions must use `authenticatedAction` from `@/lib/safe-action`
- **Design System:** Use `SemanticBadge` for semantic badges, never hardcode color classes
- **Type Check:** Run `npm run type-check` to validate all changes
- **Architecture Check:** Run `npm run check:architecture` to validate FSD rules

## Sources

### Primary (HIGH confidence)
- **Existing codebase** — All source files read directly:
  - `src/app/(authenticated)/audiencias/domain.ts` — Full Audiencia interface with all indicator fields
  - `src/app/(authenticated)/audiencias/components/audiencia-detail-sheet.tsx` — Current component to replace (356 lines)
  - `src/app/(authenticated)/audiencias/repository.ts` — Data access patterns, `dados_anteriores` population
  - `src/components/ui/semantic-badge.tsx` — SemanticBadge component API
  - `src/lib/design-system/variants.ts` — BadgeCategory type, variant mapping, getSemanticBadgeVariant()
  - `src/lib/design-system/tokens.ts` — Spacing, typography, glass depth tokens
  - `src/components/shared/glass-panel.tsx` — GlassPanel component
  - `src/components/ui/dialog.tsx` — Dialog component (Radix-based)
  - `src/app/(authenticated)/audiencias/components/prep-score.tsx` — PrepScore component
  - `src/lib/domain/audit/services/audit-log.service.ts` — AuditLogService for logs_alteracao queries
  - `supabase/schemas/14_logs_alteracao.sql` — logs_alteracao table schema
  - `supabase/migrations/20260202180000_create_generic_audit_trigger.sql` — Audit trigger logic
  - `src/app/(authenticated)/captura/services/persistence/comparison.util.ts` — compararObjetos() for diffing
  - `.mocks/audiencias-detail-dialog.html` — Approved visual mock (full HTML)
  - `src/lib/integracoes/docs/pangea-api.md` — PJe URL pattern verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already in project, no new installs
- Architecture: HIGH - Patterns established in codebase, mock is definitive reference
- Pitfalls: HIGH - Identified from direct code reading (snake/camel mismatch, migration points, overflow)
- Timeline data model: MEDIUM - dados_anteriores format confirmed from repository code but edge cases (empty snapshot, no logs) need runtime testing

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable internal codebase, no external dependency changes)
