/**
 * Barrel export principal do módulo Dashboard
 *
 * Este é o ponto de entrada principal para o módulo Dashboard.
 * Importações devem ser feitas preferencialmente a partir deste arquivo:
 *
 * @example
 * import { DashboardContent, useDashboard, actionObterDashboard } from '@/app/(authenticated)/dashboard';
 * import type { DashboardData, DashboardUsuarioData } from '@/app/(authenticated)/dashboard';
 */

// ============================================================================
// Types / Domain
// ============================================================================
export type * from './domain';
export { isDashboardAdmin, isDashboardUsuario } from './domain';
export * from './domain';

// ============================================================================
// Repository
// ============================================================================
export * from './repository';

// ============================================================================
// Service
// ============================================================================
export * from './service';

// ============================================================================
// Actions
// ============================================================================
export * from './actions';

// ============================================================================
// Hooks
// ============================================================================
export * from './hooks';

// ============================================================================
// Components
// ============================================================================
export * from './components';

// ============================================================================
// Utils
// ============================================================================
// `formatarMoeda` já é exportado pelo barrel de `./repositories` (via `./repository`).
// Re-exportamos os demais utilitários explicitamente para evitar ambiguidade.
export {
  formatarDataRelativa,
  formatarDataHora,
  formatarHora,
  formatarValorAbreviado,
  calcularPercentual,
  calcularVariacao,
  getDirecaoVariacao,
  getNivelUrgencia,
  getCorUrgencia,
  formatarDiasRestantes,
  formatarStatusExpediente,
  formatarStatusCaptura,
  formatarTRT,
  formatarGrau,
  agruparPor,
  contarOcorrencias,
} from './utils';
