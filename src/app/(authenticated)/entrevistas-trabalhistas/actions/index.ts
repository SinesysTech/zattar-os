// =============================================================================
// Entrevistas Trabalhistas — Actions Barrel Export
// =============================================================================

export type { EntrevistaActionResult } from './entrevista-actions';
export {
    iniciarEntrevistaAction,
    salvarModuloAction,
    finalizarEntrevistaAction,
    reabrirEntrevistaAction,
} from './entrevista-actions';

export {
    uploadAnexoAction,
    uploadArquivoAnexoAction,
    deleteAnexoAction,
} from './anexo-actions';

export { consolidarEntrevistaIAAction } from './consolidacao-ia-actions';

export { enviarParaIntegracaoPeticaoAction } from './integracao-peticao-actions';
