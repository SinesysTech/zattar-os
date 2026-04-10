# Phase 03: Input, Context Bar & Empty State - Research

**Researched:** 2026-04-09
**Domain:** React UI — glass-styled chat input, context bar, empty state with suggestion cards
**Confidence:** HIGH

## Summary

Phase 03 completes the visible chat interaction layer with three components: (1) a refactored ChatFooter that replaces the flat `<Input>` with an auto-resizing `<Textarea>` inside a glass container with inline action buttons and a standalone send button; (2) a new ChatContextBar that renders between the header and messages area when `selectedChat.documentoId` is non-null, displaying the linked processo's TRT identifier and numero with a "Ver processo" link; (3) a richer empty state inside chat-window.tsx that shows a centered logo, description, and a 2x2 grid of suggestion cards that trigger `novoChatOpen` and `criarGrupoOpen` dialogs.

The MOC at `docs/mocs/chat-redesign-moc.html` is the single source of truth for all visual targets. The existing `<Textarea>` from `@/components/ui/textarea.tsx` already ships with `field-sizing-content` CSS for auto-resize — no JS listener needed. The processos module exposes `actionBuscarProcesso(id: number)` which takes `documentoId` directly. The dialogs `NovoChatDialog` and `CriarGrupoDialog` already exist and accept `open/onOpenChange` props.

The recording UI inside ChatFooter must be preserved exactly — the approach is to swap only the text input path (Input → Textarea + glass wrapper) while keeping all recording logic and state untouched.

**Primary recommendation:** Refactor ChatFooter in-place (big-bang, same file), create ChatContextBar as a new file in chat/components/, and rewrite the `!selectedChat` branch in chat-window.tsx to the rich empty state. No new dependencies required.

---

## User Constraints

No CONTEXT.md exists yet for Phase 03. The following constraints are inherited from project-level decisions:

### Locked Decisions (from STATE.md + CLAUDE.md)
- Stack: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui — unchanged
- Tailwind v4 variable syntax: `bg-(--variable)` not `bg-[var(--variable)]`
- FSD Architecture: all changes stay in `src/app/(authenticated)/chat/`
- Cross-module imports via barrel (`@/app/(authenticated)/processos`), not deep paths
- Server Actions wrapped in `authenticatedAction` from `@/lib/safe-action`
- GlassPanel/IconContainer/BrandMark shared components are available — reuse before creating new
- Zero regression: all existing chat features (recording, file upload, calls) must keep working
- Inline style for `backdropFilter` + `WebkitBackdropFilter` for cross-browser blur (established Phase 2)

### Claude's Discretion
- How to fetch processo data for the context bar (client-side effect vs. passed as prop)
- Whether suggestion cards use IconContainer or custom icon wrappers
- Exact suggestion card content/actions beyond "Nova Conversa" and "Criar Grupo"
- CSS approach for Textarea auto-resize: CSS `field-sizing-content` vs JS scrollHeight listener

### Deferred (Out of Scope)
- Detail panel content (Phase 4)
- Processo deep-link routing from context bar "Ver processo" (navigate to `/processos/:id`)

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INPUT-01 | Textarea auto-resize inside glass container | Textarea component has `field-sizing-content`; MOC specifies glass wrapper styles |
| INPUT-02 | Inline action buttons (Emoji, Paperclip, Mic) inside wrapper | MOC shows `input-actions` div inside `input-wrapper`, before send button |
| INPUT-03 | Standalone send button (36x36px, bg-primary, rounded-lg) outside wrapper | MOC shows `.send-btn` outside `.input-wrapper`, inside `.input-container` |
| INPUT-04 | Recording UI preserved with new glass container shell | Recording state already implemented; only the non-recording branch needs restyle |
| INPUT-05 | Typing indicator: bouncing dots animation (3 dots, 4px, bg-primary/40) | MOC specifies `typingBounce` keyframe, 1.4s, delays 0/0.2/0.4s |
| INPUT-06 | Focus ring: primary/25 border + primary/6 box-shadow | MOC: `border-color: rgba(139,92,246,0.25); box-shadow: 0 0 0 3px rgba(139,92,246,0.06)` |
| INPUT-07 | Mobile: collapse actions into dropdown or preserve current behavior | Current mobile dropdown already handles this — preserve with glass wrapper |
| CTX-01 | Context bar appears only when `documentoId` is non-null | Domain: `ChatItem.documentoId: number | null` — conditional render |
| CTX-02 | Context bar shows TRT identifier badge + processo number text | MOC: `.context-badge` (TRT-15) + `.context-text` (numero processo) |
| CTX-03 | Context bar has "Ver processo" link (right-aligned) | MOC: `.context-link` with `margin-left: auto` |
| CTX-04 | Processo data fetched from `documentoId` | `actionBuscarProcesso(id)` from `@/app/(authenticated)/processos` — returns `Processo.trt`, `Processo.numeroProcesso` |
| EMPTY-01 | Empty state: centered layout with logo icon | MOC: 64x64 rounded-2xl bg-primary/8 container with MessageSquare or BrandMark icon |
| EMPTY-02 | Empty state: title "ZattarOS" or "Bem-vindo" + description text | MOC: `.empty-title` (Montserrat 20px 700) + `.empty-desc` (13px muted/50) |
| EMPTY-03 | Suggestion cards: 2x2 grid, glass border, hover lift | MOC specifies 420px max-width, 0.625rem gap, translateY(-2px) hover |
| EMPTY-04 | Suggestion card "Nova Conversa" triggers NovoChatDialog | `NovoChatDialog` already exists — add `novoChatOpen` state to the empty state |
| EMPTY-05 | Suggestion card "Criar Grupo" triggers CriarGrupoDialog | `CriarGrupoDialog` already exists — add `criarGrupoOpen` state |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.x | Component model | Project standard |
| Tailwind CSS 4 | 4.x | Styling | Project standard, v4 variable syntax |
| shadcn/ui Textarea | bundled | Auto-resize textarea | Already installed, `field-sizing-content` built-in |
| lucide-react | bundled | Icons | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| actionBuscarProcesso | internal | Fetch processo from documentoId | Context bar data fetch |
| NovoChatDialog | internal | Create private chat | Empty state suggestion card |
| CriarGrupoDialog | internal | Create group | Empty state suggestion card |
| BrandMark | internal | Logo in empty state | Shared component — use size="md" |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS `field-sizing-content` | JS scrollHeight listener | CSS approach is cleaner, already in Textarea component |
| Client `useEffect` for processo fetch | Server-side prop drill | Client fetch simpler — context bar is an edge case, not critical path |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure

No new directories. All new files go in existing `src/app/(authenticated)/chat/components/`:

```
chat/components/
├── chat-footer.tsx          # REFACTOR — Input→Textarea, glass wrapper, new typing indicator
├── chat-context-bar.tsx     # NEW — context bar component
├── chat-window.tsx          # EDIT — replace minimal empty state with rich version
└── (all other existing files unchanged)
```

### Pattern 1: Textarea Auto-Resize (CSS-native)

**What:** Replace `<Input>` with shadcn `<Textarea>` which includes `field-sizing-content` in its default className. This CSS property auto-sizes the element to its content without JS.

**When to use:** Any multi-line text input with dynamic height.

**MOC target specs:**
```
min-height: 32px (input-field)
max-height: 120px (input-field)
line-height: 1.5
font-size: 0.825rem
background: transparent, border: none, outline: none, resize: none
```

**Implementation:**
```typescript
// Extend the Textarea className to match glass input spec
<Textarea
  value={message}
  onChange={handleChange}
  onKeyDown={handleKeyDown}
  disabled={isUploading}
  placeholder={isUploading ? "Enviando arquivo..." : "Digite uma mensagem..."}
  rows={1}
  className="flex-1 bg-transparent border-none shadow-none ring-0 focus-visible:ring-0 resize-none min-h-8 max-h-[120px] text-[0.825rem] leading-relaxed py-1 px-0 placeholder:text-muted-foreground/40"
/>
```

Note: `field-sizing-content` is already on the base Textarea — no JS listener needed.

### Pattern 2: Glass Input Wrapper

**What:** The entire input sits inside a glass container (not a flat `bg-muted` border).

**MOC target:**
```css
background: rgba(255,255,255,0.04);
border: 1px solid rgba(255,255,255,0.08);
border-radius: 1rem;
padding: 0.25rem 0.25rem 0.25rem 0.875rem;
min-height: 44px;
```

**Focus state:**
```css
border-color: rgba(139,92,246,0.25);
box-shadow: 0 0 0 3px rgba(139,92,246,0.06);
background: rgba(255,255,255,0.05);
```

**Tailwind v4 approach:** Use inline style for the rgba values (same pattern as glassmorphic header) or Tailwind opacity modifiers where possible:
```tsx
<div
  className={cn(
    "flex-1 flex items-end rounded-2xl border px-3.5 pb-1 pt-1 transition-all duration-200",
    isFocused
      ? "border-primary/25 shadow-[0_0_0_3px_rgba(139,92,246,0.06)]"
      : "border-white/[0.08]"
  )}
  style={{ background: isFocused ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.04)' }}
>
```

### Pattern 3: Send Button Outside Wrapper

**What:** The MOC places the send button outside `.input-wrapper`, directly in `.input-container`. This is different from the current implementation where send is inside the input.

**MOC target:**
```css
.send-btn: width/height 36px, border-radius 0.625rem, bg-primary, box-shadow rgba(139,92,246,0.3)
```

```tsx
<div className="flex items-end gap-2">
  {/* glass wrapper with textarea + action buttons */}
  <div className="flex-1 flex items-end rounded-2xl ...">
    <Textarea ... />
    <div className="flex items-center gap-0.5">
      {/* emoji, paperclip, mic buttons */}
    </div>
  </div>
  {/* Send button OUTSIDE wrapper */}
  <Button
    size="icon"
    className="size-9 rounded-[0.625rem] bg-primary text-primary-foreground shadow-[0_2px_10px_rgba(139,92,246,0.3)] hover:shadow-[0_4px_15px_rgba(139,92,246,0.4)] hover:-translate-y-px transition-all"
    onClick={handleSend}
    disabled={(!message && !uploadedFile) || isUploading}
    aria-label="Enviar mensagem"
  >
    <SendIcon className="size-4" />
  </Button>
</div>
```

### Pattern 4: Typing Indicator with Bouncing Dots

**What:** Replace the current `animate-pulse` text with 3 bouncing dot animation + text.

**MOC target:**
```css
dots: width/height 4px, border-radius 999px, bg: rgba(139,92,246,0.4)
animation: typingBounce 1.4s infinite; delays: 0 / 0.2s / 0.4s
keyframes: 0%,60%,100% translateY(0); 30% translateY(-4px)
```

**Add to globals.css or use Tailwind arbitrary keyframes:**
```tsx
{typingIndicatorText && !isRecording && (
  <div className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground/50 px-2 mb-1.5">
    <div className="flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-primary/40 animate-[typingBounce_1.4s_infinite]"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
    <span>{typingIndicatorText}</span>
  </div>
)}
```

Note: `typingBounce` keyframe must be added to `globals.css`. Alternative: use `animate-bounce` per dot (Tailwind built-in) with staggered delays via inline style — simpler but slightly different easing.

### Pattern 5: ChatContextBar Component

**What:** New component that renders between ChatHeader and ChatContent when `selectedChat.documentoId` is non-null. Fetches processo data client-side.

**Placement in chat-window.tsx:**
```tsx
<ChatHeader ... />
{selectedChat.documentoId && (
  <ChatContextBar documentoId={selectedChat.documentoId} />
)}
<ChatContent ... />
```

**Fetch strategy:** `useEffect` + `actionBuscarProcesso(documentoId)` on mount. Display skeleton/loading state briefly. Cache in local state. The fetch is non-critical — if it fails, hide the bar gracefully.

**Processo fields needed:** `trt` (e.g. "TRT-15") and `numeroProcesso` (e.g. "0010234-55.2024.5.15.0001").

**Navigation:** "Ver processo" link uses `<Link href={/processos/${documentoId}}>` — the processos module has a detail route at `src/app/(authenticated)/processos/[id]/`.

**MOC layout:**
```
[badge: TRT-15] [text: Vinculada ao processo 0010234-55.2024.5.15.0001] [Ver processo →]
```

```tsx
// chat-context-bar.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { actionBuscarProcesso } from "@/app/(authenticated)/processos";

interface ChatContextBarProps {
  documentoId: number;
}

export function ChatContextBar({ documentoId }: ChatContextBarProps) {
  const [processo, setProcesso] = useState<{ trt: string; numeroProcesso: string } | null>(null);

  useEffect(() => {
    actionBuscarProcesso(documentoId).then((result) => {
      if (result.success && result.data) {
        const p = result.data as { trt: string; numeroProcesso: string };
        setProcesso({ trt: p.trt, numeroProcesso: p.numeroProcesso });
      }
    });
  }, [documentoId]);

  if (!processo) return null; // Render nothing while loading or on error

  return (
    <div
      className="relative z-[9] flex items-center gap-3 px-5 py-2 border-b border-white/[0.06]"
      style={{ background: 'rgba(139,92,246,0.03)' }}
    >
      <span className="text-[0.6rem] font-semibold px-2 py-0.5 rounded-md"
            style={{ background: 'rgba(139,92,246,0.08)', color: 'rgba(139,92,246,0.7)' }}>
        {processo.trt}
      </span>
      <span className="text-[0.65rem] text-muted-foreground/50">
        Vinculada ao processo {processo.numeroProcesso}
      </span>
      <Link
        href={`/app/(authenticated)/processos/${documentoId}`}
        className="text-[0.65rem] text-primary/60 hover:text-primary ml-auto transition-opacity duration-200"
      >
        Ver processo &rarr;
      </Link>
    </div>
  );
}
```

### Pattern 6: Rich Empty State

**What:** Replace the minimal `!selectedChat` branch in chat-window.tsx with a centered layout: logo icon, title, description, 2x2 suggestion cards.

**Important:** The empty state renders in chat-layout.tsx at the `{selectedChat ? <Suspense>...ChatWindow</Suspense> : null}` point. Currently renders `null` when no chat. The rich empty state should replace this `null` with a dedicated component.

**MOC structure:**
```
[64px icon container with MessageSquare or BrandMark]
[Title: Montserrat 20px 700]
[Desc: 13px muted/50, max-width 360px]
[2x2 grid: 4 suggestion cards, max-width 420px]
```

**Suggestion cards content (4 cards):**
1. "Nova Conversa" — icon: MessageSquare (purple) — triggers NovoChatDialog
2. "Criar Grupo" — icon: Users (blue) — triggers CriarGrupoDialog
3. "Processos" — icon: FileText (green) — description: "Acesse seus processos" (no dialog, navigate or show info)
4. "Sala Geral" — icon: Hash (amber) — description: "Junte-se a conversa geral" (select first "geral" sala)

**Placement:** Since ChatWindow is lazy-loaded, the empty state should live in ChatLayout directly (not inside ChatWindow). The current `null` in ChatLayout should become `<ChatEmptyState onNovoChatOpen={...} ... />`.

**State management:** `novoChatOpen` and `criarGrupoOpen` states live in the empty state component itself — no Zustand store changes needed.

### Anti-Patterns to Avoid

- **Re-implementing auto-resize in JS:** The shadcn Textarea already has `field-sizing-content`. Don't add a `scrollHeight` listener.
- **Deep import from processos:** Use `import { actionBuscarProcesso } from "@/app/(authenticated)/processos"` (barrel), not `../processos/actions/index.ts`.
- **Breaking recording logic:** The recording UI conditionally swaps UI within the same container. The refactor must keep recording as-is — only change the default (non-recording) path.
- **Textarea height flash on load:** Set `rows={1}` and `min-h-8` to prevent the default tall shadcn textarea from showing before content is entered.
- **Empty state inside ChatWindow lazy boundary:** The empty state should render in ChatLayout before the Suspense boundary to avoid triggering the lazy ChatWindow load when no chat is selected.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auto-resize textarea | Custom JS scrollHeight listener | shadcn Textarea with `field-sizing-content` | Already installed, CSS-native |
| Processo data fetch | Raw Supabase client call | `actionBuscarProcesso` Server Action | Auth handled, RLS enforced |
| New dialogs | New dialog components | `NovoChatDialog` + `CriarGrupoDialog` (existing) | Already exist with full functionality |
| Brand logo in empty state | Inline SVG | `BrandMark` component | Handles light/dark/size variants |
| Glass container styles | New CSS class | Inline style (rgba values) + Tailwind classes | Consistent with Phase 2 glassmorphism approach |

---

## Common Pitfalls

### Pitfall 1: Textarea base styles fighting glass container
**What goes wrong:** The shadcn Textarea's default `border`, `bg-transparent`, `shadow-xs` classes conflict with the glass wrapper. The textarea renders its own border when the wrapper should provide it.
**Why it happens:** Textarea inherits full shadcn styling; putting it inside a styled div creates double-border.
**How to avoid:** Override Textarea with `border-none shadow-none ring-0 focus-visible:ring-0 bg-transparent` to strip its own border. The glass wrapper becomes the visible border.
**Warning signs:** Two borders visible, or focus ring on the element instead of the container.

### Pitfall 2: `field-sizing-content` without explicit max-height
**What goes wrong:** Textarea grows beyond viewport, pushing send button off-screen.
**Why it happens:** `field-sizing-content` has no built-in max constraint.
**How to avoid:** Always pair `field-sizing-content` with `max-h-[120px] overflow-y-auto` per MOC spec.
**Warning signs:** Input grows without bound when pasting long text.

### Pitfall 3: Focus state managed via `onFocus/onBlur` not `focus-within`
**What goes wrong:** Focus-within CSS pseudo-class is simpler but requires the wrapper to have it in Tailwind. `focus-within:` is supported in Tailwind v4.
**Why it happens:** Developers add JS `isFocused` state unnecessarily.
**How to avoid:** Use CSS `focus-within:` variant on the wrapper div: `focus-within:border-primary/25 focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.06)]`. No JS state needed for focus styling.
**Warning signs:** Extra `useState(isFocused)` and `onFocus/onBlur` handlers when CSS suffices.

### Pitfall 4: Context bar triggers extra re-renders on every message
**What goes wrong:** ChatContextBar re-fetches processo data on every parent re-render.
**Why it happens:** `useEffect` dependency includes unstable references.
**How to avoid:** `useEffect` depends only on `documentoId` (primitive number). Cache result in local state — fetch runs only when `documentoId` changes.
**Warning signs:** Network tab shows repeated calls to `actionBuscarProcesso`.

### Pitfall 5: Recording UI broken by Textarea switch
**What goes wrong:** Recording overlay fails because the `<textarea>` element doesn't exist when recording is active, or the container sizing breaks.
**Why it happens:** Current recording renders a completely different UI inside the same container via conditional. The container height/layout must remain stable.
**How to avoid:** Keep the recording conditional structure identical. Only change the `!isRecording` branch. Ensure the glass wrapper container has `min-height: 44px` so it doesn't collapse.
**Warning signs:** Recording UI shows an empty area, or the container jumps in size.

### Pitfall 6: Empty state inside lazy Suspense boundary
**What goes wrong:** When no chat is selected, ChatLayout still triggers ChatWindow lazy load unnecessarily.
**Why it happens:** If empty state is placed inside ChatWindow, it still loads the Dyte SDK dependencies.
**How to avoid:** Empty state component lives in `ChatLayout` (or a new `ChatEmptyState` component imported directly), NOT inside `ChatWindow`. The lazy boundary only wraps the actual conversation.
**Warning signs:** Network waterfall shows Dyte SDK files loading on first visit with no chat selected.

---

## Code Examples

### Verified patterns from codebase

#### Glass wrapper focus-within pattern (Phase 2 reference)
```typescript
// Source: chat-header.tsx (Phase 2 established pattern)
// Inline style for rgba background + Tailwind for everything else
style={{
  backgroundColor: 'rgba(22,18,34,0.8)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
}}
```

#### Tailwind v4 variable syntax (Phase 1 established)
```typescript
// Source: chat-layout.tsx
className="bg-(--chat-thread-bg)"  // v4 syntax
// NOT: className="bg-[var(--chat-thread-bg)]"
```

#### actionBuscarProcesso signature
```typescript
// Source: src/app/(authenticated)/processos/actions/index.ts
export async function actionBuscarProcesso(id: number): Promise<ActionResult>
// Returns: { success: true, data: Processo } | { success: false, error: string, message: string }
// Processo fields: trt (string), numeroProcesso (string), nomeParteAutora, nomeParteRe, etc.
```

#### NovoChatDialog usage pattern
```typescript
// Source: chat-sidebar-wrapper.tsx
const [novoChatOpen, setNovoChatOpen] = useState(false);
// ...
<NovoChatDialog open={novoChatOpen} onOpenChange={setNovoChatOpen} />
```

#### Typing indicator current implementation (to replace)
```typescript
// Source: chat-footer.tsx (current)
{typingIndicatorText && !isRecording && (
  <div className="text-xs text-muted-foreground ml-4 mb-1 animate-pulse">
    {typingIndicatorText}
  </div>
)}
// REPLACE WITH: bouncing dots + text per MOC
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `<Input type="text">` flat | `<Textarea>` in glass wrapper | Phase 03 | Multi-line support, glass visual |
| `animate-pulse` text | Bouncing dots animation | Phase 03 | Matches MOC design system |
| Minimal empty state (`hidden` on mobile) | Rich empty state with cards | Phase 03 | Better onboarding UX |
| No context bar | ChatContextBar with processo link | Phase 03 | Legal process context visible |

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — purely code/component changes within existing stack)

---

## Validation Architecture

`nyquist_validation` is explicitly `false` in `.planning/config.json`. Section skipped.

---

## Open Questions

1. **Processo route path for "Ver processo" link**
   - What we know: `actionBuscarProcesso` takes `documentoId: number` which maps to `salas_chat.documento_id`
   - What's unclear: The `documento_id` in salas_chat is the processo's `id`. The processos detail route is at `src/app/(authenticated)/processos/[id]/page.tsx`. The actual URL path needs confirmation.
   - Recommendation: Check `src/app/(authenticated)/processos/[id]/page.tsx` exists — if yes, link to `/app/processos/${documentoId}`. If not, omit the link and just show the processo number as text.

2. **`typingBounce` keyframe placement**
   - What we know: Tailwind v4 supports arbitrary keyframe names with `animate-[name]`. The keyframe must be defined in `globals.css` or as a Tailwind config entry.
   - What's unclear: Whether `globals.css` already has `@keyframes typingBounce` (not found in grep of chat tokens section).
   - Recommendation: Add `@keyframes typingBounce` to `globals.css` during Wave 0 (infrastructure setup). Alternative: use `animate-bounce` (built-in) with vertical scale override — simpler but slightly different physics.

3. **Empty state suggestion cards — 3rd and 4th card actions**
   - What we know: Cards 1 (NovoChatDialog) and 2 (CriarGrupoDialog) have confirmed triggers.
   - What's unclear: Best action for "Processos" (navigate? filter sidebar?) and "Sala Geral" (select first geral sala from store?).
   - Recommendation: Planner should decide. Simple options: "Processos" → `<Link href="/app/processos">`, "Sala Geral" → call `setSelectedChat(salas.find(s => s.tipo === 'geral'))` from the Zustand store.

---

## Sources

### Primary (HIGH confidence)
- `docs/mocs/chat-redesign-moc.html` — All visual targets for input, context bar, empty state, suggestion cards (CSS + HTML structure)
- `src/components/ui/textarea.tsx` — Confirms `field-sizing-content` is already on base Textarea component
- `src/app/(authenticated)/chat/components/chat-footer.tsx` — Full current implementation to refactor
- `src/app/(authenticated)/chat/components/chat-window.tsx` — Current empty state at line 412
- `src/app/(authenticated)/chat/domain.ts` — `documentoId: number | null` on SalaChat/ChatItem
- `src/app/(authenticated)/processos/actions/index.ts` line 479 — `actionBuscarProcesso(id: number)` signature
- `src/app/(authenticated)/chat/components/novo-chat-dialog.tsx` — Confirmed `open/onOpenChange` props
- `src/app/(authenticated)/chat/components/criar-grupo-dialog.tsx` — Confirmed `open/onOpenChange` props

### Secondary (MEDIUM confidence)
- `src/app/globals.css` — CSS tokens `--chat-*`, no `typingBounce` keyframe found (needs to be added)
- `.planning/phases/02-header-messages-media/02-CONTEXT.md` — Established patterns: inline style for rgba, Tailwind v4 syntax, `focus-within` for glass containers

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all components confirmed to exist in codebase
- Architecture: HIGH — patterns match established Phase 1 and 2 approach
- Pitfalls: HIGH — all sourced from direct code analysis, not speculation
- Context bar fetch: MEDIUM — `actionBuscarProcesso` confirmed; processo route path not fully verified

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable codebase, no fast-moving dependencies)
