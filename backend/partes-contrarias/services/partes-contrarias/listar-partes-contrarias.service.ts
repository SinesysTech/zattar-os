// Serviço de listagem de partes contrárias
// Gerencia a lógica de negócio para listar partes contrárias com filtros e paginação

import {
  listarPartesContrarias as listarPartesContrariasDb,
  listarPartesContrariasComEndereco as listarPartesContrariasComEnderecoDb,
} from '../persistence/parte-contraria-persistence.service';
import type {
  ListarPartesContrariasParams,
  ListarPartesContrariasResult,
} from '@/backend/types/partes/partes-contrarias-types';

/**
 * Parâmetros estendidos para incluir endereços
 */
export interface ObterPartesContrariasParams extends ListarPartesContrariasParams {
  incluir_endereco?: boolean;
}

/**
 * Lista partes contrárias com filtros e paginação
 *
 * Fluxo:
 * 1. Aplica filtros de busca, tipo de pessoa, status, etc.
 * 2. Aplica paginação
 * 3. Retorna lista paginada de partes contrárias
 * 4. Se incluir_endereco=true, popula dados de endereço via JOIN
 */
export async function obterPartesContrarias(
  params: ObterPartesContrariasParams = {}
): Promise<ListarPartesContrariasResult> {
  const { incluir_endereco, ...listParams } = params;

  if (incluir_endereco) {
    return listarPartesContrariasComEnderecoDb(listParams);
  }

  return listarPartesContrariasDb(listParams);
}

