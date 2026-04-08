/**
 * Documentos Feature Module — Barrel Export (API Pública)
 *
 * Este é o ponto de entrada público do módulo de documentos.
 * Toda importação cross-módulo DEVE passar por este arquivo.
 *
 * Entidades: Documentos, Pastas, Arquivos, Templates, Versões, Compartilhamento
 */

// ============================================================================
// Components
// ============================================================================
export { DocumentList } from './components/document-list';
export { DocumentListSkeleton } from './components/document-list-skeleton';
export { DocumentEditor } from './components/document-editor';
export { FolderTree } from './components/folder-tree';
export { ShareDocumentDialog } from './components/share-document-dialog';
export { VersionHistoryDialog } from './components/version-history-dialog';
export { UploadDialog } from './components/upload-dialog';
export { TemplateLibraryDialog } from './components/template-library-dialog';
export { FileManager } from './components/file-manager';
export { FileUploadDialogUnified } from './components/file-upload-dialog-unified';
export { CreateFolderDialog } from './components/create-folder-dialog';

// ============================================================================
// Hooks
// ============================================================================
export { useDocument } from './hooks/use-document';
export { useDocumentsList } from './hooks/use-documents-list';
export { useDocumentSharing } from './hooks/use-document-sharing';
export { useDocumentVersions } from './hooks/use-document-versions';
export { useFolders } from './hooks/use-folders';
export { useTemplates } from './hooks/use-templates';
export { useDocumentUploads } from './hooks/use-document-uploads';

// ============================================================================
// Actions (Server Actions)
// ============================================================================
export {
  // Documentos
  actionListarDocumentos,
  actionBuscarDocumento,
  actionCriarDocumento,
  actionAtualizarDocumento,
  actionDeletarDocumento,
  actionAutoSalvar,
  // Pastas
  actionListarPastas,
  actionCriarPasta,
  actionMoverDocumento,
  actionDeletarPasta,
  // Arquivos
  actionUploadArquivoGenerico,
  actionListarItensUnificados,
  actionMoverArquivo,
  actionDeletarArquivo,
  actionBuscarCaminhoPasta,
  // Uploads
  actionUploadArquivo,
  actionListarUploads,
  actionGerarPresignedUrl,
  actionGerarUrlDownload,
  // Compartilhamento
  actionCompartilharDocumento,
  actionListarCompartilhamentos,
  actionAtualizarPermissao,
  actionRemoverCompartilhamento,
  actionListarDocumentosCompartilhados,
  // Templates
  actionListarTemplates,
  actionCriarTemplate,
  actionUsarTemplate,
  actionDeletarTemplate,
  actionListarCategorias,
  actionListarTemplatesMaisUsados,
  // Versões
  actionListarVersoes,
  actionRestaurarVersao,
  // Lixeira
  actionListarLixeira,
  actionRestaurarDaLixeira,
  actionLimparLixeira,
  actionDeletarPermanentemente,
} from './actions';

// ============================================================================
// Types / Domain
// ============================================================================
export type {
  Value,
  Documento,
  CriarDocumentoParams,
  AtualizarDocumentoParams,
  ListarDocumentosParams,
  DocumentoComUsuario,
  Arquivo,
  ArquivoComUsuario,
  CriarArquivoParams,
  AtualizarArquivoParams,
  ListarArquivosParams,
  ItemDocumento,
  Pasta,
  CriarPastaParams,
  AtualizarPastaParams,
  PastaComContadores,
  PastaHierarquia,
  DocumentoCompartilhado,
  CompartilharDocumentoParams,
  DocumentoCompartilhadoComUsuario,
  ListarCompartilhamentosParams,
  Template,
  CriarTemplateParams,
  AtualizarTemplateParams,
  TemplateComUsuario,
  ListarTemplatesParams,
  DocumentoUpload,
  UploadArquivoParams,
  DocumentoUploadComInfo,
  ListarUploadsParams,
  DocumentoVersao,
  CriarVersaoParams,
  DocumentoVersaoComUsuario,
  ListarVersoesParams,
  SalaChat,
  CriarSalaChatParams,
  SalaChatComInfo,
  ListarSalasChatParams,
  MensagemChat,
  CriarMensagemChatParams,
  AtualizarMensagemChatParams,
  MensagemChatComUsuario,
  ListarMensagensChatParams,
  PresencaUsuario,
  EventoColaboracao,
  AutoSavePayload,
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginatedResponse,
} from './domain';

export {
  PERMISSOES,
  TIPOS_PASTA,
  TIPOS_MEDIA,
  VISIBILIDADE_TEMPLATE,
  PERMISSAO_VALUES,
  TIPOS_ARQUIVO,
  EXTENSOES_PERMITIDAS,
  documentoSchema,
  criarDocumentoSchema,
  atualizarDocumentoSchema,
  pastaSchema,
  criarPastaSchema,
  atualizarPastaSchema,
  compartilhamentoSchema,
  criarCompartilhamentoSchema,
  atualizarPermissaoCompartilhamentoSchema,
  templateSchema,
  criarTemplateSchema,
  atualizarTemplateSchema,
  uploadSchema,
  criarUploadSchema,
  autoSavePayloadSchema,
  criarVersaoSchema,
  criarSalaChatSchema,
  criarMensagemChatSchema,
  atualizarMensagemChatSchema,
  arquivoSchema,
  criarArquivoSchema,
  atualizarArquivoSchema,
} from './domain';

// ============================================================================
// Utils
// ============================================================================
export {
  sanitizeFilename,
  extractTextFromPlate,
  formatPlateContent,
  exportToPdf,
  exportTextToPdf,
  exportToDocx,
} from './utils';
