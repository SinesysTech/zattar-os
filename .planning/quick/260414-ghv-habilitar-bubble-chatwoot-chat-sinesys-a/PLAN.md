# Quick Task 260414-ghv — Chatwoot bubble em páginas públicas

## Goal
Habilitar o widget Chatwoot (`chat.sinesys.app`) em `/website/*` e `/servicos/*`, mantendo `/portal`, `/(auth)` e `/(authenticated)` intocados.

## Scope discovery
- `/servicos/layout.tsx` importa `WebsiteShell` → montar o widget dentro do shell cobre ambas as áreas com um único ponto.
- `/portal`, `/(auth)`, `/(authenticated)` usam layouts próprios e não importam `WebsiteShell` → ficam limpos por construção.
- Server action `actionObterChatwootWidgetConfig` já lê `website_token` e `widget_base_url` de `integracoes` (token já salvo pelo usuário).

## Changes

### 1. CSP — src/middleware/security-headers.ts
- Trocar `chatwoot-web.platform.synthropic.app` por `chat.sinesys.app`.
- Adicionar `wss://chat.sinesys.app` à lista e incluí-la em `connect-src` (necessário para `/cable` do widget — restricted-instances doc oficial).

### 2. Novo componente client — src/app/website/components/layout/chatwoot-widget.tsx
- `"use client"` + `useEffect`.
- Consome `actionObterChatwootWidgetConfig()` no mount.
- Injeta `<script src="{baseUrl}/packs/js/sdk.js" async>` e chama `window.chatwootSDK.run({ websiteToken, baseUrl })` no `onload`.
- Cleanup: remove script + `window.$chatwoot?.reset()`.

### 3. Montagem — src/app/website/components/layout/website-shell.tsx
- Adicionar `<ChatwootWidget />` dentro do shell.

## Verification
- `npm run type-check`
- Inspeção manual: `/website/`, `/servicos/` renderizam bubble; `/portal`, `/(auth)`, `/(authenticated)` não.

## Commit
- Atomic commit: `feat(260414-ghv): enable chatwoot bubble on public pages`
