/**
 * Exportação centralizada de todos os tipos frontend relacionados a partes
 */

// Tipos compartilhados (exportados apenas uma vez)
export type {
  TipoPessoa,
  SituacaoPJE,
} from './clientes';

// Clientes
export type {
  GrauCliente,
  ClienteBase,
  Cliente,
  ClientePessoaFisica,
  ClientePessoaJuridica,
  CriarClienteParams,
  AtualizarClienteParams,
  ListarClientesParams,
  ListarClientesResult,
  UpsertClientePorCPFParams,
  UpsertClientePorCNPJParams,
  UpsertClientePorDocumentoParams,
  OrdenarPorCliente,
  OrdemCliente,
  ClienteFormData,
} from './clientes';

export {
  isClientePessoaFisica,
  isClientePessoaJuridica,
  formatarCpf as formatarCpfCliente,
  formatarCnpj as formatarCnpjCliente,
  formatarTelefone as formatarTelefoneCliente,
  getSituacaoLabel as getSituacaoLabelCliente,
  getSituacaoColor as getSituacaoColorCliente,
} from './clientes';

// Partes Contrárias
export type {
  GrauParteContraria,
  ParteContraria,
  ParteContrariaPessoaFisica,
  ParteContrariaPessoaJuridica,
  CriarParteContrariaParams,
  AtualizarParteContrariaParams,
  ListarPartesContrariasParams,
  ListarPartesContrariasResult,
  UpsertParteContrariaPorCPFParams,
  UpsertParteContrariaPorCNPJParams,
  UpsertParteContrariaPorDocumentoParams,
  OrdenarPorParteContraria,
  OrdemParteContraria,
  ParteContrariaFormData,
} from './partes-contrarias';

export {
  isParteContrariaPessoaFisica,
  isParteContrariaPessoaJuridica,
  formatarCpf as formatarCpfParteContraria,
  formatarCnpj as formatarCnpjParteContraria,
  formatarTelefone as formatarTelefoneParteContraria,
  getSituacaoLabel as getSituacaoLabelParteContraria,
  getSituacaoColor as getSituacaoColorParteContraria,
} from './partes-contrarias';

// Endereços
export type {
  EntidadeTipoEndereco,
  SituacaoEndereco,
  ClassificacaoEndereco,
  Endereco,
  CriarEnderecoParams,
  AtualizarEnderecoParams,
  ListarEnderecosParams,
  ListarEnderecosResult,
  BuscarEnderecosPorEntidadeParams,
  DefinirEnderecoPrincipalParams,
  OrdenarPorEndereco,
  OrdemEndereco,
  EnderecoFormData,
} from './enderecos';

export {
  isEnderecoCorrespondencia,
  isEnderecoAtivo,
  formatarCep,
  formatarEnderecoCompleto,
  formatarEnderecoResumido,
  getSituacaoEnderecoLabel,
  getSituacaoEnderecoColor,
  getEntidadeTipoLabel as getEntidadeTipoLabelEndereco,
  validarCep,
  validarUf,
  getNomeEstado,
  UFS_VALIDAS,
} from './enderecos';

// Terceiros (Peritos, MP, etc.)
export type {
  Terceiro,
  TerceiroPessoaFisica,
  TerceiroPessoaJuridica,
  CriarTerceiroParams,
  AtualizarTerceiroParams,
  ListarTerceirosParams,
  ListarTerceirosResult,
  UpsertTerceiroPorCPFParams,
  UpsertTerceiroPorCNPJParams,
  UpsertTerceiroPorDocumentoParams,
  UpsertTerceiroPorIdPessoaParams,
  OrdenarPorTerceiro,
  OrdemTerceiro,
  TerceiroFormData,
} from './terceiros';

export {
  isTerceiroPessoaFisica,
  isTerceiroPessoaJuridica,
  formatarCpf as formatarCpfTerceiro,
  formatarCnpj as formatarCnpjTerceiro,
  formatarDocumento,
  formatarTelefone as formatarTelefoneTerceiro,
  getSituacaoLabel as getSituacaoLabelTerceiro,
  getSituacaoColor as getSituacaoColorTerceiro,
  getTipoParteLabel as getTipoParteLabelTerceiro,
  getTipoParteColor as getTipoParteColorTerceiro,
  getPoloLabel as getPoloLabelTerceiro,
  getPoloColor as getPoloColorTerceiro,
  getGrauLabel as getGrauLabelTerceiro,
  getTrtLabel as getTrtLabelTerceiro,
  getNomeExibicao,
  validarCpf,
  validarCnpj,
} from './terceiros';

// Processo-Partes (N:N relationship)
export type {
  EntidadeTipoProcessoParte,
  GrauProcessoParte,
  PoloProcessoParte,
  TipoParteProcesso,
  ProcessoParte,
  CriarProcessoParteParams,
  AtualizarProcessoParteParams,
  ListarProcessoPartesParams,
  ListarProcessoPartesResult,
  BuscarPartesPorProcessoParams,
  ParteComDadosCompletos,
  BuscarProcessosPorEntidadeParams,
  ProcessoComParticipacao,
  VincularParteProcessoParams,
  DesvincularParteProcessoParams,
  OrdenarPorProcessoParte,
  OrdemProcessoParte,
  ProcessoParteFormData,
} from './processo-partes';

export {
  isPartePrincipal,
  isAutoridade,
  isEnderecoDesconhecido,
  getPoloLabel as getPoloLabelProcessoParte,
  getPoloColor as getPoloColorProcessoParte,
  getTipoParteLabel as getTipoParteLabelProcessoParte,
  getTipoParteColor as getTipoParteColorProcessoParte,
  getEntidadeTipoLabel as getEntidadeTipoLabelProcessoParte,
  getEntidadeTipoColor,
  getGrauLabel as getGrauLabelProcessoParte,
  getTrtLabel as getTrtLabelProcessoParte,
  getPrincipalIcon,
  getAutoridadeIcon,
  agruparPartesPorPolo,
  contarPartesPorPolo,
  getPartesPrincipais,
  getPartesPorPolo,
  validarNumeroProcesso,
  formatarNumeroProcesso,
  extrairTrtDoNumero,
  extrairAnoDoNumero,
} from './processo-partes';
