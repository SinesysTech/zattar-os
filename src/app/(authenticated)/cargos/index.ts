/**
 * CARGOS MODULE — Barrel Export (API Pública)
 *
 * Módulo de serviço (sem page.tsx) — gestão de cargos do escritório.
 */

// =============================================================================
// Types / Domain
// =============================================================================

export type {
  Cargo,
  CriarCargoDTO,
  AtualizarCargoDTO,
  ListarCargosParams,
  ListarCargosResponse,
  CargoComUsuariosError,
} from './domain';

export {
  criarCargoSchema,
  atualizarCargoSchema,
} from './domain';

// =============================================================================
// Actions
// =============================================================================

export {
  actionListarCargos,
  actionBuscarCargo,
  actionCriarCargo,
  actionAtualizarCargo,
  actionDeletarCargo,
} from './actions';

// =============================================================================
// Hooks
// =============================================================================

export { useCargos } from './hooks/use-cargos';

// =============================================================================
// Components
// =============================================================================

export { } from './components';
