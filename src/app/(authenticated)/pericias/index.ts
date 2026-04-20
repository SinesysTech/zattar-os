/**
 * Perícias Feature Module — Barrel Export (API Pública)
 *
 * Este é o ponto de entrada público do módulo de perícias.
 * Toda importação cross-módulo DEVE passar por este arquivo.
 *
 * Entidades: Perícias, Especialidades, Peritos
 */

// ============================================================================
// Components
// ============================================================================
export { PericiasClient } from './components/pericias-client';
export type { PericiasViewMode } from './components/pericias-client';
export { PericiasPulseStrip } from './components/pericias-pulse-strip';
export { PericiasMissaoContent } from './components/pericias-missao-content';
export { PericiasPipelineStepper } from './components/pericias-pipeline-stepper';
export { PericiasYearHeatmap } from './components/pericias-year-heatmap';
export { PericiasTableWrapper } from './components/pericias-table-wrapper';
export { PericiasListWrapper } from './components/pericias-list-wrapper';
export { PericiasMonthWrapper } from './components/pericias-month-wrapper';
export { PericiasYearWrapper } from './components/pericias-year-wrapper';
export { PericiasFilterBar } from './components/pericias-filter-bar';
export { PericiasCalendarMonth } from './components/pericias-calendar-month';
export { PericiasCalendarYear } from './components/pericias-calendar-year';
export { PericiaDetalhesDialog } from './components/pericia-detalhes-dialog';

// ============================================================================
// Hooks
// ============================================================================
export { usePericias } from './hooks/use-pericias';
export { useEspecialidadesPericias } from './hooks/use-especialidades-pericias';
export { usePeritos } from './hooks/use-peritos';

// ============================================================================
// Actions (Server Actions)
// ============================================================================
export {
    actionListarPericias,
    actionObterPericia,
    actionAtribuirResponsavel,
    actionAdicionarObservacao,
    actionListarEspecialidadesPericia,
    actionCriarPericia,
    actionPericiasPulseStats,
} from './actions';

export type { ActionResult, PericiasPulseStats } from './actions';

// ============================================================================
// Types / Domain
// ============================================================================
export type {
    Pericia,
    CodigoTribunal,
    GrauTribunal,
    CriarPericiaInput,
    PericiaSortBy,
    ListarPericiasParams,
    PericiasFilters,
    UsuarioOption,
    EspecialidadePericiaOption,
    PeritoOption,
} from './domain';

export {
    SituacaoPericiaCodigo,
    SITUACAO_PERICIA_LABELS,
    CodigoTribunal as CodigoTribunalValues,
    atribuirResponsavelSchema,
    adicionarObservacaoSchema,
    criarPericiaSchema,
} from './domain';
