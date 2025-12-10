/**
 * Audiências Feature Module - Main barrel export
 *
 * Este módulo centraliza toda a funcionalidade relacionada a audiências:
 * - Visualizações de calendário (semana, mês, ano)
 * - Lista de audiências
 * - Formulários de criação/edição
 * - Filtros e busca
 *
 * @example
 * // Importar componentes
 * import { AudienciasContent, AudienciaCard } from '@/features/audiencias';
 *
 * // Importar hooks
 * import { useAudiencias, useTiposAudiencias } from '@/features/audiencias';
 *
 * // Importar actions
 * import { actionCriarAudiencia } from '@/features/audiencias';
 *
 * // Importar tipos
 * import type { Audiencia, BuscarAudienciasParams } from '@/features/audiencias';
 */

// ============================================================================
// Components
// ============================================================================
export {
  // Badges
  AudienciaStatusBadge,
  AudienciaModalidadeBadge,
  // Cards
  AudienciaCard,
  // Detail views
  AudienciaDetailSheet,
  // Forms
  AudienciaForm,
  // List view
  AudienciasListView,
  // Calendar views
  AudienciasMonthDayCell,
  AudienciasCalendarWeekView,
  AudienciasCalendarMonthView,
  AudienciasCalendarYearView,
  // Main content
  AudienciasContent,
  // Filters
  AUDIENCIAS_FILTER_CONFIGS,
  buildAudienciasFilterOptions,
  buildAudienciasFilterGroups,
  parseAudienciasFilters,
} from './components';

// ============================================================================
// Hooks
// ============================================================================
export { useAudiencias, useTiposAudiencias } from './hooks';

// ============================================================================
// Actions
// ============================================================================
export {
  actionCriarAudiencia,
  actionAtualizarAudiencia,
  actionAtualizarStatusAudiencia,
  actionListarAudiencias,
} from './actions';

export type { ActionResult } from './actions';

// ============================================================================
// Types
// ============================================================================
export {
  // Domain types from core
  StatusAudiencia,
  ModalidadeAudiencia,
  PresencaHibrida,
  CODIGO_TRIBUNAL,
  GrauTribunal,
  STATUS_AUDIENCIA_LABELS,
  MODALIDADE_AUDIENCIA_LABELS,
  GRAU_TRIBUNAL_LABELS,
  createAudienciaSchema,
  updateAudienciaSchema,
  atualizarStatusSchema,
} from './types';

export type {
  // Domain types
  CodigoTribunal,
  EnderecoPresencial,
  Audiencia,
  AudienciaSortBy,
  ListarAudienciasParams,
  // Backend types
  GrauAudiencia,
  AudienciaInfra,
  CriarAudienciaInfraParams,
  AtualizarAudienciaInfraParams,
  // Frontend types
  AudienciasApiResponse,
  BuscarAudienciasParams,
  AudienciasFilters,
  AudienciasVisualizacao,
  AudienciasPaginacao,
  UseAudienciasResult,
  UseAudienciasOptions,
  TipoAudiencia,
  UseTiposAudienciasResult,
} from './types';
