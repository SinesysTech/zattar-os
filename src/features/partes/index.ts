/**
 * Partes Feature Module - Main barrel export
 *
 * Este modulo centraliza toda a funcionalidade relacionada a partes processuais:
 * - Clientes
 * - Partes Contrarias
 * - Terceiros
 * - Representantes (Advogados)
 *
 * @example
 * // Importar componentes
 * import { ClientesTableWrapper, ClienteForm } from '@/features/partes';
 *
 * // Importar hooks
 * import { usePartesContrarias, useTerceiros } from '@/features/partes';
 *
 * // Importar utils
 * import { formatarCpf, formatarNome } from '@/features/partes';
 *
 * // Importar tipos
 * import type { Cliente, ParteContraria } from '@/features/partes';
 */

// ============================================================================
// Components
// ============================================================================
export {
  // Shared
  ProcessosRelacionadosCell,
  CopyButton,
  // Clientes
  CLIENTES_FILTER_CONFIGS,
  buildClientesFilterOptions,
  buildClientesFilterGroups,
  parseClientesFilters,
  ClientesTableWrapper,
  ClienteForm,
  // Partes Contrarias
  PARTES_CONTRARIAS_FILTER_CONFIGS,
  buildPartesContrariasFilterOptions,
  buildPartesContrariasFilterGroups,
  parsePartesContrariasFilters,
  PartesContrariasTableWrapper,
  // Terceiros
  TERCEIROS_FILTER_CONFIGS,
  buildTerceirosFilterOptions,
  buildTerceirosFilterGroups,
  parseTerceirosFilters,
  TerceirosTableWrapper,
  // Representantes
  REPRESENTANTES_FILTER_CONFIGS,
  buildRepresentantesFilterOptions,
  buildRepresentantesFilterGroups,
  parseRepresentantesFilters,
  RepresentantesTableWrapper,
} from './components';

// ============================================================================
// Hooks
// ============================================================================
export {
  useClientes,
  usePartesContrarias,
  useTerceiros,
  useRepresentantes,
} from './hooks';

// ============================================================================
// Utils
// ============================================================================
export {
  formatarCpf,
  formatarCnpj,
  formatarTelefone,
  formatarCep,
  formatarNome,
  formatarEnderecoCompleto,
  formatarData,
  formatarTipoPessoa,
  calcularIdade,
} from './utils';

// ============================================================================
// Types
// ============================================================================
export type {
  // Core types
  TipoPessoa,
  SituacaoPJE,
  GrauProcesso,
  ProcessoRelacionado,
  Cliente,
  ClienteBase,
  ClientePessoaFisica,
  ClientePessoaJuridica,
  ParteContraria,
  ParteContrariaPessoaFisica,
  ParteContrariaPessoaJuridica,
  Terceiro,
  TerceiroPessoaFisica,
  TerceiroPessoaJuridica,
  TipoParteTerceiro,
  PoloTerceiro,
  ListarClientesParams,
  ListarPartesContrariasParams,
  ListarTerceirosParams,
  // Extended types
  ParteEndereco,
  PaginationInfo,
  // Params types
  BuscarPartesContrariasParams,
  BuscarTerceirosParams,
  BuscarRepresentantesParams,
  // API response types
  PartesContrariasApiResponse,
  TerceirosApiResponse,
  // Filter types
  ClientesFilters,
  PartesContrariasFilters,
  TerceirosFilters,
  RepresentantesFilters,
  // Representante types
  Representante,
  InscricaoOAB,
  SituacaoOAB,
  TipoRepresentante,
  RepresentanteComEndereco,
  ListarRepresentantesResult,
} from './types';

// ============================================================================
// Domain (Schemas, Validation, Types)
// ============================================================================
export * from './domain';

// ============================================================================
// Services
// ============================================================================
export * from './service';

// ============================================================================
// Errors
// ============================================================================
export * from './errors';

// ============================================================================
// Repository (Internal/Advanced Usage)
// ============================================================================
export * from './repository';

