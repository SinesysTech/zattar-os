/**
 * REPASSES MODULE — Barrel Export (API Pública)
 *
 * Módulo proxy/minimal que renderiza repasses pendentes.
 * Toda lógica de negócio vive no módulo `obrigacoes`.
 *
 * @see README.md para justificativa da ausência de domain/service/repository
 */

// =============================================================================
// Components
// =============================================================================

export { RepassesPageContent } from './components/repasses-page-content';

// =============================================================================
// Types / Domain (re-export de obrigacoes)
// =============================================================================

export type {
  RepassePendente,
  FiltrosRepasses,
} from '@/app/(authenticated)/obrigacoes';

// =============================================================================
// Hooks (re-export de obrigacoes)
// =============================================================================

export { useRepassesPendentes } from '@/app/(authenticated)/obrigacoes';
