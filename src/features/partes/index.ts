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
  // Tabs content (página principal)
  PartesTabsContent,
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

export type { ParteComDadosCompletos } from './types';
export type { TipoParteProcesso, PoloProcessoParte } from './types';
export { TIPOS_PARTE_PROCESSO_VALIDOS } from './types';

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
} from './domain';

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
} from './domain';

// ============================================================================
// Services
// ============================================================================
export {
  criarCliente,
  buscarCliente,
  buscarClientePorDocumento,
  buscarClientePorCPF,
  buscarClientePorCNPJ,
  buscarClientesPorNome,
  listarClientes,
  contarClientes,
  contarClientesAteData,
  contarClientesEntreDatas,
  contarClientesPorEstado,
  contarClientesPorEstadoComFiltro,
  atualizarCliente,
  upsertCliente,
  desativarCliente,
  criarParteContraria,
  buscarParteContraria,
  buscarParteContrariaPorDocumento,
  listarPartesContrarias,
  contarPartesContrarias,
  contarPartesContrariasAteData,
  contarPartesContrariasEntreDatas,
  atualizarParteContraria,
  criarTerceiro,
  buscarTerceiro,
  buscarTerceiroPorDocumento,
  buscarTerceirosPorNome,
  listarTerceiros,
  atualizarTerceiro,
  listarRepresentantes as listarRepresentantesService,
  listarRepresentantesComEndereco,
  listarRepresentantesComEnderecoEProcessos,
  buscarRepresentantePorId,
  buscarRepresentantePorIdComEndereco,
  buscarRepresentantePorCPF,
  buscarRepresentantePorNome,
  buscarRepresentantesPorOAB,
  criarRepresentante,
  atualizarRepresentante,
  deletarRepresentante,
  upsertRepresentantePorCPF,
} from './service';

// ============================================================================
// Actions (Server Actions)
// ============================================================================
export {
  // Clientes - Safe Actions
  actionListarClientesSafe,
  actionBuscarClienteSafe,
  actionListarClientesSugestoesSafe,
  actionCriarClienteSafe,
  actionAtualizarClienteSafe,
  actionDesativarClienteSafe,
  // Clientes - Direct Actions
  actionListarClientes,
  actionBuscarCliente,
  actionAtualizarCliente,
  actionListarClientesSugestoes,
  actionBuscarClientePorCPF as actionBuscarClientePorCPFAction,
  actionBuscarClientePorCNPJ as actionBuscarClientePorCNPJAction,
  actionContarClientes,
  actionContarClientesComEstatisticas,
  actionContarClientesPorEstado,
  // Partes Contrarias
  actionListarPartesContrariasSafe,
  actionBuscarParteContrariaSafe,
  actionCriarParteContrariaSafe,
  actionAtualizarParteContrariaSafe,
  actionContarPartesContrariasComEstatisticas,
  // Terceiros
  actionListarTerceirosSafe,
  actionBuscarTerceiroSafe,
  actionCriarTerceiroSafe,
  actionAtualizarTerceiroSafe,
  // Processo Partes
  actionBuscarPartesPorProcessoEPolo,
  // Representantes
  actionListarRepresentantes,
  actionBuscarRepresentantePorId as actionBuscarRepresentantePorIdAction,
  actionCriarRepresentante,
  actionAtualizarRepresentante as actionAtualizarRepresentanteAction,
  actionDeletarRepresentante,
  actionUpsertRepresentantePorCPF,
  actionBuscarRepresentantePorNome,
  actionBuscarRepresentantesPorOAB,
  // Form Actions
  actionCriarCliente,
  actionAtualizarClienteForm,
  actionDesativarCliente,
  actionCriarParteContraria,
  actionAtualizarParteContraria,
  actionListarPartesContrarias,
  actionCriarTerceiro,
  actionAtualizarTerceiro,
  actionListarTerceiros,
} from './actions';

export type { ActionResult } from './actions';

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
} from './errors';

// ============================================================================
// Repositories (Decomposed)
// ============================================================================
// Clientes
export {
  findClienteById,
  findClienteByCPF,
  findClienteByCNPJ,
  findClientesByNome,
  findAllClientes,
  saveCliente,
  updateCliente,
  upsertClienteByCPF,
  upsertClienteByCNPJ,
  softDeleteCliente,
  findAllClientesComEndereco,
  findAllClientesComEnderecoEProcessos,
  findClienteByIdComEndereco,
  countClientes,
  countClientesAteData,
  countClientesEntreDatas,
  countClientesPorEstado,
  countClientesPorEstadoComFiltro,
  // Partes Contrarias
  findParteContrariaById,
  findParteContrariaByCPF,
  findParteContrariaByCNPJ,
  findAllPartesContrarias,
  findAllPartesContrariasComEnderecoEProcessos,
  saveParteContraria,
  updateParteContraria,
  upsertParteContrariaByCPF,
  upsertParteContrariaByCNPJ,
  softDeleteParteContraria,
  countPartesContrarias,
  countPartesContrariasAteData,
  countPartesContrariasEntreDatas,
  // Terceiros
  findTerceiroById,
  findTerceiroByCPF,
  findTerceiroByCNPJ,
  findAllTerceiros,
  findAllTerceirosComEnderecoEProcessos,
  saveTerceiro,
  updateTerceiro,
  upsertTerceiroByCPF,
  upsertTerceiroByCNPJ,
  softDeleteTerceiro,
  // Representantes (with Repo suffix)
  buscarRepresentantePorIdRepo,
  buscarRepresentantePorIdComEnderecoRepo,
  buscarRepresentantePorCPFRepo,
  buscarRepresentantePorNomeRepo,
  buscarRepresentantesPorOABRepo,
  listarRepresentantesRepo,
  listarRepresentantesComEnderecoRepo,
  listarRepresentantesComEnderecoEProcessosRepo,
  criarRepresentanteRepo,
  atualizarRepresentanteRepo,
  deletarRepresentanteRepo,
  upsertRepresentantePorCPFRepo,
  // Processo Partes
  vincularParteProcesso,
  buscarProcessosPorEntidade,
  // Cadastros PJE
  upsertCadastroPJE,
  buscarEntidadePorIdPessoaPJE,
  // Converters
  converterParaCliente,
  converterParaParteContraria,
  converterParaTerceiro,
  converterParaEndereco,
} from './repositories';

export type {
  VincularParteProcessoParams,
  ProcessoParte,
  VincularParteProcessoResult,
  BuscarProcessosPorEntidadeResult,
  TipoEntidadeCadastroPJE,
  SistemaJudicial,
  CadastroPJE,
  UpsertCadastroPJEParams,
  BuscarEntidadePorIdPessoaPJEParams,
} from './repositories';
