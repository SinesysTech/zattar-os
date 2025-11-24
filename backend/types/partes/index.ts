// Exportação centralizada de todos os tipos relacionados a partes

// Exportar tipos compartilhados apenas uma vez (de clientes-types)
export type { TipoPessoa, SituacaoPJE } from './clientes-types';

// Exportar todos os outros tipos de cada módulo (exceto os já exportados)
export type {
  GrauCliente,
  Cliente,
  ClientePessoaFisica,
  ClientePessoaJuridica,
  CriarClientePFParams,
  CriarClientePJParams,
  CriarClienteParams,
  AtualizarClientePFParams,
  AtualizarClientePJParams,
  AtualizarClienteParams,
  ListarClientesParams,
  ListarClientesResult,
  UpsertClientePorIdPessoaPFParams,
  UpsertClientePorIdPessoaPJParams,
  UpsertClientePorIdPessoaParams,
  OrdenarPorCliente,
  OrdemCliente,
} from './clientes-types';

export type {
  GrauParteContraria,
  ParteContraria,
  ParteContrariaPessoaFisica,
  ParteContrariaPessoaJuridica,
  CriarParteContrariaPFParams,
  CriarParteContrariaPJParams,
  CriarParteContrariaParams,
  AtualizarParteContrariaPFParams,
  AtualizarParteContrariaPJParams,
  AtualizarParteContrariaParams,
  ListarPartesContrariasParams,
  ListarPartesContrariasResult,
  UpsertParteContrariaPorIdPessoaPFParams,
  UpsertParteContrariaPorIdPessoaPJParams,
  UpsertParteContrariaPorIdPessoaParams,
  OrdenarPorParteContraria,
  OrdemParteContraria,
} from './partes-contrarias-types';

export type {
  TipoParteTerceiro,
  PoloTerceiro,
  Terceiro,
  TerceiroPessoaFisica,
  TerceiroPessoaJuridica,
  CriarTerceiroPFParams,
  CriarTerceiroPJParams,
  CriarTerceiroParams,
  AtualizarTerceiroPFParams,
  AtualizarTerceiroPJParams,
  AtualizarTerceiroParams,
  ListarTerceirosParams,
  ListarTerceirosResult,
  UpsertTerceiroPorIdPessoaPFParams,
  UpsertTerceiroPorIdPessoaPJParams,
  UpsertTerceiroPorIdPessoaParams,
  BuscarTerceirosPorProcessoParams,
  OrdenarPorTerceiro,
  OrdemTerceiro,
} from './terceiros-types';

export * from './enderecos-types';
export * from './processo-partes-types';
