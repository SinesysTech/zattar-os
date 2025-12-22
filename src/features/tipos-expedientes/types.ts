/**
 * Tipos para Tipos de Expedientes
 * Re-exporta tipos do domain.ts para compatibilidade de imports
 */

export type {
  TipoExpediente,
  CreateTipoExpedienteInput,
  UpdateTipoExpedienteInput,
  ListarTiposExpedientesParams,
  ListarTiposExpedientesResult,
} from './domain';

export {
  LIMITE_DEFAULT,
  LIMITE_MAX,
  ORDENAR_POR_OPTIONS,
  ORDEM_OPTIONS,
  createTipoExpedienteSchema,
  updateTipoExpedienteSchema,
  listarTiposExpedientesParamsSchema,
  validarNomeTipoExpediente,
} from './domain';
