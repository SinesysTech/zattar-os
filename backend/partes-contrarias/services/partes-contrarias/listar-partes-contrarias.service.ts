/**
 * @deprecated MIGRADO PARA src/core/partes
 * Este arquivo sera removido em versao futura.
 * Use: import { listarPartesContrarias } from '@/core/partes'
 */

// Serviço de listagem de partes contrárias
// Gerencia a lógica de negócio para listar partes contrárias com filtros e paginação

import {
  listarPartesContrarias as listarPartesContrariasDb,
  listarPartesContrariasComEndereco as listarPartesContrariasComEnderecoDb,
  listarPartesContrariasComEnderecoEProcessos as listarPartesContrariasComEnderecoEProcessosDb,
} from '../persistence/parte-contraria-persistence.service';
import type {
  ListarPartesContrariasParams,
  ListarPartesContrariasResult,
} from '@/backend/types/partes/partes-contrarias-types';

/**
 * Parâmetros estendidos para incluir endereços e processos
 */
export interface ObterPartesContrariasParams extends ListarPartesContrariasParams {
  incluir_endereco?: boolean;
  incluir_processos?: boolean;
}

/**
 * Lista partes contrárias com filtros e paginação
 *
 * Fluxo:
 * 1. Aplica filtros de busca, tipo de pessoa, status, etc.
 * 2. Aplica paginação
 * 3. Retorna lista paginada de partes contrárias
 * 4. Se incluir_endereco=true, popula dados de endereço via JOIN
 * 5. Se incluir_processos=true, popula processos relacionados via processo_partes (implica incluir_endereco)
 */
export async function obterPartesContrarias(
  params: ObterPartesContrariasParams = {}
): Promise<ListarPartesContrariasResult> {
  const { incluir_endereco, incluir_processos, ...listParams } = params;

  // incluir_processos implica incluir_endereco
  if (incluir_processos) {
    return listarPartesContrariasComEnderecoEProcessosDb(listParams);
  }

  if (incluir_endereco) {
    return listarPartesContrariasComEnderecoDb(listParams);
  }

  return listarPartesContrariasDb(listParams);
}

