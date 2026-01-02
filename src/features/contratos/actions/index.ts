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
  actionContarContratosPorStatus,
  actionContarContratosComEstatisticas,
  actionResolverNomesEntidadesContrato,
} from './contratos-actions';

// Segmentos Actions
export type { Segmento, CreateSegmentoInput, UpdateSegmentoInput } from './segmentos-actions';
export {
  actionListarSegmentos,
  actionCriarSegmento,
  actionAtualizarSegmento,
  actionDeletarSegmento,
} from './segmentos-actions';
