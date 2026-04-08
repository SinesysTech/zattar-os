/**
 * ASSISTENTES ACTIONS
 *
 * Barrel export para todas as server actions do módulo assistentes.
 */

// ============================================================================
// Assistentes CRUD
// ============================================================================
export {
    actionListarAssistentes,
    actionBuscarAssistente,
    actionCriarAssistente,
    actionAtualizarAssistente,
    actionDeletarAssistente,
} from '../feature/actions/assistentes-actions';

export { requireAuth } from '../feature/actions/utils';

// ============================================================================
// Assistentes-Tipos (Configuração)
// ============================================================================
export {
    listarAssistentesTiposAction,
    buscarAssistenteParaTipoAction,
    criarAssistenteTipoAction,
    atualizarAssistenteTipoAction,
    deletarAssistenteTipoAction,
    ativarAssistenteTipoAction,
    gerarPecaAutomaticaAction,
} from './assistentes-tipos-actions';
