# Change: Refatorar módulo de Contratos para Feature-Sliced Design

## Why

O módulo de Contratos foi migrado da arquitetura legada (espalhada entre `src/core/`, `src/components/modules/`, `src/app/_lib/`, `src/app/actions/`) para a nova arquitetura **Feature-Sliced Design** em `src/features/contratos/`. Esta proposta documenta a remoção dos arquivos legados agora redundantes.

## What Changes

- **BREAKING**: Remove arquivos legados do módulo de contratos
- Consolida todo o código de contratos em `src/features/contratos/`
- Mantém API routes REST em `src/app/api/contratos/` (fazem parte do roteamento Next.js)
- Mantém serviços backend em `backend/contratos/` (usados pelas API routes)

### Arquivos a serem removidos:

**Core (migrados para features/contratos/):**
- `src/core/contratos/domain.ts` → `src/features/contratos/types.ts`
- `src/core/contratos/service.ts` → `src/features/contratos/service.ts`
- `src/core/contratos/repository.ts` → `src/features/contratos/repository.ts`
- `src/core/contratos/index.ts` → `src/features/contratos/index.ts`

**Components (migrados para features/contratos/components/):**
- `src/components/modules/contratos/contratos-table-wrapper.tsx`
- `src/components/modules/contratos/contratos-table.tsx`
- `src/components/modules/contratos/contrato-form.tsx`
- `src/components/modules/contratos/contrato-view-sheet.tsx`
- `src/components/modules/contratos/index.ts`

**App Lib (migrados para features/contratos/):**
- `src/app/_lib/types/contratos.ts` → `src/features/contratos/types.ts`
- `src/app/_lib/utils/format-contratos.ts` → `src/features/contratos/utils.ts`
- `src/app/_lib/hooks/use-contratos.ts` → `src/features/contratos/hooks.ts`

**Actions (migrados para features/contratos/actions.ts):**
- `src/app/actions/contratos.ts`

**Dashboard Components:**
- `src/app/(dashboard)/contratos/components/contratos-toolbar-filters.tsx` → `src/features/contratos/components/contratos-toolbar-filters.tsx`

## Impact

- Affected specs: contratos
- Affected code:
  - `src/app/(dashboard)/contratos/page.tsx` - já atualizado para importar de `@/features/contratos`
  - Nenhum outro código depende dos arquivos legados (verificado via imports)

### Nova Estrutura:

```
src/features/contratos/
├── index.ts              # Public API exports
├── types.ts              # Types, schemas, constants
├── utils.ts              # Formatting utilities
├── hooks.ts              # React hooks
├── actions.ts            # Server Actions
├── service.ts            # Business logic
├── repository.ts         # Data access
└── components/
    ├── index.ts
    ├── contratos-table.tsx
    ├── contratos-table-wrapper.tsx
    ├── contrato-form.tsx
    ├── contrato-view-sheet.tsx
    └── contratos-toolbar-filters.tsx
```
