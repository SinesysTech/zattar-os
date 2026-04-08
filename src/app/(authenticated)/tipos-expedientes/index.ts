/**
 * TIPOS-EXPEDIENTES MODULE — Barrel Export (API Pública)
 *
 * Módulo de cadastro auxiliar para gerenciar tipos de expedientes.
 * Tabela de domínio referenciada pelo módulo de expedientes.
 */

// =============================================================================
// Components
// =============================================================================

export { TiposExpedientesList } from './components/tipos-expedientes-list';
export { TipoExpedienteForm } from './components/tipo-expediente-form';

// =============================================================================
// Hooks
// =============================================================================

export { useTiposExpedientes } from './hooks/use-tipos-expedientes';

// =============================================================================
// Actions
// =============================================================================

export {
    actionListarTiposExpedientes,
    actionBuscarTipoExpediente,
    actionCriarTipoExpediente,
    actionAtualizarTipoExpediente,
    actionDeletarTipoExpediente,
} from './actions';

// =============================================================================
// Types / Domain
// =============================================================================

export type {
    TipoExpediente,
    CreateTipoExpedienteInput,
    UpdateTipoExpedienteInput,
    ListarTiposExpedientesParams,
    ListarTiposExpedientesResult,
} from './domain';

export {
    createTipoExpedienteSchema,
    updateTipoExpedienteSchema,
    listarTiposExpedientesParamsSchema,
    ORDENAR_POR_OPTIONS,
    ORDEM_OPTIONS,
    LIMITE_MAX,
    LIMITE_DEFAULT,
    validarNomeTipoExpediente,
} from './domain';

// =============================================================================
// Service
// =============================================================================

export {
    listar,
    buscar,
    criar,
    atualizar,
    deletar,
} from './service';

// =============================================================================
// Repository
// =============================================================================

export {
    findById,
    findByNome,
    findAll,
    create,
    update,
    deleteById,
    isInUse,
} from './repository';
