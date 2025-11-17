// Serviço de listagem de contratos
// Gerencia a lógica de negócio para listar contratos com filtros e paginação

import {
  listarContratos as listarContratosDb,
  type ListarContratosParams,
  type ListarContratosResult,
} from '../persistence/contrato-persistence.service';

/**
 * Lista contratos com filtros e paginação
 */
export async function obterContratos(
  params: ListarContratosParams = {}
): Promise<ListarContratosResult> {
  return listarContratosDb(params);
}

