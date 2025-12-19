/**
 * CONTRATOS FEATURE - Actions Barrel Export
 *
 * Re-exporta todas as Server Actions do módulo de contratos.
 */

export type { ActionResult } from './contratos-actions';
export {
  actionCriarContrato,
  actionAtualizarContrato,
  actionListarContratos,
  actionBuscarContrato,
} from './contratos-actions';
