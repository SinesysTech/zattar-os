/**
 * PARTES MODULE - Exports Publicos
 *
 * Este arquivo define a API publica do modulo de Partes.
 * Consumidores devem importar daqui, nao dos arquivos internos.
 *
 * @example
 * import { criarCliente, Cliente, createClienteSchema } from '@/core/partes';
 */

// =============================================================================
// DOMAIN - Tipos, Interfaces e Schemas
// =============================================================================

// Tipos base
export type {
  TipoPessoa,
  TipoParteTerceiro,
  PoloTerceiro,
  GrauProcesso,
} from './domain';

// Entidades - Cliente
export type {
  ClienteBase,
  ClientePessoaFisica,
  ClientePessoaJuridica,
  Cliente,
  CreateClientePFInput,
  CreateClientePJInput,
  CreateClienteInput,
  UpdateClienteInput,
  ListarClientesParams,
  // Tipos com relacionamentos (JOINs)
  ProcessoRelacionado,
  ClientePessoaFisicaComEndereco,
  ClientePessoaJuridicaComEndereco,
  ClienteComEndereco,
  ClientePessoaFisicaComEnderecoEProcessos,
  ClientePessoaJuridicaComEnderecoEProcessos,
  ClienteComEnderecoEProcessos,
} from './domain';

// Entidades - Parte Contraria
export type {
  ParteContrariaBase,
  ParteContrariaPessoaFisica,
  ParteContrariaPessoaJuridica,
  ParteContraria,
  CreateParteContrariaPFInput,
  CreateParteContrariaPJInput,
  CreateParteContrariaInput,
  UpdateParteContrariaInput,
  ListarPartesContrariasParams,
} from './domain';

// Entidades - Terceiro
export type {
  TerceiroBase,
  TerceiroPessoaFisica,
  TerceiroPessoaJuridica,
  Terceiro,
  CreateTerceiroPFInput,
  CreateTerceiroPJInput,
  CreateTerceiroInput,
  UpdateTerceiroInput,
  ListarTerceirosParams,
} from './domain';

// Tipos auxiliares de ordenacao
export type { OrdenarPorParte, OrdenarPorTerceiro, Ordem } from './domain';

// Schemas Zod - Validacao
export {
  // Schemas de documento
  cpfSchema,
  cpfStrictSchema,
  cnpjSchema,
  cnpjStrictSchema,
  emailArraySchema,
  // Schemas Cliente
  createClientePFSchema,
  createClientePJSchema,
  createClienteSchema,
  updateClienteSchema,
  // Schemas Parte Contraria
  createParteContrariaPFSchema,
  createParteContrariaPJSchema,
  createParteContrariaSchema,
  updateParteContrariaSchema,
  // Schemas Terceiro
  createTerceiroPFSchema,
  createTerceiroPJSchema,
  createTerceiroSchema,
  updateTerceiroSchema,
} from './domain';

// Funcoes de validacao
export {
  normalizarDocumento,
  validarCpfFormato,
  validarCpfDigitos,
  validarCnpjFormato,
  validarCnpjDigitos,
  validarEmail,
} from './domain';

// =============================================================================
// SERVICE - Casos de Uso (API principal)
// =============================================================================

// Cliente
export {
  criarCliente,
  buscarCliente,
  buscarClientePorDocumento,
  buscarClientesPorNome,
  listarClientes,
  atualizarCliente,
  upsertCliente,
  desativarCliente,
} from './service';

// Parte Contraria
export {
  criarParteContraria,
  buscarParteContraria,
  buscarParteContrariaPorDocumento,
  listarPartesContrarias,
  atualizarParteContraria,
} from './service';

// Terceiro
export {
  criarTerceiro,
  buscarTerceiro,
  buscarTerceiroPorDocumento,
  listarTerceiros,
  atualizarTerceiro,
} from './service';

// =============================================================================
// ERRORS - Erros Customizados
// =============================================================================

export {
  // Classes de erro
  DocumentoDuplicadoError,
  DocumentoInvalidoError,
  TipoPessoaIncompativelError,
  EntidadeNaoEncontradaError,
  CampoObrigatorioError,
  EmailInvalidoError,
  // Helpers de conversao
  toAppError,
  errorCodeToHttpStatus,
  appErrorToHttpResponse,
  // Fabricas de erro
  clienteCpfDuplicadoError,
  clienteCnpjDuplicadoError,
  parteContrariaCpfDuplicadoError,
  parteContrariaCnpjDuplicadoError,
  terceiroCpfDuplicadoError,
  terceiroCnpjDuplicadoError,
  clienteNaoEncontradoError,
  parteContrariaNaoEncontradaError,
  terceiroNaoEncontradoError,
  // Type guards
  isDocumentoDuplicadoError,
  isDocumentoInvalidoError,
  isTipoPessoaIncompativelError,
  isEntidadeNaoEncontradaError,
  isCampoObrigatorioError,
  isEmailInvalidoError,
  isPartesError,
} from './errors';

// =============================================================================
// REPOSITORY - Funcoes de persistencia (uso interno/testes)
// =============================================================================

// Nota: O repositorio e exportado para permitir testes unitarios
// e casos de uso avancados. Para uso normal, prefira usar os services.

export {
  // Cliente
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
  // Cliente com relacionamentos (JOINs)
  findClienteByIdComEndereco,
  findAllClientesComEndereco,
  findAllClientesComEnderecoEProcessos,
  // Parte Contraria
  findParteContrariaById,
  findParteContrariaByCPF,
  findParteContrariaByCNPJ,
  findAllPartesContrarias,
  saveParteContraria,
  updateParteContraria,
  // Terceiro
  findTerceiroById,
  findTerceiroByCPF,
  findTerceiroByCNPJ,
  findAllTerceiros,
  saveTerceiro,
  updateTerceiro,
} from './repository';
