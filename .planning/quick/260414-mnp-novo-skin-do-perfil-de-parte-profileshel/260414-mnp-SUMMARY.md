---
phase: 260414-mnp
plan: 01
subsystem: profiles
tags: [profiles, glass-briefing, ui, partes]
requires: []
provides:
  - ProfileHeader redesign (banner radial + avatar glass square + metadata strip)
  - ProfileKpiStrip component (2-4 KPIs por entityType)
  - ProfileSidebar glass (GlassPanel + progress card separado)
  - ProfileShellClient orquestra --tipo-color e entityType
  - Link Ver perfil completo em partes-client.tsx
affects:
  - src/lib/domain/profiles/**
  - src/app/(authenticated)/partes/partes-client.tsx
tech-stack:
  added: []
  patterns:
    - "CSS var --tipo-color injetada via style inline no root (ProfileShellClient)"
    - "color-mix(in oklch, var(--tipo-color), transparent) para tints semi-transparentes"
    - "GlassPanel depth=2 para KPIs e progress card; depth=1 para sidebar"
key-files:
  created:
    - src/lib/domain/profiles/components/profile-layout/profile-kpi-strip.tsx
  modified:
    - src/lib/domain/profiles/components/profile-layout/profile-header.tsx
    - src/lib/domain/profiles/components/profile-layout/profile-sidebar.tsx
    - src/lib/domain/profiles/components/profile-shell-client.tsx
    - src/app/(authenticated)/partes/partes-client.tsx
decisions:
  - "Banner do header NÃO injeta --tipo-color localmente — consome via CSS var vinda do ProfileShellClient root"
  - "ProfileHeader.entityType é optional (default cliente) para permitir Task 1 compilar sem Task 2"
  - "Fallback de rota em LABEL_TO_SEGMENT é 'clientes' (mais comum) quando label desconhecido"
metrics:
  duration_minutes: 3
  tasks_completed: 3
  files_created: 1
  files_modified: 4
  completed_at: "2026-04-14T19:28:00Z"
---

# Quick Task 260414-mnp: Novo skin do perfil de parte (ProfileShell) — Summary

One-liner: Redesign visual do ProfileShell para Glass Briefing (banner radial colorido por tipo, avatar glass square, KPI strip, sidebar glass com progress bar tintada) + fix do botão "Ver perfil completo" como `<Link>` por tipo.

## Task Execution

### Task 1 — ProfileHeader redesign

Reescrito `profile-header.tsx`:
- Banner com 3 radial gradients em `color-mix(in oklch, var(--tipo-color, var(--primary)) …)` + overlay linear de info
- Avatar 20→28 tamanho, `rounded-3xl`, `backdrop-blur-xl`, background `color-mix(in oklch, var(--card) 78%, transparent)`, border `border/40`, shadow-lg
- Iniciais com `color: var(--tipo-color, var(--primary))` em font-display 3xl/4xl bold
- Título via `<Heading level="page">`; subtítulos via `<Text variant="meta-label">` separados por `·`
- Metadata strip com `border-t border-border/40 pt-3 mt-4`, ícones `size-3.5 text-muted-foreground/60`
- Badges via `AppBadge` preservado
- Prop `entityType` opcional (default `cliente`) adicionada — Task 2 passa o valor real
- Zero cor hardcoded (sem `bg-blue-*`, sem `#hex`, sem `from-primary/20`)

Commit: `c95db7225`

### Task 2 — KpiStrip + Sidebar + ShellClient

**ProfileKpiStrip (novo)**
- `KPI_SPECS` por `EntityType` (cliente: 3, parte_contraria: 2, terceiro: 1, representante: 3, usuario: 0)
- Lê `data.stats.<path>` via `getNestedValue`
- Render: grid `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`, `GlassPanel depth={2}`, ícone + `<Text variant="overline">` + `<Heading level="card">` com `text-success`/`text-warning`/`text-foreground`

**ProfileSidebar reescrito**
- Imports trocados: `Card/CardContent/…` → `GlassPanel`, `Heading/Text`
- Progress card isolado (primeiro `GlassPanel depth={2}`): label "Completude do perfil" em overline, barra 2px `bg-muted` + preenchimento `var(--tipo-color, var(--primary))`
- Sections card: `<GlassPanel depth={1} className="p-5">` com `<Heading level="subsection">Perfil</Heading>` e seções em `<Text variant="overline">`
- Preservado: `calculateProfileCompletion`, `sectionHasVisibleFields`, formatação date-fns com ptBR, skip de seções vazias

**ProfileShellClient**
- Import `ProfileKpiStrip`
- `TIPO_COLOR_VAR`: cliente→`var(--primary)`, parte_contraria→`var(--destructive)`, terceiro→`var(--info)`, representante→`var(--success)`, usuario→`var(--primary)`
- Root container recebe `style={{ '--tipo-color': … }}` (cast via `CSSProperties`)
- `<ProfileHeader>` agora recebe `entityType={entityType}`
- `<ProfileKpiStrip>` inserido entre `</Card>` do header e o `<div>` do grid (dentro do `space-y-4`)
- Zero mudança no `renderSection` switch, em configs, sections/*, adapters/*, actions/*

Commit: `0f45a6954`

### Task 3 — Link "Ver perfil completo"

`src/app/(authenticated)/partes/partes-client.tsx`:
- Import `Link` de `next/link`
- Mapa module-level `LABEL_TO_SEGMENT`: `'Cliente' → 'clientes'`, `'Parte Contrária' → 'partes-contrarias'`, `'Terceiro' → 'terceiros'`, `'Representante' → 'representantes'`
- `EntityDetail` deriva `segment` e `perfilHref = /partes/${segment}/${data.id}` após `const { config } = data;`
- `<button>` → `<Link href={perfilHref}>` com classes visuais exatamente preservadas
- Ícone `ExternalLink` preservado, `size-3`

Rotas destino verificadas no filesystem — todas existem:
- `/partes/clientes/[id]/page.tsx` ✅
- `/partes/partes-contrarias/[id]/page.tsx` ✅
- `/partes/terceiros/[id]/page.tsx` ✅
- `/partes/representantes/[id]/page.tsx` ✅

Commit: `a5d6e09d9`

## Deviations from Plan

None — plan executado conforme escrito.

Obs: O commit da Task 1 também incluiu arquivos pré-staged antes do início da execução (documentos da fase de planejamento + alterações locais anteriores em `document-flow-shell.tsx` e `client-page.tsx` de assinatura-digital). O `git add` explícito foi feito apenas no arquivo do profile-header, porém o index já continha as mudanças pré-existentes. Isso **não** afeta a correção das Tasks 2 e 3 (commits individuais limpos com apenas os arquivos previstos). As alterações pré-staged estavam documentadas no `git status` inicial do worktree e não foram modificadas por este executor.

## Verification

- `npm run type-check` → ✅ passou após cada task (3 runs sem erros)
- `git diff --stat HEAD~3..HEAD -- src/lib/domain/profiles/configs/ src/lib/domain/profiles/components/sections/ src/lib/domain/profiles/adapters/` → vazio ✅
- 3 commits atômicos com prefixo `260414-mnp` no scope ✅

## Commits

| Task | Hash | Mensagem |
|------|------|----------|
| 1 | `c95db7225` | refactor(profiles): redesign ProfileHeader conforme POC Glass Briefing (260414-mnp) |
| 2 | `0f45a6954` | feat(profiles): novo KPI Strip + sidebar glass + orquestração de cor por tipo (260414-mnp) |
| 3 | `a5d6e09d9` | fix(partes): link Ver perfil completo navega para /partes/{tipo}/{id} (260414-mnp) |

## Known Stubs

Nenhum. Todos os valores renderizados derivam de `data.stats.*` real (com fallback `'—'` quando ausente, que é comportamento semântico correto, não stub).

## Self-Check: PASSED

- FOUND: src/lib/domain/profiles/components/profile-layout/profile-kpi-strip.tsx
- FOUND: src/lib/domain/profiles/components/profile-layout/profile-header.tsx (modificado)
- FOUND: src/lib/domain/profiles/components/profile-layout/profile-sidebar.tsx (modificado)
- FOUND: src/lib/domain/profiles/components/profile-shell-client.tsx (modificado)
- FOUND: src/app/(authenticated)/partes/partes-client.tsx (modificado)
- FOUND commit c95db7225
- FOUND commit 0f45a6954
- FOUND commit a5d6e09d9
