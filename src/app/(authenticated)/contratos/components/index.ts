/**
 * CONTRATOS FEATURE - Components Index
 *
 * Re-exporta todos os componentes da feature contratos.
 * Padrão DataShell implementado - usa clientes como referência.
 */

export { getContratosColumns } from "./columns";
export { ContratosTableWrapper } from "./contratos-table-wrapper";
export { ContratoForm } from "./contrato-form";
export { SegmentosDialog } from "./segmentos-dialog";
export { SegmentosFilter } from "./segmentos-filter";
export { ContratoDeleteDialog } from "./contrato-delete-dialog";

// ─── Pipeline UI Components ───────────────────────────────────────────────────
export { ContratoCard } from './contrato-card';
export type { ContratoCardData, ContratoCardProps } from './contrato-card';

export { ContratoListRow } from './contrato-list-row';
export type { ContratoListRowProps } from './contrato-list-row';

export { PipelineFunnel } from './pipeline-funnel';
export type { PipelineStageData, PipelineFunnelProps } from './pipeline-funnel';

export { FinancialStrip } from './financial-strip';
export type { ContratosStatsData, FinancialStripProps } from './financial-strip';

export { KanbanColumn } from './kanban-column';
export type { KanbanColumnProps } from './kanban-column';

// ─── Glass Briefing Orchestrator ─────────────────────────────────────────────
export { ContratosContent } from './contratos-content';
export { ContratosPulseStrip } from './contratos-pulse-strip';
export { ContratosPipelineStepper } from './contratos-pipeline-stepper';
