# Phase 03: Input, Context Bar & Empty State - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode — smart discuss skipped per user request)

<domain>
## Phase Boundary

This phase delivers three complementary UI areas in the chat module:

1. **ChatFooter redesign** — Replace the current flat `Input`-based footer with a Glass Briefing textarea that auto-expands, maintains all existing functionality (file upload, audio recording, emoji), and adopts the visual language established in phases 01-02.

2. **Context Bar** — A thin glass strip above the conversation area that surfaces the linked legal process (processo) when `sala.tipo === TipoSalaChat.Documento`. Shows processo number, client name, and a link to navigate to the processo. Only visible for Documento-type salas; hidden for Privado and Grupo types.

3. **Empty State** — Replace the single-line "Selecione uma conversa para começar" with a rich empty state panel featuring suggestion cards (quick actions) when no chat is selected on desktop.

</domain>

<decisions>
## Implementation Decisions

### ChatFooter Redesign
- Replace `<Input>` with `<Textarea>` from shadcn, auto-expanding from 1 to max 5 rows
- Outer container: `bg-foreground/[0.03]` with `backdrop-blur-[12px]` and `border-t border-white/[0.06]`
- Send button: 36px filled primary rounded-full (matches action button size from Phase 01)
- Keep all existing functionality: file upload, audio recording, typing indicator, file preview — zero regression
- Recording UI: unchanged behavior, updated colors to match Glass Briefing (`destructive` tokens already used)
- Action icons (emoji, attach, mic): `ghost` variant, 32px, `text-muted-foreground/55` matching Phase 01 header buttons

### Context Bar
- Appears between ChatHeader and ChatContent when `selectedChat.tipo === TipoSalaChat.Documento`
- Component: `ChatContextBar` in `chat-context-bar.tsx`
- Layout: 40px height, `bg-foreground/[0.03] backdrop-blur-[8px] border-b border-white/[0.06]`
- Shows: small `IconContainer` (scales-down, 24px) with process icon + processo number + truncated client name + navigate link
- Data fetching: reads `selectedChat.documentoId` — uses existing `processos` data if available, else shows generic "Processo vinculado" label
- Implementation approach: keep simple — show `documentoId` as badge, no separate API call needed for MVP

### Empty State
- Shown in the chat area column when `!selectedChat` (currently renders null on mobile, minimal text on desktop)
- Component: `ChatEmptyState` in `chat-empty-state.tsx`, replaces the current inline div in chat-layout.tsx
- Layout: centered column, glass card container with `GlassPanel` or equivalent `backdrop-blur` surface
- Content: icon (MessageSquare or similar), heading "Suas conversas", subtext "Selecione uma conversa para começar", 3 suggestion cards
- Suggestion cards (3): "Nova conversa direta", "Criar grupo", "Buscar mensagens" — each uses `IconContainer` + label + subtle glass background
- Suggestion cards are cosmetic/presentational (onClick opens existing dialogs where available)
- Visible on desktop (md+), hidden on mobile (mobile shows sidebar instead per existing responsive logic)

### Claude's Discretion
- Exact OKLCH values for glass surfaces — follow pattern from phases 01-02 (`rgba(22,18,34,0.8)` for dark, equivalent light)
- Auto-expand textarea row count and transition timing
- Whether suggestion cards trigger actual actions or show a toast (prefer triggering novo-chat-dialog and criar-grupo-dialog where wired)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `GlassPanel` from `@/components/shared` — potential container for empty state
- `IconContainer` from shared components — already used in Phase 02 media bubbles
- `ChatSidebarWrapper` already imports `novo-chat-dialog.tsx` and `criar-grupo-dialog.tsx` — suggestion cards can reference these
- `TipoSalaChat.Documento` enum in `domain.ts` — use to detect processo-linked salas
- `useChatStore` exposes `selectedChat` — use directly in layout for empty state conditional
- `Textarea` from `@/components/ui/textarea` — drop-in replacement for Input

### Established Patterns
- Glass surfaces: `backdrop-blur-[20px]` inline style + Tailwind class for Safari compatibility (Phase 01 pattern)
- Button sizing: 32px ghost for secondary actions, 36px filled primary for primary CTA (Phase 01)
- Border tokens: `border-white/[0.06]` for glass separators (Phases 01-02)
- Tailwind v4: no `tw-` prefix, use `bg-foreground/[0.03]` syntax
- Responsive: sidebar shown on mobile, chat area hidden — empty state only needed for md+ breakpoint

### Integration Points
- `chat-layout.tsx` — renders the empty state branch (`!selectedChat ? null : <ChatWindow>`) — replace `null` with `<ChatEmptyState>`
- `chat-window.tsx` — already has `if (!selectedChat) return <div>Selecione...</div>` at line 412 — remove this redundant branch, let layout handle it
- `chat-footer.tsx` — self-contained, props unchanged: `{ salaId, onEnviarMensagem, onTyping, typingIndicatorText }` — internal redesign only

</code_context>

<specifics>
## Specific Ideas

- Context bar should be dismissible per session (local state only, no persistence needed)
- Textarea should submit on Enter (no modifier), Shift+Enter for newline — same as current Input behavior
- Empty state heading should feel welcoming, not instructional — matches Glass Briefing design personality

</specifics>

<deferred>
## Deferred Ideas

- Persistent context bar collapse preference (localStorage) — out of scope for this phase
- Emoji picker implementation (currently shows button, no picker) — out of scope, existing behavior preserved
- Rich text / markdown in input — out of scope

</deferred>
