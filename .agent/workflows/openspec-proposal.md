---
description: Migrate Captura Module to FSD
---

# Change Proposal: Migrate Captura Module to FSD

## Status

Proposed

## Summary

Migrate the `captura` module to the Feature-Sliced Design (FSD) architecture. This involves creating a self-contained feature directory `src/features/captura` and refactoring the main dashboard page to use the new structure.

## Changes

### 1. New Feature Directory: `src/features/captura`

Created a comprehensive feature module with the following structure:

- `components/`: UI components (forms, lists, dialogs, filters).
- `services/`: API client (`api-client.ts`) encapsulating all backend calls.
- `hooks/`: Custom hooks (`use-capturas-log.ts`).
- `types.ts`: Centralized type definitions.
- `constants.ts`: Shared constants.

### 2. Main Page Refactor: `src/app/(dashboard)/captura/page.tsx`

Refactored the main entry point to use `PageShell` layout and consume feature components directly.

- Implemented `CapturaList` for listing capture history.
- Implemented `CapturaDialog` for initiating new captures.

### 3. Components Migration

- Migrated all legacy forms: `AcervoGeralForm`, `ArquivadosForm`, `AudienciasForm`, `PendentesForm`, `PartesForm`, `TimelineForm`.
- Migrated `DataTable` logic into `CapturaList`.
- Migrated filter logic into `CapturaFilters`.

### 4. Shared Components

- Migrated `AdvogadoCombobox` and `CredenciaisCombobox` to the feature directory.

### 5. API Services

- Centralized all `fetch` wrappers in `api-client.ts`, handling error parsing and response typing.

### 6. Cleanup

- Deleted legacy files in `src/app/(dashboard)/captura/historico` and `src/app/(dashboard)/captura/components`.
- Deleted legacy API client `src/app/api/captura/captura.ts` and hook `src/app/_lib/hooks/use-capturas-log.ts`.

## Verification

- Usage of `PageShell` + `DataShell` for consistent UI.
- All forms verified to use new API client.
- Filters and pagination logic verified in `CapturaList`.

## Impact

- Improved code organization and maintainability.
- Better type safety with consolidated types.
- Decoupling from legacy `src/app/api` directory.
