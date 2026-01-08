/**
 * Barrel export para componentes de orçamentos
 *
 * ⚠️ OTIMIZAÇÃO DE BUILD:
 * Prefira imports diretos quando possível para melhor tree-shaking.
 */

// ============================================================================
// Formulários e Dialogs
// ============================================================================
export { OrcamentoFormDialog } from './orcamento-form-dialog';
export type { OrcamentoFormDialogProps } from './orcamento-form-dialog';

export { OrcamentoItemDialog } from './orcamento-item-dialog';

// ============================================================================
// Toolbar e Filtros
// ============================================================================
export {
  ORCAMENTOS_FILTER_CONFIGS,
  buildOrcamentosFilterOptions,
  buildOrcamentosFilterGroups,
  parseOrcamentosFilters,
  filtersToSelectedIds,
} from './orcamentos-toolbar-filters';

// ============================================================================
// Cards de Resumo
// ============================================================================
export { ResumoCards } from './resumo-cards';
