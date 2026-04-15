---
phase: 260415-c9p-lint-fixes
plan: 01
type: quick
tags: [lint, design-system, code-hygiene]
one_liner: "Zerou 25 lint errors + 1 warning (unused imports, OKLCH literal, h2 direto, hook deps) mantendo --max-warnings=0"
requires: []
provides:
  - "npm run lint exit 0 com --max-warnings=0"
affects:
  - "15 arquivos em captura/, contratos/, entrevistas-trabalhistas/, usuarios/, assinatura-digital/, auth components, sidebar/header layout"
tech-stack:
  added: []
  patterns:
    - "Typography.H2 component substitui <h2> direto"
    - "oklch(from var(--foreground) ...) para sombras em vez de OKLCH literal"
    - "Prefixo _ em unused-vars pendentes de wire-up (captura_map, handlers)"
key-files:
  created: []
  modified:
    - "src/app/(auth)/layout.tsx"
    - "src/app/(authenticated)/assinatura-digital/components/formularios-glass-list.tsx"
    - "src/app/(authenticated)/assinatura-digital/components/templates-glass-list.tsx"
    - "src/app/(authenticated)/captura/advogados/page-client.tsx"
    - "src/app/(authenticated)/captura/agendamentos/page-client.tsx"
    - "src/app/(authenticated)/captura/components/captura-glass-cards.tsx"
    - "src/app/(authenticated)/captura/credenciais/page-client.tsx"
    - "src/app/(authenticated)/contratos/components/contrato-view-sheet.tsx"
    - "src/app/(authenticated)/contratos/components/contratos-table-wrapper.tsx"
    - "src/app/(authenticated)/entrevistas-trabalhistas/components/entrevista-resumo.tsx"
    - "src/app/(authenticated)/usuarios/components/detail/profile-sidebar.tsx"
    - "src/app/(authenticated)/usuarios/components/permissions/permission-toggle.tsx"
    - "src/components/auth/forgot-password-form.tsx"
    - "src/components/layout/header/header-user-menu.tsx"
    - "src/components/layout/sidebar/nav-user.tsx"
decisions:
  - "credenciaisMap, handleNovaCredencial, logout, operacao: prefixados com _ (wire-ups pendentes / assinatura de prop obrigatoria) — preserva codigo para futura ligacao"
  - "setMounted em nav-user.tsx: era bug real (mounted referenciado em JSX sem useEffect de atualizacao); adicionado useEffect(() => setMounted(true), []) para consertar o pattern SSR hydration-safe"
  - "OKLCH literal 'oklch(0 0 0/0.25)' substituido por 'oklch(from var(--foreground) 0 0 0/0.25)' — --shadow-color nao existe em globals.css, --foreground com l=0 forca preto respeitando dark mode"
  - "<h2> direto trocado por Typography.H2 (eslint rule inspeciona JSXOpeningElement.name, ignora className)"
metrics:
  duration: "~3min"
  completed: "2026-04-15"
  tasks: 2
  files: 15
---

# Quick Task 260415-c9p: Lint Fixes Summary

Zerou todos os 25 errors + 1 warning reportados por `npm run lint` com `--max-warnings=0`.

## Commits

- **Task 1** `b0aa58786` — `chore(260415-c9p-01): remove unused imports/vars + fix SSR mount bug`
  - 12 arquivos: remocao de 9 imports nao usados, prefixo `_` em 4 vars/props pendentes, fix bug SSR em nav-user.tsx
- **Task 2** `2767a9df8` — `fix(260415-c9p-02): design system + hook deps compliance`
  - 3 arquivos: OKLCH literal → token, `<h2>` → `Typography.H2`, `useCallback` deps completas

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] SSR mount pattern incompleto em nav-user.tsx**
- **Found during:** Task 1 (investigacao de `setMounted` não usado)
- **Issue:** `[mounted, setMounted] = useState(false)` com `mounted` referenciado no JSX (linhas 127 e 134) mas `setMounted` nunca chamado — bug real que deixava `mounted` permanentemente `false`, bloqueando o render condicional de theme-dependent UI
- **Fix:** Adicionado `React.useEffect(() => setMounted(true), [])` — pattern SSR hydration-safe padrao
- **Files modified:** `src/components/layout/sidebar/nav-user.tsx`
- **Commit:** `b0aa58786`

## Verification

```bash
$ npm run lint
# exit 0, zero errors, zero warnings
```

## Success Criteria Check

- [x] `npm run lint` exit code 0
- [x] Zero errors, zero warnings reportados
- [x] `src/app/(auth)/layout.tsx` usa `oklch(from var(--foreground) ...)` — sem literal
- [x] `profile-sidebar.tsx` usa `Typography.H2` (não `<h2>` direto)
- [x] `contratos-table-wrapper.tsx:423` useCallback inclui `setCreateOpen`
- [x] Nenhum comportamento runtime regressado (dead code prefixado com `_`, não removido)
- [x] Decisoes de remoção vs prefixo documentadas em commits

## Self-Check: PASSED

- FOUND commit `b0aa58786` (Task 1)
- FOUND commit `2767a9df8` (Task 2)
- FOUND: all 15 files modified present in git log
- FOUND: `npm run lint` exit code 0
