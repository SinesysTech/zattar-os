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

  // Uploads
  DocumentoUpload,
  DocumentoUploadComInfo,

  // Versões
  DocumentoVersaoComUsuario,

  // Compartilhamento / permissões
  DocumentoCompartilhado,
  DocumentoCompartilhadoComUsuario,
  CompartilharDocumentoParams,
  AtualizarPermissaoParams,
} from './domain';

export {
  PERMISSOES,
  TIPOS_PASTA,
  TIPOS_MEDIA,
  VISIBILIDADE_TEMPLATE,
  PERMISSAO_VALUES,
} from './domain';


