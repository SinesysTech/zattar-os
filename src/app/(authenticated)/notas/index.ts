/**
 * NOTAS MODULE — Barrel Export (API Pública)
 *
 * Re-exporta tipos, schemas, serviços e actions do módulo de notas.
 * Este arquivo é o ponto de entrada para consumidores externos.
 */

// =============================================================================
// Components
// =============================================================================

export { default as NotesApp } from './components/note-app';

// =============================================================================
// Actions
// =============================================================================

export {
  actionListarDadosNotas,
  actionCriarNota,
  actionAtualizarNota,
  actionArquivarNota,
  actionExcluirNota,
  actionCriarEtiqueta,
  actionAtualizarEtiqueta,
  actionExcluirEtiqueta,
  actionPingNotas,
} from './actions';

// =============================================================================
// Types / Domain
// =============================================================================

export {
  // Schemas
  noteTypeSchema,
  noteChecklistItemSchema,
  noteLabelSchema,
  noteSchema,
  notasPayloadSchema,
  listNotasSchema,
  createNotaSchema,
  updateNotaSchema,
  deleteNotaSchema,
  setNotaArquivadaSchema,
  createEtiquetaSchema,
  updateEtiquetaSchema,
  deleteEtiquetaSchema,

  // Tipos
  type NoteType,
  type NoteChecklistItem,
  type NoteLabel,
  type Note,
  type NotasPayload,
  type ListNotasInput,
  type CreateNotaInput,
  type UpdateNotaInput,
  type DeleteNotaInput,
  type SetNotaArquivadaInput,
  type CreateEtiquetaInput,
  type UpdateEtiquetaInput,
  type DeleteEtiquetaInput,
} from './domain';

// =============================================================================
// Service
// =============================================================================

export {
  listarDadosNotas,
  criarNota,
  atualizarNota,
  arquivarNota,
  excluirNota,
  criarEtiqueta,
  atualizarEtiqueta,
  excluirEtiqueta,
} from './service';

// =============================================================================
// Utils
// =============================================================================

export { AVAILABLE_LABEL_COLORS, normalizeLabelColor } from './label-colors';
