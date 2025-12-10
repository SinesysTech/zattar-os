/**
 * Módulo Core - Documentos
 * Exportações centralizadas para domínio e repositório
 */

// Domain exports
export type {
  Documento,
  DocumentoComUsuario,
  ConteudoDocumento,
  AutoSaveData,
  AtualizarDocumentoData,
} from './domain';

// Repository exports
export {
  carregarDocumento,
  salvarDocumentoAutomatico,
  salvarDocumento,
} from './repository';
