# Phase 04: Detail Panel & Preservation - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

This phase fills the inline detail panel placeholder (`hidden xl:flex w-[320px]`) in `chat-layout.tsx` with real content, and ensures zero regression on all existing chat functionality.

Two deliverables:
1. **Inline Detail Panel** — A Glass Briefing side panel (3rd column) that shows contact/group details when `showProfileSheet` is true on xl+ screens. Re-uses the data already rendered in `UserDetailSheet` (avatar, name, status, phone, country, media). The existing `UserDetailSheet` (floating modal) stays for mobile — the inline panel is the xl+ complement.

2. **Zero Regression Audit** — Verify all existing features (send message, file upload, audio recording, video/audio calls, typing indicator, real-time updates, message grouping, context bar, empty state) still work correctly after all phases 01-03 changes.

</domain>

<decisions>
## Implementation Decisions

### Inline Detail Panel Architecture
- New component: `ChatDetailPanel` in `src/app/(authenticated)/chat/components/chat-detail-panel.tsx`
- Receives same `user?: UsuarioChat` prop as `UserDetailSheet` — no new data fetching needed
- Wired into `chat-layout.tsx` inside the placeholder div (replace `{/* Phase 4 content */}` comment)
- Toggle trigger: header's info/avatar click → `toggleProfileSheet(true)` — add onClick to ChatHeader's avatar button
- Close button inside panel: X icon → `toggleProfileSheet(false)`
- Panel has its own scrollable interior for long user profiles

### Glass Briefing Styling
- Panel container: `bg-(--surface-container-low) border-l border-white/[0.06]` (already on placeholder div)
- Header section: 48px avatar centered, name, online status badge
- Sections: same data fields as UserDetailSheet (phone, country, medias, website, socialLinks) but in glass card style with `bg-foreground/[0.02] rounded-xl p-4` per section
- No blur needed on panel body (it's a solid column, not floating)

### Preservation / Zero Regression
- `UserDetailSheet` remains unchanged — mobile users still get the floating sheet
- All Phase 01-03 components (ChatHeader, ChatSidebar, ChatFooter, ChatContextBar, ChatEmptyState, date-separator, message-group, chat-bubbles) preserved as-is
- No changes to actions, hooks, store, or domain
- Regression check: run existing test suite before marking phase complete

### Claude's Discretion
- Exact padding/spacing inside the panel sections
- Whether to show a "Ver perfil completo" link (navigate to user profile page if route exists)
- Animation for panel opening (simple CSS transition on width or instant render)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `UserDetailSheet` — all data fields and rendering logic can be mirrored in inline panel
- `useChatStore().showProfileSheet` + `toggleProfileSheet` — already wired, just needs trigger in header
- `Avatar`, `AvatarFallback`, `AvatarImage`, `AvatarIndicator` — already imported in UserDetailSheet
- `ScrollArea`, `ScrollBar` — for media scroll in panel
- `getOnlineStatusColor` helper — defined in user-detail-sheet.tsx, extract or duplicate for panel
- `generateAvatarFallback` from `@/lib/utils` — avatar initials

### Established Patterns
- Glass surface: `bg-(--surface-container-low)` for panel column (matches sidebar)
- Section cards: `bg-foreground/[0.02] rounded-xl` for content grouping
- Close button: 32px ghost `text-muted-foreground/55` (matches Phase 01 header pattern)
- xl+ breakpoint for 3-column layout — already controlled by `hidden xl:flex` on placeholder

### Integration Points
- `chat-layout.tsx` line 89-93: placeholder div → replace comment with `<ChatDetailPanel user={???} />`
- Need to pass `selectedChat.usuario` from layout → ChatDetailPanel (currently layout doesn't have direct access, need to read from store or pass down)
- `chat-header.tsx`: avatar/name area → add `onClick={() => toggleProfileSheet(!showProfileSheet)}` to make it toggleable
- `chat-window.tsx` line 441: `UserDetailSheet` render — keep as-is for mobile

</code_context>

<specifics>
## Specific Ideas

- Panel close button in top-right corner, X icon, ghost 32px
- Section labels in `text-xs font-semibold uppercase text-muted-foreground/60` (matches existing UserDetailSheet style)
- Avatar 56px centered at top of panel

</specifics>

<deferred>
## Deferred Ideas

- Suggestion cards in ChatEmptyState triggering NovoChatDialog/CriarGrupoDialog (logged in Phase 03 as toast placeholder) — defer to post-milestone if needed
- "Ver perfil completo" deep-link — out of scope for this phase

</deferred>
