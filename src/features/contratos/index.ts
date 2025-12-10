/**
 * CONTRATOS FEATURE - Public API
 *
 * Re-exporta todos os módulos públicos da feature contratos.
 * Este é o ponto de entrada principal para importar funcionalidades de contratos.
 *
 * Uso:
 * import { ContratosTableWrapper, listarContratos, Contrato } from '@/features/contratos';
 */

// =============================================================================
// TYPES
// =============================================================================
export type {
  AreaDireito,
  TipoContrato,
  TipoCobranca,
  StatusContrato,
  PoloProcessual,
  TipoParte,
  ParteContrato,
  Contrato,
  CreateContratoInput,
  UpdateContratoInput,
  ListarContratosParams,
  ContratoSortBy,
  Ordem,
  ContratosApiResponse,
  BuscarContratosParams,
  ContratosFilters,
  PaginationInfo,
  ClienteInfo,
} from './types';

export {
  // Schemas Zod
  parteContratoSchema,
  areaDireitoSchema,
  tipoContratoSchema,
  tipoCobrancaSchema,
  statusContratoSchema,
  poloProcessualSchema,
  createContratoSchema,
  updateContratoSchema,
  // Labels
  AREA_DIREITO_LABELS,
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  STATUS_CONTRATO_LABELS,
  POLO_PROCESSUAL_LABELS,
} from './types';

// =============================================================================
// UTILS
// =============================================================================
export {
  formatarAreaDireito,
  formatarTipoContrato,
  formatarTipoCobranca,
  formatarStatusContrato,
  formatarPoloProcessual,
  formatarData,
  formatarDataHora,
  getStatusBadgeStyle,
  getTipoContratoBadgeStyle,
  getStatusVariant,
  getTipoContratoVariant,
} from './utils';

// =============================================================================
// SERVICE
// =============================================================================
export {
  criarContrato,
  buscarContrato,
  listarContratos,
  atualizarContrato,
} from './service';

// =============================================================================
// ACTIONS (Server Actions)
// =============================================================================
export type { ActionResult } from './actions';
export {
  actionCriarContrato,
  actionAtualizarContrato,
  actionListarContratos,
  actionBuscarContrato,
} from './actions';

// =============================================================================
// HOOKS
// =============================================================================
export { useContratos } from './hooks';

// =============================================================================
// COMPONENTS
// =============================================================================
export {
  ContratosTable,
  ContratosTableWrapper,
  ContratoForm,
  ContratoViewSheet,
  CONTRATOS_FILTER_CONFIGS,
  buildContratosFilterOptions,
  buildContratosFilterGroups,
  parseContratosFilters,
} from './components';
