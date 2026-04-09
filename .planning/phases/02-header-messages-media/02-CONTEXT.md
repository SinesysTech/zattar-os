# Phase 2: Header, Messages & Media - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Experiencia principal de conversa: header glassmorphic com backdrop-blur, bolhas de mensagem com cantos assimetricos e agrupamento por remetente, separadores de data entre grupos de dias, e renderizacao rich de midia (arquivos com IconContainer, audio com waveform visual, imagens e videos com border-radius consistente). Nenhuma mudanca em componentes de chamada/video (Dyte SDK), dialogs de criacao, ou sidebar.

</domain>

<decisions>
## Implementation Decisions

### Agrupamento de Mensagens
- **D-01:** Avatar do remetente aparece alinhado a ULTIMA bolha do grupo (WhatsApp-style). Bolhas anteriores do grupo nao mostram avatar.
- **D-02:** Nome do sender (em group chats) aparece APENAS na PRIMEIRA bolha do grupo. Estilo: `text-[10px] font-semibold text-primary opacity-60`.
- **D-03:** Mensagens do mesmo remetente com intervalo > 5 minutos quebram em grupos separados.
- **D-04:** Timestamp visivel APENAS na ultima bolha do grupo. Hover nas demais pode revelar hora individual.

### Audio Waveform Visual
- **D-05:** Waveform usa barras estaticas decorativas (padrao fixo ou random seed). Zero dependencia externa. Progresso indicado por mudanca de cor nas barras.
- **D-06:** Exibir duracao total E tempo atual ("0:23 / 1:45") no audio bubble.
- **D-07:** Botao play/pause circular posicionado DENTRO da bolha, a esquerda das barras de waveform.

### Estrategia de Migracao
- **D-08:** Big bang in-place — refatorar chat-header.tsx, chat-bubbles.tsx e chat-content.tsx diretamente. Sem arquivos v2 temporarios.
- **D-09:** DateSeparator e MessageGroup como componentes SEPARADOS em chat/components/ (date-separator.tsx, message-group.tsx).
- **D-10:** Dividir em 3 plans de execucao: (1) Header glassmorphic, (2) MessageGroup + DateSeparator + refactor bolhas texto, (3) Media bubbles (audio waveform, file, image, video).

### Tamanhos Custom de Avatar
- **D-11:** Usar className override pontual para sizes nao-padrao (36px header via `size-9`, 28px mensagens via `size-7`). NAO alterar componente Avatar shared.
- **D-12:** Border-radius dos avatares no chat segue rounded-xl (consistente com Phase 1 e IconContainer). Sem variacao por contexto.

### Claude's Discretion
- Numero exato de barras no waveform e algoritmo de distribuicao
- Logica de agrupamento (funcao helper que recebe mensagens e retorna grupos)
- Implementacao CSS do glassmorphism no header (pseudo-elements vs backdrop-filter direto)
- Animacao de transicao play/pause no audio bubble
- Estrategia de hover para revelar timestamp em bolhas intermediarias do grupo

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `docs/mocs/chat-redesign-moc.html` — MOC aprovado com todas as decisoes visuais do chat
- `.planning/phases/02-header-messages-media/02-UI-SPEC.md` — Contrato de design UI (spacing, typography, color, componentes)
- `src/app/globals.css` — Tokens CSS (--chat-thread-bg, --chat-bubble-received, --chat-sidebar-active, glass-widget, etc.)

### Phase 1 Context (decisoes herdadas)
- `.planning/phases/01-layout-shell-sidebar/01-CONTEXT.md` — Decisoes de layout, Tailwind v4 syntax, detail panel toggle

### Componentes a Refatorar (Phase 2)
- `src/app/(authenticated)/chat/components/chat-header.tsx` — Header atual (bg-card, precisa glassmorphism)
- `src/app/(authenticated)/chat/components/chat-bubbles.tsx` — 6 sub-componentes de bolha (TextChatBubble, FileChatBubble, AudioChatBubble, ImageChatBubble, VideoChatBubble)
- `src/app/(authenticated)/chat/components/chat-content.tsx` — Container de mensagens (precisa DateSeparator + MessageGroup)

### Componentes Shared a Reutilizar
- `src/components/ui/avatar.tsx` — Avatar com sizes predefinidos + AvatarIndicator
- `src/components/ui/icon-container.tsx` — IconContainer (xs/sm/md/lg) para icones de arquivo
- `src/components/ui/typography.tsx` — Heading, Text components
- `src/components/shared/glass-panel.tsx` — GlassPanel (depth 1/2/3)

### Domain e State
- `src/app/(authenticated)/chat/domain.ts` — Tipos (ChatItem, MensagemComUsuario, TipoSalaChat)
- `src/app/(authenticated)/chat/hooks/use-chat-store.ts` — Zustand store
- `src/app/(authenticated)/chat/components/message-status-icon.tsx` — Icones de status de entrega

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **GlassPanel**: Container glass com depth 1/2/3. Header pode usar depth-1 base + backdrop-blur custom.
- **IconContainer**: md(32px) para icones de arquivo nas file bubbles. bg-info/10 (recebido), bg-primary/12 (enviado).
- **Avatar + AvatarIndicator**: Online status indicator existente. Override via className para 36px/28px.
- **MessageStatusIcon**: Icone de status de entrega (sent, delivered, read). Reduzir de 16px para 12px.
- **cn() utility**: Composicao condicional de classes — padrao do codebase.

### Established Patterns
- **Tailwind v4 syntax**: `bg-(--chat-thread-bg)` em vez de `bg-[var(--chat-thread-bg)]` (decidido Phase 1).
- **Zustand store**: `useChatStore` com selectedChat, mensagens, salas — interface estavel.
- **Direction via self-end/self-start**: Bolhas enviadas usam `self-end`, recebidas `self-start`.
- **Avatar fallback**: `generateAvatarFallback(name)` de `@/lib/utils`.

### Integration Points
- **ChatContent** recebe `mensagens: MensagemComUsuario[]` e `salaAtiva: ChatItem | null` — agrupamento sera computado aqui.
- **ChatHeader** recebe `sala: ChatItem` com callbacks de chamada — manter interface de props.
- **chat-bubbles.tsx** exporta 6 componentes — refatorar exports mantendo assinaturas compativeis.
- **Componentes de chamada** (Dyte SDK): NAO TOCAR — 15+ arquivos de call/meeting isolados.

</code_context>

<specifics>
## Specific Ideas

- MOC HTML em `docs/mocs/chat-redesign-moc.html` e a referencia visual definitiva
- Cantos assimetricos: recebido `rounded-[4px_14px_14px_14px]`, enviado `rounded-[14px_4px_14px_14px]`
- Header glassmorphic: `rgba(22,18,34,0.8)` + `backdrop-blur-[20px]` + border `rgba(255,255,255,0.06)`
- Sent bubble shadow: `shadow-lg shadow-primary/20`
- Timestamps monospace: `font-mono text-[10px]` com tabular-nums
- Date separator: `text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/35` com linhas `h-px bg-foreground/[0.04]`
- Audio waveform WhatsApp-style: barras estaticas com progresso por cor, play button circular

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-header-messages-media*
*Context gathered: 2026-04-09*
