/**
 * Documentos — Server Actions (Barrel Export)
 *
 * Re-exporta todas as server actions do módulo de documentos.
 * Importações cross-módulo devem usar este barrel.
 */

// ============================================================================
// Documentos (Plate.js)
// ============================================================================
export {
    actionListarDocumentos,
    actionBuscarDocumento,
    actionCriarDocumento,
    actionAtualizarDocumento,
    actionDeletarDocumento,
    actionAutoSalvar,
} from './documentos-actions';

// ============================================================================
// Pastas
// ============================================================================
export {
    actionListarPastas,
    actionCriarPasta,
    actionMoverDocumento,
    actionDeletarPasta,
} from './pastas-actions';

// ============================================================================
// Arquivos Genéricos
// ============================================================================
export {
    actionUploadArquivoGenerico,
    actionListarItensUnificados,
    actionMoverArquivo,
    actionDeletarArquivo,
    actionBuscarCaminhoPasta,
} from './arquivos-actions';

// ============================================================================
// Uploads
// ============================================================================
export {
    actionUploadArquivo,
    actionListarUploads,
    actionGerarPresignedUrl,
    actionGerarUrlDownload,
} from './uploads-actions';

// ============================================================================
// Compartilhamento
// ============================================================================
export {
    actionCompartilharDocumento,
    actionListarCompartilhamentos,
    actionAtualizarPermissao,
    actionRemoverCompartilhamento,
    actionListarDocumentosCompartilhados,
} from './compartilhamento-actions';

// ============================================================================
// Templates
// ============================================================================
export {
    actionListarTemplates,
    actionCriarTemplate,
    actionUsarTemplate,
    actionDeletarTemplate,
    actionListarCategorias,
    actionListarTemplatesMaisUsados,
} from './templates-actions';

// ============================================================================
// Versões
// ============================================================================
export {
    actionListarVersoes,
    actionRestaurarVersao,
} from './versoes-actions';

// ============================================================================
// Lixeira
// ============================================================================
export {
    actionListarLixeira,
    actionRestaurarDaLixeira,
    actionLimparLixeira,
    actionDeletarPermanentemente,
} from './lixeira-actions';
