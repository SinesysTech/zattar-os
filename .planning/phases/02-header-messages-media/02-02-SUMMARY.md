---
phase: 02-header-messages-media
plan: "02"
subsystem: ui
tags: [react, chat, tailwind, typescript, shadcn]

requires:
  - phase: 02-header-messages-media plan 01
    provides: ChatHeader glassmorphic, MessageStatusIcon at 12px, chat CSS tokens

provides:
  - DateSeparator component with PT-BR date formatting and horizontal separator lines
  - MessageGroup component grouping same-sender messages with shared 28px avatar
  - TextChatBubble with asymmetric corners (4px/14px) and purple shadow on sent
  - ChatContent with 5-minute-gap grouping logic and date separator insertion

affects: [02-03, chat-media-bubbles]

tech-stack:
  added: []
  patterns:
    - "Message grouping: same usuarioId + <5min gap = same MessageGroup"
    - "Asymmetric bubble corners: received=0.25rem_0.875rem_0.875rem_0.875rem, sent=0.875rem_0.25rem_0.875rem_0.875rem"
    - "isFirstInGroup=true → all 14px corners (0.875rem); false → asymmetric"
    - "Avatar invisible (not hidden) for own messages to preserve alignment space"
    - "Timestamp/status shown only on last bubble via showTimestamp prop"
    - "DateSeparator uses PT-BR month names array lookup, no external date library"

key-files:
  created:
    - src/app/(authenticated)/chat/components/date-separator.tsx
    - src/app/(authenticated)/chat/components/message-group.tsx
  modified:
    - src/app/(authenticated)/chat/components/chat-bubbles.tsx
    - src/app/(authenticated)/chat/components/chat-content.tsx

key-decisions:
  - "Committed Task 1 (DateSeparator + MessageGroup) and Task 2 (refactored bubbles + ChatContent) as two separate atomic commits"
  - "Context menu trigger moved outside the bubble content div to group-hover positioning with absolute placement"
  - "Non-text bubble variants (File, Audio, Image, Video) accept new props but retain current styling (deferred to Plan 03)"
  - "groupMessages helper uses FIVE_MINUTES_MS = 5 * 60 * 1000 constant for clarity"

requirements-completed: [MSG-01, MSG-02, MSG-03, MSG-04, MSG-05, MSG-06, MSG-07]

duration: 18min
completed: 2026-04-09
---

# Phase 02 Plan 02: Messages & Grouping Summary

**WhatsApp-style message grouping with asymmetric bubble corners, 28px shared avatars, PT-BR date separators, and useMemo-memoized grouping logic in ChatContent**

## Performance

- **Duration:** 18 min
- **Started:** 2026-04-09T23:29:00Z
- **Completed:** 2026-04-09T23:47:40Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- DateSeparator renders "Hoje, DD de MMMM" / "DD de MMMM" / "DD de MMMM de YYYY" in PT-BR with horizontal separator lines
- MessageGroup groups same-sender messages with one 28px avatar aligned to the last bubble, invisible placeholder for own messages
- TextChatBubble refactored: asymmetric corners (4px on avatar side / 14px elsewhere), primary bg + purple shadow for sent, chat-bubble-received + subtle border for received
- ChatContent rewired: groupMessages function with 5-minute gap breaking, DateSeparator insertion on day change, useMemo memoization

## Task Commits

1. **Task 1: Create DateSeparator and MessageGroup components** - `064366aa` (feat)
2. **Task 2: Refactor text bubbles and wire grouping in ChatContent** - `6b85dfa6` (feat)

## Files Created/Modified

- `src/app/(authenticated)/chat/components/date-separator.tsx` - DateSeparator with PT-BR month names, role="separator", horizontal lines
- `src/app/(authenticated)/chat/components/message-group.tsx` - MessageGroup with 28px avatar, sender name in group chats, ChatBubble delegation
- `src/app/(authenticated)/chat/components/chat-bubbles.tsx` - ChatBubble extended with isFirstInGroup/isLastInGroup/showTimestamp; TextChatBubble fully redesigned
- `src/app/(authenticated)/chat/components/chat-content.tsx` - groupMessages helper, useMemo, DateSeparator + MessageGroup rendering

## Decisions Made

- Context menu trigger (DropdownMenu) moved to absolute-positioned wrapper outside the bubble div, shown on `group-hover` — keeps the bubble content clean
- Non-text bubbles (File, Audio, Image, Video) receive the new props but their styling is unchanged — deferred to Plan 03 per D-10
- `FIVE_MINUTES_MS = 5 * 60 * 1000` named constant for 5-minute gap check (explicitly readable)
- `invisible` class used on own-message avatar (not `hidden`) to preserve column width for alignment

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

TypeScript error on first compile: `message-group.tsx` called `ChatBubble` with `isFirstInGroup` before those props were added to `chat-bubbles.tsx`. Resolved by completing Task 2 (chat-bubbles.tsx refactor) before re-running TypeScript — both tasks passed together cleanly.

## Known Stubs

None — all message types render correctly. Non-text bubble visual styling is intentionally deferred to Plan 03 (Media Bubbles).

## Next Phase Readiness

- Plan 03 (Media Bubbles) can immediately use the new `ChatBubble` prop interface (`isFirstInGroup`, `isLastInGroup`, `showTimestamp`) when refactoring FileChatBubble, AudioChatBubble, ImageChatBubble, VideoChatBubble
- MessageGroup and DateSeparator are complete and require no further changes for Plan 03

---
*Phase: 02-header-messages-media*
*Completed: 2026-04-09*
