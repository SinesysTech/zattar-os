// =============================================================================
// DOMAIN - Tipos, Schemas e Constantes
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
// SERVICE - Casos de Uso
// =============================================================================
export {
    listar,
    buscar,
    criar,
    atualizar,
    deletar,
} from './service';

// =============================================================================
// REPOSITORY - Acesso a Dados (para uso avançado/testes)
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

// =============================================================================
// ACTIONS - Server Actions
// =============================================================================
export {
    actionListarTiposExpedientes,
    actionBuscarTipoExpediente,
    actionCriarTipoExpediente,
    actionAtualizarTipoExpediente,
    actionDeletarTipoExpediente,
} from './actions/tipos-expedientes-actions';

// =============================================================================
// COMPONENTS - UI
// =============================================================================
export {
    TiposExpedientesList,
} from './components/tipos-expedientes-list';

export {
    TipoExpedienteForm
} from './components/tipo-expediente-form';
