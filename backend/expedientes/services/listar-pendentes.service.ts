// Serviço de listagem de pendentes de manifestação
// Gerencia a lógica de negócio para listar pendentes com filtros, paginação, ordenação e agrupamento

import {
  listarPendentes as listarPendentesDb,
  listarPendentesAgrupado as listarPendentesAgrupadoDb,
} from './persistence/listar-pendentes.service';
import type {
  ListarPendentesParams,
  ListarPendentesResult,
  ListarPendentesAgrupadoResult,
} from '@/backend/types/expedientes/types';

/**
 * Lista pendentes de manifestação com filtros, paginação e ordenação
 * 
 * Fluxo:
 * 1. Valida parâmetros de entrada
 * 2. Aplica filtros de busca, TRT, grau, responsável, etc.
 * 3. Aplica paginação
 * 4. Aplica ordenação (padrão: data_prazo_legal_parte asc)
 * 5. Retorna lista paginada de pendentes
 */
export async function obterPendentes(
  params: ListarPendentesParams = {}
): Promise<ListarPendentesResult | ListarPendentesAgrupadoResult> {
  // Se agrupar_por está presente, usar função de agrupamento
  if (params.agrupar_por) {
    return listarPendentesAgrupadoDb(params as ListarPendentesParams & { agrupar_por: string });
  }

  // Caso contrário, usar função padrão de listagem
  return listarPendentesDb(params);
}

