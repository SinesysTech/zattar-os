/**
 * =============================================================================
 * Componentes Compartilhados - Barrel Export
 * =============================================================================
 *
 * Este arquivo exporta todos os componentes compartilhados do sistema.
 * Para instruções detalhadas de uso, consulte o arquivo CLAUDE.md nesta pasta.
 *
 * Referência de implementação: src/features/partes/components/clientes/
 * =============================================================================
 */

// =============================================================================
// LAYOUT
// =============================================================================

export { PageShell } from './page-shell';

// =============================================================================
// DATA SHELL - Padrão obrigatório para tabelas
// =============================================================================

export {
  DataShell,
  DataTable,
  DataTableToolbar,
  DataTableColumnHeader,
  DataPagination,
} from './data-shell';

export type {
  DataShellProps,
  DataShellActionButton,
} from './data-shell/data-shell';

export type { DataTableToolbarProps } from './data-shell/data-table-toolbar';

// =============================================================================
// FORMULÁRIOS E DETALHES
// =============================================================================

export { DialogFormShell } from './dialog-form-shell';
export { DetailSheet } from './detail-sheet';

// =============================================================================
// UTILITÁRIOS
// =============================================================================

export { EmptyState } from './empty-state';
export { TablePagination } from './table-pagination';
