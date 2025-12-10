/**
 * Barrel export do módulo Repasses
 *
 * Feature minimalista que delega para @/features/obrigacoes
 *
 * @example
 * import { RepassesPageContent } from '@/features/repasses';
 */

export { RepassesPageContent } from './components/repasses-page-content';

// Re-exportar tipos e componentes de obrigacoes para conveniência
export type {
  RepassePendente,
  FiltrosRepasses,
} from '@/features/obrigacoes';

export {
  actionListarRepassesPendentes,
  actionAnexarDeclaracao,
  actionRegistrarRepasse,
  useRepassesPendentes,
} from '@/features/obrigacoes';
