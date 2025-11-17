// Serviço de listagem de partes contrárias
// Gerencia a lógica de negócio para listar partes contrárias com filtros e paginação

import {
  listarPartesContrarias as listarPartesContrariasDb,
  type ListarPartesContrariasParams,
  type ListarPartesContrariasResult,
} from '../persistence/parte-contraria-persistence.service';

/**
 * Lista partes contrárias com filtros e paginação
 * 
 * Fluxo:
 * 1. Aplica filtros de busca, tipo de pessoa, status, etc.
 * 2. Aplica paginação
 * 3. Retorna lista paginada de partes contrárias
 */
export async function obterPartesContrarias(
  params: ListarPartesContrariasParams = {}
): Promise<ListarPartesContrariasResult> {
  return listarPartesContrariasDb(params);
}

