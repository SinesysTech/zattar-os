// Serviço de listagem de acervo
// Gerencia a lógica de negócio para listar acervo com filtros, paginação, ordenação e agrupamento

import {
  listarAcervo as listarAcervoDb,
  listarAcervoAgrupado as listarAcervoAgrupadoDb,
} from './persistence/listar-acervo.service';
import type {
  ListarAcervoParams,
  ListarAcervoResult,
  ListarAcervoAgrupadoResult,
} from './types';

/**
 * Lista acervo com filtros, paginação e ordenação
 * 
 * Fluxo:
 * 1. Valida parâmetros de entrada
 * 2. Aplica filtros de busca, origem, TRT, grau, responsável, etc.
 * 3. Aplica paginação
 * 4. Aplica ordenação
 * 5. Retorna lista paginada de processos
 */
export async function obterAcervo(
  params: ListarAcervoParams = {}
): Promise<ListarAcervoResult | ListarAcervoAgrupadoResult> {
  // Se agrupar_por está presente, usar função de agrupamento
  if (params.agrupar_por) {
    return listarAcervoAgrupadoDb(params as ListarAcervoParams & { agrupar_por: string });
  }

  // Caso contrário, usar função padrão de listagem
  return listarAcervoDb(params);
}

