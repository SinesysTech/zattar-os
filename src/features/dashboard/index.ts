/**
 * Barrel export principal do módulo Dashboard
 *
 * Este é o ponto de entrada principal para o módulo Dashboard.
 * Importações devem ser feitas preferencialmente a partir deste arquivo:
 *
 * @example
 * import { DashboardContent, useDashboard, actionObterDashboard } from '@/features/dashboard';
 * import type { DashboardData, DashboardUsuarioData } from '@/features/dashboard';
 */

// Types
export type * from './types';

// Type Guards
export { isDashboardAdmin, isDashboardUsuario } from './types';

// Domain (Schemas Zod)
export * from './domain';

// Utils
export * from './utils';

// Hooks
export * from './hooks';

// Actions
export * from './actions';

// Components
export * from './components';
