/**
 * CONTRATOS FEATURE - Hooks Barrel Export
 *
 * Re-exporta todos os hooks do módulo de contratos.
 */

export { useContratos } from './use-contratos';
export { useSegmentos } from './use-segmentos';
export type { SegmentoOption } from './use-segmentos';
export { useKanbanContratos, SEM_ESTAGIO_KEY } from './use-kanban-contratos';
export type { KanbanContrato, KanbanColumns } from './use-kanban-contratos';
export { useContratosPage } from './use-contratos-page';
export type { UseContratosPageParams, UseContratosPageResult } from './use-contratos-page';
export { useContratosStats } from './use-contratos-stats';
export type { UseContratosStatsResult } from './use-contratos-stats';
