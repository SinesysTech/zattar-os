---
phase: 05-indicadores-detail-dialog
plan: 04
subsystem: ui
tags: [audiencias, migration, dialog, sheet, barrel, big-bang]

# Dependency graph
requires:
  - phase: 05-indicadores-detail-dialog/05-03
    provides: AudienciaDetailDialog component with identical interface to Sheet
provides:
  - Big-bang migration of all 5 usage points from AudienciaDetailSheet to AudienciaDetailDialog
  - Updated barrel exports with Dialog, IndicadorBadges, Timeline
  - Test mock updated for new component
affects: [audiencias module, phase 6 views]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Drop-in replacement via identical props interface — no consumer changes needed beyond import/JSX rename"

key-files:
  created:
    - .planning/phases/05-indicadores-detail-dialog/05-04-SUMMARY.md
  modified:
    - src/app/(authenticated)/audiencias/components/index.ts
    - src/app/(authenticated)/audiencias/index.ts
    - src/app/(authenticated)/audiencias/audiencias-client.tsx
    - src/app/(authenticated)/audiencias/components/audiencias-content.tsx
    - src/app/(authenticated)/audiencias/components/audiencias-list-wrapper.tsx
    - src/app/(authenticated)/audiencias/components/audiencias-table-wrapper.tsx
    - src/app/(authenticated)/audiencias/components/__tests__/audiencias-content.test.tsx

key-decisions:
  - "AudienciaDetailSheet file preserved (not deleted) — available as reference or rollback"
  - "AudienciaIndicadorBadges and AudienciaTimeline added to barrel for Phase 6 consumption"

patterns-established:
  - "Big-bang migration pattern: identical interface enables simple search-replace across all consumers"

requirements-completed: [DIALOG-01, DIALOG-10]

# Metrics
duration: 5min
completed: 2026-04-11
---

# Phase 05 Plan 04: Big-bang Migration Summary

**All 5 usage points migrated from AudienciaDetailSheet to AudienciaDetailDialog — zero remaining Sheet references, barrel exports updated, test mock updated**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-11
- **Completed:** 2026-04-11
- **Tasks:** 2 of 3 complete (Task 3 is human checkpoint)
- **Files modified:** 7

## Accomplishments
- Migrated audiencias-client.tsx: import + JSX → AudienciaDetailDialog
- Migrated audiencias-content.tsx: import + JSX → AudienciaDetailDialog
- Migrated audiencias-list-wrapper.tsx: import + JSX → AudienciaDetailDialog
- Migrated audiencias-table-wrapper.tsx: import + JSX → AudienciaDetailDialog
- Updated components/index.ts barrel: AudienciaDetailDialog + AudienciaIndicadorBadges + AudienciaTimeline
- Updated audiencias/index.ts barrel: AudienciaDetailDialog exported
- Updated test mock: audiencia-detail-dialog mock replaces audiencia-detail-sheet

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Migrate all usage points + barrels | `6ce2923a` | 7 files |
| 2 | Validation | included in Task 1 | - |
| 3 | Human verification | PENDING | - |

## Pending: Human Verification (Task 3)

Run `npm run dev` and verify at http://localhost:3000/audiencias:
1. Click any audiencia in Quadro/Missao view → centered DIALOG opens (not lateral sheet)
2. Dialog has: header with title/status/buttons, scrollable body with 7 sections, footer
3. Click "Fechar" → closes
4. Click "Editar Audiência" → edit dialog opens
5. Navigate to Lista/Semana views → dialog opens there too

## Known Stubs
- AudienciaDetailSheet file preserved (not deleted) — can be removed in cleanup phase

---
*Phase: 05-indicadores-detail-dialog*
*Completed: 2026-04-11*
