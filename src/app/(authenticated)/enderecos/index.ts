/**
 * ENDEREÇOS MODULE — Barrel Export (API Pública)
 *
 * Módulo de serviço (sem page.tsx) — gestão de endereços físicos.
 * Relação polimórfica via entidade_tipo + entidade_id.
 */

// =============================================================================
// Types / Domain
// =============================================================================

export * from './domain';

// =============================================================================
// Service
// =============================================================================

export * from './service';

// =============================================================================
// Repository (namespace export to avoid conflicts with service)
// =============================================================================

export * as enderecosRepository from './repository';
export { upsertEnderecoPorIdPje } from './repository';

// =============================================================================
// Actions
// =============================================================================

export {
    actionCriarEndereco,
    actionAtualizarEndereco,
    actionBuscarEnderecoPorId,
    actionBuscarEnderecosPorEntidade,
    actionListarEnderecos,
    actionDeletarEndereco,
} from './actions';

// =============================================================================
// Components
// =============================================================================

export * from './components';

// =============================================================================
// Utils
// =============================================================================

export * from './utils';
