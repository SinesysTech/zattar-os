/**
 * ASSISTENTES MODULE
 *
 * Barrel export — API pública do módulo assistentes.
 * Inclui gestão de assistentes (CRUD) e configuração assistentes-tipos.
 */

// ============================================================================
// Components
// ============================================================================
export { AssistentesListWrapper } from './feature/components/shared/assistentes-list-wrapper';
export { AssistenteCard } from './feature/components/list/assistente-card';
export { CreateDialog } from './feature/components/dialogs/create-dialog';
export { EditDialog } from './feature/components/dialogs/edit-dialog';
export { DeleteDialog } from './feature/components/dialogs/delete-dialog';
export { AssistentesTiposConfig } from './components';

// ============================================================================
// Hooks
// ============================================================================
export { useAssistentes } from './feature/hooks/use-assistentes';
export { useAssistenteMutations } from './feature/hooks/use-assistente-mutations';

// ============================================================================
// Actions
// ============================================================================
export {
    actionListarAssistentes,
    actionBuscarAssistente,
    actionCriarAssistente,
    actionAtualizarAssistente,
    actionDeletarAssistente,
    requireAuth,
    listarAssistentesTiposAction,
    buscarAssistenteParaTipoAction,
    criarAssistenteTipoAction,
    atualizarAssistenteTipoAction,
    deletarAssistenteTipoAction,
    ativarAssistenteTipoAction,
    gerarPecaAutomaticaAction,
} from './actions';

// ============================================================================
// Types / Domain — Assistentes
// ============================================================================
export type {
    Assistente,
    AssistentesParams,
    TipoAssistente,
    AssistenteSchema,
    CriarAssistenteInput,
    CriarAssistenteDifyInput,
    AtualizarAssistenteInput,
} from './feature/domain';

export {
    assistenteSchema,
    criarAssistenteSchema,
    criarAssistenteDifySchema,
    atualizarAssistenteSchema,
    STATUS_LABELS,
    TIPO_ASSISTENTE,
    TIPO_ASSISTENTE_LABELS,
} from './feature/domain';

// ============================================================================
// Types / Domain — Assistentes-Tipos
// ============================================================================
export type {
    AssistenteTipo,
    AssistenteTipoComRelacoes,
    CriarAssistenteTipoInput,
    AtualizarAssistenteTipoInput,
    ListarAssistentesTiposParams,
} from './domain';

export {
    criarAssistenteTipoSchema,
    atualizarAssistenteTipoSchema,
    listarAssistentesTiposSchema,
} from './domain';

// ============================================================================
// Utils
// ============================================================================
export {
    formatarDataCriacao,
    formatarDataRelativa,
    truncarDescricao,
    sanitizarIframeCode,
} from './feature/utils';

// ============================================================================
// Services (para uso interno cross-módulo)
// ============================================================================
export {
    criarAssistenteDify,
    deletarAssistentePorDifyApp,
    sincronizarAssistenteDify,
} from './feature/service';

export * as assistentesTiposService from './service';
