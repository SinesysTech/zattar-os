/**
 * PARTES REPOSITORIES - Barrel Export
 *
 * Re-exporta todas as funcoes dos repositories decompostos para
 * manter retrocompatibilidade com codigo existente.
 *
 * A estrutura antiga (repository.ts monolitico) esta sendo substituida por:
 * - clientes-repository.ts
 * - partes-contrarias-repository.ts
 * - terceiros-repository.ts
 * - shared/converters.ts
 */

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
} from './clientes-repository';

// Partes Contrarias
export {
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
} from './partes-contrarias-repository';

// Terceiros
export {
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
} from './terceiros-repository';

// Converters (para casos onde precisam ser usados externamente)
export {
  converterParaCliente,
  converterParaParteContraria,
  converterParaTerceiro,
  converterParaEndereco,
} from './shared/converters';
