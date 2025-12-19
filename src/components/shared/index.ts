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

// =============================================================================
// VISUALIZAÇÕES TEMPORAIS
// =============================================================================

export {
  ViewSwitcher,
  DEFAULT_VIEWS,
  DEFAULT_ICONS,
} from './view-switcher';

export type {
  ViewType,
  ViewOption,
  ViewSwitcherProps,
} from './view-switcher';

export {
  DateNavigation,
  DateNavigationCompact,
} from './date-navigation';

export type {
  NavigationMode,
  DateNavigationProps,
  DateNavigationCompactProps,
} from './date-navigation';

export {
  WeekDaysCarousel,
  WeekDaysStrip,
  DaysCarousel,
  MonthsCarousel,
  YearsCarousel,
  useWeekNavigation,
  useDayNavigation,
  useMonthNavigation,
  useYearNavigation,
} from './week-days-carousel';

export type {
  DayInfo,
  WeekDaysCarouselProps,
  WeekDaysStripProps,
  DaysCarouselProps,
  MonthsCarouselProps,
  YearsCarouselProps,
} from './week-days-carousel';

export {
  TemporalViewShell,
  TemporalViewContent,
  TemporalViewHeader,
  TemporalViewLoading,
  TemporalViewError,
} from './temporal-view-shell';

export type {
  TemporalViewShellProps,
  TemporalViewContentProps,
  TemporalViewHeaderProps,
  TemporalViewLoadingProps,
  TemporalViewErrorProps,
} from './temporal-view-shell';

// =============================================================================
// LIFTED TABS (estilo tabs-13 shadcn-studio)
// =============================================================================

export {
  ExpedientesTabsCarousel,
} from './expedientes-tabs-carousel';

export type {
  ExpedientesTab,
  ExpedientesTabsCarouselProps,
} from './expedientes-tabs-carousel';