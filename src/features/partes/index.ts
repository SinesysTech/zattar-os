/**
 * Partes Feature Module - Main barrel export
 *
 * ⚠️ OTIMIZAÇÃO DE BUILD:
 * Prefira imports diretos quando possível para melhor tree-shaking:
 *
 * ✅ Recomendado (import direto):
 * import { useClientes } from '@/features/partes/hooks/use-clientes';
 * import { ClientesTableWrapper } from '@/features/partes/components/clientes';
 *
 * ⚠️ Use com moderação (barrel export):
 * import { useClientes, ClientesTableWrapper } from '@/features/partes';
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
  FilterPopover,
  // Clientes
  ClientesTableWrapper,
  ClienteForm,
  // Partes Contrarias
  PartesContrariasTableWrapper,
  // Terceiros
  TerceirosTableWrapper,
  // Representantes
  RepresentantesTableWrapper,
} from "./components";

export type { FilterOption } from "./components";

// ============================================================================
// Hooks
// ============================================================================
export {
  useClientes,
  usePartesContrarias,
  useTerceiros,
  useRepresentantes,
} from "./hooks";

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
} from "./utils";

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
} from "./types";

export type { ParteComDadosCompletos } from "./types";
export type { TipoParteProcesso, PoloProcessoParte } from "./types";
export { TIPOS_PARTE_PROCESSO_VALIDOS } from "./types";

// ============================================================================
// Domain (Schemas, Validation, Types)
// ============================================================================
// Additional domain types
export type {
  CreateClientePFInput,
  CreateClientePJInput,
  CreateClienteInput,
  UpdateClienteInput,
  ParteContrariaBase,
  CreateParteContrariaPFInput,
  CreateParteContrariaPJInput,
  CreateParteContrariaInput,
  UpdateParteContrariaInput,
  TerceiroBase,
  CreateTerceiroPFInput,
  CreateTerceiroPJInput,
  CreateTerceiroInput,
  UpdateTerceiroInput,
  OrdenarPorParte,
  Ordem,
  OrdenarPorTerceiro,
  ClienteComEndereco,
  ClienteComEnderecoEProcessos,
  ParteContrariaComEndereco,
  ParteContrariaComEnderecoEProcessos,
  TerceiroComEndereco,
  TerceiroComEnderecoEProcessos,
} from "./domain";

// Functions and Schemas
export {
  normalizarDocumento,
  validarCpfFormato,
  validarCpfDigitos,
  validarCnpjFormato,
  validarCnpjDigitos,
  validarEmail,
  cpfSchema,
  cpfStrictSchema,
  cnpjSchema,
  cnpjStrictSchema,
  emailArraySchema,
  createClientePFSchema,
  createClientePJSchema,
  createClienteSchema,
  updateClienteSchema,
  createParteContrariaPFSchema,
  createParteContrariaPJSchema,
  createParteContrariaSchema,
  updateParteContrariaSchema,
  createTerceiroPFSchema,
  createTerceiroPJSchema,
  createTerceiroSchema,
  updateTerceiroSchema,
} from "./domain";

// ============================================================================
// Server-only exports
// ============================================================================
// Actions, Services e Repositories devem ser importados de "@/features/partes/server".

// ============================================================================
// Errors
// ============================================================================
export {
  DocumentoDuplicadoError,
  DocumentoInvalidoError,
  TipoPessoaIncompativelError,
  EntidadeNaoEncontradaError,
  CampoObrigatorioError,
  EmailInvalidoError,
  toAppError,
  isDocumentoDuplicadoError,
  isDocumentoInvalidoError,
  isTipoPessoaIncompativelError,
  isEntidadeNaoEncontradaError,
  isCampoObrigatorioError,
  isEmailInvalidoError,
  isPartesError,
  clienteCpfDuplicadoError,
  clienteCnpjDuplicadoError,
  parteContrariaCpfDuplicadoError,
  parteContrariaCnpjDuplicadoError,
  terceiroCpfDuplicadoError,
  terceiroCnpjDuplicadoError,
  clienteNaoEncontradoError,
  parteContrariaNaoEncontradaError,
  terceiroNaoEncontradoError,
  errorCodeToHttpStatus,
  appErrorToHttpResponse,
} from "./errors";
