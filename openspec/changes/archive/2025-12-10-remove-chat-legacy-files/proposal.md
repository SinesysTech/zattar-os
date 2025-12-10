# Change: Remove Chat Legacy Files

## Why

O módulo de chat foi completamente migrado para a nova arquitetura Feature-Sliced Design em `src/features/chat/`. Os arquivos legados espalhados em múltiplos diretórios (`src/core/chat/`, `src/components/modules/chat/`, `src/components/chat/`, `src/hooks/modules/chat/`, `src/app/actions/chat.ts`) estão obsoletos e devem ser removidos para manter a codebase limpa e evitar confusão.

## What Changes

- **REMOVE** `src/core/chat/` - Domain, Repository, Service e Index migrados para `src/features/chat/`
- **REMOVE** `src/components/modules/chat/` - ChatLayout, ChatSidebar, ChatWindow, RoomList migrados para `src/features/chat/components/`
- **REMOVE** `src/components/chat/` - Componentes legados (chat-interface, chat-room, room-list, etc.) deprecados
- **REMOVE** `src/hooks/modules/chat/` - Hooks migrados para `src/features/chat/hooks/`
- **REMOVE** `src/app/actions/chat.ts` - Server Actions migrados para `src/features/chat/actions.ts`
- **REMOVE** `src/app/api/chat/` - API Routes legadas (deprecadas, substituídas por Server Actions)
- **REMOVE** `backend/documentos/services/persistence/chat-persistence.service.ts` - Persistence service legado (deprecado)

## Impact

- **Affected specs**: chat
- **Affected code**:
  - Nenhuma funcionalidade é perdida - tudo foi migrado para `src/features/chat/`
  - A página `src/app/(dashboard)/chat/page.tsx` já usa a nova estrutura
  - Qualquer código que importe de `@/core/chat` deve ser atualizado para `@/features/chat`
