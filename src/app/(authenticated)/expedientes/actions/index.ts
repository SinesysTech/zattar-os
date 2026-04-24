/**
 * Barrel export para Server Actions da feature Expedientes
 *
 * Organiza todas as actions de:
 * - Expedientes (CRUD, baixa, reversão, listagem)
 * - Bulk Actions (transferência em massa, baixa em massa)
 */

// =============================================================================
// EXPEDIENTES - Server Actions
// =============================================================================
export {
  actionCriarExpediente,
  actionAtualizarExpediente,
  actionAtualizarExpedientePayload,
  actionBaixarExpediente,
  actionReverterBaixa,
  actionListarExpedientes,
  actionContarExpedientesPorStatus,
} from './expediente-actions';

export type { ActionResult } from './types';

// =============================================================================
// BULK ACTIONS
// =============================================================================
export {
  actionBulkTransferirResponsavel,
  actionBulkBaixar,
} from './expediente-bulk-actions';
