// Tipos compartilhados de domínio e contratos (importar diretamente quando possível, aqui apenas re-exportando o essencial para conveniência ou para tipos específicos do frontend)
export type { TipoPessoa, SituacaoPJE, GrauProcesso } from '@/types/domain/common';
export type { ProcessoRelacionado } from '@/types/domain/processo-relacionado';
export type {
  ClienteBase,
  Cliente,
  ClientePessoaFisica,
  ClientePessoaJuridica,
  TipoParteTerceiro,
  PoloTerceiro,
  Terceiro,
  TerceiroPessoaFisica,
  TerceiroPessoaJuridica,
  ParteContraria,
  ParteContrariaPessoaFisica,
  ParteContrariaPessoaJuridica,
  EntidadeTipoEndereco,
  SituacaoEndereco,
  ClassificacaoEndereco,
  Endereco,
  EntidadeTipoProcessoParte,
  PoloProcessoParte,
  TipoParteProcesso,
  ProcessoParte,
  ParteComDadosCompletos,
  ProcessoComParticipacao,
} from '@/types/domain';

export type {
  CriarClienteParams,
  AtualizarClienteParams,
  ListarClientesParams,
  ListarClientesResult,
  UpsertClientePorCPFParams,
  UpsertClientePorCNPJParams,
  UpsertClientePorDocumentoParams,
  OrdenarPorCliente,
  OrdemCliente,
  CriarParteContrariaParams,
  AtualizarParteContrariaParams,
  ListarPartesContrariasParams,
  ListarPartesContrariasResult,
  UpsertParteContrariaPorCPFParams,
  UpsertParteContrariaPorCNPJParams,
  UpsertParteContrariaPorDocumentoParams,
  OrdenarPorParteContraria,
  OrdemParteContraria,
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
  CriarEnderecoParams,
  AtualizarEnderecoParams,
  ListarEnderecosParams,
  ListarEnderecosResult,
  BuscarEnderecosPorEntidadeParams,
  DefinirEnderecoPrincipalParams,
  OrdenarPorEndereco,
  OrdemEndereco,
  CriarProcessoParteParams,
  AtualizarProcessoParteParams,
  ListarProcessoPartesParams,
  ListarProcessoPartesResult,
  BuscarPartesPorProcessoParams,
  BuscarProcessosPorEntidadeParams,
  VincularParteProcessoParams,
  DesvincularParteProcessoParams,
  OrdenarPorProcessoParte,
  OrdemProcessoParte,
} from '@/types/contracts';

// Tipos específicos do frontend (UI, Formulários, APIs)
export type { AcervoApiResponse, BuscarProcessosParams, ProcessosFilters } from './acervo';
export type { AudienciasApiResponse, BuscarAudienciasParams, AudienciasFilters } from './audiencias';
export type { Assistente, AssistentesParams, AssistentesFilters, ViewMode as AssistentesViewMode, AssistentesApiResponse, CriarAssistenteData, AtualizarAssistenteData } from './assistentes';
export type { ClientesApiResponse, BuscarClientesParams, ClienteFormData } from './clientes';
export type { ContratosApiResponse, BuscarContratosParams, ContratosFilters } from './contratos';
export type { CredenciaisResponse, Credencial, CriarCredencialParams, AtualizarCredencialParams, Advogado, CodigoTRT, GrauTRT } from './credenciais';
export type { ExpedientesApiResponse, BuscarExpedientesParams, ExpedientesFilters } from './expedientes';
export type { RepresentantesApiResponse, BuscarRepresentantesParams, RepresentantesFilters } from './representantes';
export type { ParteContrariaFormData } from './partes-contrarias';
export type { TerceiroFormData } from './terceiros';
export type { UsuariosFilters, UsuariosParams, ViewMode, Permissao, PermissaoMatriz, UsuarioDetalhado, PermissoesSaveState } from './usuarios';
export type { TimelineAPIResponse, TimelineItem, BackblazeB2Info, GoogleDriveInfo, TimelineItemEnriquecido, TimelineMetadata, TimelineDocument, DocumentoDetalhes, CapturaTimelineAPIResponse } from './timeline';
export type { DataTableColumn, ServerPaginationState, ServerSortingState, DataTableFilters, DataTableProps } from './data-table';
export type { TribunaisResponse, TribunalConfig, CriarTribunalParams, AtualizarTribunalParams } from './tribunais';
export type { ProcessoParteFormData } from './processo-partes';
export type { EnderecoFormData } from './enderecos';

// Funções utilitárias de frontend (devem ser importadas de seus respectivos arquivos)
export {
  isClientePessoaFisica,
  isClientePessoaJuridica,
  formatarCpf as formatarCpfCliente,
  formatarCnpj as formatarCnpjCliente,
  formatarTelefone as formatarTelefoneCliente,
  getSituacaoLabel as getSituacaoLabelCliente,
  getSituacaoColor as getSituacaoColorCliente,
} from './clientes';

export {
  isParteContrariaPessoaFisica,
  isParteContrariaPessoaJuridica,
  formatarCpf as formatarCpfParteContraria,
  formatarCnpj as formatarCnpjParteContraria,
  formatarTelefone as formatarTelefoneParteContraria,
  getSituacaoLabel as getSituacaoLabelParteContraria,
  getSituacaoColor as getSituacaoColorParteContraria,
} from './partes-contrarias';

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