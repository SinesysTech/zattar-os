/**
 * Backwards-compatible type exports for the "documentos" feature.
 *
 * Some modules (hooks/actions/components) import from `../types` or `../../types`.
 * The canonical source of truth is `domain.ts`, but this file keeps old paths working.
 */

export type {
  Value,

  // Pastas
  Pasta,
  PastaComContadores,
  PastaHierarquia,
  CriarPastaParams,
  AtualizarPastaParams,

  // Templates
  Template,
  TemplateComUsuario,
  CriarTemplateParams,
  AtualizarTemplateParams,
  ListarTemplatesParams,

  // Documentos
  Documento,
  DocumentoComUsuario,
  CriarDocumentoParams,
  AtualizarDocumentoParams,
  ListarDocumentosParams,
  AutoSavePayload,

  // Uploads
  DocumentoUpload,
  DocumentoUploadComInfo,
  UploadArquivoParams,
  ListarUploadsParams,

  // Versões
  DocumentoVersao,
  DocumentoVersaoComUsuario,
  CriarVersaoParams,
  ListarVersoesParams,

  // Compartilhamento / permissões
  DocumentoCompartilhado,
  DocumentoCompartilhadoComUsuario,
  CompartilharDocumentoParams,
  ListarCompartilhamentosParams,

  // Arquivos genéricos
  Arquivo,
  ArquivoComUsuario,
  CriarArquivoParams,
  AtualizarArquivoParams,
  ListarArquivosParams,
  ItemDocumento,
} from "./domain";

export {
  PERMISSOES,
  TIPOS_PASTA,
  TIPOS_MEDIA,
  VISIBILIDADE_TEMPLATE,
  PERMISSAO_VALUES,
  TIPOS_ARQUIVO,
  EXTENSOES_PERMITIDAS,
} from "./domain";
